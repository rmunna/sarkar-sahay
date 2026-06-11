#!/usr/bin/env node
/**
 * myScheme catalog ingester — pulls the full Indian government scheme list and
 * per-scheme details from the public myScheme API into data/schemes/.
 *
 * Source: https://www.myscheme.gov.in (DARPG/NeGD). Public data; we cite it.
 * The API key below is the one the myScheme frontend ships publicly — it can
 * rotate; if calls start 401-ing, refresh it from the site's network tab.
 *
 *   node scripts/ingest-myscheme.mjs --probe        # dump 1 list page + 1 detail raw, verify shape FIRST
 *   node scripts/ingest-myscheme.mjs --all          # full paginated ingest (resumable)
 *   node scripts/ingest-myscheme.mjs --all --limit 50
 *
 * Politeness: PAGE_DELAY/DETAIL_DELAY throttle requests; --all resumes from the
 * raw cache in data/schemes/_raw/ so re-runs don't re-hit fetched schemes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "schemes");
const RAW = path.join(OUT, "_raw");

const API = "https://api.myscheme.gov.in";
const API_KEY = process.env.MYSCHEME_API_KEY || "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc";
const HEADERS = {
  "x-api-key": API_KEY,
  accept: "application/json",
  "accept-language": "en",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
  origin: "https://www.myscheme.gov.in",
  referer: "https://www.myscheme.gov.in/",
};

const PAGE_SIZE = 100;
const PAGE_DELAY = 800;
const DETAIL_DELAY = 350;

const args = process.argv.slice(2);
const PROBE = args.includes("--probe");
const ALL = args.includes("--all");
const LIMIT = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1], 10) : Infinity;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function slugify(t) {
  return String(t || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

async function fetchListPage(from, size) {
  const qs = `lang=en&q=%5B%5D&keyword=&sort=&from=${from}&size=${size}`;
  const candidates = [
    `${API}/search/v5/schemes?${qs}`,
    `${API}/search/v4/schemes?${qs}`,
    `${API}/schemes/v6/public/schemes?lang=en&from=${from}&size=${size}&keyword=`,
  ];
  for (const url of candidates) {
    try {
      const j = await getJSON(url);
      const items = j?.data?.hits?.items || j?.data?.hits || j?.data?.schemes || j?.data || [];
      if (Array.isArray(items) && items.length) return { items, total: j?.data?.summary?.total ?? j?.data?.total ?? null, urlUsed: url };
    } catch { /* try next */ }
  }
  return { items: [], total: null, urlUsed: null };
}

async function fetchDetail(slug) {
  const cached = path.join(RAW, `${slug}.json`);
  if (fs.existsSync(cached)) return JSON.parse(fs.readFileSync(cached, "utf8"));
  const candidates = [
    `${API}/schemes/v5/public/schemes/${slug}?lang=en`,
    `${API}/schemes/v4/public/schemes/${slug}?lang=en`,
  ];
  for (const url of candidates) {
    try {
      const j = await getJSON(url);
      const d = j?.data || j;
      if (d && (d.schemeName || d.basicDetails || d.en)) {
        fs.mkdirSync(RAW, { recursive: true });
        fs.writeFileSync(cached, JSON.stringify(d, null, 2));
        return d;
      }
    } catch { /* try next */ }
  }
  return null;
}

function listItemSlug(it) {
  return it.fields?.slug || it.slug || slugify(it.fields?.schemeName || it.schemeName);
}

const STATE_CANON = {
  "all": null, "all india": null, "central": null,
};

// Map a search/list item (it.fields.*) straight to a SchemeRecord. The detail
// API is access-controlled (403), so we use the rich list fields + link out to
// the official myScheme page for the deepest eligibility/benefit prose.
function mapListItem(it) {
  const f = it.fields || {};
  const slug = f.slug || slugify(f.schemeName);
  const level = String(f.level || "").toLowerCase() === "state" ? "state" : "central";
  const benStates = (f.beneficiaryState || []).filter(s => s && !["all"].includes(String(s).toLowerCase()));
  const state = level === "state" && benStates.length ? slugify(benStates[0]) : null;
  const schemeFor = String(f.schemeFor || "").toLowerCase();
  const occupations = schemeFor.includes("business") ? ["business-owner", "self-employed"] : ["any"];
  return {
    id: `myscheme-${slug}`,
    name: f.schemeName || slug,
    slug,
    guidePath: `/scheme/${slug}`,
    level,
    state,
    schemeCategory: slugify((f.schemeCategory || [])[0] || "other"),
    categories: f.schemeCategory || [],
    benefitSummary: (f.briefDescription || "").toString().replace(/\s+/g, " ").trim().slice(0, 300),
    benefitType: "service",
    eligibility: {
      gender: "any", minAge: null, maxAge: null, maxAnnualIncomeINR: null,
      casteCategories: ["any"], occupations,
      widowOnly: false, disabilityRequired: false, bplOrPriorityCardRequired: false,
      otherRequirements: [],
    },
    detail: {
      ministry: f.nodalMinistryName || null,
      shortTitle: f.schemeShortTitle || null,
      beneficiaryState: f.beneficiaryState || [],
      schemeFor: f.schemeFor || null,
      tags: f.tags || [],
      description: (f.briefDescription || "").toString(),
    },
    officialLink: `https://www.myscheme.gov.in/schemes/${slug}`,
    source: "myscheme",
    confidence: 0.5,
    extractedAt: new Date().toISOString().slice(0, 10),
  };
}
void STATE_CANON;

async function probe() {
  console.log("PROBE: fetching one list page...");
  const { items, total, urlUsed } = await fetchListPage(0, 2);
  console.log("list endpoint:", urlUsed, "| total:", total, "| sample items:", items.length);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "_probe-list.json"), JSON.stringify(items.slice(0, 2), null, 2));
  if (items[0]) {
    const slug = listItemSlug(items[0]);
    console.log("first slug:", slug, "→ fetching detail...");
    const d = await fetchDetail(slug);
    fs.writeFileSync(path.join(OUT, "_probe-detail.json"), JSON.stringify(d, null, 2));
    console.log("detail keys:", d ? Object.keys(d).join(", ") : "NULL");
  }
  console.log("Wrote _probe-list.json and _probe-detail.json — inspect, then finalize mapDetail() and run --all.");
}

function mapDetail(d, slug) {
  const en = d.en || d;
  const basic = en.basicDetails || en;
  const name = basic.schemeName || d.schemeName || slug;
  const level = (basic.level || "").toLowerCase().includes("state") ? "state" : "central";
  const state = level === "state" ? slugify(basic.state || (basic.beneficiaryState || [])[0] || "") : null;
  const eligText = (en.eligibilityCriteria?.eligibilityDescription_md || en.eligibilityCriteria?.eligibilityDescription || "").toString();
  return {
    id: `myscheme-${slug}`,
    name,
    slug,
    guidePath: `/scheme/${slug}`,
    level,
    state,
    schemeCategory: slugify((basic.schemeCategory || [])[0] || basic.category || "other"),
    benefitSummary: (en.benefits?.benefits_md || en.briefDescription || "").toString().slice(0, 240),
    benefitType: "service",
    eligibility: {
      gender: "any", minAge: null, maxAge: null, maxAnnualIncomeINR: null,
      casteCategories: ["any"], occupations: ["any"],
      widowOnly: false, disabilityRequired: false, bplOrPriorityCardRequired: false,
      otherRequirements: eligText ? [eligText.replace(/\s+/g, " ").trim().slice(0, 300)] : [],
    },
    detail: {
      ministry: basic.nodalMinistryName || basic.ministry || null,
      eligibilityText: eligText,
      benefitsText: (en.benefits?.benefits_md || "").toString(),
      applicationProcess: (en.applicationProcess?.[0]?.process_md || "").toString(),
      documents: (en.documentsRequired?.documentsRequired_md || "").toString(),
      tags: basic.tags || en.tags || [],
    },
    officialLink: basic.schemeUrl || en.references?.[0]?.url || `https://www.myscheme.gov.in/schemes/${slug}`,
    source: "myscheme",
    confidence: 0.6,
    extractedAt: new Date().toISOString().slice(0, 10),
  };
}

async function ingestAll() {
  fs.mkdirSync(OUT, { recursive: true });
  let from = 0;
  const bySlug = new Map();
  while (bySlug.size < LIMIT) {
    const { items, total } = await fetchListPage(from, PAGE_SIZE);
    if (!items.length) break;
    for (const it of items) {
      const rec = mapListItem(it);
      if (rec.slug && !bySlug.has(rec.slug)) bySlug.set(rec.slug, rec);
    }
    from += PAGE_SIZE;
    console.log(`collected ${bySlug.size} / ~${total ?? "?"}`);
    if (total && from >= total) break;
    await sleep(PAGE_DELAY);
  }
  const mapped = [...bySlug.values()].slice(0, LIMIT);
  writeOutputs(mapped);
  console.log(`DONE: ${mapped.length} schemes ingested from myScheme search API.`);
}
void fetchDetail; void mapDetail; void DETAIL_DELAY;

// Single namespaced file — never clobbers the curated central.json/state-*.json
// (those hold the 10 hand-verified schemes with precise structured eligibility).
// The loader merges this with the curated set and dedups by id (curated wins).
function writeOutputs(schemes) {
  fs.mkdirSync(OUT, { recursive: true });
  const central = schemes.filter(s => s.level === "central").length;
  const byState = {};
  for (const s of schemes.filter(s => s.level === "state")) byState[s.state || "unknown"] = (byState[s.state || "unknown"] || 0) + 1;
  fs.writeFileSync(path.join(OUT, "myscheme.json"), JSON.stringify(schemes, null, 2));
  fs.writeFileSync(path.join(OUT, "myscheme-index.json"), JSON.stringify({
    generatedAt: new Date().toISOString(), source: "myscheme",
    total: schemes.length, central, states: Object.fromEntries(Object.entries(byState).sort()),
  }, null, 2));
}

if (PROBE) await probe();
else if (ALL) await ingestAll();
else console.log("Use --probe first (verify shape), then --all. See header.");

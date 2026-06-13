#!/usr/bin/env node
/**
 * myScheme DETAIL ingester — fetches the full per-scheme content (description,
 * benefits, eligibility, how-to-apply) from the public myScheme API and caches
 * it to data/schemes/_detail/<slug>.json. Turns the thin catalog pages into
 * rich, index-worthy pages.
 *
 * Endpoint (the correct one — query param, not path):
 *   GET /schemes/v6/public/schemes?slug=<slug>&lang=en   (public key)
 *
 * Polite: ~1 req/sec with jitter, resumable (skips cached), backs off on 429.
 * Source: myScheme (DARPG/NeGD). Public government data; cited on the page.
 *
 *   node scripts/ingest-myscheme-detail.mjs --slug gsfe     # one (test)
 *   node scripts/ingest-myscheme-detail.mjs --all           # all (resumable)
 *   node scripts/ingest-myscheme-detail.mjs --all --limit 50
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const langI = process.argv.indexOf("--lang");
const LANG = langI !== -1 ? process.argv[langI + 1] : "en";
const OUT = path.join(ROOT, "data", "schemes", LANG === "en" ? "_detail" : `_detail_${LANG}`);
const API = "https://api.myscheme.gov.in/schemes/v6/public/schemes";
const KEY = process.env.MYSCHEME_API_KEY || "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc";
const HEADERS = {
  "x-api-key": KEY, accept: "application/json", "accept-language": "en",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
  origin: "https://www.myscheme.gov.in", referer: "https://www.myscheme.gov.in/",
};

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const one = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const limitI = args.indexOf("--limit");
const LIMIT = limitI !== -1 ? parseInt(args[limitI + 1], 10) : Infinity;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = () => 800 + Math.floor(Math.random() * 600);

function clean(md) {
  return (md || "").toString().replace(/\r/g, "").trim();
}

function map(slug, en, basicFallback) {
  const b = en.basicDetails || {};
  const c = en.schemeContent || {};
  const ap = (en.applicationProcess || [])[0] || {};
  return {
    slug,
    name: b.schemeName || basicFallback?.name || slug,
    shortTitle: b.schemeShortTitle || null,
    level: b.level?.value || null,
    state: b.state?.label || null,
    nodalDept: b.nodalDepartmentName?.label || b.nodalMinistryName?.label || null,
    schemeFor: b.schemeFor || null,
    targetBeneficiaries: (b.targetBeneficiaries || []).map(t => t?.label || t).filter(Boolean),
    benefitType: c.benefitTypes?.label || null,
    briefDescription: clean(c.briefDescription),
    descriptionMd: clean(c.detailedDescription_md),
    benefitsMd: clean(c.benefits_md),
    eligibilityMd: clean(en.eligibilityCriteria?.eligibilityDescription_md),
    exclusionsMd: clean(c.exclusions_md),
    applicationMode: ap.mode || null,
    applicationMd: clean(ap.process_md),
    references: (c.references || []).map(r => ({ title: r?.title || "", url: r?.url || "" })).filter(r => r.url),
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
}

async function fetchDetail(slug, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${API}?slug=${encodeURIComponent(slug)}&lang=${LANG}`, { headers: HEADERS });
      if (res.status === 429) { await sleep(8000 * (i + 1)); continue; }
      const j = await res.json();
      // response is keyed by language (data.en / data.hi / data.ta …)
      const node = j?.data?.[LANG] || j?.data?.en;
      if (j?.status === "Success" && node) return node;
      return null; // success-but-empty or failure
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
  return null;
}

function slugList() {
  if (one) return [one];
  const ms = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "schemes", "myscheme.json"), "utf8"));
  return ms.map(s => ({ slug: s.msSlug ?? s.slug ?? s.id, name: s.name }));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const list = (one ? [{ slug: one }] : slugList());
  const pending = list.filter(x => !fs.existsSync(path.join(OUT, `${x.slug}.json`))).slice(0, LIMIT);
  console.log(`schemes: ${list.length} | cached: ${list.length - list.filter(x => !fs.existsSync(path.join(OUT, `${x.slug}.json`))).length} | this run: ${pending.length}`);

  let ok = 0, empty = 0, fail = 0, consecutiveFail = 0;
  for (let i = 0; i < pending.length; i++) {
    const { slug, name } = pending[i];
    try {
      const en = await fetchDetail(slug);
      if (en) {
        fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(map(slug, en, { name }), null, 2));
        ok++; consecutiveFail = 0;
      } else { empty++; }
    } catch (e) {
      fail++; consecutiveFail++;
      console.error(`  ✗ ${slug}: ${e.message?.slice(0, 60)}`);
      if (consecutiveFail >= 8) { console.error("8 consecutive failures — backing off 60s (possible rate-limit/block)"); await sleep(60000); consecutiveFail = 0; }
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${pending.length} — ok=${ok} empty=${empty} fail=${fail}`);
    await sleep(jitter());
  }
  console.log(`DONE: captured=${ok} empty=${empty} failed=${fail}`);
}

main();

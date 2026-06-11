#!/usr/bin/env node
/**
 * Scheme Eligibility Extractor — guides → structured eligibility database
 *
 * Reads every guide with category "Government Schemes" or "State Schemes",
 * asks Gemini to extract structured eligibility criteria, and writes
 * per-level/per-state JSON to data/schemes/ (repo golden rule:
 * scripts/ → data/ → src/lib/ → src/app/).
 *
 * Powers the /eligibility checker. Eligibility fields are nullable —
 * null means "the guide does not state this constraint", and the matcher
 * must treat null as "no restriction". Gemini is instructed to never
 * invent thresholds that are not in the guide text.
 *
 * Usage:
 *   node scripts/extract-scheme-eligibility.mjs              # full run (resumes)
 *   node scripts/extract-scheme-eligibility.mjs --limit 10   # validation sample
 *   node scripts/extract-scheme-eligibility.mjs --force      # re-extract all
 *
 * Rate limit: ~13 req/min to stay under Gemini free tier (15 RPM).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "content", "guides");
const OUT_DIR = path.join(ROOT, "data", "schemes");
const MODEL_NAME = "gemini-2.5-flash";
const SLEEP_MS = 4500;

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitArg = args.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

function loadApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envFile = path.join(ROOT, ".env.local");
  if (fs.existsSync(envFile)) {
    const match = fs.readFileSync(envFile, "utf8").match(/^GEMINI_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  console.error("GEMINI_API_KEY not set (env or .env.local)");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(loadApiKey());
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
});

const OCCUPATIONS = [
  "farmer", "agricultural-labourer", "student", "unemployed-youth",
  "salaried-employee", "self-employed", "business-owner", "artisan",
  "fisherman", "construction-worker", "street-vendor", "domestic-worker",
  "homemaker", "any",
];

const SCHEME_CATEGORIES = [
  "pension", "housing", "farmer-support", "health-insurance", "education-scholarship",
  "women-welfare", "business-loan", "food-security", "employment", "skill-training",
  "disability-welfare", "energy-subsidy", "insurance", "other",
];

const PROMPT_HEADER = `You extract structured eligibility data for an Indian government scheme from a guide article.

Return STRICT JSON with exactly this shape:
{
  "isScheme": boolean,            // false if the article is NOT about one specific welfare scheme (e.g. it is a portal guide, a how-to, or covers many schemes)
  "name": string,                 // official scheme name, short
  "level": "central" | "state",
  "state": string | null,         // lowercase state name with hyphens (e.g. "west-bengal") if state-level, else null
  "schemeCategory": one of ${JSON.stringify(SCHEME_CATEGORIES)},
  "benefitSummary": string,       // one line, e.g. "₹3,500/month pension for elderly, widows and disabled"
  "benefitType": "cash" | "subsidy" | "loan" | "insurance" | "service" | "in-kind",
  "eligibility": {
    "gender": "any" | "female" | "male",
    "minAge": number | null,
    "maxAge": number | null,
    "maxAnnualIncomeINR": number | null,   // convert monthly limits to annual (x12)
    "casteCategories": ["any"] or subset of ["general","obc","sc","st","ews","minority"],
    "occupations": subset of ${JSON.stringify(OCCUPATIONS)},  // use ["any"] when occupation does not matter
    "widowOnly": boolean,
    "disabilityRequired": boolean,
    "bplOrPriorityCardRequired": boolean,
    "otherRequirements": string[]          // short phrases for conditions that do not fit above, e.g. "Swasthya Sathi card required", "land ownership below 5 acres"
  },
  "officialLink": string | null,
  "confidence": number            // 0-1: how completely the guide states the eligibility rules
}

Rules:
- Use ONLY facts stated in the article. If a threshold (age, income) is not stated, use null. NEVER guess numbers.
- "occupations" lists who the scheme is FOR. A scheme open to everyone gets ["any"].
- If multiple sub-pensions exist (old age / widow / disability), describe the scheme overall and set minAge/widowOnly/disabilityRequired only if they apply to ALL variants; put variant rules in otherRequirements.
- benefitSummary must include the amount when the article states one.

ARTICLE:
`;

function schemeGuides() {
  return fs.readdirSync(GUIDES_DIR)
    .filter(f => f.endsWith(".md"))
    .filter(f => {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, f), "utf8");
      const head = raw.slice(0, 600);
      return head.includes('category: "Government Schemes"') || head.includes('category: "State Schemes"');
    })
    .sort();
}

function loadExisting() {
  const byId = new Map();
  if (!fs.existsSync(OUT_DIR)) return byId;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!f.endsWith(".json") || f === "index.json") continue;
    for (const s of JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8"))) {
      byId.set(s.id, s);
    }
  }
  return byId;
}

async function extractOne(file) {
  const raw = fs.readFileSync(path.join(GUIDES_DIR, file), "utf8");
  const parsed = matter(raw);
  const body = parsed.content.slice(0, 9000);
  const title = parsed.data?.title || file;
  const result = await model.generateContent(
    `${PROMPT_HEADER}Title: ${title}\n\n${body}`,
  );
  const data = JSON.parse(result.response.text());
  if (!data.isScheme) return null;
  const id = file.replace(/\.md$/, "");
  return {
    id,
    name: data.name,
    guidePath: `/guide/${id}`,
    level: data.level,
    state: data.level === "state" ? data.state : null,
    schemeCategory: data.schemeCategory,
    benefitSummary: data.benefitSummary,
    benefitType: data.benefitType,
    eligibility: data.eligibility,
    officialLink: data.officialLink || (parsed.data?.officialLinks?.[0] ?? null),
    confidence: data.confidence,
    extractedAt: new Date().toISOString().slice(0, 10),
  };
}

function writeOutputs(schemes) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const central = schemes.filter(s => s.level === "central");
  const byState = new Map();
  for (const s of schemes.filter(s => s.level === "state")) {
    const key = s.state || "unknown";
    if (!byState.has(key)) byState.set(key, []);
    byState.get(key).push(s);
  }
  fs.writeFileSync(path.join(OUT_DIR, "central.json"), JSON.stringify(central, null, 2));
  for (const [state, list] of byState) {
    fs.writeFileSync(path.join(OUT_DIR, `state-${state}.json`), JSON.stringify(list, null, 2));
  }
  const index = {
    generatedAt: new Date().toISOString(),
    total: schemes.length,
    central: central.length,
    states: Object.fromEntries([...byState].map(([k, v]) => [k, v.length]).sort()),
  };
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2));
  return index;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const files = schemeGuides();
  const existing = force ? new Map() : loadExisting();
  const pending = files.filter(f => !existing.has(f.replace(/\.md$/, ""))).slice(0, limit);
  console.log(`scheme guides: ${files.length} | already extracted: ${existing.size} | this run: ${pending.length}`);

  const schemes = [...existing.values()];
  let done = 0, skipped = 0, failed = 0;
  for (const file of pending) {
    try {
      const scheme = await extractOne(file);
      if (scheme) {
        schemes.push(scheme);
        done++;
        console.log(`  ✓ ${scheme.name} [${scheme.level}${scheme.state ? ":" + scheme.state : ""}] conf=${scheme.confidence}`);
      } else {
        skipped++;
        console.log(`  ⏭  ${file} (not a single-scheme article)`);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ ${file}: ${e.message?.slice(0, 140)}`);
      if (/429|quota|rate/i.test(e.message || "")) {
        console.error("  rate limited — backing off 60s");
        await sleep(60_000);
      }
    }
    // checkpoint every 25 so an interrupted run loses little
    if ((done + skipped + failed) % 25 === 0) writeOutputs(schemes);
    await sleep(SLEEP_MS);
  }

  const index = writeOutputs(schemes);
  console.log(`\nextracted=${done} skipped=${skipped} failed=${failed}`);
  console.log(`database: ${index.total} schemes (${index.central} central, ${Object.keys(index.states).length} states)`);
}

main();

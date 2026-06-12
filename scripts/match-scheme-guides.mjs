#!/usr/bin/env node
/**
 * Strict scheme → guide matcher. For each myScheme scheme, find a CitizenNest
 * guide that is confidently about the SAME scheme, and write the mapping to
 * data/schemes/scheme-guide-map.json. Used by /scheme/[slug] to surface a
 * "Read the full guide" link (catalog → rich content funnel).
 *
 * Precision over recall: a guide matches only if its slug contains BOTH words
 * of a distinctive bigram from the scheme name (two specific words together),
 * OR the scheme's acronym (shortTitle) appears as a guide-slug token. A single
 * shared common word (e.g. "kisan") never matches — that avoids false links.
 *
 *   node scripts/match-scheme-guides.mjs            # write the map
 *   node scripts/match-scheme-guides.mjs --sample   # print 25 matches, don't write
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "content", "guides");
const MS_FILE = path.join(ROOT, "data", "schemes", "myscheme.json");
const OUT = path.join(ROOT, "data", "schemes", "scheme-guide-map.json");

const SAMPLE = process.argv.includes("--sample");

// Generic words that carry no disambiguating signal across scheme names.
const STOP = new Set([
  "scheme", "schemes", "yojana", "yojna", "pradhan", "mantri", "pm", "government",
  "govt", "state", "central", "india", "indian", "national", "mission", "program",
  "programme", "board", "department", "dept", "plan", "fund", "science", "and",
  "for", "the", "of", "to", "under", "online", "apply", "registration", "card",
  "ministry", "welfare", "development", "general", "special", "new", "phase",
]);

function tokens(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}
function contentTokens(s) {
  return tokens(s).filter(t => t.length >= 4 && !STOP.has(t));
}

// Exclude hub/listing/comparison guides — they're not about ONE scheme, so a
// token overlap with them is a false match (e.g. "...-government-schemes-services").
const HUB = /(government-schemes|schemes-services|schemes-list|list-of|all-schemes|state-schemes|top-\d|best-|-vs-|difference|compare|services$)/;
const guideSlugs = fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith(".md")).map(f => f.slice(0, -3)).filter(s => !HUB.test(s));
const guideTokenSets = guideSlugs.map(slug => ({ slug, set: new Set(tokens(slug)) }));
const df = new Map();
for (const { set } of guideTokenSets) for (const t of set) df.set(t, (df.get(t) || 0) + 1);
// a token is "rare/distinctive" if it appears in few guide slugs
const RARE_MAX = 6;
const isRare = t => (df.get(t) || 0) <= RARE_MAX;

function bestGuide(scheme) {
  const name = scheme.name || "";
  const ct = contentTokens(name);
  if (ct.length === 0) return null;

  // distinctive bigrams = consecutive content tokens
  const bigrams = [];
  const allTokens = tokens(name).filter(t => t.length >= 4 && !STOP.has(t));
  for (let i = 0; i < allTokens.length - 1; i++) bigrams.push([allTokens[i], allTokens[i + 1]]);

  const acronym = (scheme.detail?.shortTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  let best = null, bestScore = 0;
  for (const { slug, set } of guideTokenSets) {
    // acronym hit (e.g. "pmkvy" in slug) is a strong, precise signal
    const acronymHit = acronym.length >= 4 && set.has(acronym);
    // bigram hit: guide slug contains BOTH words of a distinctive bigram, AND
    // at least one of those words is RARE — so coincidental matches on common
    // words ("establishment", "medium", "insurance") don't trigger.
    const bigramHit = bigrams.some(([a, b]) => set.has(a) && set.has(b) && (isRare(a) || isRare(b)));
    if (!acronymHit && !bigramHit) continue;

    // rank candidates by shared rare tokens (specific words shared = confident
    // it's the same scheme), then by total shared tokens.
    const sharedRare = ct.filter(t => set.has(t) && isRare(t)).length;
    const sharedAll = ct.filter(t => set.has(t)).length;
    const score = sharedRare * 10 + sharedAll + (acronymHit ? 30 : 0);
    if (score > bestScore) { bestScore = score; best = slug; }
  }
  // require a rare-token or acronym hit (score >= 10) — not just generic overlap
  return bestScore >= 10 ? best : null;
}

function main() {
  const schemes = JSON.parse(fs.readFileSync(MS_FILE, "utf8"));
  const map = {};
  const samples = [];
  for (const s of schemes) {
    const slug = s.slug ?? s.id;
    const g = bestGuide(s);
    if (g) { map[slug] = g; if (samples.length < 25) samples.push([s.name, g]); }
  }
  console.log(`schemes: ${schemes.length} | confident guide matches: ${Object.keys(map).length}`);
  if (SAMPLE) {
    for (const [n, g] of samples) console.log(`  ${n.slice(0, 50).padEnd(52)} -> /guide/${g}`);
    console.log("(--sample: not written)");
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}

main();

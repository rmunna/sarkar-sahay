import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import type { SchemeRecord, SchemeLite } from "./schemes";

// Server-only filesystem loaders for the scheme database. Kept separate from
// schemes.ts so the pure matcher/types there stay importable by client
// components without pulling `fs` into the client bundle.
//
// Two sources are merged:
//   - curated central.json / state-*.json — hand-verified, PRECISE structured
//     eligibility (age/income/caste/occupation). Small set, high confidence.
//   - myscheme.json — full myScheme catalog (~3,559 schemes), rich metadata but
//     coarse eligibility (level/state/category). Cited to myScheme.
// Curated wins on id collision (it has the real eligibility rules).

const DATA_DIR = () => path.join(process.cwd(), "data", "schemes");

let _all: SchemeRecord[] | null = null;

export function getAllSchemes(): SchemeRecord[] {
  if (_all) return _all;
  const dir = DATA_DIR();
  if (!existsSync(dir)) return (_all = []);

  const curated: SchemeRecord[] = [];
  let myscheme: SchemeRecord[] = [];
  for (const f of readdirSync(dir)) {
    // only scheme-record arrays: skip index files and the scheme→guide map (an object)
    if (!f.endsWith(".json") || f.endsWith("index.json") || f === "scheme-guide-map.json") continue;
    const rows = JSON.parse(readFileSync(path.join(dir, f), "utf-8"));
    if (!Array.isArray(rows)) continue; // defensive: ignore any non-array json
    if (f === "myscheme.json") myscheme = rows;
    else curated.push(...rows);
  }
  const seen = new Set(curated.map(s => s.id));
  // also dedup curated-vs-myscheme by slug (curated PM-Kisan vs myScheme PM-Kisan)
  const curatedSlugs = new Set(curated.map(s => s.slug ?? s.id));
  _all = [...curated, ...myscheme.filter(s => !seen.has(s.id) && !curatedSlugs.has(s.slug ?? s.id))];
  return _all;
}

export function getSchemeStates(): string[] {
  const states = new Set<string>();
  for (const s of getAllSchemes()) if (s.state) states.add(s.state);
  return [...states].sort();
}

/** The hand-verified schemes with PRECISE structured eligibility (~10). Sent
 * full to the client matcher — tiny. */
export function getCuratedSchemes(): SchemeRecord[] {
  return getAllSchemes().filter(s => s.source !== "myscheme");
}

/** Ultra-slim catalog for the broad "schemes for your state/category" list and
 * the /schemes directory. ~60 bytes/scheme → the whole 3.5k set is ~50KB gzip,
 * vs 3MB+ when full records were shipped. */
export function getCatalogLite(): SchemeLite[] {
  return getAllSchemes().map(s => ({
    name: s.name,
    slug: (s.slug ?? s.id) as string,
    guidePath: s.guidePath,
    level: s.level,
    state: s.state,
    category: s.schemeCategory,
  }));
}

export function getSchemeBySlug(slug: string): SchemeRecord | null {
  return getAllSchemes().find(s => (s.slug ?? s.id) === slug) ?? null;
}

/** Related schemes for internal linking: same category, same state first, then
 * same category central, excluding self. Keeps the detail page useful and
 * spreads crawl/link equity. */
export function getRelatedSchemes(scheme: SchemeRecord, limit = 10): SchemeRecord[] {
  const self = scheme.slug ?? scheme.id;
  const all = getAllSchemes().filter(s => (s.slug ?? s.id) !== self && s.schemeCategory === scheme.schemeCategory);
  const sameState = scheme.state ? all.filter(s => s.state === scheme.state) : [];
  const central = all.filter(s => s.level === "central");
  const rest = all.filter(s => !sameState.includes(s) && !central.includes(s));
  const seen = new Set<string>();
  const out: SchemeRecord[] = [];
  for (const s of [...sameState, ...central, ...rest]) {
    const id = s.slug ?? s.id;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export function getAllSchemeSlugs(): string[] {
  return getAllSchemes().map(s => s.slug ?? s.id).filter(Boolean) as string[];
}

export interface SchemeFullDetail {
  slug: string;
  name: string;
  shortTitle: string | null;
  level: string | null;
  state: string | null;
  nodalDept: string | null;
  schemeFor: string | null;
  targetBeneficiaries: string[];
  benefitType: string | null;
  briefDescription: string;
  descriptionMd: string;
  benefitsMd: string;
  eligibilityMd: string;
  exclusionsMd: string;
  applicationMode: string | null;
  applicationMd: string;
  references: { title: string; url: string }[];
  fetchedAt: string;
}

/** Full myScheme detail (description/benefits/eligibility/how-to-apply), keyed
 * by the myScheme short code (msSlug). `lang` selects en (default) or a
 * translated set (_detail_hi, etc.). Present only for ingested schemes. */
export function getSchemeDetail(msSlug: string, lang = "en"): SchemeFullDetail | null {
  if (!msSlug) return null;
  const dir = lang === "en" ? "_detail" : `_detail_${lang}`;
  const f = path.join(DATA_DIR(), dir, `${msSlug}.json`);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, "utf-8")) as SchemeFullDetail; } catch { return null; }
}

/** A scheme is "rich enough to index" when it has real benefit + eligibility
 * prose (not just a one-line description). */
export function isRichDetail(d: SchemeFullDetail | null): boolean {
  if (!d) return false;
  const elig = (d.eligibilityMd || "").length;
  const ben = (d.benefitsMd || "").length;
  const desc = (d.descriptionMd || d.briefDescription || "").length;
  return elig >= 80 && (ben >= 20 || desc >= 200);
}

/** True when the detail's prose actually contains Devanagari — the myScheme API
 * silently falls back to English when a Hindi translation is missing, so a
 * `_detail_hi` file can still hold English text. We must NOT publish English
 * content on a /hi/ URL, so the Hindi route only ships pages that pass this. */
export function isRichHindiDetail(d: SchemeFullDetail | null): boolean {
  if (!isRichDetail(d)) return false;
  const prose = `${d!.descriptionMd} ${d!.benefitsMd} ${d!.eligibilityMd} ${d!.briefDescription}`;
  const deva = (prose.match(/[ऀ-ॿ]/g) || []).length;
  return deva >= 40; // a real Hindi page has plenty of Devanagari; English fallbacks have ~none
}

/** Descriptive slugs whose Hindi detail is genuinely in Hindi and rich enough
 * to index. Drives the /hi/scheme/[slug] static params + reciprocal hreflang. */
export function getHindiSchemeSlugs(): string[] {
  const out: string[] = [];
  for (const s of getAllSchemes()) {
    const key = s.msSlug ?? s.slug ?? s.id;
    if (isRichHindiDetail(getSchemeDetail(key, "hi"))) out.push((s.slug ?? s.id) as string);
  }
  return out;
}

/** Whether a scheme (by descriptive slug) has a publishable Hindi page — used by
 * the English route to add a reciprocal hreflang only when the target exists. */
export function hasHindiScheme(slug: string): boolean {
  const s = getSchemeBySlug(slug);
  if (!s) return false;
  return isRichHindiDetail(getSchemeDetail(s.msSlug ?? slug, "hi"));
}

let _guideMap: Record<string, string> | null = null;

/** Confident scheme→guide matches (from scripts/match-scheme-guides.mjs). Lets
 * a scheme page link to the full how-to-apply guide where one exists. */
export function getGuideForScheme(schemeSlug: string): string | null {
  if (!_guideMap) {
    const f = path.join(DATA_DIR(), "scheme-guide-map.json");
    _guideMap = existsSync(f) ? JSON.parse(readFileSync(f, "utf-8")) : {};
  }
  return _guideMap![schemeSlug] ?? null;
}

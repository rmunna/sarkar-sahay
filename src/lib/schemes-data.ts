import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import type { SchemeRecord } from "./schemes";

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
    if (!f.endsWith(".json") || f.endsWith("index.json")) continue;
    const rows = JSON.parse(readFileSync(path.join(dir, f), "utf-8")) as SchemeRecord[];
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

/** Slim projection for the client-side matcher — drops the heavy `detail`/
 * description fields so /eligibility doesn't ship megabytes of props. */
export function getSchemesForMatcher(): SchemeRecord[] {
  return getAllSchemes().map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    guidePath: s.guidePath,
    level: s.level,
    state: s.state,
    schemeCategory: s.schemeCategory,
    benefitSummary: s.benefitSummary,
    benefitType: s.benefitType,
    eligibility: s.eligibility,
    officialLink: s.officialLink,
    confidence: s.confidence,
    extractedAt: s.extractedAt,
  }));
}

export function getSchemeBySlug(slug: string): SchemeRecord | null {
  return getAllSchemes().find(s => (s.slug ?? s.id) === slug) ?? null;
}

export function getAllSchemeSlugs(): string[] {
  return getAllSchemes().map(s => s.slug ?? s.id).filter(Boolean) as string[];
}

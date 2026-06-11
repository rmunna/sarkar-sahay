import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

export type Gender = "any" | "female" | "male";
export type CasteCategory = "general" | "obc" | "sc" | "st" | "ews" | "minority";

export interface SchemeEligibility {
  gender: Gender;
  minAge: number | null;
  maxAge: number | null;
  maxAnnualIncomeINR: number | null;
  casteCategories: ("any" | CasteCategory)[];
  occupations: string[];
  widowOnly: boolean;
  disabilityRequired: boolean;
  bplOrPriorityCardRequired: boolean;
  otherRequirements: string[];
}

export interface SchemeRecord {
  id: string;
  name: string;
  guidePath: string;
  level: "central" | "state";
  state: string | null; // state slug, e.g. "west-bengal"
  schemeCategory: string;
  benefitSummary: string;
  benefitType: "cash" | "subsidy" | "loan" | "insurance" | "service" | "in-kind";
  eligibility: SchemeEligibility;
  officialLink: string | null;
  confidence: number;
  extractedAt: string;
}

export interface UserProfile {
  age: number;
  gender: "female" | "male";
  state: string | null; // state slug
  annualIncomeINR: number | null; // null = prefer not to say
  casteCategory: CasteCategory;
  occupation: string; // one of the occupation slugs, or "any"
  isWidow: boolean;
  hasDisability: boolean;
  hasBplCard: boolean;
}

export interface SchemeMatch {
  scheme: SchemeRecord;
  /** Number of profile-specific constraints this scheme actually checked — higher = more targeted at this user. */
  specificity: number;
  /** Conditions the guide states but this checker cannot verify (user must self-check). */
  checkManually: string[];
}

const DATA_DIR = () => path.join(process.cwd(), "data", "schemes");

let _all: SchemeRecord[] | null = null;

export function getAllSchemes(): SchemeRecord[] {
  if (!_all) {
    const dir = DATA_DIR();
    if (!existsSync(dir)) return (_all = []);
    _all = readdirSync(dir)
      .filter(f => f.endsWith(".json") && f !== "index.json")
      .flatMap(f => JSON.parse(readFileSync(path.join(dir, f), "utf-8")) as SchemeRecord[]);
  }
  return _all;
}

export function getSchemeStates(): string[] {
  const states = new Set<string>();
  for (const s of getAllSchemes()) if (s.state) states.add(s.state);
  return [...states].sort();
}

/**
 * Core matching rule: a scheme matches when EVERY constraint it defines is
 * satisfied by the profile. Null / "any" constraints are skipped — the guide
 * does not restrict on that axis. Constraints we can't model are surfaced in
 * `checkManually` instead of silently dropped.
 */
export function matchSchemes(profile: UserProfile, schemes: SchemeRecord[] = getAllSchemes()): SchemeMatch[] {
  const matches: SchemeMatch[] = [];

  for (const scheme of schemes) {
    if (scheme.level === "state" && scheme.state && profile.state && scheme.state !== profile.state) continue;
    if (scheme.level === "state" && profile.state === null) continue;

    const e = scheme.eligibility;
    let specificity = 0;

    if (e.gender !== "any") {
      if (e.gender !== profile.gender) continue;
      specificity++;
    }
    if (e.minAge !== null) {
      if (profile.age < e.minAge) continue;
      specificity++;
    }
    if (e.maxAge !== null) {
      if (profile.age > e.maxAge) continue;
      specificity++;
    }
    if (e.maxAnnualIncomeINR !== null && profile.annualIncomeINR !== null) {
      if (profile.annualIncomeINR > e.maxAnnualIncomeINR) continue;
      specificity++;
    }
    if (e.casteCategories.length > 0 && !e.casteCategories.includes("any")) {
      if (!e.casteCategories.includes(profile.casteCategory)) continue;
      specificity++;
    }
    if (e.occupations.length > 0 && !e.occupations.includes("any")) {
      if (profile.occupation === "any" || !e.occupations.includes(profile.occupation)) continue;
      specificity += 2; // occupation-targeted schemes are the most relevant results
    }
    if (e.widowOnly) {
      if (!profile.isWidow) continue;
      specificity += 2;
    }
    if (e.disabilityRequired) {
      if (!profile.hasDisability) continue;
      specificity += 2;
    }
    if (e.bplOrPriorityCardRequired) {
      if (!profile.hasBplCard) continue;
      specificity++;
    }

    const checkManually = [...(e.otherRequirements || [])];
    if (e.maxAnnualIncomeINR !== null && profile.annualIncomeINR === null) {
      checkManually.unshift(`Annual income must be ≤ ₹${e.maxAnnualIncomeINR.toLocaleString("en-IN")}`);
    }

    matches.push({ scheme, specificity, checkManually });
  }

  // Most targeted first; state schemes before central at equal specificity
  // (state schemes are usually the actionable surprise), then by confidence.
  return matches.sort((a, b) =>
    b.specificity - a.specificity
    || (a.scheme.level === b.scheme.level ? 0 : a.scheme.level === "state" ? -1 : 1)
    || b.scheme.confidence - a.scheme.confidence,
  );
}

/**
 * Court data access — server-side only (uses fs)
 * In-memory cache after first load
 */

import * as fs from "fs";
import * as path from "path";

export interface CaseType {
  code: string;
  name: string;
}

export interface CourtRecord {
  slug: string;
  name: string;
  shortName: string;
  type: "supreme" | "high" | "district" | "tribunal";
  state: string;
  stateSlug: string;
  city: string;
  address: string;
  website: string;
  caseStatusUrl: string;
  advocateUrl?: string;
  causeListUrl?: string;
  ecourtsStateCode?: string;
  ecourtsDistCode?: string;
  cnrStateCode?: string;
  caseTypes: CaseType[];
  phone?: string;
  established?: string;
  description: string;
}

const DATA_DIR = path.join(process.cwd(), "data", "court");

// ─── In-memory caches ────────────────────────────────────────────────────────

let _courts: CourtRecord[] | null = null;
let _index: Record<string, CourtRecord> | null = null;
let _byState: Record<string, CourtRecord[]> | null = null;

function loadCourts(): CourtRecord[] {
  if (!_courts) {
    // courts.json = Supreme + High Courts
    const hc: CourtRecord[] = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "courts.json"), "utf-8")
    );
    // district-courts.json = all ~739 district courts
    const districtFile = path.join(DATA_DIR, "district-courts.json");
    const dc: CourtRecord[] = fs.existsSync(districtFile)
      ? JSON.parse(fs.readFileSync(districtFile, "utf-8"))
      : [];
    _courts = [...hc, ...dc];
  }
  return _courts!;
}

function loadIndex(): Record<string, CourtRecord> {
  if (!_index) {
    _index = {};
    for (const c of loadCourts()) _index[c.slug] = c;
  }
  return _index!;
}

function loadByState(): Record<string, CourtRecord[]> {
  if (!_byState) {
    _byState = {};
    for (const c of loadCourts()) {
      if (!_byState[c.stateSlug]) _byState[c.stateSlug] = [];
      _byState[c.stateSlug].push(c);
    }
  }
  return _byState!;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllCourts(): CourtRecord[] {
  return loadCourts();
}

export function getCourtBySlug(slug: string): CourtRecord | null {
  return loadIndex()[slug] ?? null;
}

export function getCourtsByState(stateSlug: string): CourtRecord[] {
  return loadByState()[stateSlug] ?? [];
}

export function getAllStates(): { stateSlug: string; state: string; count: number }[] {
  const byState = loadByState();
  return Object.entries(byState)
    .map(([stateSlug, courts]) => ({
      stateSlug,
      state: courts[0].state,
      count: courts.length,
    }))
    .sort((a, b) => a.state.localeCompare(b.state));
}

/** For generateStaticParams on /court/[state] */
export function getAllStateParams(): { state: string }[] {
  return Object.keys(loadByState()).map((stateSlug) => ({ state: stateSlug }));
}

/** For generateStaticParams on /court/[state]/[court] */
export function getAllCourtParams(): { state: string; court: string }[] {
  return loadCourts()
    .filter((c) => c.type !== "supreme") // Supreme Court has its own route
    .map((c) => ({ state: c.stateSlug, court: c.slug }));
}

export function getHighCourts(): CourtRecord[] {
  return loadCourts().filter((c) => c.type === "high");
}

export function getDistrictCourts(): CourtRecord[] {
  return loadCourts().filter((c) => c.type === "district");
}

export function getSupremeCourt(): CourtRecord | null {
  return loadCourts().find((c) => c.type === "supreme") ?? null;
}

/** eCourts deep-link for district courts */
export function buildEcourtsUrl(court: CourtRecord): string {
  if (court.ecourtsStateCode && court.ecourtsDistCode) {
    return `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${court.ecourtsStateCode}&dist_code=${court.ecourtsDistCode}`;
  }
  return court.caseStatusUrl;
}

/** Parse CNR number into components */
export function parseCNR(cnr: string): {
  stateCode: string;
  distCode: string;
  estCode: string;
  caseNo: string;
  year: string;
} | null {
  // CNR = [StateCode(2)][DistCode(2)][EstCode(2)][CaseNo(6)][Year(4)] — 16 chars
  const clean = cnr.replace(/\s/g, "").toUpperCase();
  if (clean.length !== 16) return null;
  return {
    stateCode: clean.slice(0, 2),
    distCode: clean.slice(2, 4),
    estCode: clean.slice(4, 6),
    caseNo: clean.slice(6, 12),
    year: clean.slice(12, 16),
  };
}

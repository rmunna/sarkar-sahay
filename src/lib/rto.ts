import { readFileSync } from "fs";
import path from "path";

export interface RTORecord {
  code: string;      // "AP-01"
  stateCode: string; // "AP"
  number: string;    // "01"
  name: string;      // "Vijayawada (Central)"
  state: string;     // "Andhra Pradesh"
  stateSlug: string; // "andhra-pradesh"
  city: string;      // "Vijayawada"
  slug: string;      // "ap-01"
}

let _all: RTORecord[] | null = null;
let _byState: Record<string, RTORecord[]> | null = null;
let _bySlug: Record<string, RTORecord> | null = null;

function loadAll(): RTORecord[] {
  if (!_all) {
    const filePath = path.join(process.cwd(), "data", "rto", "rto.json");
    _all = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _all!;
}

function loadByState(): Record<string, RTORecord[]> {
  if (!_byState) {
    const filePath = path.join(process.cwd(), "data", "rto", "by-state.json");
    _byState = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _byState!;
}

function loadBySlug(): Record<string, RTORecord> {
  if (!_bySlug) {
    const all = loadAll();
    _bySlug = Object.fromEntries(all.map((r) => [r.slug, r]));
  }
  return _bySlug!;
}

export function getRTOBySlug(slug: string): RTORecord | null {
  return loadBySlug()[slug.toLowerCase()] ?? null;
}

export function getRTOByCode(code: string): RTORecord | null {
  return loadBySlug()[code.toLowerCase().replace(/\s+/g, "-")] ?? null;
}

export function getAllRTOs(): RTORecord[] {
  return loadAll();
}

export function getRTOsByState(stateSlug: string): RTORecord[] {
  return loadByState()[stateSlug] ?? [];
}

export function getAllStates(): { stateSlug: string; state: string; count: number }[] {
  const byState = loadByState();
  return Object.entries(byState)
    .map(([stateSlug, rtoms]) => ({
      stateSlug,
      state: rtoms[0]?.state ?? stateSlug,
      count: rtoms.length,
    }))
    .sort((a, b) => a.state.localeCompare(b.state));
}

export function getAllRTOParams(): { code: string }[] {
  return loadAll().map((r) => ({ code: r.slug }));
}

export function searchRTO(query: string, limit = 20): RTORecord[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const all = loadAll();
  return all
    .filter(
      (r) =>
        r.slug.includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

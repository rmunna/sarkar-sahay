/**
 * Pincode data — D1-backed implementation (Cloudflare migration).
 * Mirrors ifsc-d1.ts: D1 at runtime on Workers, fs fallback at build/dev and
 * during `next build` (NEXT_PHASE guard). See src/lib/pincode.ts for the
 * filesystem source and pure helpers (slugs, paths, generateStaticParams).
 */

import type { PincodeRecord, PincodeSummary } from "./pincode";
import * as fsImpl from "./pincode";

interface D1Like {
  prepare(sql: string): {
    bind(...vals: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
}

type Row = {
  pincode: string; post_office: string; places: string; district: string;
  district_slug: string; state: string; state_slug: string; taluk: string;
  lat: string; lng: string;
};

function rowToRecord(r: Row): PincodeRecord {
  let places: string[] = [];
  try { places = JSON.parse(r.places); } catch { places = []; }
  return {
    pincode: r.pincode, places, postOffice: r.post_office, district: r.district,
    districtSlug: r.district_slug, state: r.state, stateSlug: r.state_slug,
    taluk: r.taluk, lat: r.lat, lng: r.lng,
  };
}

const SELECT = `SELECT pincode,post_office,places,district,district_slug,state,state_slug,taluk,lat,lng FROM pincode_places`;

type CloudflareCtxModule = {
  getCloudflareContext: (opts?: { async?: boolean }) => Promise<{ env?: Record<string, unknown> }>;
};

async function getDB(): Promise<D1Like | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  try {
    const specifier = "@opennextjs/cloudflare";
    const mod = (await import(/* webpackIgnore: true */ specifier).catch(() => null)) as CloudflareCtxModule | null;
    if (!mod || typeof mod.getCloudflareContext !== "function") return null;
    const ctx = await mod.getCloudflareContext({ async: true });
    return ((ctx?.env?.citizennest_data as D1Like | undefined) ?? null);
  } catch {
    return null;
  }
}

export async function getPincodeBySlug(stateSlug: string, districtSlug: string, slug: string): Promise<PincodeRecord | null> {
  const pincode = slug.slice(-6);
  if (!/^\d{6}$/.test(pincode)) return null;
  const db = await getDB();
  if (!db) return fsImpl.getPincodeBySlug(stateSlug, districtSlug, slug);
  const row = await db.prepare(`${SELECT} WHERE state_slug = ? AND district_slug = ? AND pincode = ? LIMIT 1`)
    .bind(stateSlug, districtSlug, pincode).first<Row>();
  return row ? rowToRecord(row) : null;
}

export async function getPincodeData(pincode: string): Promise<PincodeRecord | null> {
  const db = await getDB();
  if (!db) return fsImpl.getPincodeData(pincode);
  const row = await db.prepare(`${SELECT} WHERE pincode = ? LIMIT 1`).bind(pincode).first<Row>();
  return row ? rowToRecord(row) : null;
}

export async function getNearbyPincodes(record: PincodeRecord, limit = 8): Promise<PincodeRecord[]> {
  const db = await getDB();
  if (!db) return fsImpl.getNearbyPincodes(record, limit);
  const { results } = await db.prepare(
    `${SELECT} WHERE state_slug = ? AND district_slug = ? AND pincode != ? LIMIT ${Number(limit)}`,
  ).bind(record.stateSlug, record.districtSlug, record.pincode).all<Row>();
  return results.map(rowToRecord);
}

export async function searchPincodes(query: string, limit = 10): Promise<PincodeSummary[]> {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 3) return [];
  const db = await getDB();
  if (!db) return fsImpl.searchPincodes(query, limit);
  const like = `%${q}%`;
  const { results } = await db.prepare(
    `SELECT pincode,post_office,district,district_slug,state,state_slug FROM pincode_places
     WHERE LOWER(post_office) LIKE ? OR LOWER(district) LIKE ? OR pincode LIKE ? LIMIT ${Number(limit)}`,
  ).bind(like, like, `${q}%`).all<{ pincode: string; post_office: string; district: string; district_slug: string; state: string; state_slug: string }>();
  return results.map(r => ({
    pincode: r.pincode, postOffice: r.post_office, district: r.district,
    districtSlug: r.district_slug, state: r.state, stateSlug: r.state_slug,
  }));
}

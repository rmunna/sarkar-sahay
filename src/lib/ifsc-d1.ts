/**
 * IFSC data — D1-backed implementation (Cloudflare migration).
 *
 * Dual-path by design:
 *   - At runtime on Workers, queries the D1 binding (citizennest_data).
 *   - At build time / local dev (no binding), falls back to the fs-based
 *     functions in ./ifsc, so `next build` and `next dev` keep working without
 *     a remote D1 connection. generateStaticParams (top-300 prerender) stays on
 *     the fs path; only on-demand runtime renders hit D1.
 *
 * Cutover plan: once @opennextjs/cloudflare is wired up, the IFSC pages import
 * the async functions here instead of the sync ones in ./ifsc. The route
 * components are already async server components, so `await` is free.
 */

import type { IFSCBranch, BankInfo } from "./ifsc";
import * as fsImpl from "./ifsc";

// Minimal shape of the D1 binding we use — avoids a hard dependency on
// @cloudflare/workers-types until the adapter is installed.
interface D1Like {
  prepare(sql: string): {
    bind(...vals: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
}

type Row = {
  ifsc: string; bank: string; bank_slug: string; branch: string; branch_display: string;
  city: string; city_slug: string; district: string; state: string; state_slug: string;
  address: string; micr: string; contact: string; neft: number; rtgs: number; imps: number;
  upi: number; page_slug: string;
};

function rowToBranch(r: Row): IFSCBranch {
  return {
    ifsc: r.ifsc, bank: r.bank, bankSlug: r.bank_slug, branch: r.branch,
    branchDisplay: r.branch_display, city: r.city, citySlug: r.city_slug,
    district: r.district, state: r.state, stateSlug: r.state_slug, address: r.address,
    micr: r.micr, contact: r.contact, neft: !!r.neft, rtgs: !!r.rtgs, imps: !!r.imps,
    upi: !!r.upi, pageSlug: r.page_slug,
  };
}

const SELECT = `SELECT ifsc,bank,bank_slug,branch,branch_display,city,city_slug,district,state,state_slug,address,micr,contact,neft,rtgs,imps,upi,page_slug FROM ifsc_branches`;

/**
 * Resolve the D1 binding from the Cloudflare request context, or null when
 * unavailable (build/dev). Uses a runtime import so the adapter is only a
 * dependency in the Workers environment.
 */
type CloudflareCtxModule = {
  getCloudflareContext: (opts?: { async?: boolean }) => Promise<{ env?: Record<string, unknown> }>;
};

async function getDB(): Promise<D1Like | null> {
  try {
    // Indirection keeps tsc from resolving the adapter until it is installed at
    // cutover; until then this returns null and callers use the fs fallback.
    const specifier = "@opennextjs/cloudflare";
    const mod = (await import(/* webpackIgnore: true */ specifier).catch(() => null)) as CloudflareCtxModule | null;
    if (!mod || typeof mod.getCloudflareContext !== "function") return null;
    const ctx = await mod.getCloudflareContext({ async: true });
    return ((ctx?.env?.citizennest_data as D1Like | undefined) ?? null);
  } catch {
    return null;
  }
}

export async function getBranchBySlug(bankSlug: string, pageSlug: string): Promise<IFSCBranch | null> {
  const db = await getDB();
  if (!db) return fsImpl.getBranchBySlug(bankSlug, pageSlug);
  const row = await db.prepare(`${SELECT} WHERE bank_slug = ? AND page_slug = ? LIMIT 1`)
    .bind(bankSlug, pageSlug).first<Row>();
  return row ? rowToBranch(row) : null;
}

export async function getBranchByIFSC(ifscCode: string): Promise<IFSCBranch | null> {
  const db = await getDB();
  if (!db) return fsImpl.getBranchByIFSC(ifscCode);
  const row = await db.prepare(`${SELECT} WHERE ifsc = ? LIMIT 1`)
    .bind(ifscCode.toUpperCase()).first<Row>();
  return row ? rowToBranch(row) : null;
}

export async function getBranchesByCity(bankSlug: string, citySlug: string): Promise<IFSCBranch[]> {
  const db = await getDB();
  if (!db) return fsImpl.getBranchesByCity(bankSlug, citySlug);
  const { results } = await db.prepare(`${SELECT} WHERE bank_slug = ? AND city_slug = ?`)
    .bind(bankSlug, citySlug).all<Row>();
  return results.map(rowToBranch);
}

export async function getNearbyBranches(branch: IFSCBranch, limit = 5): Promise<IFSCBranch[]> {
  const inCity = await getBranchesByCity(branch.bankSlug, branch.citySlug);
  return inCity.filter(b => b.ifsc !== branch.ifsc).slice(0, limit);
}

export async function getBranchesByBank(bankSlug: string): Promise<IFSCBranch[]> {
  const db = await getDB();
  if (!db) return fsImpl.getBranchesByBank(bankSlug);
  const { results } = await db.prepare(`${SELECT} WHERE bank_slug = ?`).bind(bankSlug).all<Row>();
  return results.map(rowToBranch);
}

export async function getAllBanks(): Promise<BankInfo[]> {
  const db = await getDB();
  if (!db) return fsImpl.getAllBanks();
  const { results } = await db.prepare(`SELECT slug, name, count FROM ifsc_banks ORDER BY count DESC`).bind().all<BankInfo>();
  return results;
}

export async function searchBranches(query: string, bankSlug?: string, limit = 20): Promise<IFSCBranch[]> {
  const db = await getDB();
  if (!db) return fsImpl.searchBranches(query, bankSlug, limit);
  const q = `%${query.toUpperCase().trim()}%`;
  if (!query.trim()) return [];
  const where = bankSlug
    ? `WHERE bank_slug = ? AND (branch LIKE ? OR city LIKE ? OR ifsc LIKE ?)`
    : `WHERE branch LIKE ? OR city LIKE ? OR ifsc LIKE ?`;
  const binds = bankSlug ? [bankSlug, q, q, q] : [q, q, q];
  const { results } = await db.prepare(`${SELECT} ${where} LIMIT ${Number(limit)}`).bind(...binds).all<Row>();
  return results.map(rowToBranch);
}

/**
 * IFSC Search API
 * GET /api/ifsc/search?q=koramangala&bank=icici
 * GET /api/ifsc/search?q=ICIC0001234          (direct IFSC lookup)
 *
 * Returns top 10 matching branches as JSON.
 * All searching is done server-side — no large JSON payload to the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchBranches, getBranchByIFSC, BANK_DISPLAY_NAMES } from "@/lib/ifsc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const bank = (searchParams.get("bank") || "").trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], error: "Query too short" }, { status: 400 });
  }

  // Direct IFSC code lookup (11 chars, alphanumeric)
  if (/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(q)) {
    const branch = getBranchByIFSC(q.toUpperCase());
    if (branch) {
      return NextResponse.json({
        results: [{
          ifsc: branch.ifsc,
          bank: branch.bank,
          bankSlug: branch.bankSlug,
          branch: branch.branchDisplay,
          city: branch.city,
          state: branch.state,
          address: branch.address,
          pageSlug: branch.pageSlug,
          url: `/ifsc/${branch.bankSlug}/${branch.pageSlug}`,
        }],
        type: "direct",
      });
    }
    return NextResponse.json({ results: [], type: "direct" });
  }

  // Text search
  const branches = searchBranches(q, bank || undefined, 10);

  const results = branches.map((b) => ({
    ifsc: b.ifsc,
    bank: b.bank,
    bankSlug: b.bankSlug,
    branch: b.branchDisplay,
    city: b.city,
    state: b.state,
    pageSlug: b.pageSlug,
    url: `/ifsc/${b.bankSlug}/${b.pageSlug}`,
  }));

  return NextResponse.json({ results, type: "search", bank: BANK_DISPLAY_NAMES[bank] || null });
}

import { NextResponse } from "next/server";
import { getAllGuides } from "@/lib/guides";
import { getActiveUpdates } from "@/lib/updates";

export const dynamic = "force-static";

export function GET() {
  const guides = getAllGuides().map((g) => ({
    s: g.slug,
    t: g.title,
    d: g.description,
    c: g.category,
  }));
  const updates = getActiveUpdates().map((u) => ({
    s: u.slug,
    t: u.title,
    d: u.description,
    c: u.organization + " — " + u.category,
    u: 1,
  }));
  return NextResponse.json([...guides, ...updates], {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}

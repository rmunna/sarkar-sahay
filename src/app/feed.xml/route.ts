import { getAllGuides } from "@/lib/guides";
import { getActiveUpdates } from "@/lib/updates";

export const dynamic = "force-static";

export function GET() {
  const BASE = "https://www.citizennest.com";
  const guides = getAllGuides()
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 50);
  const updates = getActiveUpdates();

  const items = [
    ...updates.map((u) => ({
      title: u.title,
      link: `${BASE}/update/${u.slug}`,
      description: u.description,
      category: u.category,
    })),
    ...guides.map((g) => ({
      title: g.title,
      link: `${BASE}/guide/${g.slug}`,
      description: g.description,
      category: g.category,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CitizenNest — Government Services Made Simple</title>
    <link>${BASE}</link>
    <description>Step-by-step guides for every Indian government service — Aadhaar, PAN, Passport, Schemes, Jobs &amp; more.</description>
    <language>en-in</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE}/favicon.svg</url>
      <title>CitizenNest</title>
      <link>${BASE}</link>
    </image>
${items
  .map(
    (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <category>${item.category}</category>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

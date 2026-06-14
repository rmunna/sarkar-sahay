#!/usr/bin/env node
/**
 * Generate public/feed.xml as a real static file at build time.
 *
 * The old app/feed.xml route handler ran through the Worker and 503'd on the
 * free plan (same cold-start CPU issue as pages). A static file in public/ is
 * served directly by Cloudflare — reliable 200, and required for Google News /
 * Publisher Center, which rejects a feed that errors.
 *
 * Runs in cf:build, so every deploy refreshes it with the latest content.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.citizennest.com";
const UPDATES = path.join(ROOT, "content/updates");
const GUIDES = path.join(ROOT, "content/guides");
const today = new Date().toISOString().slice(0, 10);

const fld = (fm, k) => (fm.match(new RegExp(`^${k}:\\s*["']?(.*?)["']?\\s*$`, "m")) || [])[1]?.trim() || "";
function frontmatter(file) {
  const txt = fs.readFileSync(file, "utf8");
  const end = txt.indexOf("\n---", 3);
  return end > 0 ? txt.slice(0, end) : txt.slice(0, 2000);
}

// time-sensitive updates first (active, not expired, newest first)
const updates = (fs.existsSync(UPDATES) ? fs.readdirSync(UPDATES) : [])
  .filter((f) => f.endsWith(".md"))
  .map((f) => { const fm = frontmatter(path.join(UPDATES, f)); return { slug: f.replace(/\.md$/, ""), title: fld(fm, "title"), description: fld(fm, "description"), category: fld(fm, "category"), status: fld(fm, "status") || "active", expiry: fld(fm, "expiryDate"), pub: fld(fm, "publishedDate"), kind: "update" }; })
  .filter((u) => u.title && u.status === "active" && !(u.expiry && u.expiry < today))
  .sort((a, b) => (b.pub || "").localeCompare(a.pub || ""));

// a slice of guides for breadth
const guides = (fs.existsSync(GUIDES) ? fs.readdirSync(GUIDES) : [])
  .filter((f) => f.endsWith(".md"))
  .map((f) => { const fm = frontmatter(path.join(GUIDES, f)); return { slug: f.replace(/\.md$/, ""), title: fld(fm, "title"), description: fld(fm, "description"), category: fld(fm, "category"), kind: "guide" }; })
  .filter((g) => g.title)
  .sort((a, b) => a.title.localeCompare(b.title))
  .slice(0, 50);

const items = [...updates, ...guides].map((it) => {
  const link = `${BASE}/${it.kind}/${it.slug}`;
  return `    <item>
      <title><![CDATA[${it.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${it.description}]]></description>
      <category>${it.category}</category>
    </item>`;
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CitizenNest — Government Services Made Simple</title>
    <link>${BASE}</link>
    <description>Step-by-step guides for every Indian government service — Aadhaar, PAN, Passport, Schemes, Jobs &amp; more.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image><url>${BASE}/favicon.svg</url><title>CitizenNest</title><link>${BASE}</link></image>
${items}
  </channel>
</rss>`;

fs.writeFileSync(path.join(ROOT, "public", "feed.xml"), xml);
console.log(`generate-feed: wrote public/feed.xml (${updates.length} updates + ${guides.length} guides)`);

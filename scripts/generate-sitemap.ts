/**
 * Generate sitemap.xml from content/guides/*.md
 * Run after build: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citizennest.com";
const GUIDES_DIR = path.join(__dirname, "..", "content", "guides");
const UPDATES_DIR = path.join(__dirname, "..", "content", "updates");
const OUT_DIR = path.join(__dirname, "..", ".next", "static");

function getGuides() {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(GUIDES_DIR, f), "utf8");
      const { data } = matter(content);
      return {
        slug: f.replace(/\.md$/, ""),
        lastUpdated: data.lastUpdated || new Date().toISOString().split("T")[0],
      };
    });
}

function getUpdates() {
  if (!fs.existsSync(UPDATES_DIR)) return [];
  return fs
    .readdirSync(UPDATES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(UPDATES_DIR, f), "utf8");
      const { data } = matter(content);
      return {
        slug: f.replace(/\.md$/, ""),
        publishedDate: data.publishedDate || new Date().toISOString().split("T")[0],
        status: data.status || "active",
      };
    });
}

function generateSitemap(): string {
  const guides = getGuides();
  const updates = getUpdates();
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: BASE_URL, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${BASE_URL}/categories`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/updates`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/about`, lastmod: today, changefreq: "monthly", priority: "0.3" },
    ...guides.map((g) => ({
      loc: `${BASE_URL}/guide/${g.slug}`,
      lastmod: g.lastUpdated,
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...updates
      .filter((u) => u.status === "active")
      .map((u) => ({
        loc: `${BASE_URL}/update/${u.slug}`,
        lastmod: u.publishedDate,
        changefreq: "daily",
        priority: "0.9",
      })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

// Write to both public/ (for dev) and out/ (post-build)
const sitemap = generateSitemap();

fs.writeFileSync(path.join(__dirname, "..", "public", "sitemap.xml"), sitemap);
console.log("✅ Written public/sitemap.xml");

if (fs.existsSync(OUT_DIR)) {
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemap);
  console.log("✅ Written out/sitemap.xml");
}

console.log(`📄 ${getGuides().length + getUpdates().filter(u => u.status === "active").length + 4} URLs in sitemap`);

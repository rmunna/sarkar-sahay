/**
 * Generate sitemap.xml from content/guides/*.md
 * Run after build: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

// State slugs for state pages
const STATE_SLUGS = [
  "karnataka", "tamil-nadu", "kerala", "telangana", "maharashtra",
  "rajasthan", "bihar", "west-bengal", "assam", "gujarat",
  "madhya-pradesh", "uttar-pradesh", "haryana", "punjab",
  "jharkhand", "chhattisgarh", "odisha",
];

// Calculator slugs (hardcoded routes in src/app/calculator/)
const CALCULATOR_SLUGS = [
  "age-eligibility", "atal-pension-yojana-eligibility", "ayushman-bharat-eligibility",
  "car-loan", "education-cost", "emi", "epf", "fd", "gratuity", "gst",
  "home-loan-eligibility", "hra-exemption", "income-tax", "interest",
  "job-eligibility", "lumpsum", "mudra-loan-eligibility", "nps",
  "pm-awas-yojana-eligibility", "pm-kisan-eligibility", "ppf", "rent-receipt",
  "retirement", "salary", "senior-citizen-pension-eligibility", "sip",
  "stamp-duty", "sukanya-samriddhi", "sukanya-samriddhi-eligibility",
  "ujjwala-yojana-eligibility",
];

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
const GUIDES_DIR = path.join(__dirname, "..", "content", "guides");
const GUIDES_HI_DIR = path.join(__dirname, "..", "content", "guides-hi");
const UPDATES_DIR = path.join(__dirname, "..", "content", "updates");
const OUT_DIR = path.join(__dirname, "..", ".next", "static");

function toDateString(val: unknown): string {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) return val.toISOString().split("T")[0];
  const s = String(val);
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try to parse and format
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}

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
        lastUpdated: toDateString(data.lastUpdated),
      };
    });
}

function getHindiGuides() {
  if (!fs.existsSync(GUIDES_HI_DIR)) return [];
  return fs
    .readdirSync(GUIDES_HI_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(GUIDES_HI_DIR, f), "utf8");
      const { data } = matter(content);
      return {
        slug: f.replace(/\.md$/, ""),
        lastUpdated: toDateString(data.lastUpdated),
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
        publishedDate: toDateString(data.publishedDate),
        status: data.status || "active",
      };
    });
}

function generateSitemap(): string {
  const guides = getGuides();
  const hindiGuides = getHindiGuides();
  const updates = getUpdates();
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: BASE_URL, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${BASE_URL}/hi`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/categories`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/updates`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/about`, lastmod: today, changefreq: "monthly", priority: "0.3" },
    { loc: `${BASE_URL}/states`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    ...STATE_SLUGS.map((s) => ({
      loc: `${BASE_URL}/state/${s}`,
      lastmod: today,
      changefreq: "weekly" as const,
      priority: "0.6",
    })),
    ...CALCULATOR_SLUGS.map((s) => ({
      loc: `${BASE_URL}/calculator/${s}`,
      lastmod: today,
      changefreq: "monthly" as const,
      priority: "0.7",
    })),
    ...guides.map((g) => ({
      loc: `${BASE_URL}/guide/${g.slug}`,
      lastmod: g.lastUpdated,
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...hindiGuides.map((g) => ({
      loc: `${BASE_URL}/hi/guide/${g.slug}`,
      lastmod: g.lastUpdated || today,
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

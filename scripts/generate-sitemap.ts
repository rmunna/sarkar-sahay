/**
 * Generate sitemap.xml from content/guides/*.md + IFSC pages
 * Run after build: npx tsx scripts/generate-sitemap.ts
 *
 * Outputs:
 *   public/sitemap.xml         — main sitemap (guides, calculators, IFSC home+bank pages)
 *   public/sitemap-ifsc-{bank}.xml — per-bank branch sitemaps (~134K URLs total)
 *   public/sitemap-index.xml   — sitemap index linking all the above
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

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function buildUrlset(urls: SitemapUrl[]): string {
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

function getIFSCBanks(): { slug: string; count: number }[] {
  const banksFile = path.join(__dirname, "..", "data", "ifsc", "banks.json");
  if (!fs.existsSync(banksFile)) return [];
  return JSON.parse(fs.readFileSync(banksFile, "utf8")) as { slug: string; count: number }[];
}

interface IFSCBranchRecord {
  pageSlug: string;
}

function getIFSCBranches(bankSlug: string): IFSCBranchRecord[] {
  const f = path.join(__dirname, "..", "data", "ifsc", `${bankSlug}.json`);
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, "utf8")) as IFSCBranchRecord[];
}

function generateMainSitemap(): string {
  const guides = getGuides();
  const hindiGuides = getHindiGuides();
  const updates = getUpdates();
  const today = new Date().toISOString().split("T")[0];
  const ifscBanks = getIFSCBanks();

  const urls: SitemapUrl[] = [
    { loc: BASE_URL, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${BASE_URL}/hi`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/categories`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/updates`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/about`, lastmod: today, changefreq: "monthly", priority: "0.3" },
    { loc: `${BASE_URL}/states`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    // IFSC home + all bank pages
    { loc: `${BASE_URL}/ifsc`, lastmod: today, changefreq: "monthly", priority: "0.9" },
    ...ifscBanks.map((b) => ({
      loc: `${BASE_URL}/ifsc/${b.slug}`,
      lastmod: today,
      changefreq: "monthly" as const,
      priority: "0.8",
    })),
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
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
    ...hindiGuides.map((g) => ({
      loc: `${BASE_URL}/hi/guide/${g.slug}`,
      lastmod: g.lastUpdated || today,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
    ...updates
      .filter((u) => u.status === "active")
      .map((u) => ({
        loc: `${BASE_URL}/update/${u.slug}`,
        lastmod: u.publishedDate,
        changefreq: "daily" as const,
        priority: "0.9",
      })),
  ];

  return buildUrlset(urls);
}

function generateIFSCSitemaps(publicDir: string): string[] {
  const today = new Date().toISOString().split("T")[0];
  const banks = getIFSCBanks();
  const sitemapNames: string[] = [];

  for (const bank of banks) {
    const branches = getIFSCBranches(bank.slug);
    if (!branches.length) continue;

    const urls: SitemapUrl[] = branches.map((b) => ({
      loc: `${BASE_URL}/ifsc/${bank.slug}/${b.pageSlug}`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.7",
    }));

    const filename = `sitemap-ifsc-${bank.slug}.xml`;
    fs.writeFileSync(path.join(publicDir, filename), buildUrlset(urls));
    console.log(`  ✅ ${filename}: ${urls.length.toLocaleString()} URLs`);
    sitemapNames.push(filename);
  }

  return sitemapNames;
}

function generateSitemapIndex(publicDir: string, sitemapNames: string[]): string {
  const today = new Date().toISOString().split("T")[0];
  const allSitemaps = ["sitemap.xml", ...sitemapNames];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps
  .map(
    (name) => `  <sitemap>
    <loc>${BASE_URL}/${name}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

// --- Main ---
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// 1. Main sitemap
const mainSitemap = generateMainSitemap();
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), mainSitemap);
console.log("✅ Written public/sitemap.xml");

// 2. Per-bank IFSC sitemaps
console.log("📍 Generating IFSC branch sitemaps …");
const ifscSitemapNames = generateIFSCSitemaps(PUBLIC_DIR);

// 3. Sitemap index
const sitemapIndex = generateSitemapIndex(PUBLIC_DIR, ifscSitemapNames);
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap-index.xml"), sitemapIndex);
console.log("✅ Written public/sitemap-index.xml");

if (fs.existsSync(OUT_DIR)) {
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), mainSitemap);
  fs.writeFileSync(path.join(OUT_DIR, "sitemap-index.xml"), sitemapIndex);
}

const totalIFSCUrls = ifscSitemapNames.length > 0
  ? getIFSCBanks().reduce((sum, b) => sum + getIFSCBranches(b.slug).length, 0)
  : 0;
console.log(`\n📄 Total URLs generated:`);
console.log(`   Main sitemap: ${getGuides().length + getUpdates().filter(u => u.status === "active").length + getIFSCBanks().length + 10} URLs`);
console.log(`   IFSC branch sitemaps: ${totalIFSCUrls.toLocaleString()} URLs across ${ifscSitemapNames.length} files`);

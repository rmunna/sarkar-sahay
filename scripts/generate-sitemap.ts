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
  "old-vs-new-regime", "pm-awas-yojana-eligibility", "pm-kisan-eligibility",
  "ppf", "rent-receipt", "retirement", "salary",
  "senior-citizen-pension-eligibility", "sip",
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

// Scheme pages are indexable only once they carry rich myScheme detail
// (benefits + eligibility). Mirrors isRichDetail() in src/lib/schemes-data.ts.
function getRichSchemeSlugs(): string[] {
  const detailDir = path.join(__dirname, "..", "data", "schemes", "_detail");
  const msFile = path.join(__dirname, "..", "data", "schemes", "myscheme.json");
  if (!fs.existsSync(detailDir) || !fs.existsSync(msFile)) return [];
  const schemes = JSON.parse(fs.readFileSync(msFile, "utf-8")) as { slug?: string; id: string; msSlug?: string }[];
  const out: string[] = [];
  for (const s of schemes) {
    const msSlug = s.msSlug ?? s.slug ?? s.id;     // detail file key
    const urlSlug = s.slug ?? s.id;                // descriptive URL slug
    const f = path.join(detailDir, `${msSlug}.json`);
    if (!fs.existsSync(f)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(f, "utf-8"));
      const elig = (d.eligibilityMd || "").length;
      const ben = (d.benefitsMd || "").length;
      const desc = (d.descriptionMd || d.briefDescription || "").length;
      if (elig >= 80 && (ben >= 20 || desc >= 200)) out.push(urlSlug);
    } catch { /* skip */ }
  }
  return out;
}

// Descriptive slugs with a genuinely-Hindi, rich detail file. Mirrors
// isRichHindiDetail() in src/lib/schemes-data.ts (the myScheme API falls back
// to English when a translation is missing, so we require real Devanagari).
function getRichHindiSchemeSlugs(): string[] {
  const detailDir = path.join(__dirname, "..", "data", "schemes", "_detail_hi");
  const msFile = path.join(__dirname, "..", "data", "schemes", "myscheme.json");
  if (!fs.existsSync(detailDir) || !fs.existsSync(msFile)) return [];
  const schemes = JSON.parse(fs.readFileSync(msFile, "utf-8")) as { slug?: string; id: string; msSlug?: string }[];
  const out: string[] = [];
  for (const s of schemes) {
    const msSlug = s.msSlug ?? s.slug ?? s.id;
    const urlSlug = s.slug ?? s.id;
    const f = path.join(detailDir, `${msSlug}.json`);
    if (!fs.existsSync(f)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(f, "utf-8"));
      const elig = (d.eligibilityMd || "").length;
      const ben = (d.benefitsMd || "").length;
      const desc = (d.descriptionMd || d.briefDescription || "").length;
      if (elig < 80 || (ben < 20 && desc < 200)) continue;
      const prose = `${d.descriptionMd || ""} ${d.benefitsMd || ""} ${d.eligibilityMd || ""} ${d.briefDescription || ""}`;
      const deva = (prose.match(/[ऀ-ॿ]/g) || []).length;
      if (deva >= 40) out.push(urlSlug);
    } catch { /* skip */ }
  }
  return out;
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
    // Pincode home
    { loc: `${BASE_URL}/pincode`, lastmod: today, changefreq: "monthly", priority: "0.9" },
    // HSN home
    { loc: `${BASE_URL}/hsn`, lastmod: today, changefreq: "monthly", priority: "0.8" },
    // RTO home
    { loc: `${BASE_URL}/rto`, lastmod: today, changefreq: "monthly", priority: "0.8" },
    // Scheme eligibility engine + directory + rich per-scheme pages.
    // Only schemes with ingested myScheme detail (benefits + eligibility) are
    // included; thin ones stay noindex + out of the sitemap.
    { loc: `${BASE_URL}/eligibility`, lastmod: today, changefreq: "weekly", priority: "0.9" },
    { loc: `${BASE_URL}/schemes`, lastmod: today, changefreq: "weekly", priority: "0.9" },
    ...getRichSchemeSlugs().map((slug) => ({
      loc: `${BASE_URL}/scheme/${slug}`,
      lastmod: today,
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
    // Court home + special pages
    { loc: `${BASE_URL}/court`, lastmod: today, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/court/supreme-court`, lastmod: today, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/court/cnr`, lastmod: today, changefreq: "monthly", priority: "0.7" },
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
    // Hindi per-scheme pages (only those with genuinely-Hindi rich detail).
    ...getRichHindiSchemeSlugs().map((slug) => ({
      loc: `${BASE_URL}/hi/scheme/${slug}`,
      lastmod: today,
      changefreq: "monthly" as const,
      priority: "0.6",
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

interface PincodeSummary {
  pincode: string;
  postOffice: string;
  stateSlug: string;
  districtSlug: string;
}

function slugifyText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function generatePincodeSitemap(publicDir: string): string[] {
  const today = new Date().toISOString().split("T")[0];
  const indexFile = path.join(__dirname, "..", "data", "pincode", "index.json");
  if (!fs.existsSync(indexFile)) return [];

  const index = JSON.parse(fs.readFileSync(indexFile, "utf8")) as Record<string, PincodeSummary>;
  const records = Object.values(index);

  // 1. Individual pincode pages (new hierarchical URLs)
  const pincodeUrls: SitemapUrl[] = records.map((r) => {
    const slug = slugifyText(r.postOffice) + "-" + r.pincode;
    return {
      loc: `${BASE_URL}/pincode/${r.stateSlug}/${r.districtSlug}/${slug}`,
      lastmod: today,
      changefreq: "yearly",
      priority: "0.6",
    };
  });

  // 2. District pages — unique state/district combos
  const districtSeen = new Set<string>();
  const districtUrls: SitemapUrl[] = [];
  for (const r of records) {
    const key = `${r.stateSlug}/${r.districtSlug}`;
    if (!districtSeen.has(key)) {
      districtSeen.add(key);
      districtUrls.push({
        loc: `${BASE_URL}/pincode/${r.stateSlug}/${r.districtSlug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  }

  // 3. State pages — unique state slugs
  const stateSeen = new Set<string>();
  const stateUrls: SitemapUrl[] = [];
  for (const r of records) {
    if (!stateSeen.has(r.stateSlug)) {
      stateSeen.add(r.stateSlug);
      stateUrls.push({
        loc: `${BASE_URL}/pincode/${r.stateSlug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.8",
      });
    }
  }

  // Write: one sitemap for pincodes, one combined for state+district hubs
  const pinFile = "sitemap-pincode.xml";
  const hubFile = "sitemap-pincode-hubs.xml";

  fs.writeFileSync(path.join(publicDir, pinFile), buildUrlset(pincodeUrls));
  console.log(`  ✅ ${pinFile}: ${pincodeUrls.length.toLocaleString()} URLs`);

  fs.writeFileSync(path.join(publicDir, hubFile), buildUrlset([...stateUrls, ...districtUrls]));
  console.log(`  ✅ ${hubFile}: ${stateUrls.length} state + ${districtUrls.length} district URLs`);

  return [pinFile, hubFile];
}

function generateHSNSitemap(publicDir: string): string {
  const today = new Date().toISOString().split("T")[0];
  const allFile = path.join(__dirname, "..", "data", "hsn", "all.json");
  if (!fs.existsSync(allFile)) return "";

  const records = JSON.parse(fs.readFileSync(allFile, "utf8")) as { code: string }[];
  const urls: SitemapUrl[] = records.map((r) => ({
    loc: `${BASE_URL}/hsn/${r.code.toLowerCase()}`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.6",
  }));

  const filename = "sitemap-hsn.xml";
  fs.writeFileSync(path.join(publicDir, filename), buildUrlset(urls));
  console.log(`  ✅ ${filename}: ${urls.length} URLs`);
  return filename;
}

function generateRTOSitemap(publicDir: string): string {
  const today = new Date().toISOString().split("T")[0];
  const rtoFile = path.join(__dirname, "..", "data", "rto", "rto.json");
  if (!fs.existsSync(rtoFile)) return "";

  const records = JSON.parse(fs.readFileSync(rtoFile, "utf8")) as { slug: string }[];
  const urls: SitemapUrl[] = records.map((r) => ({
    loc: `${BASE_URL}/rto/${r.slug}`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.6",
  }));

  const filename = "sitemap-rto.xml";
  fs.writeFileSync(path.join(publicDir, filename), buildUrlset(urls));
  console.log(`  ✅ ${filename}: ${urls.length} URLs`);
  return filename;
}

interface CourtSummary {
  slug: string;
  stateSlug: string;
  type: string;
}

function generateCourtSitemap(publicDir: string): string {
  const today = new Date().toISOString().split("T")[0];
  const hcFile = path.join(__dirname, "..", "data", "court", "courts.json");
  const dcFile = path.join(__dirname, "..", "data", "court", "district-courts.json");
  if (!fs.existsSync(hcFile)) return "";

  const hcCourts = JSON.parse(fs.readFileSync(hcFile, "utf8")) as CourtSummary[];
  const dcCourts: CourtSummary[] = fs.existsSync(dcFile)
    ? JSON.parse(fs.readFileSync(dcFile, "utf8"))
    : [];
  const courts = [...hcCourts, ...dcCourts];

  const urls: SitemapUrl[] = [];

  // State hubs — unique stateSlug values (exclude supreme which has own page)
  const stateSeen = new Set<string>();
  for (const c of courts) {
    if (!stateSeen.has(c.stateSlug)) {
      stateSeen.add(c.stateSlug);
      urls.push({
        loc: `${BASE_URL}/court/${c.stateSlug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  }

  // Individual court pages (not supreme — it has its own static route)
  for (const c of courts) {
    if (c.type === "supreme") continue;
    urls.push({
      loc: `${BASE_URL}/court/${c.stateSlug}/${c.slug}`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  const filename = "sitemap-court.xml";
  fs.writeFileSync(path.join(publicDir, filename), buildUrlset(urls));
  console.log(`  ✅ ${filename}: ${urls.length} URLs (${hcCourts.length - 1} HC + ${dcCourts.length} district + state hubs)`);
  return filename;
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

// 3. Pincode sitemaps (individual + hub pages)
console.log("📮 Generating pincode sitemaps …");
const pincodeSitemapNames = generatePincodeSitemap(PUBLIC_DIR);

// 4. HSN sitemap
console.log("📦 Generating HSN sitemap …");
const hsnSitemapName = generateHSNSitemap(PUBLIC_DIR);

// 5. RTO sitemap
console.log("🚗 Generating RTO sitemap …");
const rtoSitemapName = generateRTOSitemap(PUBLIC_DIR);

// 6. Court sitemap
console.log("⚖️  Generating court sitemap …");
const courtSitemapName = generateCourtSitemap(PUBLIC_DIR);

// 7. Sitemap index
const allSitemapNames = [
  ...ifscSitemapNames,
  ...pincodeSitemapNames,
  ...(hsnSitemapName ? [hsnSitemapName] : []),
  ...(rtoSitemapName ? [rtoSitemapName] : []),
  ...(courtSitemapName ? [courtSitemapName] : []),
];
const sitemapIndex = generateSitemapIndex(PUBLIC_DIR, allSitemapNames);
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
console.log(`   Main sitemap: ${getGuides().length + getUpdates().filter(u => u.status === "active").length + getIFSCBanks().length + 11} URLs`);
console.log(`   IFSC branch sitemaps: ${totalIFSCUrls.toLocaleString()} URLs across ${ifscSitemapNames.length} files`);
console.log(`   Pincode sitemap: 19,238 URLs`);

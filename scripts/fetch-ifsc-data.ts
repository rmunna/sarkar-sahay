/**
 * IFSC Data Fetcher
 * Downloads IFSC data from Razorpay's open IFSC database (https://github.com/razorpay/ifsc)
 * and processes it into per-bank JSON files for fast lookup.
 *
 * Run: npx tsx scripts/fetch-ifsc-data.ts
 * Output: data/ifsc/<bank-slug>.json + data/ifsc/index.json + data/ifsc/banks.json
 *
 * Data source: IFSC.csv from Razorpay GitHub releases (latest)
 * CSV columns: BANK,IFSC,BRANCH,CENTRE,DISTRICT,STATE,ADDRESS,CONTACT,IMPS,RTGS,CITY,ISO3166,NEFT,MICR,UPI,SWIFT
 */

import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import readline from "readline";

const DATA_DIR = path.join(process.cwd(), "data", "ifsc");

// Canonical bank slug mapping — maps IFSC prefix to our slug
const BANK_CODE_TO_SLUG: Record<string, string> = {
  SBIN: "sbi",
  HDFC: "hdfc",
  ICIC: "icici",
  UTIB: "axis",
  PUNB: "pnb",
  BARB: "bob",
  CNRB: "canara",
  UBIN: "union",
  BKID: "boi",
  KKBK: "kotak",
  IBKL: "idbi",
  IDIB: "indian",
  YESB: "yes",
  CBIN: "central",
  INDB: "indusind",
  FDRL: "federal",
  RATN: "rbl",
  IDFB: "idfc",
  BDBL: "bandhan",
};

const BANK_DISPLAY_NAMES: Record<string, string> = {
  sbi: "State Bank of India",
  hdfc: "HDFC Bank",
  icici: "ICICI Bank",
  axis: "Axis Bank",
  pnb: "Punjab National Bank",
  bob: "Bank of Baroda",
  canara: "Canara Bank",
  union: "Union Bank of India",
  boi: "Bank of India",
  kotak: "Kotak Mahindra Bank",
  idbi: "IDBI Bank",
  indian: "Indian Bank",
  yes: "Yes Bank",
  central: "Central Bank of India",
  indusind: "IndusInd Bank",
  federal: "Federal Bank",
  rbl: "RBL Bank",
  idfc: "IDFC FIRST Bank",
  bandhan: "Bandhan Bank",
};

// Only index these banks — others are too small to generate meaningful SEO traffic
const INDEXED_BANK_SLUGS = new Set(Object.keys(BANK_DISPLAY_NAMES));

export interface IFSCBranch {
  ifsc: string;
  bank: string;
  bankSlug: string;
  branch: string;
  branchDisplay: string;
  city: string;
  citySlug: string;
  district: string;
  state: string;
  stateSlug: string;
  address: string;
  micr: string;
  contact: string;
  neft: boolean;
  rtgs: boolean;
  imps: boolean;
  upi: boolean;
  pageSlug: string; // used as URL: /ifsc/[bankSlug]/[pageSlug]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getBankSlugFromIFSC(ifsc: string): string {
  const code = ifsc.slice(0, 4).toUpperCase();
  return BANK_CODE_TO_SLUG[code] || slugify(code);
}

function makeBranchPageSlug(branch: string, city: string): string {
  // e.g. "RAMAMURTHY NAGAR" + "BANGALORE" -> "ramamurthy-nagar-bangalore"
  return slugify(`${branch} ${city}`);
}

/**
 * Parse a single CSV row, respecting quoted fields with commas inside.
 * Returns an array of field values.
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  result.push(field.trim());
  return result;
}

/**
 * Download the full IFSC CSV from Razorpay GitHub releases
 * Uses curl to handle GitHub's multi-level redirects reliably.
 */
async function downloadCSV(): Promise<string> {
  // Fetch latest release tag from GitHub API
  const latestTag = await new Promise<string>((resolve) => {
    https
      .get(
        "https://api.github.com/repos/razorpay/ifsc/releases/latest",
        { headers: { "User-Agent": "ifsc-fetcher" } },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data) as { tag_name: string };
              resolve(json.tag_name);
            } catch {
              resolve("v2.0.59"); // fallback
            }
          });
        }
      )
      .on("error", () => resolve("v2.0.59"));
  });

  console.log(`  Using release: ${latestTag}`);
  const CSV_URL = `https://github.com/razorpay/ifsc/releases/download/${latestTag}/IFSC.csv`;
  const RAW_DIR = path.join(DATA_DIR, "raw");
  const CSV_FILE = path.join(RAW_DIR, "IFSC.csv");

  fs.mkdirSync(RAW_DIR, { recursive: true });

  // Use curl -L to follow all redirects (GitHub -> CDN can be 3+ hops)
  console.log("  Downloading IFSC.csv …");
  execSync(`curl -L -o "${CSV_FILE}" "${CSV_URL}"`, { stdio: "inherit" });
  console.log("  ✅ Downloaded IFSC.csv");
  return CSV_FILE;
}

/**
 * Process the downloaded CSV into per-bank JSON files
 */
async function processCSV(csvFile: string): Promise<void> {
  console.log("⚙️  Processing IFSC CSV …");

  const byBank: Record<string, IFSCBranch[]> = {};
  const index: Record<
    string,
    { bankSlug: string; pageSlug: string; bank: string; branch: string; city: string }
  > = {};

  // CSV columns (0-indexed):
  // 0:BANK, 1:IFSC, 2:BRANCH, 3:CENTRE, 4:DISTRICT, 5:STATE,
  // 6:ADDRESS, 7:CONTACT, 8:IMPS, 9:RTGS, 10:CITY, 11:ISO3166,
  // 12:NEFT, 13:MICR, 14:UPI, 15:SWIFT

  let lineNum = 0;
  let total = 0;
  let skipped = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // skip header

    if (!line.trim()) continue;

    const cols = parseCSVRow(line);
    const ifsc = (cols[1] || "").toUpperCase().trim();
    if (!ifsc || ifsc.length !== 11) {
      skipped++;
      continue;
    }

    const bankSlug = getBankSlugFromIFSC(ifsc);

    // Only index our known banks (the ones with SEO-worthy traffic)
    if (!INDEXED_BANK_SLUGS.has(bankSlug)) {
      skipped++;
      continue;
    }

    const rawBankName = (cols[0] || "").trim();
    const bankName = rawBankName || BANK_DISPLAY_NAMES[bankSlug] || bankSlug.toUpperCase();
    const rawBranch = (cols[2] || "").trim();
    const rawCity = (cols[10] || cols[3] || "").trim(); // prefer CITY, fall back to CENTRE
    const district = (cols[4] || "").trim();
    const state = (cols[5] || "").trim();
    const address = (cols[6] || "").trim();
    const contact = (cols[7] || "").trim();
    const imps = cols[8] === "true";
    const rtgs = cols[9] === "true";
    const neft = cols[12] === "true";
    const micr = (cols[13] || "").trim();
    const upi = cols[14] === "true";

    const pageSlug = makeBranchPageSlug(rawBranch, rawCity);

    const branch: IFSCBranch = {
      ifsc,
      bank: bankName,
      bankSlug,
      branch: rawBranch.toUpperCase(),
      branchDisplay: toTitleCase(rawBranch),
      city: rawCity.toUpperCase(),
      citySlug: slugify(rawCity),
      district,
      state,
      stateSlug: slugify(state),
      address,
      micr,
      contact,
      neft,
      rtgs,
      imps,
      upi,
      pageSlug,
    };

    if (!byBank[bankSlug]) byBank[bankSlug] = [];
    byBank[bankSlug].push(branch);

    index[ifsc] = {
      bankSlug,
      pageSlug,
      bank: bankName,
      branch: branch.branchDisplay,
      city: branch.city,
    };

    total++;
  }

  // Write per-bank files
  for (const [bankSlug, branches] of Object.entries(byBank)) {
    const bankFile = path.join(DATA_DIR, `${bankSlug}.json`);
    fs.writeFileSync(bankFile, JSON.stringify(branches));
    console.log(`  ✅ ${bankSlug}: ${branches.length.toLocaleString()} branches`);
  }

  // Write lightweight index (IFSC -> lookup key)
  const indexFile = path.join(DATA_DIR, "index.json");
  fs.writeFileSync(indexFile, JSON.stringify(index));

  // Write bank list
  const bankList = Object.keys(byBank)
    .map((slug) => ({
      slug,
      name: BANK_DISPLAY_NAMES[slug] || slug.toUpperCase(),
      count: byBank[slug].length,
    }))
    .sort((a, b) => b.count - a.count);

  fs.writeFileSync(
    path.join(DATA_DIR, "banks.json"),
    JSON.stringify(bankList, null, 2)
  );

  console.log(
    `\n✅ Indexed ${total.toLocaleString()} branches across ${Object.keys(byBank).length} banks`
  );
  console.log(`   (skipped ${skipped.toLocaleString()} rows from smaller/foreign banks)`);
  console.log(`📁 Output: ${DATA_DIR}`);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const csvFile = path.join(DATA_DIR, "raw", "IFSC.csv");

  if (!fs.existsSync(csvFile)) {
    console.log("📥 Fetching latest IFSC data from Razorpay …");
    await downloadCSV();
  } else {
    console.log("📂 Using existing IFSC.csv (delete data/ifsc/raw/IFSC.csv to re-download)");
  }

  await processCSV(csvFile);
}

main().catch(console.error);

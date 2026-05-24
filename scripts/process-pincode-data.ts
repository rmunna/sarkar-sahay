/**
 * Pincode Data Processor
 * Processes GeoNames India postal code data (data/pincode/raw/IN.txt)
 * into per-state JSON files + a full index for fast lookup.
 *
 * Data source: https://download.geonames.org/export/zip/IN.zip
 * License: Creative Commons Attribution 4.0
 *
 * Run: npx tsx scripts/process-pincode-data.ts
 * Output: data/pincode/*.json
 *
 * GeoNames columns (tab-separated):
 * 0:country, 1:pincode, 2:place_name, 3:state, 4:state_code,
 * 5:district, 6:district_code, 7:taluk, 8:taluk_code, 9:lat, 10:lng, 11:accuracy
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const DATA_DIR = path.join(process.cwd(), "data", "pincode");
const RAW_FILE = path.join(DATA_DIR, "raw", "IN.txt");

export interface PincodeRecord {
  pincode: string;
  places: string[];       // all locality/area names under this pincode
  district: string;
  districtSlug: string;
  state: string;
  stateSlug: string;
  taluk: string;          // sub-district / block
  lat: string;
  lng: string;
  postOffice: string;     // primary place name (first entry)
}

export interface PincodeSummary {
  pincode: string;
  postOffice: string;
  district: string;
  state: string;
  stateSlug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Canonical state name normalisation (GeoNames uses some odd names)
const STATE_NAME_MAP: Record<string, string> = {
  "Andaman & Nicobar Islands": "Andaman & Nicobar Islands",
  "Andhra Pradesh": "Andhra Pradesh",
  "Arunachal Pradesh": "Arunachal Pradesh",
  "Assam": "Assam",
  "Bihar": "Bihar",
  "Chandigarh": "Chandigarh",
  "Chhattisgarh": "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu": "Dadra & Nagar Haveli / Daman & Diu",
  "Delhi": "Delhi",
  "Goa": "Goa",
  "Gujarat": "Gujarat",
  "Haryana": "Haryana",
  "Himachal Pradesh": "Himachal Pradesh",
  "Jammu and Kashmir": "Jammu & Kashmir",
  "Jharkhand": "Jharkhand",
  "Karnataka": "Karnataka",
  "Kerala": "Kerala",
  "Ladakh": "Ladakh",
  "Lakshadweep": "Lakshadweep",
  "Madhya Pradesh": "Madhya Pradesh",
  "Maharashtra": "Maharashtra",
  "Manipur": "Manipur",
  "Meghalaya": "Meghalaya",
  "Mizoram": "Mizoram",
  "Nagaland": "Nagaland",
  "Odisha": "Odisha",
  "Puducherry": "Puducherry",
  "Punjab": "Punjab",
  "Rajasthan": "Rajasthan",
  "Sikkim": "Sikkim",
  "Tamil Nadu": "Tamil Nadu",
  "Telangana": "Telangana",
  "Tripura": "Tripura",
  "Uttar Pradesh": "Uttar Pradesh",
  "Uttarakhand": "Uttarakhand",
  "West Bengal": "West Bengal",
};

async function processData(): Promise<void> {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`❌ Raw data not found: ${RAW_FILE}`);
    console.log("Download with:");
    console.log("  curl -L https://download.geonames.org/export/zip/IN.zip -o /tmp/IN.zip");
    console.log("  unzip /tmp/IN.zip -d /tmp/in_pincode");
    console.log(`  cp /tmp/in_pincode/IN.txt ${RAW_FILE}`);
    process.exit(1);
  }

  console.log("⚙️  Processing GeoNames India pincode data …");

  // Group rows by pincode
  const byPincode: Record<string, {
    places: Set<string>;
    district: string;
    state: string;
    taluk: string;
    lat: string;
    lng: string;
  }> = {};

  const rl = readline.createInterface({
    input: fs.createReadStream(RAW_FILE, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    lineCount++;

    const cols = line.split("\t");
    if (cols.length < 10) continue;

    const pincode = cols[1].trim();
    const placeName = cols[2].trim();
    const rawState = cols[3].trim();
    const district = cols[5].trim();
    const taluk = cols[7].trim();
    const lat = cols[9].trim();
    const lng = cols[10].trim();

    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) continue;

    const state = STATE_NAME_MAP[rawState] || rawState;

    if (!byPincode[pincode]) {
      byPincode[pincode] = {
        places: new Set(),
        district,
        state,
        taluk,
        lat,
        lng,
      };
    }

    if (placeName) byPincode[pincode].places.add(placeName);
    // Keep best lat/lng (first non-empty)
    if (!byPincode[pincode].lat && lat) byPincode[pincode].lat = lat;
    if (!byPincode[pincode].lng && lng) byPincode[pincode].lng = lng;
  }

  console.log(`  Parsed ${lineCount.toLocaleString()} rows → ${Object.keys(byPincode).length.toLocaleString()} unique pincodes`);

  // Build records
  const records: PincodeRecord[] = Object.entries(byPincode).map(([pincode, data]) => {
    const places = Array.from(data.places).sort();
    return {
      pincode,
      places,
      postOffice: places[0] || pincode,
      district: data.district,
      districtSlug: slugify(data.district),
      state: data.state,
      stateSlug: slugify(data.state),
      taluk: data.taluk,
      lat: data.lat,
      lng: data.lng,
    };
  });

  // Sort by pincode numerically
  records.sort((a, b) => Number(a.pincode) - Number(b.pincode));

  // Write per-state files
  const byState: Record<string, PincodeRecord[]> = {};
  for (const r of records) {
    const key = r.stateSlug;
    if (!byState[key]) byState[key] = [];
    byState[key].push(r);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const [stateSlug, stateRecords] of Object.entries(byState)) {
    const file = path.join(DATA_DIR, `${stateSlug}.json`);
    fs.writeFileSync(file, JSON.stringify(stateRecords));
    console.log(`  ✅ ${stateSlug}: ${stateRecords.length.toLocaleString()} pincodes`);
  }

  // Write lightweight index: pincode → { stateSlug, district, state, places[0] }
  const index: Record<string, PincodeSummary> = {};
  for (const r of records) {
    index[r.pincode] = {
      pincode: r.pincode,
      postOffice: r.postOffice,
      district: r.district,
      state: r.state,
      stateSlug: r.stateSlug,
    };
  }
  fs.writeFileSync(path.join(DATA_DIR, "index.json"), JSON.stringify(index));

  // Write states list
  const stateList = Object.entries(byState)
    .map(([slug, recs]) => ({
      slug,
      name: recs[0].state,
      count: recs.length,
    }))
    .sort((a, b) => b.count - a.count);
  fs.writeFileSync(path.join(DATA_DIR, "states.json"), JSON.stringify(stateList, null, 2));

  console.log(`\n✅ ${records.length.toLocaleString()} pincodes across ${Object.keys(byState).length} states`);
  console.log(`📁 Output: ${DATA_DIR}`);
}

processData().catch(console.error);

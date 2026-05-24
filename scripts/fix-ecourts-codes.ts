/**
 * Fix eCourts state codes in district-courts.json.
 *
 * State codes verified live from:
 * https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index
 *
 * Also removes ALL ecourtsDistCode values — those were unverified guesses
 * based on the wrong state_code system. Courts fall back to state-level URL.
 * dist_codes can be added later once verified per-state.
 *
 * Run: npx tsx scripts/fix-ecourts-codes.ts
 */

import * as fs from "fs";
import * as path from "path";

// Verified from live portal (services.ecourts.gov.in state dropdown)
// stateSlug → correct ecourtsStateCode
const CORRECT_STATE_CODES: Record<string, string> = {
  "andaman-and-nicobar-islands": "28",
  "andhra-pradesh":              "2",
  "arunachal-pradesh":           "36",
  "assam":                       "6",
  "bihar":                       "8",
  "chandigarh":                  "27",
  "chhattisgarh":                "18",
  "dadra-and-nagar-haveli":      "38",
  "daman-and-diu":               "38",
  "goa":                         "30",
  "gujarat":                     "17",
  "haryana":                     "14",
  "himachal-pradesh":            "5",
  "jammu-and-kashmir":           "12",
  "jharkhand":                   "7",
  "karnataka":                   "3",
  "kerala":                      "4",
  "ladakh":                      "33",
  "lakshadweep":                 "37",
  "madhya-pradesh":              "23",
  "maharashtra":                 "1",
  "manipur":                     "25",
  "meghalaya":                   "21",
  "mizoram":                     "19",
  "nagaland":                    "34",
  "delhi":                       "26",
  "odisha":                      "11",
  "puducherry":                  "35",
  "punjab":                      "22",
  "rajasthan":                   "9",
  "sikkim":                      "24",
  "tamil-nadu":                  "10",
  "telangana":                   "29",
  "tripura":                     "20",
  "uttar-pradesh":               "13",
  "uttarakhand":                 "15",
  "west-bengal":                 "16",
};

interface CourtRecord {
  slug: string;
  stateSlug: string;
  ecourtsStateCode: string;
  ecourtsDistCode?: string;
  caseStatusUrl: string;
  [key: string]: unknown;
}

const DATA_DIR = path.join(__dirname, "..", "data", "court");
const FILE = path.join(DATA_DIR, "district-courts.json");

const courts: CourtRecord[] = JSON.parse(fs.readFileSync(FILE, "utf-8"));

let fixed = 0;
let unknown = 0;
const unknownStates = new Set<string>();

for (const c of courts) {
  const correct = CORRECT_STATE_CODES[c.stateSlug];
  if (!correct) {
    unknownStates.add(c.stateSlug);
    unknown++;
    continue;
  }

  // Fix state code
  if (c.ecourtsStateCode !== correct) {
    c.ecourtsStateCode = correct;
    fixed++;
  }

  // Remove unverified dist_code
  delete c.ecourtsDistCode;

  // Rebuild caseStatusUrl without dist_code
  c.caseStatusUrl = `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${correct}`;
}

fs.writeFileSync(FILE, JSON.stringify(courts, null, 2));

console.log(`✅ Fixed ${courts.length} courts`);
console.log(`   ${fixed} state codes corrected`);
console.log(`   All ecourtsDistCode values removed (unverified)`);
if (unknownStates.size > 0) {
  console.log(`⚠️  Unknown stateSlugs (not in mapping): ${[...unknownStates].join(", ")}`);
}
console.log(`\n📋 Correct state codes (services.ecourts.gov.in):`);
for (const [slug, code] of Object.entries(CORRECT_STATE_CODES)) {
  console.log(`   ${code.padStart(2)}  ${slug}`);
}

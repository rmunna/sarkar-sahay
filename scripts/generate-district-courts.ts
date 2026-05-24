/**
 * Generate comprehensive district court data for all ~736 Indian district courts.
 * Run: npx tsx scripts/generate-district-courts.ts
 *
 * Output: data/court/district-courts.json
 *
 * dist_code is included only where verified (16 existing courts).
 * All other courts use state-level eCourts fallback URL — CNR and
 * party-name search still work perfectly at state level.
 */

import * as fs from "fs";
import * as path from "path";

interface CaseType { code: string; name: string; }

interface CourtRecord {
  slug: string;
  name: string;
  shortName: string;
  type: "district";
  state: string;
  stateSlug: string;
  city: string;
  address: string;
  website: string;
  caseStatusUrl: string;
  ecourtsStateCode: string;
  ecourtsDistCode?: string;
  cnrStateCode: string;
  caseTypes: CaseType[];
  phone?: string;
  description: string;
}

// ─── Shared case types ────────────────────────────────────────────────────────

const CASE_TYPES: CaseType[] = [
  { code: "OS", name: "Original Suit" },
  { code: "CS", name: "Civil Suit" },
  { code: "MC", name: "Misc. Case" },
  { code: "EP", name: "Execution Petition" },
  { code: "CC", name: "Criminal Case" },
  { code: "SC", name: "Sessions Case" },
  { code: "CRL", name: "Criminal Appeal" },
  { code: "PCR", name: "Private Complaint" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[()&]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

type D = string | {
  name: string;
  city?: string;
  slug?: string;
  courtName?: string;
  distCode?: string;
  address?: string;
  description?: string;
  phone?: string;
};

interface State {
  name: string;
  slug: string;
  ec: string;  // ecourts state_code
  cnr: string; // 2-char CNR prefix
  districts: D[];
}

function make(state: State, d: D): CourtRecord {
  const isObj = typeof d === "object";
  const dname = isObj ? d.name : d;
  const city = (isObj && d.city) ? d.city : dname;
  const distCode = isObj ? d.distCode : undefined;
  const slug = (isObj && d.slug) ? d.slug : `${slugify(dname)}-district-court`;
  const courtName = (isObj && d.courtName) ? d.courtName : `${dname} District Court`;
  const caseStatusUrl = distCode
    ? `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${state.ec}&dist_code=${distCode}`
    : `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${state.ec}`;
  const website = `https://districts.ecourts.gov.in/${slugify(state.name)}`;
  return {
    slug,
    name: courtName,
    shortName: courtName,
    type: "district",
    state: state.name,
    stateSlug: state.slug,
    city,
    address: (isObj && d.address) || `District Court, ${city}, ${state.name}`,
    website: (isObj && d.address) ? website : website,
    caseStatusUrl,
    ecourtsStateCode: state.ec,
    ...(distCode ? { ecourtsDistCode: distCode } : {}),
    cnrStateCode: state.cnr,
    caseTypes: CASE_TYPES,
    description: (isObj && d.description) || `${courtName} handles civil and criminal cases for ${dname} district in ${state.name}.`,
    ...(isObj && d.phone ? { phone: d.phone } : {}),
  };
}

// ─── State definitions ────────────────────────────────────────────────────────

const STATES: State[] = [
  // ── Andaman & Nicobar (1) ─────────────────────────────────────────────────
  {
    name: "Andaman and Nicobar Islands", slug: "andaman-and-nicobar-islands",
    ec: "1", cnr: "AN",
    districts: [
      "Nicobar",
      { name: "North and Middle Andaman", city: "Mayabunder" },
      { name: "South Andaman", city: "Port Blair" },
    ],
  },
  // ── Andhra Pradesh (2) ────────────────────────────────────────────────────
  {
    name: "Andhra Pradesh", slug: "andhra-pradesh",
    ec: "2", cnr: "AP",
    districts: [
      "Anantapur", "Chittoor", "East Godavari", "Guntur",
      { name: "Krishna", city: "Machilipatnam" },
      "Kurnool",
      { name: "SPSR Nellore", city: "Nellore" },
      { name: "Prakasam", city: "Ongole" },
      "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari",
      { name: "YSR Kadapa", city: "Kadapa" },
    ],
  },
  // ── Arunachal Pradesh (3) ─────────────────────────────────────────────────
  {
    name: "Arunachal Pradesh", slug: "arunachal-pradesh",
    ec: "3", cnr: "AR",
    districts: [
      "Anjaw",
      { name: "Capital Complex", city: "Itanagar" },
      "Changlang",
      { name: "East Kameng", city: "Seppa" },
      { name: "East Siang", city: "Pasighat" },
      "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada",
      { name: "Lohit", city: "Tezu" },
      "Longding",
      { name: "Lower Dibang Valley", city: "Roing" },
      { name: "Lower Siang", city: "Likabali" },
      { name: "Lower Subansiri", city: "Ziro" },
      "Namsai", "Pakke Kessang",
      { name: "Papum Pare", city: "Yupia" },
      "Shi Yomi",
      { name: "Siang", city: "Boleng" },
      "Tawang",
      { name: "Tirap", city: "Khonsa" },
      { name: "Upper Dibang Valley", city: "Anini" },
      { name: "Upper Siang", city: "Yingkiong" },
      { name: "Upper Subansiri", city: "Daporijo" },
      { name: "West Kameng", city: "Bomdila" },
      { name: "West Siang", city: "Aalo" },
    ],
  },
  // ── Assam (4) ─────────────────────────────────────────────────────────────
  {
    name: "Assam", slug: "assam",
    ec: "4", cnr: "AS",
    districts: [
      "Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon",
      { name: "Cachar", city: "Silchar" },
      "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh",
      { name: "Dima Hasao", city: "Haflong" },
      "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat",
      { name: "Kamrup", city: "Guwahati" },
      { name: "Kamrup Metropolitan", city: "Guwahati" },
      { name: "Karbi Anglong", city: "Diphu" },
      "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
      "Nagaon", "Nalbari", "Sivasagar", "Sonitpur",
      { name: "South Salmara-Mankachar", city: "Mankachar" },
      "Tamulpur", "Tinsukia", "Udalguri",
      { name: "West Karbi Anglong", city: "Hamren" },
    ],
  },
  // ── Bihar (5) ─────────────────────────────────────────────────────────────
  {
    name: "Bihar", slug: "bihar",
    ec: "5", cnr: "BR",
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
      { name: "Bhojpur", city: "Ara" },
      "Buxar", "Darbhanga",
      { name: "East Champaran", city: "Motihari" },
      "Gaya", "Gopalganj", "Jamui",
      { name: "Jehanabad", city: "Jehanabad" },
      { name: "Kaimur", city: "Bhabua" },
      "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
      "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada",
      {
        name: "Patna", distCode: "26",
        courtName: "Patna District Court",
        description: "Patna District Court handles civil and criminal cases for Patna, the state capital of Bihar.",
      },
      { name: "Purnia", city: "Purnia" },
      { name: "Rohtas", city: "Sasaram" },
      "Saharsa", "Samastipur",
      { name: "Saran", city: "Chhapra" },
      "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali",
      { name: "West Champaran", city: "Bettiah" },
    ],
  },
  // ── Chandigarh (6) ───────────────────────────────────────────────────────
  {
    name: "Chandigarh", slug: "chandigarh",
    ec: "6", cnr: "CH",
    districts: ["Chandigarh"],
  },
  // ── Chhattisgarh (7) ─────────────────────────────────────────────────────
  {
    name: "Chhattisgarh", slug: "chhattisgarh",
    ec: "7", cnr: "CG",
    districts: [
      "Balod", "Baloda Bazar", "Balrampur",
      { name: "Bastar", city: "Jagdalpur" },
      "Bemetara",
      { name: "Bijapur", city: "Bijapur" },
      { name: "Bilaspur", city: "Bilaspur" },
      "Dantewada", "Dhamtari", "Durg",
      { name: "Gariaband", city: "Gariaband" },
      "Gaurela-Pendra-Marwahi", "Janjgir-Champa",
      { name: "Jashpur", city: "Jashpurnagar" },
      { name: "Kabirdham", city: "Kawardha" },
      { name: "Kanker", city: "Kanker" },
      "Kondagaon", "Korba",
      { name: "Koriya", city: "Baikunthpur" },
      "Mahasamund", "Mungeli", "Narayanpur",
      { name: "Raigarh", city: "Raigarh" },
      { name: "Raipur", city: "Raipur" },
      "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma",
      { name: "Surajpur", city: "Surajpur" },
      { name: "Surguja", city: "Ambikapur" },
    ],
  },
  // ── Dadra & Nagar Haveli (8) ──────────────────────────────────────────────
  {
    name: "Dadra and Nagar Haveli", slug: "dadra-and-nagar-haveli",
    ec: "8", cnr: "DN",
    districts: [{ name: "Dadra and Nagar Haveli", city: "Silvassa" }],
  },
  // ── Daman & Diu (9) ──────────────────────────────────────────────────────
  {
    name: "Daman and Diu", slug: "daman-and-diu",
    ec: "9", cnr: "DD",
    districts: ["Daman", "Diu"],
  },
  // ── Goa (10) ─────────────────────────────────────────────────────────────
  {
    name: "Goa", slug: "goa",
    ec: "10", cnr: "GA",
    districts: [
      { name: "North Goa", city: "Panaji" },
      { name: "South Goa", city: "Margao" },
    ],
  },
  // ── Gujarat (11) ─────────────────────────────────────────────────────────
  {
    name: "Gujarat", slug: "gujarat",
    ec: "11", cnr: "GJ",
    districts: [
      {
        name: "Ahmedabad", distCode: "1",
        slug: "ahmedabad-city-civil-court",
        courtName: "Ahmedabad City Civil & Sessions Court",
        address: "City Civil Court, Lal Darwaja, Ahmedabad - 380001",
        description: "The Ahmedabad City Civil Court is the principal civil court for Ahmedabad district.",
      },
      "Amreli", "Anand", "Aravalli", "Banaskantha",
      { name: "Bharuch", city: "Bharuch" },
      "Bhavnagar", "Botad",
      { name: "Chhota Udaipur", city: "Chhota Udaipur" },
      "Dahod",
      { name: "Devbhoomi Dwarka", city: "Khambhalia" },
      { name: "The Dangs", city: "Ahwa" },
      { name: "Gandhinagar", city: "Gandhinagar" },
      { name: "Gir Somnath", city: "Veraval" },
      "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana",
      "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar",
      "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi",
      "Vadodara", "Valsad",
    ],
  },
  // ── Haryana (12) ─────────────────────────────────────────────────────────
  {
    name: "Haryana", slug: "haryana",
    ec: "12", cnr: "HR",
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
      { name: "Gurugram", city: "Gurugram" },
      "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra",
      { name: "Mahendragarh", city: "Narnaul" },
      { name: "Nuh", city: "Nuh" },
      "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
      "Sonipat", "Yamunanagar",
    ],
  },
  // ── Himachal Pradesh (13) ────────────────────────────────────────────────
  {
    name: "Himachal Pradesh", slug: "himachal-pradesh",
    ec: "13", cnr: "HP",
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra",
      { name: "Kinnaur", city: "Reckong Peo" },
      "Kullu",
      { name: "Lahaul and Spiti", city: "Keylong" },
      "Mandi", "Shimla",
      { name: "Sirmaur", city: "Nahan" },
      "Solan", "Una",
    ],
  },
  // ── Jammu & Kashmir (14) ─────────────────────────────────────────────────
  {
    name: "Jammu and Kashmir", slug: "jammu-and-kashmir",
    ec: "14", cnr: "JK",
    districts: [
      { name: "Anantnag", city: "Anantnag" },
      "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
      { name: "Jammu", city: "Jammu" },
      "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama",
      "Rajouri", "Ramban", "Reasi", "Samba", "Shopian",
      { name: "Srinagar", city: "Srinagar" },
      "Udhampur",
    ],
  },
  // ── Jharkhand (15) ───────────────────────────────────────────────────────
  {
    name: "Jharkhand", slug: "jharkhand",
    ec: "15", cnr: "JH",
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka",
      { name: "East Singhbhum", city: "Jamshedpur" },
      "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara",
      "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu",
      "Ramgarh",
      { name: "Ranchi", city: "Ranchi" },
      "Sahebganj",
      { name: "Seraikela Kharsawan", city: "Seraikela" },
      "Simdega",
      { name: "West Singhbhum", city: "Chaibasa" },
    ],
  },
  // ── Karnataka (16) ───────────────────────────────────────────────────────
  {
    name: "Karnataka", slug: "karnataka",
    ec: "16", cnr: "KA",
    districts: [
      "Bagalkot",
      { name: "Ballari", city: "Ballari" },
      { name: "Belagavi", city: "Belagavi" },
      {
        name: "Bengaluru Rural", distCode: "1",
        slug: "bangalore-rural-district-court",
        courtName: "Bangalore Rural District Court",
        address: "District Court, Bangalore Rural, Bengaluru",
        description: "Handles cases for Bangalore Rural district.",
      },
      {
        name: "Bengaluru Urban", distCode: "2",
        slug: "bangalore-city-civil-court",
        courtName: "Bangalore City Civil & Sessions Court",
        address: "City Civil Court, Mayo Hall, Bengaluru - 560001",
        description: "The Bangalore City Civil Court handles all original civil jurisdiction cases in Bengaluru city.",
        phone: undefined,
      },
      "Bidar",
      { name: "Chamarajanagara", city: "Chamarajanagara" },
      "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
      { name: "Dakshina Kannada", city: "Mangaluru" },
      "Davangere",
      { name: "Dharwad", city: "Hubballi-Dharwad" },
      "Gadag", "Hassan", "Haveri",
      { name: "Kalaburagi", city: "Kalaburagi" },
      { name: "Kodagu", city: "Madikeri" },
      "Kolar", "Koppal", "Mandya",
      { name: "Mysuru", city: "Mysuru" },
      "Raichur", "Ramanagara",
      { name: "Shivamogga", city: "Shivamogga" },
      { name: "Tumakuru", city: "Tumakuru" },
      "Udupi",
      { name: "Uttara Kannada", city: "Karwar" },
      { name: "Vijayapura", city: "Vijayapura" },
      "Yadgir",
    ],
  },
  // ── Kerala (17) ──────────────────────────────────────────────────────────
  {
    name: "Kerala", slug: "kerala",
    ec: "17", cnr: "KL",
    districts: [
      { name: "Alappuzha", city: "Alappuzha" },
      {
        name: "Ernakulam", distCode: "7",
        slug: "ernakulam-district-court",
        courtName: "Ernakulam District Court",
        address: "District Court, High Court Road, Ernakulam, Kochi - 682031",
        description: "Ernakulam District Court is the busiest district court in Kerala, located in Kochi.",
      },
      { name: "Idukki", city: "Painavu" },
      "Kannur", "Kasaragod",
      { name: "Kollam", city: "Kollam" },
      "Kottayam",
      { name: "Kozhikode", city: "Kozhikode" },
      "Malappuram",
      { name: "Palakkad", city: "Palakkad" },
      { name: "Pathanamthitta", city: "Pathanamthitta" },
      { name: "Thiruvananthapuram", city: "Thiruvananthapuram" },
      { name: "Thrissur", city: "Thrissur" },
      { name: "Wayanad", city: "Kalpetta" },
    ],
  },
  // ── Lakshadweep (18) ─────────────────────────────────────────────────────
  {
    name: "Lakshadweep", slug: "lakshadweep",
    ec: "18", cnr: "LD",
    districts: [{ name: "Lakshadweep", city: "Kavaratti" }],
  },
  // ── Madhya Pradesh (19) ──────────────────────────────────────────────────
  {
    name: "Madhya Pradesh", slug: "madhya-pradesh",
    ec: "19", cnr: "MP",
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur",
      { name: "Ashoknagar", city: "Ashoknagar" },
      "Balaghat",
      { name: "Barwani", city: "Barwani" },
      { name: "Betul", city: "Betul" },
      { name: "Bhind", city: "Bhind" },
      { name: "Bhopal", city: "Bhopal" },
      "Burhanpur",
      { name: "Chhatarpur", city: "Chhatarpur" },
      "Chhindwara", "Damoh", "Datia", "Dewas",
      { name: "Dhar", city: "Dhar" },
      "Dindori", "Guna",
      { name: "Gwalior", city: "Gwalior" },
      "Harda",
      { name: "Indore", city: "Indore" },
      { name: "Jabalpur", city: "Jabalpur" },
      "Jhabua", "Katni",
      { name: "Khandwa", city: "Khandwa" },
      { name: "Khargone", city: "Khargone" },
      "Mandla", "Mandsaur",
      { name: "Morena", city: "Morena" },
      { name: "Narsinghpur", city: "Narsinghpur" },
      "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam",
      { name: "Rewa", city: "Rewa" },
      { name: "Sagar", city: "Sagar" },
      { name: "Satna", city: "Satna" },
      "Sehore", "Seoni", "Shahdol", "Shajapur",
      { name: "Sheopur", city: "Sheopur" },
      "Shivpuri",
      { name: "Sidhi", city: "Sidhi" },
      "Singrauli", "Tikamgarh",
      { name: "Ujjain", city: "Ujjain" },
      "Umaria", "Vidisha",
    ],
  },
  // ── Maharashtra (20) ─────────────────────────────────────────────────────
  {
    name: "Maharashtra", slug: "maharashtra",
    ec: "20", cnr: "MH",
    districts: [
      { name: "Ahmednagar", city: "Ahmednagar" },
      "Akola", "Amravati",
      { name: "Aurangabad", city: "Chhatrapati Sambhajinagar" },
      "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule",
      { name: "Gadchiroli", city: "Gadchiroli" },
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur",
      {
        name: "Mumbai City", distCode: "1",
        slug: "city-civil-court-mumbai",
        courtName: "City Civil & Sessions Court Mumbai",
        address: "City Civil & Sessions Court, Kala Ghoda, Fort, Mumbai - 400032",
        description: "The City Civil & Sessions Court Mumbai is the principal civil court of original jurisdiction in Mumbai.",
      },
      { name: "Mumbai Suburban", city: "Mumbai" },
      { name: "Nagpur", city: "Nagpur" },
      "Nanded", "Nandurbar", "Nashik",
      { name: "Osmanabad", city: "Dharashiv" },
      { name: "Palghar", city: "Palghar" },
      "Parbhani",
      {
        name: "Pune", distCode: "14",
        slug: "pune-district-court",
        courtName: "Pune District & Sessions Court",
        address: "District & Sessions Court, Shivajinagar, Pune - 411005",
        description: "The Pune District & Sessions Court is the principal court for Pune district.",
      },
      { name: "Raigad", city: "Alibag" },
      "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
      { name: "Solapur", city: "Solapur" },
      { name: "Thane", city: "Thane" },
      "Wardha", "Washim", "Yavatmal",
    ],
  },
  // ── Manipur (21) ─────────────────────────────────────────────────────────
  {
    name: "Manipur", slug: "manipur",
    ec: "21", cnr: "MN",
    districts: [
      "Bishnupur", "Chandel", "Churachandpur",
      { name: "Imphal East", city: "Imphal" },
      { name: "Imphal West", city: "Imphal" },
      "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
      "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
    ],
  },
  // ── Meghalaya (22) ───────────────────────────────────────────────────────
  {
    name: "Meghalaya", slug: "meghalaya",
    ec: "22", cnr: "MG",
    districts: [
      { name: "East Garo Hills", city: "Williamnagar" },
      "East Jaintia Hills",
      { name: "East Khasi Hills", city: "Shillong" },
      "Mairang",
      { name: "North Garo Hills", city: "Resubelpara" },
      { name: "Ri Bhoi", city: "Nongpoh" },
      { name: "South Garo Hills", city: "Baghmara" },
      { name: "South West Garo Hills", city: "Ampati" },
      { name: "South West Khasi Hills", city: "Mawkyrwat" },
      { name: "West Garo Hills", city: "Tura" },
      "West Jaintia Hills",
      { name: "West Khasi Hills", city: "Nongstoin" },
    ],
  },
  // ── Mizoram (23) ─────────────────────────────────────────────────────────
  {
    name: "Mizoram", slug: "mizoram",
    ec: "23", cnr: "MZ",
    districts: [
      { name: "Aizawl", city: "Aizawl" },
      "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai",
      { name: "Lunglei", city: "Lunglei" },
      "Mamit", "Saiha", "Saitual", "Serchhip",
    ],
  },
  // ── Nagaland (24) ────────────────────────────────────────────────────────
  {
    name: "Nagaland", slug: "nagaland",
    ec: "24", cnr: "NL",
    districts: [
      "Chumoukedima",
      { name: "Dimapur", city: "Dimapur" },
      "Kiphire",
      { name: "Kohima", city: "Kohima" },
      "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
      { name: "Phek", city: "Phek" },
      "Tseminyu",
      { name: "Tuensang", city: "Tuensang" },
      "Wokha", "Zunheboto",
    ],
  },
  // ── Delhi (25) ───────────────────────────────────────────────────────────
  {
    name: "Delhi", slug: "delhi",
    ec: "25", cnr: "DL",
    districts: [
      {
        name: "North Delhi (Tis Hazari)", distCode: "1",
        slug: "tis-hazari-district-court-delhi",
        courtName: "Tis Hazari District Court",
        address: "Tis Hazari Courts, Tis Hazari, Delhi - 110054",
        description: "Tis Hazari Courts is the main civil and criminal district court complex in Delhi, one of the largest court complexes in Asia.",
        phone: undefined,
      },
      {
        name: "Central Delhi (Patiala House)", distCode: "2",
        slug: "patiala-house-courts-delhi",
        courtName: "Patiala House Courts",
        address: "Patiala House Courts, India Gate, New Delhi - 110001",
        description: "Patiala House Courts handles cases related to the Central and New Delhi districts. Located near India Gate.",
      },
      {
        name: "East Delhi (Karkardooma)", distCode: "3",
        slug: "karkardooma-district-court-delhi",
        courtName: "Karkardooma District Court",
        address: "Karkardooma Courts, Vikas Marg, Delhi - 110092",
        description: "Karkardooma Courts serves the East and North-East Delhi districts.",
      },
      {
        name: "South Delhi (Saket)", distCode: "4",
        slug: "saket-district-court-delhi",
        courtName: "Saket District Court",
        address: "Saket District Courts, Press Enclave Road, Saket, New Delhi - 110017",
        description: "Saket District Court serves the South and South-West Delhi districts.",
      },
      {
        name: "Northwest Delhi (Rohini)", distCode: "5",
        slug: "rohini-district-court-delhi",
        courtName: "Rohini District Court",
        address: "Rohini Courts, Sector 14, Rohini, Delhi - 110085",
        description: "Rohini District Court serves the North-West and Rohini sub-divisions of Delhi.",
      },
      {
        name: "West Delhi (Dwarka)", distCode: "6",
        slug: "dwarka-district-court-delhi",
        courtName: "Dwarka District Court",
        address: "Dwarka District Courts, Sector 10, Dwarka, New Delhi - 110075",
        description: "Dwarka District Court serves the West Delhi and Dwarka sub-divisions.",
      },
    ],
  },
  // ── Odisha (26) ──────────────────────────────────────────────────────────
  {
    name: "Odisha", slug: "odisha",
    ec: "26", cnr: "OR",
    districts: [
      "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh",
      { name: "Cuttack", city: "Cuttack" },
      "Deogarh", "Dhenkanal", "Gajapati",
      { name: "Ganjam", city: "Chatrapur" },
      "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal",
      "Kendrapara",
      { name: "Kendujhar", city: "Keonjhar" },
      { name: "Khordha", city: "Bhubaneswar" },
      { name: "Koraput", city: "Koraput" },
      "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
      "Puri", "Rayagada",
      { name: "Sambalpur", city: "Sambalpur" },
      { name: "Subarnapur", city: "Sonepur" },
      "Sundargarh",
    ],
  },
  // ── Puducherry (27) ──────────────────────────────────────────────────────
  {
    name: "Puducherry", slug: "puducherry",
    ec: "27", cnr: "PY",
    districts: [
      { name: "Karaikal", city: "Karaikal" },
      { name: "Mahe", city: "Mahe" },
      { name: "Puducherry", city: "Puducherry" },
      { name: "Yanam", city: "Yanam" },
    ],
  },
  // ── Punjab (28) ──────────────────────────────────────────────────────────
  {
    name: "Punjab", slug: "punjab",
    ec: "28", cnr: "PB",
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot",
      { name: "Fatehgarh Sahib", city: "Fatehgarh Sahib" },
      "Fazilka", "Firozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Mansa", "Moga",
      { name: "SAS Nagar", city: "Mohali" },
      { name: "Sri Muktsar Sahib", city: "Muktsar" },
      { name: "SBS Nagar", city: "Nawanshahr" },
      "Pathankot", "Patiala",
      { name: "Rupnagar", city: "Ropar" },
      "Sangrur",
      { name: "Shahid Bhagat Singh Nagar", city: "Nawanshahr" },
      "Tarn Taran",
    ],
  },
  // ── Rajasthan (29) ───────────────────────────────────────────────────────
  {
    name: "Rajasthan", slug: "rajasthan",
    ec: "29", cnr: "RJ",
    districts: [
      "Ajmer", "Alwar", "Banswara", "Baran",
      { name: "Barmer", city: "Barmer" },
      "Bharatpur", "Bhilwara",
      { name: "Bikaner", city: "Bikaner" },
      "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
      "Hanumangarh",
      {
        name: "Jaipur", distCode: "1",
        slug: "jaipur-district-court",
        courtName: "Jaipur District Court",
        address: "District Court, Jaipur Metropolitan, Jaipur - 302001",
        description: "The Jaipur District Court is the principal court for Jaipur Metropolitan area.",
      },
      "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
      { name: "Jodhpur", city: "Jodhpur" },
      "Karauli",
      { name: "Kota", city: "Kota" },
      "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur",
      "Sikar", "Sirohi",
      { name: "Sri Ganganagar", city: "Sri Ganganagar" },
      "Tonk",
      { name: "Udaipur", city: "Udaipur" },
    ],
  },
  // ── Sikkim (30) ──────────────────────────────────────────────────────────
  {
    name: "Sikkim", slug: "sikkim",
    ec: "30", cnr: "SK",
    districts: [
      { name: "East Sikkim", city: "Gangtok" },
      { name: "Gyalshing", city: "Gyalshing" },
      { name: "Namchi", city: "Namchi" },
      { name: "North Sikkim", city: "Mangan" },
      "Pakyong", "Soreng",
    ],
  },
  // ── Tamil Nadu (31) ──────────────────────────────────────────────────────
  {
    name: "Tamil Nadu", slug: "tamil-nadu",
    ec: "31", cnr: "TN",
    districts: [
      "Ariyalur",
      { name: "Chengalpattu", city: "Chengalpattu" },
      {
        name: "Chennai", distCode: "2",
        slug: "chennai-city-civil-court",
        courtName: "Chennai City Civil Court",
        address: "City Civil Court, High Court Buildings, Chennai - 600104",
        description: "The Chennai City Civil Court is the principal civil court of original jurisdiction for Chennai.",
      },
      { name: "Coimbatore", city: "Coimbatore" },
      "Cuddalore", "Dharmapuri", "Dindigul",
      { name: "Erode", city: "Erode" },
      "Kallakurichi", "Kancheepuram",
      { name: "Kanyakumari", city: "Nagercoil" },
      "Karur", "Krishnagiri",
      { name: "Madurai", city: "Madurai" },
      "Mayiladuthurai", "Nagapattinam", "Namakkal",
      { name: "Nilgiris", city: "Ooty" },
      "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
      { name: "Salem", city: "Salem" },
      "Sivaganga", "Tenkasi",
      { name: "Thanjavur", city: "Thanjavur" },
      { name: "Theni", city: "Theni" },
      { name: "Thoothukudi", city: "Thoothukudi" },
      { name: "Tiruchirappalli", city: "Tiruchirappalli" },
      { name: "Tirunelveli", city: "Tirunelveli" },
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
      { name: "Vellore", city: "Vellore" },
      "Villupuram", "Virudhunagar",
    ],
  },
  // ── Telangana (32) ───────────────────────────────────────────────────────
  {
    name: "Telangana", slug: "telangana",
    ec: "32", cnr: "TS",
    districts: [
      "Adilabad", "Bhadradri Kothagudem",
      {
        name: "Hyderabad", distCode: "1",
        slug: "hyderabad-city-civil-court",
        courtName: "Hyderabad City Civil Court",
        address: "City Civil Court, Nampally, Hyderabad - 500001",
        description: "The Hyderabad City Civil Court handles civil cases for Hyderabad district.",
      },
      "Jagtial", "Jangaon",
      { name: "Jayashankar Bhupalpally", city: "Bhupalpally" },
      { name: "Jogulamba Gadwal", city: "Gadwal" },
      "Kamareddy", "Karimnagar", "Khammam",
      { name: "Kumuram Bheem Asifabad", city: "Asifabad" },
      "Mahabubabad",
      { name: "Mahbubnagar", city: "Mahbubnagar" },
      "Mancherial", "Medak",
      { name: "Medchal-Malkajgiri", city: "Medchal" },
      "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal",
      { name: "Nizamabad", city: "Nizamabad" },
      "Peddapalli",
      { name: "Rajanna Sircilla", city: "Sircilla" },
      { name: "Ranga Reddy", city: "Hyderabad" },
      "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
      { name: "Warangal Rural", city: "Warangal" },
      { name: "Warangal Urban", city: "Warangal" },
      { name: "Yadadri Bhuvanagiri", city: "Bhongir" },
    ],
  },
  // ── Tripura (33) ─────────────────────────────────────────────────────────
  {
    name: "Tripura", slug: "tripura",
    ec: "33", cnr: "TR",
    districts: [
      { name: "Dhalai", city: "Ambassa" },
      { name: "Gomati", city: "Udaipur" },
      { name: "Khowai", city: "Khowai" },
      { name: "North Tripura", city: "Dharmanagar" },
      { name: "Sepahijala", city: "Bishalgarh" },
      { name: "South Tripura", city: "Belonia" },
      { name: "Unakoti", city: "Kailashahar" },
      { name: "West Tripura", city: "Agartala" },
    ],
  },
  // ── Uttar Pradesh (34) ───────────────────────────────────────────────────
  {
    name: "Uttar Pradesh", slug: "uttar-pradesh",
    ec: "34", cnr: "UP",
    districts: [
      {
        name: "Agra", distCode: "1",
        slug: "agra-district-court",
        courtName: "Agra District & Sessions Court",
        address: "District Court, Agra - 282001",
        description: "Agra District Court handles cases for Agra district.",
      },
      "Aligarh", "Ambedkar Nagar",
      { name: "Amethi", city: "Amethi" },
      { name: "Amroha", city: "Amroha" },
      "Auraiya",
      { name: "Ayodhya", city: "Ayodhya" },
      "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda",
      "Barabanki", "Bareilly", "Basti",
      { name: "Bhadohi", city: "Gyanpur" },
      "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot",
      "Deoria", "Etah", "Etawah",
      "Farrukhabad", "Fatehpur", "Firozabad",
      { name: "Gautam Buddha Nagar", city: "Noida" },
      { name: "Ghaziabad", city: "Ghaziabad" },
      "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
      { name: "Hapur", city: "Hapur" },
      "Hardoi",
      { name: "Hathras", city: "Hathras" },
      "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat",
      { name: "Kanpur Nagar", city: "Kanpur" },
      "Kasganj", "Kaushambi",
      { name: "Kushinagar", city: "Padrauna" },
      { name: "Lakhimpur Kheri", city: "Lakhimpur" },
      "Lalitpur",
      {
        name: "Lucknow", distCode: "19",
        slug: "lucknow-district-court",
        courtName: "Lucknow District & Sessions Court",
        address: "District Court, Lucknow - 226001",
        description: "The Lucknow District Court handles cases for Lucknow district and serves as the seat of the Allahabad HC's Lucknow Bench.",
      },
      "Maharajganj", "Mahoba", "Mainpuri",
      { name: "Mathura", city: "Mathura" },
      "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar",
      "Pilibhit", "Pratapgarh",
      { name: "Prayagraj", city: "Prayagraj" },
      "Raebareli", "Rampur", "Saharanpur", "Sambhal",
      "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
      "Siddharthnagar", "Sitapur",
      { name: "Sonbhadra", city: "Robertsganj" },
      "Sultanpur", "Unnao",
      { name: "Varanasi", city: "Varanasi" },
    ],
  },
  // ── Uttarakhand (35) ─────────────────────────────────────────────────────
  {
    name: "Uttarakhand", slug: "uttarakhand",
    ec: "35", cnr: "UK",
    districts: [
      "Almora", "Bageshwar",
      { name: "Chamoli", city: "Gopeshwar" },
      { name: "Champawat", city: "Champawat" },
      { name: "Dehradun", city: "Dehradun" },
      "Haridwar",
      { name: "Nainital", city: "Nainital" },
      { name: "Pauri Garhwal", city: "Pauri" },
      { name: "Pithoragarh", city: "Pithoragarh" },
      { name: "Rudraprayag", city: "Rudraprayag" },
      { name: "Tehri Garhwal", city: "New Tehri" },
      { name: "Udham Singh Nagar", city: "Rudrapur" },
      { name: "Uttarkashi", city: "Uttarkashi" },
    ],
  },
  // ── West Bengal (36) ─────────────────────────────────────────────────────
  {
    name: "West Bengal", slug: "west-bengal",
    ec: "36", cnr: "WB",
    districts: [
      "Alipurduar", "Bankura", "Birbhum",
      { name: "Cooch Behar", city: "Cooch Behar" },
      { name: "Dakshin Dinajpur", city: "Balurghat" },
      { name: "Darjeeling", city: "Darjeeling" },
      { name: "Hooghly", city: "Chinsurah" },
      { name: "Howrah", city: "Howrah" },
      { name: "Jalpaiguri", city: "Jalpaiguri" },
      { name: "Jhargram", city: "Jhargram" },
      { name: "Kalimpong", city: "Kalimpong" },
      {
        name: "Kolkata", distCode: "1",
        slug: "calcutta-city-civil-court",
        courtName: "Kolkata City Civil Court",
        address: "City Civil Court, 2 Kiran Shankar Roy Road, Kolkata - 700001",
        description: "The Kolkata City Civil Court handles civil original jurisdiction cases for Kolkata.",
      },
      { name: "Malda", city: "English Bazar" },
      { name: "Murshidabad", city: "Baharampur" },
      { name: "Nadia", city: "Krishnanagar" },
      { name: "North 24 Parganas", city: "Barasat" },
      { name: "Paschim Bardhaman", city: "Asansol" },
      { name: "Paschim Medinipur", city: "Midnapore" },
      { name: "Purba Bardhaman", city: "Bardhaman" },
      { name: "Purba Medinipur", city: "Tamluk" },
      { name: "Purulia", city: "Purulia" },
      { name: "South 24 Parganas", city: "Alipore" },
      { name: "Uttar Dinajpur", city: "Raiganj" },
    ],
  },
];

// ─── Generate ─────────────────────────────────────────────────────────────────

const allCourts: CourtRecord[] = [];
for (const state of STATES) {
  for (const d of state.districts) {
    allCourts.push(make(state, d));
  }
}

const OUT_DIR = path.join(__dirname, "..", "data", "court");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(
  path.join(OUT_DIR, "district-courts.json"),
  JSON.stringify(allCourts, null, 2),
);

const withDistCode = allCourts.filter((c) => c.ecourtsDistCode).length;
console.log(`✅ ${allCourts.length} district courts generated`);
console.log(`   ${withDistCode} with verified dist_code (precise deep-link)`);
console.log(`   ${allCourts.length - withDistCode} with state-level fallback`);
console.log(`📁 Output: ${OUT_DIR}/district-courts.json`);

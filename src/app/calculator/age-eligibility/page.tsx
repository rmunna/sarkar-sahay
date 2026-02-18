"use client";

import { useState } from "react";
import Link from "next/link";

type Eligibility = { name: string; eligible: boolean; ageRange: string; note?: string; guideSlug?: string };

type StateScheme = {
  name: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  note?: string;
  guideSlug: string | null;
};

function getAge(dob: Date, ref: Date) {
  let years = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) years--;
  const ageInDays = (ref.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24);
  return { years, decimal: ageInDays / 365.25 };
}

function checkEligibility(age: number): Eligibility[] {
  return [
    { name: "Voter ID Card", ageRange: "18+", eligible: age >= 18, guideSlug: "voter-id-card-apply-online" },
    { name: "Driving License (with gear)", ageRange: "18+", eligible: age >= 18, guideSlug: "driving-license-apply-online" },
    { name: "Driving License (without gear)", ageRange: "16+", eligible: age >= 16, note: "Motorcycles up to 50cc", guideSlug: "driving-license-apply-online" },
    { name: "Passport (Minor)", ageRange: "0 – 17", eligible: age < 18, guideSlug: "child-minor-passport-apply" },
    { name: "Passport (Adult)", ageRange: "18+", eligible: age >= 18, guideSlug: "passport-apply-online" },
    { name: "Baal Aadhaar (Child Aadhaar)", ageRange: "0 – 5", eligible: age <= 5, guideSlug: "baal-aadhaar-child-aadhaar-card" },
    { name: "PM Kisan Samman Nidhi", ageRange: "18+", eligible: age >= 18, note: "For farmer families", guideSlug: "pm-kisan-samman-nidhi" },
    { name: "PM Awas Yojana", ageRange: "18+", eligible: age >= 18, note: "Must be head of household", guideSlug: "pm-awas-yojana-apply" },
    { name: "PM Ujjwala Yojana", ageRange: "18+", eligible: age >= 18, note: "For BPL women", guideSlug: "lpg-subsidy-ujjwala-yojana" },
    { name: "Sukanya Samriddhi Yojana", ageRange: "0 – 10", eligible: age <= 10, note: "For girl child", guideSlug: "sukanya-samriddhi-yojana" },
    { name: "Atal Pension Yojana", ageRange: "18 – 40", eligible: age >= 18 && age <= 40, guideSlug: "atal-pension-yojana-apy" },
    { name: "PM Vaya Vandana Yojana", ageRange: "60+", eligible: age >= 60, note: "Pension for senior citizens" },
    { name: "Ayushman Bharat (PMJAY)", ageRange: "All ages", eligible: true, note: "No age limit; based on SECC data", guideSlug: "ayushman-bharat-health-card" },
    { name: "E-Shram Card", ageRange: "16 – 59", eligible: age >= 16 && age <= 59, note: "Unorganised workers", guideSlug: "e-shram-card-registration" },
    { name: "NREGA Job Card", ageRange: "18+", eligible: age >= 18, note: "Rural households", guideSlug: "nrega-job-card-apply-download" },
    { name: "National Scholarship Portal", ageRange: "Varies", eligible: age >= 5 && age <= 35, note: "School/college students", guideSlug: "national-scholarship-portal-apply" },
    { name: "Senior Citizen Savings Scheme", ageRange: "60+", eligible: age >= 60, note: "55+ for retired defence/govt", guideSlug: "senior-citizen-savings-scheme" },
    { name: "Senior Citizen Tax Benefits", ageRange: "60+", eligible: age >= 60, note: "Higher basic exemption limit" },
    { name: "Super Senior Citizen Tax Benefits", ageRange: "80+", eligible: age >= 80, note: "₹5L exemption (old regime)" },
    { name: "EPF Withdrawal (Full)", ageRange: "58+", eligible: age >= 58, note: "Or 2 months unemployment", guideSlug: "epf-pf-withdrawal-online" },
    { name: "NPS (National Pension System)", ageRange: "18 – 70", eligible: age >= 18 && age <= 70, guideSlug: "nps-national-pension-system-account" },
    { name: "PAN Card", ageRange: "All ages", eligible: true, note: "Minors need representative assessee", guideSlug: "pan-card-apply-online" },
    { name: "Aadhaar Card", ageRange: "All ages", eligible: true, note: "Including newborns", guideSlug: "aadhaar-card-apply-online" },
    { name: "Railway Concession (Senior)", ageRange: "58+ (F) / 60+ (M)", eligible: age >= 58, note: "Currently suspended" },
  ];
}

/* ───── State schemes data ───── */
const INDIAN_STATES = [
  "Uttar Pradesh", "Bihar", "Maharashtra", "Rajasthan", "Madhya Pradesh", "Tamil Nadu",
  "West Bengal", "Karnataka", "Gujarat", "Haryana", "Telangana", "Kerala", "Odisha",
  "Assam", "Chhattisgarh", "Punjab", "Jharkhand",
];

const STATE_SCHEMES: Record<string, StateScheme[]> = {
  "Uttar Pradesh": [
    { name: "Kanya Sumangala Yojana", ageRange: "0 – 15", ageMin: 0, ageMax: 15, note: "For girls", guideSlug: "kanya-sumangala-yojana-up" },
    { name: "Shadi Anudan Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "Daughter's marriage assistance", guideSlug: "shadi-anudan-yojana-up" },
    { name: "UP Free Laptop/Tablet Yojana", ageRange: "Students", ageMin: 10, ageMax: 25, note: "For meritorious students", guideSlug: "up-free-laptop-tablet-yojana" },
    { name: "UP Pension Yojana", ageRange: "60+", ageMin: 60, ageMax: 99, note: "Old age, widow, disabled", guideSlug: "up-pension-yojana-old-age-widow-disabled" },
    { name: "Mukhyamantri Yuva Swarozgar Yojana", ageRange: "18 – 40", ageMin: 18, ageMax: 40, note: "Self-employment for youth", guideSlug: "mukhyamantri-yuva-swarozgar-yojana-up" },
  ],
  "Bihar": [
    { name: "Mukhyamantri Kanya Utthan Yojana", ageRange: "0 – 25", ageMin: 0, ageMax: 25, note: "Girls, birth to graduation", guideSlug: "mukhyamantri-kanya-utthan-yojana-bihar" },
    { name: "Mukhyamantri Cycle Yojana", ageRange: "Students", ageMin: 10, ageMax: 18, note: "For school students", guideSlug: "bihar-mukhyamantri-cycle-yojana" },
    { name: "Bihar Gramin Awas Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "Rural BPL housing", guideSlug: "bihar-mukhyamantri-gramin-awas-yojana" },
    { name: "Satat Jeevika Yojana", ageRange: "18 – 50", ageMin: 18, ageMax: 50, note: "Women SHGs", guideSlug: "bihar-satat-jeevika-yojana" },
  ],
  "Maharashtra": [
    { name: "Lek Ladki Yojana", ageRange: "0 – 18", ageMin: 0, ageMax: 18, note: "For girls", guideSlug: "maharashtra-lek-ladki-yojana" },
    { name: "Gharkul Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "Housing assistance", guideSlug: "maharashtra-gharkul-yojana" },
    { name: "Shravan Bal Pension", ageRange: "65+", ageMin: 65, ageMax: 99, note: "Senior citizen pension", guideSlug: "maharashtra-shravan-bal-pension" },
  ],
  "Rajasthan": [
    { name: "Chiranjeevi Yojana", ageRange: "All ages", ageMin: 0, ageMax: 99, note: "Health insurance", guideSlug: "chiranjeevi-yojana-rajasthan" },
    { name: "Rajshri Yojana", ageRange: "0 – 12", ageMin: 0, ageMax: 12, note: "For girls", guideSlug: "rajasthan-mukhyamantri-rajshri-yojana" },
    { name: "Palanhar Yojana", ageRange: "0 – 18", ageMin: 0, ageMax: 18, note: "For orphans", guideSlug: "rajasthan-palanhar-yojana" },
    { name: "Devnarayan Scooty Scheme", ageRange: "College girls", ageMin: 16, ageMax: 25, note: "For meritorious girls", guideSlug: "rajasthan-devnarayan-scooty-scheme" },
  ],
  "Madhya Pradesh": [
    { name: "Ladli Bahna Yojana", ageRange: "21 – 60", ageMin: 21, ageMax: 60, note: "For women", guideSlug: "ladli-bahna-yojana-mp" },
    { name: "Jan Kalyan Sambal Yojana", ageRange: "18 – 60", ageMin: 18, ageMax: 60, note: "Unorganised workers", guideSlug: "mp-mukhyamantri-jan-kalyan-sambal-yojana" },
    { name: "Yuva Internship Yojana", ageRange: "18 – 29", ageMin: 18, ageMax: 29, note: "Youth internship", guideSlug: "mp-mukhyamantri-yuva-internship-yojana" },
  ],
  "Tamil Nadu": [
    { name: "Pudhumai Penn Scholarship", ageRange: "College girls", ageMin: 16, ageMax: 25, note: "For girls in higher education", guideSlug: "tn-pudhumai-penn-scholarship" },
    { name: "Marriage Assistance Scheme", ageRange: "18+", ageMin: 18, ageMax: 99, note: "For women", guideSlug: "tn-marriage-assistance-scheme" },
    { name: "Free Bicycle/Laptop Scheme", ageRange: "Students", ageMin: 10, ageMax: 25, note: "For school/college students", guideSlug: "tn-free-bicycle-laptop-scheme-students" },
    { name: "Kalaignar Magalir Urimai Thogai", ageRange: "21+", ageMin: 21, ageMax: 99, note: "For women", guideSlug: "kalaignar-magalir-urimai-thogai-tamil-nadu" },
    { name: "Naan Mudhalvan", ageRange: "Youth", ageMin: 15, ageMax: 30, note: "Youth skill development", guideSlug: "tn-naan-mudhalvan-skill-development" },
  ],
  "West Bengal": [
    { name: "Lakshmir Bhandar", ageRange: "25 – 60", ageMin: 25, ageMax: 60, note: "For women", guideSlug: "lakshmir-bhandar-west-bengal" },
    { name: "Kanyashree Prakalpa", ageRange: "13 – 18", ageMin: 13, ageMax: 18, note: "Girls, up to graduation", guideSlug: "kanyashree-prakalpa-west-bengal" },
    { name: "Swasthya Sathi", ageRange: "All ages", ageMin: 0, ageMax: 99, note: "Health insurance", guideSlug: "swasthya-sathi-west-bengal" },
    { name: "Sabuj Sathi Bicycle Scheme", ageRange: "Students", ageMin: 10, ageMax: 18, note: "For school students", guideSlug: "wb-sabuj-sathi-bicycle-scheme" },
  ],
  "Karnataka": [
    { name: "Anna Bhagya Scheme", ageRange: "All ages", ageMin: 0, ageMax: 99, note: "Free rice/ration", guideSlug: "karnataka-anna-bhagya-rice-scheme" },
    { name: "Bhagyalakshmi Scheme", ageRange: "0 – 18", ageMin: 0, ageMax: 18, note: "For girls", guideSlug: "karnataka-bhagyalakshmi-scheme" },
    { name: "Vidyasiri Scholarship", ageRange: "Students", ageMin: 10, ageMax: 25, note: "For students", guideSlug: "karnataka-vidyasiri-scholarship" },
  ],
  "Gujarat": [
    { name: "Vhali Dikri Yojana", ageRange: "0 – 18", ageMin: 0, ageMax: 18, note: "For girls", guideSlug: "gujarat-vhali-dikri-yojana" },
    { name: "Manav Garima Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "BPL self-employment", guideSlug: "gujarat-manav-garima-yojana" },
    { name: "Mukhyamantri Yuva Swavalamban Yojana", ageRange: "Students", ageMin: 10, ageMax: 25, note: "For students", guideSlug: "gujarat-mukhyamantri-yuva-swavalamban-yojana" },
  ],
  "Haryana": [
    { name: "Family ID / Parivar Pehchan Patra", ageRange: "All ages", ageMin: 0, ageMax: 99, note: "Family identity document", guideSlug: "haryana-family-id-parivar-pehchan-patra" },
    { name: "Old Age Samman Allowance", ageRange: "60+", ageMin: 60, ageMax: 99, note: "Senior citizen pension", guideSlug: "haryana-old-age-samman-allowance" },
  ],
  "Telangana": [
    { name: "Aasara Pension", ageRange: "57+", ageMin: 57, ageMax: 99, note: "Old age, widow, disabled", guideSlug: "telangana-aasara-pension" },
    { name: "Dalit Bandhu Scheme", ageRange: "18+", ageMin: 18, ageMax: 99, note: "For SC community", guideSlug: "telangana-dalit-bandhu-scheme" },
  ],
  "Kerala": [
    { name: "LIFE Mission Housing", ageRange: "18+", ageMin: 18, ageMax: 99, note: "BPL housing", guideSlug: "kerala-life-mission-housing" },
    { name: "Snehapoorvam Scholarship", ageRange: "Students", ageMin: 5, ageMax: 25, note: "Orphans/students", guideSlug: "kerala-snehapoorvam-scholarship" },
  ],
  "Odisha": [
    { name: "KALIA Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "For farmers", guideSlug: "odisha-kalia-yojana-farmers" },
    { name: "Madhu Babu Pension Yojana", ageRange: "60+", ageMin: 60, ageMax: 99, note: "Old age pension", guideSlug: "odisha-madhu-babu-pension-yojana" },
  ],
  "Assam": [
    { name: "Orunodoi Scheme", ageRange: "18+", ageMin: 18, ageMax: 99, note: "For women", guideSlug: "assam-orunodoi-scheme" },
    { name: "Pragyan Bharati Scooty Scheme", ageRange: "College girls", ageMin: 16, ageMax: 25, note: "For meritorious girls", guideSlug: "assam-pragyan-bharati-scooty-scheme" },
  ],
  "Chhattisgarh": [
    { name: "Mahtari Vandana Yojana", ageRange: "21+", ageMin: 21, ageMax: 99, note: "For married women", guideSlug: "chhattisgarh-mahtari-vandana-yojana" },
    { name: "Godhan Nyay Yojana", ageRange: "18+", ageMin: 18, ageMax: 99, note: "For cattle owners", guideSlug: "chhattisgarh-godhan-nyay-yojana" },
  ],
  "Punjab": [
    { name: "Ashirwad Scheme", ageRange: "18+", ageMin: 18, ageMax: 99, note: "Marriage assistance for daughters", guideSlug: "punjab-ashirwad-scheme-marriage" },
    { name: "Atta Dal Scheme", ageRange: "All ages", ageMin: 0, ageMax: 99, note: "BPL families", guideSlug: "punjab-atta-dal-scheme" },
  ],
  "Jharkhand": [
    { name: "Guruji Credit Card Scheme", ageRange: "Students", ageMin: 10, ageMax: 25, note: "Education loan for students", guideSlug: "jharkhand-guruji-credit-card-students" },
    { name: "Mukhyamantri Protsahan Yojana", ageRange: "Graduates", ageMin: 18, ageMax: 35, note: "For unemployed graduates", guideSlug: "jharkhand-mukhyamantri-protsahan-yojana" },
  ],
};

export default function SchemeEligibilityChecker() {
  const [dob, setDob] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [result, setResult] = useState<null | { years: number; decimal: number; items: Eligibility[]; stateItems: Eligibility[] }>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "not">("all");

  function calculate() {
    if (!dob) return;
    const d = new Date(dob);
    const now = new Date();
    const { years, decimal } = getAge(d, now);
    const nationalItems = checkEligibility(decimal);

    const stateItems: Eligibility[] = [];
    if (selectedState && STATE_SCHEMES[selectedState]) {
      for (const s of STATE_SCHEMES[selectedState]) {
        stateItems.push({
          name: s.name,
          ageRange: s.ageRange,
          eligible: decimal >= s.ageMin && decimal <= s.ageMax,
          note: s.note,
          guideSlug: s.guideSlug ?? undefined,
        });
      }
    }

    setResult({ years, decimal, items: nationalItems, stateItems });
    setFilter("all");
  }

  const allItems = result ? [...result.items, ...result.stateItems] : [];
  const filtered = result
    ? filter === "all" ? allItems : filter === "eligible" ? allItems.filter((i) => i.eligible) : allItems.filter((i) => !i.eligible)
    : null;
  const eligibleCount = allItems.filter((i) => i.eligible).length;
  const totalCount = allItems.length;

  const nationalFiltered = result
    ? filter === "all" ? result.items : filter === "eligible" ? result.items.filter((i) => i.eligible) : result.items.filter((i) => !i.eligible)
    : null;
  const stateFiltered = result
    ? filter === "all" ? result.stateItems : filter === "eligible" ? result.stateItems.filter((i) => i.eligible) : result.stateItems.filter((i) => !i.eligible)
    : null;

  function renderItem(item: Eligibility) {
    return (
      <div key={item.name} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${item.eligible ? "bg-green-50" : "bg-gray-50"}`}>
        <div>
          <span className={`font-medium ${item.eligible ? "text-green-800" : "text-gray-500"}`}>
            {item.guideSlug ? (
              <Link href={`/guide/${item.guideSlug}`} className="hover:text-orange-600 underline decoration-dotted underline-offset-2">{item.name}</Link>
            ) : item.name}
          </span>
          <span className="text-xs text-gray-400 ml-2">({item.ageRange})</span>
          {item.note && <span className="text-xs text-gray-400 ml-1">• {item.note}</span>}
        </div>
        <span className={`text-sm font-semibold shrink-0 ${item.eligible ? "text-green-600" : "text-red-400"}`}>
          {item.eligible ? "✓ Eligible" : "✗ Not Eligible"}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Scheme & Service Eligibility Checker India", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/age-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🎂 Scheme & Service <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Enter your date of birth to check age eligibility for government schemes, services, and benefits in India — including state-specific schemes.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State (optional)</label>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">All India (National only)</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={calculate} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Check Eligibility</button>
      </div>

      {result && (
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 text-center">
            <p className="text-sm text-gray-500">Your Age</p>
            <p className="text-3xl font-bold text-orange-600">{result.years} years</p>
            <p className="text-xs text-gray-400 mt-1">{result.decimal.toFixed(2)} years (decimal)</p>
            <p className="text-sm text-gray-500 mt-2">Eligible for <span className="font-bold text-orange-600">{eligibleCount}</span> out of {totalCount} schemes & services</p>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {([["all", `All (${totalCount})`], ["eligible", `✅ Eligible (${eligibleCount})`], ["not", `❌ Not Eligible (${totalCount - eligibleCount})`]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === key ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">🇮🇳 National Schemes & Services</h2>
            <div className="space-y-2">
              {nationalFiltered?.map(renderItem)}
            </div>

            {selectedState && stateFiltered && stateFiltered.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">📍 {selectedState} Schemes</h2>
                <div className="space-y-2">
                  {stateFiltered.map(renderItem)}
                </div>
              </>
            )}

            <p className="mt-4 text-xs text-gray-400">Age eligibility only. Most schemes have additional criteria (income, BPL status, etc.). Check individual guides for full details.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/job-eligibility" className="text-sm text-orange-600 hover:underline">→ Government Job Eligibility Checker</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What schemes can senior citizens (60+) avail?", "Senior citizens are eligible for PM Vaya Vandana Yojana, Senior Citizen Savings Scheme, higher tax exemptions, and railway concessions (currently suspended). At 80+, you get super senior citizen tax benefits."],
          ["Is there an age limit for Aadhaar or PAN?", "No. Aadhaar can be made from birth (Baal Aadhaar for 0-5 years). PAN has no age limit — minors need a representative assessee."],
          ["What is the age limit for Sukanya Samriddhi Yojana?", "The girl child must be under 10 years of age at the time of account opening. One account per girl, max 2 per family."],
          ["Can I get EPF withdrawal before 58?", "Partial withdrawal is allowed for specific purposes (medical, housing, education). Full withdrawal is at 58 or after 2 months of unemployment."],
          ["What is the age limit for E-Shram card?", "Workers aged 16-59 in the unorganised sector can register. No upper age limit for renewal of existing cards."],
          ["Does this tool show state-specific schemes?", "Yes! Select your state from the dropdown to see state-specific schemes like Ladli Bahna (MP), Kanya Sumangala (UP), Lakshmir Bhandar (West Bengal), and many more — in addition to all national schemes."],
          ["Which states are covered for state schemes?", "We currently cover 17 major states including Uttar Pradesh, Bihar, Maharashtra, Rajasthan, Madhya Pradesh, Tamil Nadu, West Bengal, Karnataka, Gujarat, Haryana, Telangana, Kerala, Odisha, Assam, Chhattisgarh, Punjab, and Jharkhand. More states will be added soon."],
        ].map(([q, a]) => (
          <details key={q} className="mb-3 group">
            <summary className="cursor-pointer font-medium text-gray-800 group-open:text-orange-600">{q}</summary>
            <p className="mt-1 text-sm text-gray-600 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

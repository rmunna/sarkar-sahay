"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import schemesData from "@/data/schemes.json";

/* ───── Types ───── */
interface Scheme {
  id: string;
  name: Record<string, string>;
  type: "central" | "state";
  state: string | null;
  category: string;
  benefitAmountPerYear: number | null;
  benefitDescription: Record<string, string>;
  eligibility: {
    ageMin: number | null;
    ageMax: number | null;
    gender: string | null;
    incomeMax: number | null;
    categories: string[] | null;
    occupation: string[] | null;
    bpl: boolean | null;
    urbanRural: string | null;
    additionalCriteria: string;
  };
  officialUrl: string;
  guideSlug: string | null;
}

const schemes = schemesData as unknown as Scheme[];

/* ───── Constants ───── */
const STATES = [
  "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const STATE_LANG: Record<string, string> = {
  "Andhra Pradesh": "te", "Arunachal Pradesh": "en", "Assam": "as", "Bihar": "hi",
  "Chhattisgarh": "hi", "Delhi": "hi", "Goa": "hi", "Gujarat": "gu",
  "Haryana": "hi", "Himachal Pradesh": "hi", "Jammu & Kashmir": "hi",
  "Jharkhand": "hi", "Karnataka": "kn", "Kerala": "ml", "Madhya Pradesh": "hi",
  "Maharashtra": "mr", "Manipur": "en", "Meghalaya": "en", "Mizoram": "en",
  "Nagaland": "en", "Odisha": "or", "Puducherry": "ta", "Punjab": "pa",
  "Rajasthan": "hi", "Sikkim": "en", "Tamil Nadu": "ta", "Telangana": "te",
  "Tripura": "bn", "Uttar Pradesh": "hi", "Uttarakhand": "hi", "West Bengal": "bn",
};

const STATE_LANG_NAME: Record<string, string> = {
  te: "తెలుగు", hi: "हिन्दी", gu: "ગુજરાતી", kn: "ಕನ್ನಡ",
  ml: "മലയാളം", mr: "मराठी", ta: "தமிழ்", bn: "বাংলা",
  as: "অসমীয়া", or: "ଓଡ଼ିଆ", pa: "ਪੰਜਾਬੀ", en: "English",
};

const INCOME_OPTIONS = [
  { label: "Less than ₹1 lakh", value: 100000 },
  { label: "₹1 – 2.5 lakh", value: 250000 },
  { label: "₹2.5 – 5 lakh", value: 500000 },
  { label: "₹5 – 10 lakh", value: 1000000 },
  { label: "More than ₹10 lakh", value: 1100000 },
];

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const OCCUPATIONS = ["Unemployed", "Farmer", "Student", "Unorganised Worker", "Homemaker", "Salaried", "Self-Employed", "Street Vendor", "Artisan/Craftsperson", "Labourer", "Fisher"];
const OCCUPATION_MAP: Record<string, string> = {
  "Unemployed": "unemployed", "Farmer": "farmer", "Student": "student",
  "Unorganised Worker": "unorganised", "Homemaker": "homemaker",
  "Salaried": "salaried", "Self-Employed": "self-employed",
  "Street Vendor": "street vendor", "Artisan/Craftsperson": "artisan",
  "Labourer": "labourer", "Fisher": "fisher",
};

/* ───── Helpers ───── */
function getAge(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  return years;
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function checkEligibility(
  scheme: Scheme,
  age: number, gender: string, income: number, category: string,
  occupation: string, bpl: boolean, area: string
): boolean {
  const e = scheme.eligibility;
  if (e.ageMin !== null && age < e.ageMin) return false;
  if (e.ageMax !== null && age > e.ageMax) return false;
  if (e.gender !== null && e.gender !== gender.toLowerCase()) return false;
  if (e.incomeMax !== null && income > e.incomeMax) return false;
  if (e.categories !== null && !e.categories.some(c => c.toLowerCase() === category.toLowerCase())) return false;
  if (e.occupation !== null && !e.occupation.includes("any") && !e.occupation.includes(occupation)) return false;
  if (e.bpl === true && !bpl) return false;
  if (e.urbanRural !== null && e.urbanRural !== area.toLowerCase()) return false;
  return true;
}

/* ───── FAQs ───── */
const FAQS = [
  { q: "How does the Government Scheme Finder work?", a: "Enter your basic details like age, income, category, and occupation. Our tool checks your eligibility against 230+ central and state government schemes and shows you the ones you qualify for, along with estimated annual benefits." },
  { q: "Is this eligibility check accurate?", a: "Our tool checks against the official eligibility criteria for each scheme. However, some schemes have additional criteria (like land ownership or specific documents) that can only be verified during the actual application. Always check the official website for final confirmation." },
  { q: "Can I apply for schemes directly from here?", a: "This tool helps you discover schemes you're eligible for. For each scheme, we provide a link to the official website and our detailed guide (where available) with step-by-step application instructions." },
  { q: "How many government schemes are covered?", a: "We cover 230+ schemes including 50+ central government schemes (PM Kisan, Ayushman Bharat, PM Awas Yojana, etc.) and 180+ state-specific schemes across all 31 states and UTs. We regularly update the database with verified benefit amounts." },
  { q: "Do I need to pay anything to check my eligibility?", a: "No, this tool is completely free. All government schemes listed here are also free to apply for through official channels. Beware of any third-party service charging money for scheme applications." },
];

/* ───── Component ───── */
export default function SchemeFinderPage() {
  const [state, setState] = useState("All India");
  const [dob, setDob] = useState("2000-01-01");
  const [gender, setGender] = useState("Male");
  const [income, setIncome] = useState(100000);
  const [category, setCategory] = useState("General");
  const [occupation, setOccupation] = useState("Unemployed");
  const [bpl, setBpl] = useState(true);
  const [area, setArea] = useState("Rural");
  const [showResults, setShowResults] = useState(false);
  const [useLang, setUseLang] = useState(false);
  const [filter, setFilter] = useState<"all" | "central" | "state">("state");
  const [showIneligible, setShowIneligible] = useState(false);

  const langCode = STATE_LANG[state] || null;

  const results = useMemo(() => {
    if (!showResults || !dob) return { eligible: [] as (Scheme & { _eligible: boolean })[], ineligible: [] as (Scheme & { _eligible: boolean })[] };
    const age = getAge(dob);
    const occ = OCCUPATION_MAP[occupation] || "any";

    const relevant = schemes.filter(s =>
      state === "All India" ? s.type === "central" : (s.type === "central" || s.state === state)
    );

    const eligible: (Scheme & { _eligible: boolean })[] = [];
    const ineligible: (Scheme & { _eligible: boolean })[] = [];

    for (const s of relevant) {
      if (checkEligibility(s, age, gender, income, category, occ, bpl, area)) {
        eligible.push({ ...s, _eligible: true });
      } else {
        ineligible.push({ ...s, _eligible: false });
      }
    }

    return { eligible, ineligible };
  }, [showResults, dob, state, gender, income, category, occupation, bpl, area]);

  const filtered = useMemo(() => {
    const list = results.eligible;
    if (filter === "central") return list.filter(s => s.type === "central");
    if (filter === "state") return list.filter(s => s.type === "state");
    return list;
  }, [results.eligible, filter]);

  const totalBenefit = useMemo(() =>
    results.eligible.reduce((sum, s) => sum + (s.benefitAmountPerYear || 0), 0),
    [results.eligible]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  function getName(s: Scheme) {
    if (useLang && langCode && s.name[langCode]) return s.name[langCode];
    return s.name.en;
  }

  function getBenefitDesc(s: Scheme) {
    if (useLang && langCode && s.benefitDescription[langCode]) return s.benefitDescription[langCode];
    return s.benefitDescription.en;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Government Scheme Finder",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    "description": "Find government schemes you're eligible for. Covers 230+ central and state schemes across all 31 states.",
    "url": "https://citizennest.com/calculator/scheme-finder",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/calculator" className="hover:text-orange-600">Calculators</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800">Scheme Finder</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Government Scheme Finder — Check Your Eligibility
        </h1>
        <p className="text-gray-600 mb-8">
          Enter your details below to discover central and state government schemes you may be eligible for. Covers 230+ schemes across all 31 states.
        </p>

        {/* Input Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={state} onChange={e => { setState(e.target.value); setUseLang(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>

            {/* Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Family Income</label>
              <select value={income} onChange={e => setIncome(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <select value={occupation} onChange={e => setOccupation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* BPL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BPL Card</label>
              <select value={bpl ? "yes" : "no"} onChange={e => setBpl(e.target.value === "yes")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select value={area} onChange={e => setArea(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>Urban</option><option>Rural</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => { if (dob) setShowResults(true); }}
            disabled={!dob}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find My Schemes
          </button>
        </div>

        {/* Results */}
        {showResults && dob && (
          <div>
            {/* Summary */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
              <p className="text-gray-700 text-sm mb-1">Based on your details</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                You may be eligible for <span className="text-orange-600">{results.eligible.length} schemes</span>
              </p>
              {totalBenefit > 0 && (
                <p className="text-lg text-gray-700">
                  Worth up to <span className="font-bold text-green-700">{fmt(totalBenefit)}/year</span> in total benefits
                </p>
              )}
            </div>

            {/* Language Toggle */}
            {langCode && STATE_LANG_NAME[langCode] && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setUseLang(!useLang)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${useLang ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"}`}
                >
                  {useLang ? `Showing in ${STATE_LANG_NAME[langCode]}` : `Show in ${STATE_LANG_NAME[langCode]}`}
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              {(["state", "central", "all"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${filter === f ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"}`}>
                  {f === "all" ? `All (${results.eligible.length})` : f === "central" ? `Central (${results.eligible.filter(s => s.type === "central").length})` : `State (${results.eligible.filter(s => s.type === "state").length})`}
                </button>
              ))}
            </div>

            {/* Grouped Schemes */}
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, list]) => (
              <div key={cat} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{cat}</h3>
                <div className="space-y-3">
                  {list.map(s => (
                    <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{getName(s)}</h4>
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Eligible</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{s.type === "central" ? "Central" : s.state}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{getBenefitDesc(s)}</p>
                          {s.eligibility.additionalCriteria && (
                            <p className="text-xs text-gray-500 mt-1">ℹ️ {s.eligibility.additionalCriteria}</p>
                          )}
                          <div className="flex gap-3 mt-2">
                            {s.guideSlug && (
                              <Link href={`/guide/${s.guideSlug}`} className="text-sm text-orange-600 hover:underline font-medium">
                                Read Guide →
                              </Link>
                            )}
                            <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                              Official Website ↗
                            </a>
                          </div>
                        </div>
                        {s.benefitAmountPerYear && (
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-green-700">{fmt(s.benefitAmountPerYear)}</p>
                            <p className="text-xs text-gray-500">/year</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                No eligible schemes found for this filter. Try changing the filter above.
              </div>
            )}

            {/* Ineligible Schemes */}
            {results.ineligible.length > 0 && (
              <div className="mt-8">
                <button onClick={() => setShowIneligible(!showIneligible)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <span>{showIneligible ? "▼" : "▶"}</span>
                  Not eligible for {results.ineligible.length} other schemes
                </button>
                {showIneligible && (
                  <div className="mt-3 space-y-2">
                    {results.ineligible.map(s => (
                      <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-70">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600 text-sm">{getName(s)}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{s.type === "central" ? "Central" : s.state}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{getBenefitDesc(s)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FAQs */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl p-4 group">
                <summary className="font-medium text-gray-900 cursor-pointer">{faq.q}</summary>
                <p className="text-gray-600 text-sm mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cross Links */}
        <section className="mt-10 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/calculator/age-eligibility" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
              <p className="font-medium text-gray-900">Age Eligibility Checker</p>
              <p className="text-sm text-gray-500">Check age requirements for documents & schemes</p>
            </Link>
            <Link href="/calculator/job-eligibility" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
              <p className="font-medium text-gray-900">Job Eligibility Checker</p>
              <p className="text-sm text-gray-500">Check eligibility for government exams</p>
            </Link>
            <Link href="/calculator" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
              <p className="font-medium text-gray-900">All Calculators</p>
              <p className="text-sm text-gray-500">Explore all free tools & calculators</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

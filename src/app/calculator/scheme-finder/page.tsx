"use client";

import { useState, useMemo, useCallback } from "react";
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
  benefitOneTime?: number | null;
  benefitType?: string;
  perHousehold?: boolean;
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
    education?: string | null;
    relation?: string[] | null;
    additionalCriteria: string;
  };
  officialUrl: string;
  guideSlug: string | null;
}

interface FamilyMember {
  id: string;
  relation: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  education: string;
}

interface MemberSchemeMatch {
  member: FamilyMember;
  scheme: Scheme;
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

const RELATIONS = ["Self", "Spouse", "Father", "Mother", "Son", "Daughter", "Other"];
const EDUCATION_LEVELS = ["None", "Primary", "Secondary", "Graduate", "Post-Graduate"];
const EDU_ORDER: Record<string, number> = { "none": 0, "primary": 1, "secondary": 2, "graduate": 3, "postgraduate": 4 };

const RELATION_GENDER: Record<string, string> = {
  "Father": "Male", "Mother": "Female", "Son": "Male", "Daughter": "Female",
};

const RELATION_TO_TAG: Record<string, string> = {
  "Self": "self", "Spouse": "spouse", "Father": "senior", "Mother": "senior",
  "Son": "child", "Daughter": "child", "Other": "any",
};

/* ───── Helpers ───── */
function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function checkMemberEligibility(
  scheme: Scheme,
  member: FamilyMember,
  income: number,
  category: string,
  bpl: boolean,
  area: string,
): boolean {
  const e = scheme.eligibility;
  if (e.ageMin !== null && member.age < e.ageMin) return false;
  if (e.ageMax !== null && member.age > e.ageMax) return false;
  if (e.gender !== null && e.gender !== member.gender.toLowerCase()) return false;
  if (e.incomeMax !== null && income > e.incomeMax) return false;
  if (e.categories !== null && !e.categories.some(c => c.toLowerCase() === category.toLowerCase())) return false;

  const occ = OCCUPATION_MAP[member.occupation] || "any";
  if (e.occupation !== null && !e.occupation.includes("any") && !e.occupation.includes(occ)) return false;
  if (e.bpl === true && !bpl) return false;
  if (e.urbanRural !== null && e.urbanRural !== area.toLowerCase()) return false;

  // Education check
  if (e.education && e.education !== "none") {
    const required = EDU_ORDER[e.education] || 0;
    const memberEdu = EDU_ORDER[member.education.toLowerCase().replace("-", "")] || 0;
    if (memberEdu < required) return false;
  }

  // Relation check
  if (e.relation && !e.relation.includes("any")) {
    const memberTag = RELATION_TO_TAG[member.relation] || "any";
    if (!e.relation.includes(memberTag) && memberTag !== "any") return false;
  }

  return true;
}

/* ───── FAQs ───── */
const FAQS = [
  { q: "How does the Family Scheme Finder work?", a: "Add your family members with their age, gender, occupation, and education. Our tool checks each member's eligibility against 230+ central and state government schemes and shows the total benefit your family can receive — split into annual recurring and one-time benefits." },
  { q: "Why is a family-based approach better?", a: "Government schemes target different family members — PM-Kisan for the farmer, Ayushman Bharat for the whole family, scholarships for children, pension for senior citizens. A family-based check ensures you don't miss any benefit that your household qualifies for." },
  { q: "Are household schemes counted per person?", a: "No. Household-level schemes like PMAY (housing), ration cards, and Ujjwala are counted once for the whole family, not per member. Individual schemes like PM-Kisan or pensions are counted per eligible member." },
  { q: "Is this eligibility check accurate?", a: "Our tool checks against the official eligibility criteria for each scheme. However, some schemes have additional criteria (like land ownership or specific documents) that can only be verified during the actual application. Always check the official website for final confirmation." },
  { q: "How many government schemes are covered?", a: "We cover 230+ schemes including 50+ central government schemes (PM Kisan, Ayushman Bharat, PM Awas Yojana, etc.) and 180+ state-specific schemes across all 31 states and UTs." },
];

/* ───── Component ───── */
export default function SchemeFinderPage() {
  const [state, setState] = useState("All India");
  const [income, setIncome] = useState(100000);
  const [category, setCategory] = useState("General");
  const [bpl, setBpl] = useState(true);
  const [area, setArea] = useState("Rural");
  const [showResults, setShowResults] = useState(false);
  const [useLang, setUseLang] = useState(false);
  const [viewMode, setViewMode] = useState<"family" | "member">("family");

  const [members, setMembers] = useState<FamilyMember[]>([
    { id: uid(), relation: "Self", name: "", age: 35, gender: "Male", occupation: "Farmer", education: "Secondary" },
  ]);

  const langCode = STATE_LANG[state] || null;

  const addMember = useCallback(() => {
    const rel: string = members.length === 1 ? "Spouse" : "Son";
    const defaultGender = RELATION_GENDER[rel] || "Male";
    const defaultAge = rel === "Son" || rel === "Daughter" ? 10 : rel === "Father" || rel === "Mother" ? 60 : 30;
    const defaultOcc = rel === "Son" || rel === "Daughter" ? "Student" : rel === "Father" || rel === "Mother" ? "Unemployed" : "Homemaker";
    setMembers(prev => [...prev, {
      id: uid(), relation: rel, name: "", age: defaultAge,
      gender: defaultGender, occupation: defaultOcc, education: "Secondary",
    }]);
  }, [members.length]);

  const removeMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMember = useCallback((id: string, field: keyof FamilyMember, value: string | number) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      // Auto-set gender for gendered relations
      if (field === "relation" && RELATION_GENDER[value as string]) {
        updated.gender = RELATION_GENDER[value as string];
      }
      // Auto-set defaults based on relation
      if (field === "relation") {
        if (value === "Son" || value === "Daughter") {
          updated.age = 10; updated.occupation = "Student";
        } else if (value === "Father" || value === "Mother") {
          updated.age = 60; updated.occupation = "Unemployed";
        }
      }
      return updated;
    }));
  }, []);

  // ───── Compute results ─────
  const results = useMemo(() => {
    if (!showResults) return null;

    const relevant = schemes.filter(s =>
      state === "All India" ? s.type === "central" : (s.type === "central" || s.state === state)
    );

    // For each scheme, find which members are eligible
    const schemeMatches = new Map<string, { scheme: Scheme; members: FamilyMember[] }>();
    const memberMatches = new Map<string, { member: FamilyMember; schemes: Scheme[] }>();

    // Init memberMatches
    for (const m of members) {
      memberMatches.set(m.id, { member: m, schemes: [] });
    }

    for (const s of relevant) {
      const eligibleMembers: FamilyMember[] = [];
      for (const m of members) {
        if (checkMemberEligibility(s, m, income, category, bpl, area)) {
          eligibleMembers.push(m);
          memberMatches.get(m.id)!.schemes.push(s);
        }
      }
      if (eligibleMembers.length > 0) {
        schemeMatches.set(s.id, { scheme: s, members: eligibleMembers });
      }
    }

    // Calculate totals
    let annualRecurring = 0;
    let oneTimeBenefits = 0;
    const householdCounted = new Set<string>();

    for (const [, { scheme, members: eligMembers }] of schemeMatches) {
      const isHousehold = scheme.perHousehold === true;
      const bt = scheme.benefitType || "recurring";

      if (bt === "recurring" || bt === "milestone") {
        if (scheme.benefitAmountPerYear) {
          if (isHousehold) {
            if (!householdCounted.has(scheme.id)) {
              annualRecurring += scheme.benefitAmountPerYear;
              householdCounted.add(scheme.id);
            }
          } else {
            annualRecurring += scheme.benefitAmountPerYear * eligMembers.length;
          }
        }
      }

      if (bt === "one-time" || bt === "subsidy") {
        const amt = scheme.benefitOneTime || scheme.benefitAmountPerYear || 0;
        if (amt) {
          if (isHousehold) {
            if (!householdCounted.has(scheme.id + "_ot")) {
              oneTimeBenefits += amt;
              householdCounted.add(scheme.id + "_ot");
            }
          } else {
            oneTimeBenefits += amt * eligMembers.length;
          }
        }
      }
    }

    const totalSchemes = schemeMatches.size;
    const ineligible = relevant.filter(s => !schemeMatches.has(s.id));

    return { schemeMatches, memberMatches, annualRecurring, oneTimeBenefits, totalSchemes, ineligible };
  }, [showResults, state, income, category, bpl, area, members]);

  function getName(s: Scheme) {
    if (useLang && langCode && s.name[langCode]) return s.name[langCode];
    return s.name.en;
  }

  function getBenefitDesc(s: Scheme) {
    if (useLang && langCode && s.benefitDescription[langCode]) return s.benefitDescription[langCode];
    return s.benefitDescription.en;
  }

  function getMemberLabel(m: FamilyMember) {
    return m.name || m.relation;
  }

  function getMemberEmoji(m: FamilyMember) {
    if (m.age >= 60) return "👴";
    if (m.relation === "Mother" || (m.gender === "Female" && m.age >= 18)) return "👩";
    if (m.relation === "Father" || (m.gender === "Male" && m.age >= 18)) return "👨";
    if (m.relation === "Daughter" || (m.gender === "Female" && m.age < 18)) return "👧";
    if (m.relation === "Son" || (m.gender === "Male" && m.age < 18)) return "👦";
    return "🧑";
  }

  function getBenefitBadge(s: Scheme) {
    const bt = s.benefitType || "recurring";
    if (bt === "recurring") return { label: "Annual", color: "bg-green-100 text-green-800" };
    if (bt === "one-time") return { label: "One-time", color: "bg-blue-100 text-blue-800" };
    if (bt === "subsidy") return { label: "Subsidy", color: "bg-purple-100 text-purple-800" };
    if (bt === "insurance") return { label: "Insurance", color: "bg-yellow-100 text-yellow-800" };
    if (bt === "loan") return { label: "Loan", color: "bg-orange-100 text-orange-800" };
    if (bt === "service") return { label: "Service", color: "bg-gray-100 text-gray-800" };
    if (bt === "milestone") return { label: "Milestone", color: "bg-teal-100 text-teal-800" };
    return { label: bt, color: "bg-gray-100 text-gray-700" };
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Family Government Scheme Finder",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    "description": "Find government schemes your entire family is eligible for. Add family members and see total annual and one-time benefits. Covers 230+ central and state schemes.",
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
          Family Government Scheme Finder — Total Benefits Calculator
        </h1>
        <p className="text-gray-600 mb-8">
          Add your family members below to discover all government schemes your household is eligible for. See the total annual recurring and one-time benefits your family can receive.
        </p>

        {/* Household Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏠 Household Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={state} onChange={e => { setState(e.target.value); setUseLang(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Family Income</label>
              <select value={income} onChange={e => setIncome(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BPL Card</label>
              <select value={bpl ? "yes" : "no"} onChange={e => setBpl(e.target.value === "yes")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select value={area} onChange={e => setArea(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>Rural</option><option>Urban</option>
              </select>
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">👨‍👩‍👧‍👦 Family Members</h2>
            <button onClick={addMember}
              className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-100 transition">
              + Add Member
            </button>
          </div>

          <div className="space-y-4">
            {members.map((m, idx) => (
              <div key={m.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {getMemberEmoji(m)} Member {idx + 1}
                    {m.name ? ` — ${m.name}` : ` — ${m.relation}`}
                  </span>
                  {members.length > 1 && (
                    <button onClick={() => removeMember(m.id)}
                      className="text-red-400 hover:text-red-600 text-sm">✕ Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Relation</label>
                    <select value={m.relation} onChange={e => updateMember(m.id, "relation", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500">
                      {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name <span className="text-gray-400">(optional)</span></label>
                    <input type="text" value={m.name} placeholder="e.g. Ravi"
                      onChange={e => updateMember(m.id, "name", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Age</label>
                    <input type="number" min={0} max={120} value={m.age}
                      onChange={e => updateMember(m.id, "age", parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gender</label>
                    <select value={m.gender} onChange={e => updateMember(m.id, "gender", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Occupation</label>
                    <select value={m.occupation} onChange={e => updateMember(m.id, "occupation", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500">
                      {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Education</label>
                    <select value={m.education} onChange={e => updateMember(m.id, "education", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500">
                      {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowResults(true)}
            disabled={members.length === 0}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find Family Schemes
          </button>
        </div>

        {/* Results */}
        {showResults && results && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-sm text-green-700 mb-1">Annual Recurring Benefits</p>
                <p className="text-2xl font-bold text-green-800">
                  {results.annualRecurring > 0 ? `${fmt(results.annualRecurring)}/yr` : "—"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 text-center">
                <p className="text-sm text-blue-700 mb-1">One-Time Benefits</p>
                <p className="text-2xl font-bold text-blue-800">
                  {results.oneTimeBenefits > 0 ? fmt(results.oneTimeBenefits) : "—"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 text-center">
                <p className="text-sm text-orange-700 mb-1">Total Schemes Eligible</p>
                <p className="text-2xl font-bold text-orange-800">{results.totalSchemes}</p>
                <p className="text-xs text-orange-600 mt-0.5">for {members.length} family member{members.length > 1 ? "s" : ""}</p>
              </div>
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

            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setViewMode("family")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${viewMode === "family" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"}`}>
                👨‍👩‍👧‍👦 By Family (All Schemes)
              </button>
              <button onClick={() => setViewMode("member")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${viewMode === "member" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"}`}>
                🧑 By Member
              </button>
            </div>

            {/* Family View — grouped by benefit type */}
            {viewMode === "family" && (() => {
              const entries = Array.from(results.schemeMatches.values());
              const recurring = entries.filter(e => {
                const bt = e.scheme.benefitType || "recurring";
                return bt === "recurring" || bt === "milestone";
              });
              const oneTime = entries.filter(e => {
                const bt = e.scheme.benefitType || "recurring";
                return bt === "one-time" || bt === "subsidy";
              });
              const other = entries.filter(e => {
                const bt = e.scheme.benefitType || "recurring";
                return !["recurring", "milestone", "one-time", "subsidy"].includes(bt);
              });

              return (
                <div className="space-y-6">
                  {recurring.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                        🔄 Annual Recurring Benefits
                        {results.annualRecurring > 0 && <span className="text-sm font-normal text-green-600">({fmt(results.annualRecurring)}/year)</span>}
                      </h3>
                      <div className="space-y-3">
                        {recurring.map(({ scheme, members: eligMembers }) => (
                          <SchemeCard key={scheme.id} scheme={scheme} eligMembers={eligMembers}
                            getName={getName} getBenefitDesc={getBenefitDesc} getBenefitBadge={getBenefitBadge}
                            getMemberLabel={getMemberLabel} getMemberEmoji={getMemberEmoji} />
                        ))}
                      </div>
                    </div>
                  )}

                  {oneTime.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        🎯 One-Time Benefits
                        {results.oneTimeBenefits > 0 && <span className="text-sm font-normal text-blue-600">({fmt(results.oneTimeBenefits)})</span>}
                      </h3>
                      <div className="space-y-3">
                        {oneTime.map(({ scheme, members: eligMembers }) => (
                          <SchemeCard key={scheme.id} scheme={scheme} eligMembers={eligMembers}
                            getName={getName} getBenefitDesc={getBenefitDesc} getBenefitBadge={getBenefitBadge}
                            getMemberLabel={getMemberLabel} getMemberEmoji={getMemberEmoji} />
                        ))}
                      </div>
                    </div>
                  )}

                  {other.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">🛡️ Insurance, Loans &amp; Services</h3>
                      <div className="space-y-3">
                        {other.map(({ scheme, members: eligMembers }) => (
                          <SchemeCard key={scheme.id} scheme={scheme} eligMembers={eligMembers}
                            getName={getName} getBenefitDesc={getBenefitDesc} getBenefitBadge={getBenefitBadge}
                            getMemberLabel={getMemberLabel} getMemberEmoji={getMemberEmoji} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Member View */}
            {viewMode === "member" && (
              <div className="space-y-6">
                {Array.from(results.memberMatches.values()).map(({ member, schemes: memberSchemes }) => (
                  <div key={member.id}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      {getMemberEmoji(member)} {getMemberLabel(member)}
                      <span className="text-sm font-normal text-gray-500">
                        ({member.age} yrs, {member.gender}, {member.occupation})
                      </span>
                      <span className="text-sm font-medium text-orange-600">— {memberSchemes.length} schemes</span>
                    </h3>
                    {memberSchemes.length === 0 ? (
                      <p className="text-gray-500 text-sm ml-8">No eligible schemes found for this member.</p>
                    ) : (
                      <div className="space-y-3">
                        {memberSchemes.map(scheme => (
                          <SchemeCard key={scheme.id} scheme={scheme} eligMembers={[member]}
                            getName={getName} getBenefitDesc={getBenefitDesc} getBenefitBadge={getBenefitBadge}
                            getMemberLabel={getMemberLabel} getMemberEmoji={getMemberEmoji} compact />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ineligible */}
            {results.ineligible.length > 0 && (
              <details className="mt-8">
                <summary className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                  Not eligible for {results.ineligible.length} other schemes
                </summary>
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
              </details>
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
              <p className="text-sm text-gray-500">Check age requirements for documents &amp; schemes</p>
            </Link>
            <Link href="/calculator/job-eligibility" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
              <p className="font-medium text-gray-900">Job Eligibility Checker</p>
              <p className="text-sm text-gray-500">Check eligibility for government exams</p>
            </Link>
            <Link href="/calculator" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
              <p className="font-medium text-gray-900">All Calculators</p>
              <p className="text-sm text-gray-500">Explore all free tools &amp; calculators</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ───── SchemeCard Component ───── */
function SchemeCard({ scheme, eligMembers, getName, getBenefitDesc, getBenefitBadge, getMemberLabel, getMemberEmoji, compact }: {
  scheme: Scheme;
  eligMembers: FamilyMember[];
  getName: (s: Scheme) => string;
  getBenefitDesc: (s: Scheme) => string;
  getBenefitBadge: (s: Scheme) => { label: string; color: string };
  getMemberLabel: (m: FamilyMember) => string;
  getMemberEmoji: (m: FamilyMember) => string;
  compact?: boolean;
}) {
  const badge = getBenefitBadge(scheme);
  const amt = scheme.benefitAmountPerYear || scheme.benefitOneTime;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{getName(scheme)}</h4>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>{badge.label}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {scheme.type === "central" ? "Central" : scheme.state}
            </span>
            {scheme.perHousehold && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">🏠 Per household</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{getBenefitDesc(scheme)}</p>

          {/* Eligible members */}
          {!compact && eligMembers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">Eligible:</span>
              {eligMembers.map(m => (
                <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                  {getMemberEmoji(m)} {getMemberLabel(m)}
                </span>
              ))}
            </div>
          )}

          {scheme.eligibility.additionalCriteria && (
            <p className="text-xs text-gray-500 mt-1">ℹ️ {scheme.eligibility.additionalCriteria}</p>
          )}
          <div className="flex gap-3 mt-2">
            {scheme.guideSlug && (
              <Link href={`/guide/${scheme.guideSlug}`} className="text-sm text-orange-600 hover:underline font-medium">
                Read Guide →
              </Link>
            )}
            <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
              Official Website ↗
            </a>
          </div>
        </div>
        {amt && amt > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-green-700">{fmt(amt)}</p>
            <p className="text-xs text-gray-500">
              {scheme.benefitType === "one-time" || scheme.benefitType === "subsidy" ? "one-time" : "/year"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

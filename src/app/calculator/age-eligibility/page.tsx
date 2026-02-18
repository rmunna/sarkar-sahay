"use client";

import { useState } from "react";
import Link from "next/link";

type Eligibility = { name: string; eligible: boolean; ageRange: string; note?: string; guideSlug?: string };

function getAge(dob: Date, ref: Date) {
  let years = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) years--;
  const ageInDays = (ref.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24);
  return { years, decimal: ageInDays / 365.25 };
}

function checkEligibility(age: number): Eligibility[] {
  return [
    // Identity & Documents
    { name: "Voter ID Card", ageRange: "18+", eligible: age >= 18, guideSlug: "voter-id-card-apply-online" },
    { name: "Driving License (with gear)", ageRange: "18+", eligible: age >= 18, guideSlug: "driving-license-apply-online" },
    { name: "Driving License (without gear)", ageRange: "16+", eligible: age >= 16, note: "Motorcycles up to 50cc", guideSlug: "driving-license-apply-online" },
    { name: "Passport (Minor)", ageRange: "0 – 17", eligible: age < 18, guideSlug: "child-minor-passport-apply" },
    { name: "Passport (Adult)", ageRange: "18+", eligible: age >= 18, guideSlug: "passport-apply-online" },
    { name: "Baal Aadhaar (Child Aadhaar)", ageRange: "0 – 5", eligible: age <= 5, guideSlug: "baal-aadhaar-child-aadhaar-card" },

    // Government Schemes
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

    // Finance & Tax
    { name: "Senior Citizen Savings Scheme", ageRange: "60+", eligible: age >= 60, note: "55+ for retired defence/govt", guideSlug: "senior-citizen-savings-scheme" },
    { name: "Senior Citizen Tax Benefits", ageRange: "60+", eligible: age >= 60, note: "Higher basic exemption limit" },
    { name: "Super Senior Citizen Tax Benefits", ageRange: "80+", eligible: age >= 80, note: "₹5L exemption (old regime)" },
    { name: "EPF Withdrawal (Full)", ageRange: "58+", eligible: age >= 58, note: "Or 2 months unemployment", guideSlug: "epf-pf-withdrawal-online" },
    { name: "NPS (National Pension System)", ageRange: "18 – 70", eligible: age >= 18 && age <= 70, guideSlug: "nps-national-pension-scheme" },

    // Services
    { name: "PAN Card", ageRange: "All ages", eligible: true, note: "Minors need representative assessee", guideSlug: "pan-card-apply-online" },
    { name: "Aadhaar Card", ageRange: "All ages", eligible: true, note: "Including newborns", guideSlug: "aadhaar-card-apply-online" },
    { name: "Railway Concession (Senior)", ageRange: "58+ (F) / 60+ (M)", eligible: age >= 58, note: "Currently suspended" },
  ];
}

export default function SchemeEligibilityChecker() {
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<null | { years: number; decimal: number; items: Eligibility[] }>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "not">("all");

  function calculate() {
    if (!dob) return;
    const d = new Date(dob);
    const now = new Date();
    const { years, decimal } = getAge(d, now);
    setResult({ years, decimal, items: checkEligibility(decimal) });
    setFilter("all");
  }

  const filtered = result
    ? filter === "all" ? result.items : filter === "eligible" ? result.items.filter((i) => i.eligible) : result.items.filter((i) => !i.eligible)
    : null;
  const eligibleCount = result?.items.filter((i) => i.eligible).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Scheme & Service Eligibility Checker India", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/age-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🎂 Scheme & Service <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Enter your date of birth to check age eligibility for government schemes, services, and benefits in India.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <button onClick={calculate} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Check Eligibility</button>
      </div>

      {result && (
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 text-center">
            <p className="text-sm text-gray-500">Your Age</p>
            <p className="text-3xl font-bold text-orange-600">{result.years} years</p>
            <p className="text-xs text-gray-400 mt-1">{result.decimal.toFixed(2)} years (decimal)</p>
            <p className="text-sm text-gray-500 mt-2">Eligible for <span className="font-bold text-orange-600">{eligibleCount}</span> out of {result.items.length} schemes & services</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([["all", `All (${result.items.length})`], ["eligible", `✅ Eligible (${eligibleCount})`], ["not", `❌ Not Eligible (${result.items.length - eligibleCount})`]] as const).map(([key, label]) => (
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
            <h2 className="text-lg font-bold text-gray-900 mb-3">Results</h2>
            <div className="space-y-2">
              {filtered?.map((item) => (
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
              ))}
            </div>
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

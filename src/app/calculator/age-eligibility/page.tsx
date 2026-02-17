"use client";

import { useState } from "react";
import Link from "next/link";

type Eligibility = { name: string; eligible: boolean; ageRange: string; note?: string };

function getAge(dob: Date, ref: Date) {
  let years = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) years--;
  // Precise decimal age
  const ageInDays = (ref.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24);
  return { years, decimal: ageInDays / 365.25 };
}

function checkEligibility(age: number): Eligibility[] {
  return [
    { name: "UPSC Civil Services", ageRange: "21 – 32", eligible: age >= 21 && age <= 32 },
    { name: "SSC CGL", ageRange: "18 – 27", eligible: age >= 18 && age <= 27 },
    { name: "SSC CHSL", ageRange: "18 – 27", eligible: age >= 18 && age <= 27 },
    { name: "NDA", ageRange: "16.5 – 19.5", eligible: age >= 16.5 && age <= 19.5 },
    { name: "CDS", ageRange: "19 – 25", eligible: age >= 19 && age <= 25 },
    { name: "RBI Grade B", ageRange: "21 – 30", eligible: age >= 21 && age <= 30 },
    { name: "IBPS PO", ageRange: "20 – 30", eligible: age >= 20 && age <= 30 },
    { name: "IBPS Clerk", ageRange: "20 – 28", eligible: age >= 20 && age <= 28 },
    { name: "Voter ID", ageRange: "18+", eligible: age >= 18 },
    { name: "Driving License", ageRange: "18+", eligible: age >= 18, note: "16+ for without gear" },
    { name: "Senior Citizen Benefits", ageRange: "60+", eligible: age >= 60 },
    { name: "Super Senior Citizen", ageRange: "80+", eligible: age >= 80 },
    { name: "Atal Pension Yojana", ageRange: "18 – 40", eligible: age >= 18 && age <= 40 },
    { name: "PM-KISAN", ageRange: "18+", eligible: age >= 18, note: "For farmer families" },
    { name: "Passport (Minor)", ageRange: "0 – 17", eligible: age < 18 },
    { name: "Passport (Adult)", ageRange: "18+", eligible: age >= 18 },
  ];
}

export default function AgeEligibilityChecker() {
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<null | { years: number; decimal: number; items: Eligibility[] }>(null);

  function calculate() {
    if (!dob) return;
    const d = new Date(dob);
    const now = new Date();
    const { years, decimal } = getAge(d, now);
    setResult({ years, decimal, items: checkEligibility(decimal) });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Age & Eligibility Checker India", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/age-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🎂 Age & Eligibility <span className="text-orange-600">Checker</span></h1>
      <p className="text-gray-600 mb-6">Enter your date of birth to check your current age and eligibility for government exams, schemes, and services in India.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <button onClick={calculate} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Check Eligibility</button>
      </div>

      {result && (
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <p className="text-sm text-gray-500">Your Age</p>
            <p className="text-3xl font-bold text-orange-600">{result.years} years</p>
            <p className="text-xs text-gray-400">{result.decimal.toFixed(2)} years (decimal)</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Eligibility Check</h2>
            <div className="space-y-2">
              {result.items.map((item) => (
                <div key={item.name} className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.eligible ? "bg-green-50" : "bg-gray-50"}`}>
                  <div>
                    <span className={`font-medium ${item.eligible ? "text-green-800" : "text-gray-500"}`}>{item.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.ageRange})</span>
                    {item.note && <span className="text-xs text-gray-400 ml-1">• {item.note}</span>}
                  </div>
                  <span className={`text-sm font-semibold ${item.eligible ? "text-green-600" : "text-red-400"}`}>
                    {item.eligible ? "✓ Eligible" : "✗ Not Eligible"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">Age limits shown are for General category. SC/ST/OBC candidates may get relaxation of 3-5 years for exams.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator/stamp-duty" className="text-sm text-orange-600 hover:underline">→ Stamp Duty Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is the UPSC age limit?", "For General category, the upper age limit for UPSC Civil Services is 32 years. OBC gets 35, SC/ST gets 37 years."],
          ["Can I apply for SSC after 27?", "General category cutoff is 27 for SSC CGL/CHSL. OBC gets 30, SC/ST gets 32 years relaxation."],
          ["What age do I need for a voter ID?", "You must be at least 18 years old on the qualifying date (January 1 of the year) to register as a voter."],
          ["When am I considered a senior citizen for tax?", "At age 60 you become a senior citizen (higher basic exemption). At 80, super senior citizen with even higher exemption."],
          ["Is NDA open to girls?", "Yes, since 2023 women can apply for NDA. The age limit is 16.5 to 19.5 years for both genders."],
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

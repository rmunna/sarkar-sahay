"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

type StateRates = { stamp: number; stampFemale?: number; registration: number; label: string };

const STATE_RATES: Record<string, StateRates> = {
  maharashtra: { label: "Maharashtra", stamp: 6, stampFemale: 5, registration: 1 },
  karnataka: { label: "Karnataka", stamp: 5, stampFemale: 4, registration: 1 },
  tamilnadu: { label: "Tamil Nadu", stamp: 7, registration: 1 },
  up: { label: "Uttar Pradesh", stamp: 7, stampFemale: 6, registration: 1 },
  delhi: { label: "Delhi", stamp: 6, stampFemale: 4, registration: 1 },
  rajasthan: { label: "Rajasthan", stamp: 6, stampFemale: 5, registration: 1 },
  gujarat: { label: "Gujarat", stamp: 4.9, registration: 1 },
  telangana: { label: "Telangana", stamp: 6, registration: 0.5 },
  westbengal: { label: "West Bengal", stamp: 7, stampFemale: 6, registration: 1 },
  mp: { label: "Madhya Pradesh", stamp: 7.5, stampFemale: 6, registration: 1 },
};

export default function StampDutyCalculator() {
  const [state, setState] = useState("maharashtra");
  const [value, setValue] = useState("");
  const [propType, setPropType] = useState<"residential" | "commercial">("residential");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [result, setResult] = useState<null | { stampDuty: number; registration: number; total: number }>(null);

  function calculate() {
    const v = Number(value) || 0;
    const rates = STATE_RATES[state];
    const stampRate = (gender === "female" && rates.stampFemale ? rates.stampFemale : rates.stamp) + (propType === "commercial" ? 1 : 0);
    const stampDuty = v * stampRate / 100;
    const registration = v * rates.registration / 100;
    setResult({ stampDuty, registration, total: stampDuty + registration });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Stamp Duty Calculator India", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/stamp-duty", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">📜 Stamp Duty <span className="text-orange-600">Calculator</span></h1>
      <p className="text-gray-600 mb-6">Calculate stamp duty and registration charges for property purchase across major Indian states. Rates vary by state, property type, and buyer gender.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {Object.entries(STATE_RATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Value (₹)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 5000000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="ptype" checked={propType === "residential"} onChange={() => setPropType("residential")} className="accent-orange-600" /> Residential</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="ptype" checked={propType === "commercial"} onChange={() => setPropType("commercial")} className="accent-orange-600" /> Commercial</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Gender</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="gender" checked={gender === "male"} onChange={() => setGender("male")} className="accent-orange-600" /> Male</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="gender" checked={gender === "female"} onChange={() => setGender("female")} className="accent-orange-600" /> Female</label>
            </div>
          </div>
        </div>
        <button onClick={calculate} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Calculate</button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
              <p className="text-sm text-gray-500">Stamp Duty</p>
              <p className="text-2xl font-bold text-orange-700">{fmt(result.stampDuty)}</p>
            </div>
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
              <p className="text-sm text-gray-500">Registration</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(result.registration)}</p>
            </div>
            <div className="rounded-lg p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-green-700">{fmt(result.total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* State rates table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Stamp Duty Rates by State</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 text-left"><th className="py-2 text-gray-600">State</th><th className="py-2 text-gray-600">Male</th><th className="py-2 text-gray-600">Female</th><th className="py-2 text-gray-600">Registration</th></tr></thead>
          <tbody>
            {Object.values(STATE_RATES).map((r) => (
              <tr key={r.label} className="border-b border-gray-100">
                <td className="py-1.5">{r.label}</td>
                <td className="py-1.5">{r.stamp}%</td>
                <td className="py-1.5">{r.stampFemale ? `${r.stampFemale}%` : `${r.stamp}%`}</td>
                <td className="py-1.5">{r.registration}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">Rates are approximate for residential property. Commercial rates may be ~1% higher. Always verify with your local sub-registrar.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator/age-eligibility" className="text-sm text-orange-600 hover:underline">→ Age Eligibility Checker</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Why do women pay lower stamp duty?", "Several states like Maharashtra, Delhi, UP, and Rajasthan offer reduced stamp duty rates for female buyers to encourage women's property ownership."],
          ["Is stamp duty the same across India?", "No, stamp duty is a state subject. Rates vary significantly — from ~4.9% in Gujarat to 7.5% in Madhya Pradesh."],
          ["Can I save on stamp duty?", "Register property in a woman's name, check for first-time buyer rebates, and look for government amnesty schemes."],
          ["Is stamp duty tax-deductible?", "Yes, stamp duty and registration charges are deductible under Section 80C up to ₹1.5 lakh in the year of purchase."],
          ["What is the difference between stamp duty and registration charges?", "Stamp duty is a tax on the property transaction document. Registration charges are fees for officially recording the ownership transfer at the sub-registrar's office."],
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

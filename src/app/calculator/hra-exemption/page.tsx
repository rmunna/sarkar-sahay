"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function HRACalculator() {
  const [basic, setBasic] = useState("");
  const [da, setDa] = useState("");
  const [hraReceived, setHraReceived] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [metro, setMetro] = useState(true);
  const [result, setResult] = useState<null | { exemption: number; taxable: number }>(null);

  function calculate() {
    const b = Number(basic) || 0;
    const d = Number(da) || 0;
    const hra = Number(hraReceived) || 0;
    const rent = Number(rentPaid) || 0;
    const salary = b + d;

    const a = hra; // actual HRA received
    const bVal = rent - 0.1 * salary; // rent paid - 10% of salary
    const c = metro ? 0.5 * salary : 0.4 * salary; // 50% or 40% of salary

    const exemption = Math.max(0, Math.min(a, bVal, c));
    setResult({ exemption, taxable: Math.max(0, hra - exemption) });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "HRA Exemption Calculator India", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/hra-exemption", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🏠 HRA Exemption <span className="text-orange-600">Calculator</span></h1>
      <p className="text-gray-600 mb-6">Calculate how much of your House Rent Allowance is tax-exempt under Section 10(13A). The exemption is the minimum of three amounts: actual HRA received, rent paid minus 10% of salary, and 50%/40% of salary (metro/non-metro).</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (₹/year)</label>
            <input type="number" value={basic} onChange={(e) => setBasic(e.target.value)} placeholder="e.g. 600000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dearness Allowance (₹/year)</label>
            <input type="number" value={da} onChange={(e) => setDa(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HRA Received (₹/year)</label>
            <input type="number" value={hraReceived} onChange={(e) => setHraReceived(e.target.value)} placeholder="e.g. 240000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rent Paid (₹/year)</label>
            <input type="number" value={rentPaid} onChange={(e) => setRentPaid(e.target.value)} placeholder="e.g. 180000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={metro} onChange={(e) => setMetro(e.target.checked)} className="accent-orange-600" />
            Metro city (Delhi, Mumbai, Chennai, Kolkata)
          </label>
        </div>
        <button onClick={calculate} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Calculate HRA</button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-gray-500">HRA Exemption</p>
              <p className="text-2xl font-bold text-green-700">{fmt(result.exemption)}</p>
            </div>
            <div className="rounded-lg p-4 bg-red-50 border border-red-200">
              <p className="text-sm text-gray-500">Taxable HRA</p>
              <p className="text-2xl font-bold text-red-700">{fmt(result.taxable)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator/gratuity" className="text-sm text-orange-600 hover:underline">→ Gratuity Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["How is HRA exemption calculated?", "It is the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of salary, (3) 50% of salary for metro cities or 40% for non-metro."],
          ["Which cities are considered metro for HRA?", "Delhi, Mumbai, Chennai, and Kolkata are metro cities for HRA exemption purposes."],
          ["Can I claim HRA if I own a house?", "Yes, you can claim HRA even if you own a house in a different city, as long as you pay rent where you live."],
          ["Is HRA available under the New Tax Regime?", "No, HRA exemption under Section 10(13A) is not available under the New Tax Regime."],
          ["Do I need rent receipts to claim HRA?", "If rent exceeds ₹1 lakh per year, you must provide the landlord's PAN. Rent receipts are needed for amounts above ₹3,000/month."],
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

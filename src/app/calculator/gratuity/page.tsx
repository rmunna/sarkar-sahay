"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function GratuityCalculator() {
  const [salary, setSalary] = useState("");
  const [years, setYears] = useState("");
  const [sector, setSector] = useState<"private" | "govt">("private");
  const [result, setResult] = useState<null | { gratuity: number; taxFree: number; taxable: number }>(null);

  function calculate() {
    const s = Number(salary) || 0;
    const y = Number(years) || 0;
    // Private: (15 × last drawn salary × years) / 26
    // Govt: (15 × last drawn salary × years) / 26 (same formula but no cap on tax-free)
    const gratuity = sector === "govt"
      ? (15 * s * y) / 26
      : (15 * s * y) / 26;
    const taxFreeLimit = sector === "govt" ? gratuity : Math.min(gratuity, 2000000); // ₹20L for private
    const taxable = Math.max(0, gratuity - taxFreeLimit);
    setResult({ gratuity, taxFree: taxFreeLimit, taxable });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Gratuity Calculator India", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/gratuity", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🎁 Gratuity <span className="text-orange-600">Calculator</span></h1>
      <p className="text-gray-600 mb-6">Estimate your gratuity amount based on last drawn salary and years of service. Gratuity is payable after 5+ years of continuous service under the Payment of Gratuity Act, 1972.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Drawn Salary (₹/month)</label>
            <p className="text-xs text-gray-400 mb-1">Basic + DA</p>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 50000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Service</label>
            <input type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 10" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="sector" checked={sector === "private"} onChange={() => setSector("private")} className="accent-orange-600" /> Private</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="sector" checked={sector === "govt"} onChange={() => setSector("govt")} className="accent-orange-600" /> Government</label>
          </div>
        </div>
        <button onClick={calculate} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Calculate Gratuity</button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
              <p className="text-sm text-gray-500">Gratuity Amount</p>
              <p className="text-2xl font-bold text-orange-700">{fmt(result.gratuity)}</p>
            </div>
            <div className="rounded-lg p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-gray-500">Tax-Free</p>
              <p className="text-2xl font-bold text-green-700">{fmt(result.taxFree)}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-500">Taxable</p>
              <p className="text-2xl font-bold text-gray-700">{fmt(result.taxable)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Formula: (15 × Monthly Salary × Years of Service) ÷ 26. Tax-free limit: {sector === "govt" ? "Entire amount for government employees" : "₹20 lakh for private sector"}.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/epf" className="text-sm text-orange-600 hover:underline">→ EPF Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is the minimum service for gratuity?", "You must complete at least 5 years of continuous service. However, in case of death or disability, this condition is relaxed."],
          ["What is the tax-free limit for gratuity?", "For private sector employees, gratuity up to ₹20 lakh is tax-free. For government employees, the entire amount is tax-exempt."],
          ["What salary is used for gratuity calculation?", "Last drawn basic salary plus dearness allowance (DA) is used. Other components like HRA are excluded."],
          ["Is gratuity applicable to contract employees?", "Gratuity applies to employees in establishments with 10+ employees. Contract workers may be eligible depending on their employment terms."],
          ["Can an employer refuse to pay gratuity?", "Gratuity can be forfeited only if the employee is terminated for misconduct involving moral turpitude, and only to the extent of damages caused."],
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

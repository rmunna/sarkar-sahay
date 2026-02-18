"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PRESETS = [
  { label: "🎓 IIT/NIT", cost: 1000000 },
  { label: "⚕️ MBBS Private", cost: 5000000 },
  { label: "🏥 MBBS Govt", cost: 500000 },
  { label: "📊 MBA IIM", cost: 2500000 },
  { label: "🔧 Engg Private", cost: 1500000 },
  { label: "✈️ Abroad MS", cost: 4000000 },
];

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        {segments.map((seg) => {
          const stroke = (seg.value / total) * circumference;
          const el = (
            <circle key={seg.label} cx="80" cy="80" r={radius} fill="none" stroke={seg.color} strokeWidth="24"
              strokeDasharray={`${stroke} ${circumference}`} strokeDashoffset={-offset} />
          );
          offset += stroke;
          return el;
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-sm justify-center">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label} ({((seg.value / total) * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EducationCostCalculator() {
  const [childAge, setChildAge] = useState("5");
  const [eduAge, setEduAge] = useState("18");
  const [annualCost, setAnnualCost] = useState("1000000");
  const [inflation, setInflation] = useState("8");
  const [sipReturns, setSipReturns] = useState("12");

  const cAge = Number(childAge) || 0;
  const eAge = Number(eduAge) || 0;
  const cost = Number(annualCost) || 0;
  const inflRate = Number(inflation) || 0;
  const retRate = Number(sipReturns) || 0;
  const yearsToGo = Math.max(0, eAge - cAge);

  const result = useMemo(() => {
    if (yearsToGo <= 0 || cost <= 0) return null;

    const futureCost = cost * Math.pow(1 + inflRate / 100, yearsToGo);

    // Lumpsum needed today
    const lumpsum = futureCost / Math.pow(1 + retRate / 100, yearsToGo);

    // Monthly SIP needed
    const monthlyRate = retRate / 12 / 100;
    const totalMonths = yearsToGo * 12;
    let monthlySIP: number;
    if (monthlyRate === 0) {
      monthlySIP = futureCost / totalMonths;
    } else {
      monthlySIP = futureCost * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // Year-wise projection
    const projection: { year: number; childAge: number; costThatYear: number; sipAccumulated: number }[] = [];
    let accumulated = 0;
    for (let y = 0; y <= yearsToGo; y++) {
      const costAtYear = cost * Math.pow(1 + inflRate / 100, y);
      projection.push({ year: y, childAge: cAge + y, costThatYear: costAtYear, sipAccumulated: accumulated });
      accumulated = accumulated * (1 + retRate / 100) + monthlySIP * 12;
    }

    return { futureCost, lumpsum, monthlySIP, projection };
  }, [cAge, yearsToGo, cost, inflRate, retRate]);

  function applyPreset(p: typeof PRESETS[number]) {
    setAnnualCost(String(p.cost));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Education Cost Calculator India",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/education-cost",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🎓 Education Cost <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Plan for your child&apos;s higher education. Estimate the future cost of IIT, MBBS, MBA, or studying abroad, and calculate how much to save via SIP or lumpsum.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="text-sm border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition">
            {p.label} ({fmt(p.cost)})
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Child&apos;s Current Age</label>
            <input type="number" value={childAge} onChange={(e) => setChildAge(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="0" max="17" step="1" value={childAge}
              onChange={(e) => setChildAge(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Start Age</label>
            <input type="number" value={eduAge} onChange={(e) => setEduAge(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="15" max="25" step="1" value={eduAge}
              onChange={(e) => setEduAge(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Total Education Cost (₹)</label>
            <input type="number" value={annualCost} onChange={(e) => setAnnualCost(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="100000" max="10000000" step="100000" value={annualCost}
              onChange={(e) => setAnnualCost(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Cost Inflation (%)</label>
            <input type="number" step="0.5" value={inflation} onChange={(e) => setInflation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="4" max="15" step="0.5" value={inflation}
              onChange={(e) => setInflation(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Investment Returns (%)</label>
            <input type="number" step="0.5" value={sipReturns} onChange={(e) => setSipReturns(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="4" max="18" step="0.5" value={sipReturns}
              onChange={(e) => setSipReturns(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Education Cost Estimate</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Future Cost (in {yearsToGo} years)</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(result.futureCost)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Monthly SIP Needed</p>
                    <p className="text-xl font-bold text-green-600">{fmt(result.monthlySIP)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Lumpsum Today</p>
                    <p className="text-xl font-bold text-gray-900">{fmt(result.lumpsum)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">Current Cost → Future Cost</p>
                  <p className="text-sm text-gray-700">{fmt(cost)} → {fmt(result.futureCost)} <span className="text-orange-600">({((result.futureCost / cost - 1) * 100).toFixed(0)}% increase)</span></p>
                </div>
              </div>
              <DonutChart segments={[
                { label: "Today's Cost", value: cost, color: "#16a34a" },
                { label: "Inflation Impact", value: result.futureCost - cost, color: "#ea580c" },
              ]} />
            </div>
          </div>

          {/* Projection Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Cost Projection
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Child Age</th>
                      <th className="py-2 text-right">Education Cost</th>
                      <th className="py-2 text-right">SIP Accumulated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.projection.map((row) => (
                      <tr key={row.childAge} className={`border-b border-gray-100 ${row.childAge === eAge ? "bg-orange-50 font-semibold" : ""}`}>
                        <td className="py-1.5 text-gray-600">{row.childAge}</td>
                        <td className="py-1.5 text-right">{fmt(row.costThatYear)}</td>
                        <td className="py-1.5 text-right">{fmt(row.sipAccumulated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/retirement" className="text-sm text-orange-600 hover:underline">→ Retirement Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is education inflation in India?", "Education costs in India have been rising at 8-12% per year, significantly higher than general inflation. Private colleges and international education often see even steeper increases."],
          ["How much does IIT cost today?", "IIT fees for a 4-year B.Tech program are approximately ₹8-10 lakh including hostel. This has increased significantly from ₹2 lakh a decade ago."],
          ["Should I invest in equity or debt for education?", "For goals more than 7 years away, equity mutual funds (index funds, flexi-cap) are suitable. As the goal nears (3-5 years), gradually shift to debt funds for safety."],
          ["What about education loans?", "While education loans are an option, saving in advance means your child starts their career debt-free. You can use our EMI Calculator to estimate loan costs."],
          ["Is Sukanya Samriddhi Yojana good for education?", "SSY offers ~8% tax-free returns with Section 80C benefits. It's excellent for a girl child's education, though partial withdrawal is allowed only after she turns 18."],
          ["How to plan for studying abroad?", "Factor in currency risk — if the rupee depreciates 3-4% annually against USD, your effective education inflation could be 12-15%. Consider investing partially in international funds."],
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

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function calcNPS(monthly: number, currentAge: number, retireAge: number, annualRate: number) {
  const years = retireAge - currentAge;
  if (monthly <= 0 || years <= 0) return { totalInvested: 0, corpus: 0, returns: 0, annuity: 0, lumpSum: 0, years: 0 };
  const n = years * 12;
  const r = annualRate / 100 / 12;
  const corpus = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const totalInvested = monthly * n;
  return {
    totalInvested,
    corpus,
    returns: corpus - totalInvested,
    annuity: corpus * 0.4,
    lumpSum: corpus * 0.6,
    years,
  };
}

function yearWiseGrowth(monthly: number, annualRate: number, years: number) {
  const rows: { year: number; invested: number; value: number }[] = [];
  const r = annualRate / 100 / 12;
  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const invested = monthly * n;
    const value = r === 0 ? invested : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    rows.push({ year: y, invested, value });
  }
  return rows;
}

function DonutChart({ invested, returns }: { invested: number; returns: number }) {
  const total = invested + returns;
  if (total === 0) return null;
  const iPct = (invested / total) * 100;
  const rPct = (returns / total) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const rStroke = (rPct / 100) * circumference;
  const iStroke = (iPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#fdba74" strokeWidth="24"
          strokeDasharray={`${rStroke} ${circumference}`} strokeDashoffset={0} />
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ea580c" strokeWidth="24"
          strokeDasharray={`${iStroke} ${circumference}`} strokeDashoffset={-rStroke} />
      </svg>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Contributed ({iPct.toFixed(1)}%)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> Returns ({rPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export default function NPSCalculator() {
  const [monthly, setMonthly] = useState("5000");
  const [currentAge, setCurrentAge] = useState("25");
  const [retireAge, setRetireAge] = useState("60");
  const [rate, setRate] = useState("10");

  const result = useMemo(
    () => calcNPS(Number(monthly) || 0, Number(currentAge) || 0, Number(retireAge) || 0, Number(rate) || 0),
    [monthly, currentAge, retireAge, rate]
  );

  const growth = useMemo(
    () => yearWiseGrowth(Number(monthly) || 0, Number(rate) || 0, result.years),
    [monthly, rate, result.years]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "NPS Calculator — Estimate National Pension Scheme Returns",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/nps",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏦 NPS <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Estimate your National Pension Scheme corpus at retirement, monthly annuity income, and lump sum withdrawal amount.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution (₹)</label>
            <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="500" max="100000" step="500" value={monthly}
              onChange={(e) => setMonthly(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (% p.a.)</label>
            <input type="number" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="4" max="14" step="0.5" value={rate}
              onChange={(e) => setRate(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
            <input type="number" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="18" max="55" value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retirement Age</label>
            <input type="number" value={retireAge} onChange={(e) => setRetireAge(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="55" max="70" value={retireAge}
              onChange={(e) => setRetireAge(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
        </div>
      </div>

      {/* Results */}
      {result.corpus > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">NPS Returns Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Total Corpus at {retireAge}</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(result.corpus)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Contributed</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.totalInvested)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Returns</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.returns)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Lump Sum (60%)</p>
                    <p className="text-lg font-bold text-green-700">{fmt(result.lumpSum)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Annuity (40%)</p>
                    <p className="text-lg font-bold text-blue-700">{fmt(result.annuity)}</p>
                  </div>
                </div>
              </div>
              <DonutChart invested={result.totalInvested} returns={result.returns} />
            </div>
          </div>

          {/* Year-wise Growth Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Growth
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Year</th>
                      <th className="py-2 text-right">Contributed</th>
                      <th className="py-2 text-right">Corpus Value</th>
                      <th className="py-2 text-right">Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growth.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.year}</td>
                        <td className="py-1.5 text-right">{fmt(row.invested)}</td>
                        <td className="py-1.5 text-right">{fmt(row.value)}</td>
                        <td className="py-1.5 text-right text-green-600">{fmt(row.value - row.invested)}</td>
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
        <Link href="/calculator/sip" className="text-sm text-orange-600 hover:underline">→ SIP Calculator</Link>
        <Link href="/calculator/ppf" className="text-sm text-orange-600 hover:underline">→ PPF Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is NPS?", "National Pension System (NPS) is a voluntary, long-term retirement savings scheme by the Government of India. It allows you to build a retirement corpus through regular contributions."],
          ["How much of NPS corpus can I withdraw?", "At retirement (age 60), you can withdraw up to 60% as a tax-free lump sum. The remaining 40% must be used to purchase an annuity plan for regular pension income."],
          ["What is the tax benefit of NPS?", "NPS contributions qualify for tax deduction under Section 80CCD(1) up to ₹1.5 lakh and an additional ₹50,000 under Section 80CCD(1B), totaling up to ₹2 lakh in deductions."],
          ["What returns can I expect from NPS?", "NPS returns depend on your asset allocation. Historically, NPS equity funds have given 10-14% returns, while debt/government bond funds give 8-10%. Returns are market-linked and not guaranteed."],
          ["Can I exit NPS before 60?", "Yes, premature exit is allowed after 5 years of contributions. However, you must use at least 80% of the corpus to buy an annuity. Only 20% can be withdrawn as lump sum."],
          ["Who manages NPS funds?", "NPS funds are managed by PFRDA-registered Pension Fund Managers including SBI, LIC, HDFC, ICICI, Kotak, Aditya Birla, and UTI."],
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

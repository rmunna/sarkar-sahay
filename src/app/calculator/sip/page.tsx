"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PRESETS = [
  { label: "🛡️ Conservative", rate: 8 },
  { label: "⚖️ Moderate", rate: 12 },
  { label: "🚀 Aggressive", rate: 15 },
];

function calcSIP(monthly: number, annualRate: number, years: number) {
  if (monthly <= 0 || years <= 0) return { invested: 0, returns: 0, total: 0 };
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return { invested: monthly * n, returns: 0, total: monthly * n };
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  return { invested, returns: fv - invested, total: fv };
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
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Invested ({iPct.toFixed(1)}%)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> Returns ({rPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export default function SIPCalculator() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");

  const { invested, returns, total } = useMemo(
    () => calcSIP(Number(monthly) || 0, Number(rate) || 0, Number(years) || 0),
    [monthly, rate, years]
  );

  const growth = useMemo(
    () => yearWiseGrowth(Number(monthly) || 0, Number(rate) || 0, Number(years) || 0),
    [monthly, rate, years]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SIP Calculator — Calculate Mutual Fund SIP Returns Online",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/sip",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        📈 SIP <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Estimate your mutual fund SIP returns, total wealth accumulated, and view a year-wise growth projection.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setRate(String(p.rate))}
            className="text-sm border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
          >
            {p.label} ({p.rate}%)
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Investment (₹)</label>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (% p.a.)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 12"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Period (Years)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g. 10"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {total > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">SIP Returns Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(total)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Invested</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(invested)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Estimated Returns</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(returns)}</p>
                  </div>
                </div>
              </div>
              <DonutChart invested={invested} returns={returns} />
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
                      <th className="py-2 text-right">Invested</th>
                      <th className="py-2 text-right">Value</th>
                      <th className="py-2 text-right">Gain</th>
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
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/fd" className="text-sm text-orange-600 hover:underline">→ FD Calculator</Link>
        <Link href="/calculator/ppf" className="text-sm text-orange-600 hover:underline">→ PPF Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* Affiliate CTA — Start SIP */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">Sponsored</p>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to Start Your SIP?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Open a free mutual fund account and start SIP in 5 minutes — no paperwork, zero commission.
          Over 1 crore Indians invest via these platforms.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://groww.in/mutual-funds/sip"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Start SIP on Groww — Free →
          </a>
          <a
            href="https://upstox.com/mutual-funds/"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 hover:bg-green-50 text-green-800 text-sm font-semibold rounded-lg transition"
          >
            Invest via Upstox
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is SIP?", "SIP (Systematic Investment Plan) allows you to invest a fixed amount regularly in mutual funds. It helps build wealth over time through the power of compounding and rupee cost averaging."],
          ["How is SIP return calculated?", "SIP returns are calculated using the formula: FV = P × [((1+r)^n - 1) / r] × (1+r), where P is the monthly investment, r is the monthly rate of return, and n is the total number of months."],
          ["What is the minimum SIP amount?", "Most mutual funds in India allow SIPs starting from ₹500 per month. Some funds even allow ₹100 SIPs."],
          ["Are SIP returns guaranteed?", "No, SIP returns are market-linked and not guaranteed. The calculator shows estimated returns based on an assumed annual rate. Actual returns may vary based on market conditions."],
          ["What is the difference between SIP and lump sum?", "SIP invests a fixed amount regularly (monthly), reducing the risk of market timing through rupee cost averaging. Lump sum is a one-time investment. SIP is generally better for salaried individuals."],
          ["Can I stop or modify my SIP?", "Yes, you can stop, pause, or modify your SIP amount at any time. There is no penalty for stopping a SIP in most mutual funds."],
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

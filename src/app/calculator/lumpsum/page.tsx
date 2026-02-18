"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const FD_RATE = 7;

const PRESETS = [
  { label: "🛡️ Debt Fund", rate: 7 },
  { label: "⚖️ Balanced", rate: 10 },
  { label: "📈 Equity", rate: 12 },
  { label: "🚀 Small Cap", rate: 15 },
];

function calcLumpsum(principal: number, rate: number, years: number) {
  if (principal <= 0 || years <= 0) return { maturity: 0, returns: 0, cagr: 0 };
  const maturity = principal * Math.pow(1 + rate / 100, years);
  const cagr = (Math.pow(maturity / principal, 1 / years) - 1) * 100;
  return { maturity, returns: maturity - principal, cagr };
}

function yearWiseGrowth(principal: number, rate: number, fdRate: number, years: number) {
  const rows: { year: number; mfValue: number; fdValue: number }[] = [];
  for (let y = 1; y <= years; y++) {
    rows.push({
      year: y,
      mfValue: principal * Math.pow(1 + rate / 100, y),
      fdValue: principal * Math.pow(1 + fdRate / 100, y),
    });
  }
  return rows;
}

function BarChart({ mfValue, fdValue, principal }: { mfValue: number; fdValue: number; principal: number }) {
  const max = Math.max(mfValue, fdValue, 1);
  const mfPct = (mfValue / max) * 100;
  const fdPct = (fdValue / max) * 100;
  const pPct = (principal / max) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-gray-700">Comparison</div>
      {[
        { label: "Mutual Fund", pct: mfPct, value: mfValue, color: "bg-orange-500" },
        { label: `FD (${FD_RATE}%)`, pct: fdPct, value: fdValue, color: "bg-blue-500" },
        { label: "Invested", pct: pPct, value: principal, color: "bg-gray-400" },
      ].map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{item.label}</span>
            <span>{fmt(item.value)}</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.max(item.pct, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LumpsumCalculator() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");

  const result = useMemo(
    () => calcLumpsum(Number(principal) || 0, Number(rate) || 0, Number(years) || 0),
    [principal, rate, years]
  );

  const fdResult = useMemo(
    () => calcLumpsum(Number(principal) || 0, FD_RATE, Number(years) || 0),
    [principal, years]
  );

  const growth = useMemo(
    () => yearWiseGrowth(Number(principal) || 0, Number(rate) || 0, FD_RATE, Number(years) || 0),
    [principal, rate, years]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Lumpsum Calculator — Calculate One-Time Investment Returns",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/lumpsum",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        💰 Lumpsum <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate returns on a one-time investment. Compare mutual fund returns with FD returns side by side.
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount (₹)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="10000" max="10000000" step="10000" value={principal}
              onChange={(e) => setPrincipal(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (% p.a.)</label>
            <input type="number" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1" max="30" step="0.5" value={rate}
              onChange={(e) => setRate(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period (Years)</label>
            <input type="number" value={years} onChange={(e) => setYears(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1" max="30" value={years}
              onChange={(e) => setYears(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
        </div>
      </div>

      {/* Results */}
      {result.maturity > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Investment Returns Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Maturity Amount</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(result.maturity)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Invested</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(Number(principal) || 0)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Returns</p>
                    <p className="text-lg font-bold text-green-600">{fmt(result.returns)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">CAGR</p>
                    <p className="text-lg font-bold text-gray-900">{result.cagr.toFixed(1)}%</p>
                  </div>
                </div>
                {/* FD Comparison */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-gray-500">FD Returns ({FD_RATE}% p.a.)</p>
                  <p className="text-lg font-bold text-blue-700">{fmt(fdResult.maturity)}</p>
                  <p className="text-xs text-gray-500">Extra earnings: <span className="font-semibold text-green-600">{fmt(result.maturity - fdResult.maturity)}</span></p>
                </div>
              </div>
              <BarChart mfValue={result.maturity} fdValue={fdResult.maturity} principal={Number(principal) || 0} />
            </div>
          </div>

          {/* Year-wise Growth Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Growth (MF vs FD)
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Year</th>
                      <th className="py-2 text-right">MF Value</th>
                      <th className="py-2 text-right">FD Value</th>
                      <th className="py-2 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growth.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.year}</td>
                        <td className="py-1.5 text-right">{fmt(row.mfValue)}</td>
                        <td className="py-1.5 text-right">{fmt(row.fdValue)}</td>
                        <td className="py-1.5 text-right text-green-600">{fmt(row.mfValue - row.fdValue)}</td>
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
        <Link href="/calculator/fd" className="text-sm text-orange-600 hover:underline">→ FD Calculator</Link>
        <Link href="/calculator/nps" className="text-sm text-orange-600 hover:underline">→ NPS Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is a lumpsum investment?", "A lumpsum investment is a one-time investment of a large amount into a mutual fund or other financial instrument, as opposed to investing in installments (SIP)."],
          ["Lumpsum vs SIP — which is better?", "If markets are low and you have surplus funds, lumpsum can give higher returns. SIP is better for regular income earners as it averages out market volatility through rupee cost averaging."],
          ["What is CAGR?", "CAGR (Compound Annual Growth Rate) represents the annualized return rate that an investment would have earned if it grew at a steady rate. It's the standard way to compare investments."],
          ["Is lumpsum investment risky?", "Lumpsum carries higher timing risk since you invest everything at once. If markets drop right after investing, your returns may be lower. Diversification and longer holding periods reduce this risk."],
          ["How long should I stay invested in lumpsum?", "For equity mutual funds, experts recommend a minimum holding period of 5-7 years. Longer periods (10+ years) significantly improve the probability of positive returns."],
          ["Are lumpsum mutual fund returns taxable?", "Yes. Equity funds held >1 year: LTCG above ₹1.25 lakh taxed at 12.5%. Debt funds: taxed at your income tax slab rate regardless of holding period (as per 2024 rules)."],
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

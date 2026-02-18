"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const FREQ_OPTIONS = [
  { label: "Yearly", value: 1 },
  { label: "Half-Yearly", value: 2 },
  { label: "Quarterly", value: 4 },
  { label: "Monthly", value: 12 },
];

function calcSimple(principal: number, rate: number, years: number) {
  const interest = principal * rate * years / 100;
  return { interest, maturity: principal + interest };
}

function calcCompound(principal: number, rate: number, years: number, freq: number) {
  const maturity = principal * Math.pow(1 + rate / (100 * freq), freq * years);
  return { interest: maturity - principal, maturity };
}

function yearWiseBreakdown(principal: number, rate: number, years: number, freq: number) {
  const rows: { year: number; si: number; siTotal: number; ci: number; ciTotal: number }[] = [];
  for (let y = 1; y <= years; y++) {
    const siTotal = principal + principal * rate * y / 100;
    const ciTotal = principal * Math.pow(1 + rate / (100 * freq), freq * y);
    rows.push({
      year: y,
      si: principal * rate / 100,
      siTotal,
      ci: ciTotal - (y === 1 ? principal : principal * Math.pow(1 + rate / (100 * freq), freq * (y - 1))),
      ciTotal,
    });
  }
  return rows;
}

function BarChart({ siMaturity, ciMaturity, principal }: { siMaturity: number; ciMaturity: number; principal: number }) {
  const max = Math.max(siMaturity, ciMaturity, 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-gray-700">Comparison</div>
      {[
        { label: "Compound Interest", pct: (ciMaturity / max) * 100, value: ciMaturity, color: "bg-orange-500" },
        { label: "Simple Interest", pct: (siMaturity / max) * 100, value: siMaturity, color: "bg-blue-500" },
        { label: "Principal", pct: (principal / max) * 100, value: principal, color: "bg-gray-400" },
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

export default function InterestCalculator() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("5");
  const [freq, setFreq] = useState(4);
  const [mode, setMode] = useState<"both" | "simple" | "compound">("both");

  const si = useMemo(
    () => calcSimple(Number(principal) || 0, Number(rate) || 0, Number(years) || 0),
    [principal, rate, years]
  );

  const ci = useMemo(
    () => calcCompound(Number(principal) || 0, Number(rate) || 0, Number(years) || 0, freq),
    [principal, rate, years, freq]
  );

  const breakdown = useMemo(
    () => yearWiseBreakdown(Number(principal) || 0, Number(rate) || 0, Number(years) || 0, freq),
    [principal, rate, years, freq]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Interest Calculator — Simple & Compound Interest Online",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/interest",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏧 Interest <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate and compare simple interest vs compound interest. See the power of compounding with year-wise breakdowns.
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        {(["both", "simple", "compound"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`text-sm px-4 py-2 rounded-lg border transition capitalize ${mode === m ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            {m === "both" ? "Compare Both" : `${m} Interest`}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (₹)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1000" max="10000000" step="1000" value={principal}
              onChange={(e) => setPrincipal(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1" max="30" step="0.1" value={rate}
              onChange={(e) => setRate(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period (Years)</label>
            <input type="number" value={years} onChange={(e) => setYears(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1" max="30" value={years}
              onChange={(e) => setYears(e.target.value)} className="w-full mt-2 accent-orange-600" />
          </div>
          {(mode === "both" || mode === "compound") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
              <div className="flex gap-2 flex-wrap">
                {FREQ_OPTIONS.map((f) => (
                  <button key={f.value} onClick={() => setFreq(f.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${freq === f.value ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {(si.maturity > 0 || ci.maturity > 0) && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Interest Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                {(mode === "both" || mode === "compound") && (
                  <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                    <p className="text-sm text-gray-500">Compound Interest Maturity</p>
                    <p className="text-3xl font-bold text-orange-600">{fmt(ci.maturity)}</p>
                    <p className="text-xs text-gray-500">Interest: {fmt(ci.interest)}</p>
                  </div>
                )}
                {(mode === "both" || mode === "simple") && (
                  <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4 text-center">
                    <p className="text-sm text-gray-500">Simple Interest Maturity</p>
                    <p className="text-3xl font-bold text-blue-600">{fmt(si.maturity)}</p>
                    <p className="text-xs text-gray-500">Interest: {fmt(si.interest)}</p>
                  </div>
                )}
                {mode === "both" && (
                  <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Compounding Advantage</p>
                    <p className="text-lg font-bold text-green-700">{fmt(ci.interest - si.interest)}</p>
                  </div>
                )}
              </div>
              <BarChart siMaturity={si.maturity} ciMaturity={ci.maturity} principal={Number(principal) || 0} />
            </div>
          </div>

          {/* Year-wise Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Breakdown
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Year</th>
                      {(mode === "both" || mode === "simple") && (
                        <>
                          <th className="py-2 text-right">SI Interest</th>
                          <th className="py-2 text-right">SI Total</th>
                        </>
                      )}
                      {(mode === "both" || mode === "compound") && (
                        <>
                          <th className="py-2 text-right">CI Interest</th>
                          <th className="py-2 text-right">CI Total</th>
                        </>
                      )}
                      {mode === "both" && <th className="py-2 text-right">Difference</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.year}</td>
                        {(mode === "both" || mode === "simple") && (
                          <>
                            <td className="py-1.5 text-right">{fmt(row.si)}</td>
                            <td className="py-1.5 text-right">{fmt(row.siTotal)}</td>
                          </>
                        )}
                        {(mode === "both" || mode === "compound") && (
                          <>
                            <td className="py-1.5 text-right">{fmt(row.ci)}</td>
                            <td className="py-1.5 text-right">{fmt(row.ciTotal)}</td>
                          </>
                        )}
                        {mode === "both" && (
                          <td className="py-1.5 text-right text-green-600">{fmt(row.ciTotal - row.siTotal)}</td>
                        )}
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
        <Link href="/calculator/fd" className="text-sm text-orange-600 hover:underline">→ FD Calculator</Link>
        <Link href="/calculator/sip" className="text-sm text-orange-600 hover:underline">→ SIP Calculator</Link>
        <Link href="/calculator/lumpsum" className="text-sm text-orange-600 hover:underline">→ Lumpsum Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is simple interest?", "Simple interest is calculated only on the original principal amount. Formula: SI = P × R × T / 100. The interest remains the same every year."],
          ["What is compound interest?", "Compound interest is calculated on the principal plus accumulated interest. Interest earns interest, leading to exponential growth over time. Most bank FDs and investments use compound interest."],
          ["What is compounding frequency?", "Compounding frequency is how often interest is calculated and added to the principal. Higher frequency (monthly > quarterly > yearly) results in more interest due to more frequent compounding."],
          ["Which banks use simple vs compound interest?", "Most savings accounts and FDs use compound interest. Simple interest is typically used for short-term personal loans, car loans, and some government schemes."],
          ["How does compounding frequency affect returns?", "More frequent compounding gives higher returns. For ₹1,00,000 at 10% for 5 years: Annual compounding gives ₹1,61,051 while monthly compounding gives ₹1,64,531 — a difference of ₹3,480."],
          ["What is the Rule of 72?", "The Rule of 72 is a quick way to estimate how long it takes to double your money. Divide 72 by the annual interest rate. At 12% returns, your money doubles in approximately 72/12 = 6 years."],
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

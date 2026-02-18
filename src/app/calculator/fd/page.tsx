"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PRESETS = [
  { label: "🏦 SBI", rate: 6.5 },
  { label: "🏤 Post Office", rate: 7.5 },
  { label: "👴 Senior Citizen", rate: 7.5 },
];

const FREQ_OPTIONS: { label: string; value: number }[] = [
  { label: "Monthly", value: 12 },
  { label: "Quarterly", value: 4 },
  { label: "Half-Yearly", value: 2 },
  { label: "Yearly", value: 1 },
];

function calcFD(principal: number, annualRate: number, years: number, compFreq: number) {
  if (principal <= 0 || years <= 0) return { maturity: 0, interest: 0, effectiveRate: 0 };
  const r = annualRate / 100;
  const maturity = principal * Math.pow(1 + r / compFreq, compFreq * years);
  const interest = maturity - principal;
  const effectiveRate = (Math.pow(1 + r / compFreq, compFreq) - 1) * 100;
  return { maturity, interest, effectiveRate };
}

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = (principal / total) * 100;
  const iPct = (interest / total) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const iStroke = (iPct / 100) * circumference;
  const pStroke = (pPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#fdba74" strokeWidth="24"
          strokeDasharray={`${iStroke} ${circumference}`} strokeDashoffset={0} />
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ea580c" strokeWidth="24"
          strokeDasharray={`${pStroke} ${circumference}`} strokeDashoffset={-iStroke} />
      </svg>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Principal ({pPct.toFixed(1)}%)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> Interest ({iPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export default function FDCalculator() {
  const [amount, setAmount] = useState("100000");
  const [rate, setRate] = useState("6.5");
  const [tenure, setTenure] = useState("5");
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">("years");
  const [compFreq, setCompFreq] = useState(4);

  const years = tenureUnit === "years" ? (Number(tenure) || 0) : (Number(tenure) || 0) / 12;
  const principal = Number(amount) || 0;
  const annualRate = Number(rate) || 0;

  const { maturity, interest, effectiveRate } = useMemo(
    () => calcFD(principal, annualRate, years, compFreq),
    [principal, annualRate, years, compFreq]
  );

  const comparisonTable = useMemo(() => {
    return FREQ_OPTIONS.map((f) => {
      const res = calcFD(principal, annualRate, years, f.value);
      return { label: f.label, freq: f.value, ...res };
    });
  }, [principal, annualRate, years]);

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FD Calculator — Fixed Deposit Maturity & Interest Calculator",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/fd",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏦 FD <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your fixed deposit maturity amount, total interest earned, and compare returns across different compounding frequencies.
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
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenure</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="e.g. 5"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={tenureUnit}
                onChange={(e) => setTenureUnit(e.target.value as "years" | "months")}
                className="border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
            <select
              value={compFreq}
              onChange={(e) => setCompFreq(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {FREQ_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {maturity > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">FD Maturity Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Maturity Amount</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(maturity)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(interest)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Effective Rate</p>
                    <p className="text-lg font-bold text-gray-900">{effectiveRate.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">Principal</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(principal)}</p>
                </div>
              </div>
              <DonutChart principal={principal} interest={interest} />
            </div>
          </div>

          {/* Compounding Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📊 Compounding Frequency Comparison
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Frequency</th>
                      <th className="py-2 text-right">Maturity</th>
                      <th className="py-2 text-right">Interest</th>
                      <th className="py-2 text-right">Effective Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonTable.map((row) => (
                      <tr key={row.label} className={`border-b border-gray-100 ${row.freq === compFreq ? "bg-orange-50 font-medium" : ""}`}>
                        <td className="py-1.5 text-gray-600">{row.label}</td>
                        <td className="py-1.5 text-right">{fmt(row.maturity)}</td>
                        <td className="py-1.5 text-right">{fmt(row.interest)}</td>
                        <td className="py-1.5 text-right">{row.effectiveRate.toFixed(2)}%</td>
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
        <Link href="/calculator/sip" className="text-sm text-orange-600 hover:underline">→ SIP Calculator</Link>
        <Link href="/calculator/ppf" className="text-sm text-orange-600 hover:underline">→ PPF Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is a Fixed Deposit?", "A Fixed Deposit (FD) is a savings instrument offered by banks and NBFCs where you deposit a lump sum for a fixed tenure at a predetermined interest rate. It is one of the safest investment options in India."],
          ["How is FD interest calculated?", "FD interest is calculated using the formula A = P × (1 + r/n)^(n×t), where P is the principal, r is the annual rate, n is the compounding frequency, and t is the tenure in years."],
          ["What is compounding frequency?", "Compounding frequency determines how often interest is added to the principal. Quarterly compounding (most common in India) adds interest 4 times a year, resulting in slightly higher returns than annual compounding."],
          ["Is FD interest taxable?", "Yes, FD interest is taxable as per your income tax slab. Banks deduct TDS at 10% if the interest exceeds ₹40,000 in a year (₹50,000 for senior citizens). You can submit Form 15G/15H to avoid TDS if your income is below the taxable limit."],
          ["What is the difference between cumulative and non-cumulative FD?", "In cumulative FD, interest is compounded and paid at maturity along with the principal. In non-cumulative FD, interest is paid out periodically (monthly, quarterly, etc.), resulting in slightly lower effective returns."],
          ["Do senior citizens get higher FD rates?", "Yes, most banks offer an additional 0.25% to 0.75% interest rate to senior citizens (60+ years) on their fixed deposits."],
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

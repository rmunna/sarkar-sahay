"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function calcPPF(annualDeposit: number, rate: number, years: number) {
  const rows: { year: number; opening: number; deposit: number; interest: number; closing: number }[] = [];
  let balance = 0;
  const r = rate / 100;
  for (let y = 1; y <= years; y++) {
    const opening = balance;
    const deposit = annualDeposit;
    const interest = (opening + deposit) * r;
    const closing = opening + deposit + interest;
    rows.push({ year: y, opening, deposit, interest, closing });
    balance = closing;
  }
  const totalInvested = annualDeposit * years;
  const totalInterest = balance - totalInvested;
  return { rows, totalInvested, totalInterest, maturity: balance };
}

function DonutChart({ invested, interest }: { invested: number; interest: number }) {
  const total = invested + interest;
  if (total === 0) return null;
  const iPct = (invested / total) * 100;
  const rPct = (interest / total) * 100;
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
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> Interest ({rPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export default function PPFCalculator() {
  const [deposit, setDeposit] = useState("150000");
  const [rate, setRate] = useState("7.1");
  const [years, setYears] = useState("15");

  const annualDeposit = Math.min(150000, Math.max(500, Number(deposit) || 0));
  const annualRate = Number(rate) || 0;
  const period = Number(years) || 0;
  const validPeriod = period < 15 ? 15 : period > 50 ? 50 : (period <= 15 ? 15 : 15 + Math.ceil((period - 15) / 5) * 5) > period ? 15 + Math.floor((period - 15) / 5) * 5 : period;

  const { rows, totalInvested, totalInterest, maturity } = useMemo(
    () => calcPPF(annualDeposit, annualRate, validPeriod),
    [annualDeposit, annualRate, validPeriod]
  );

  const taxSaved = Math.min(annualDeposit, 150000) * 0.312; // 31.2% highest slab + cess

  const periodOptions = useMemo(() => {
    const opts = [15];
    for (let y = 20; y <= 50; y += 5) opts.push(y);
    return opts;
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "PPF Calculator — Public Provident Fund Maturity Calculator",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/ppf",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏛️ PPF <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your Public Provident Fund maturity amount, interest earned, and tax savings under Section 80C.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Deposit (₹)</label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              min={500}
              max={150000}
              placeholder="₹500 – ₹1,50,000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">Min ₹500 · Max ₹1,50,000</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 7.1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">Current govt rate: 7.1%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period (Years)</label>
            <select
              value={validPeriod}
              onChange={(e) => setYears(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {periodOptions.map((y) => (
                <option key={y} value={y}>{y} years{y > 15 ? ` (${(y - 15) / 5} extension${(y - 15) / 5 > 1 ? "s" : ""})` : ""}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">15 years + 5-year blocks</p>
          </div>
        </div>
      </div>

      {/* Results */}
      {maturity > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">PPF Maturity Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Maturity Amount</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(maturity)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Invested</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalInvested)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalInterest)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xs text-gray-500">Estimated Annual Tax Savings (80C)</p>
                  <p className="text-lg font-bold text-green-700">{fmt(taxSaved)}</p>
                  <p className="text-xs text-gray-400">At highest slab (31.2%)</p>
                </div>
              </div>
              <DonutChart invested={totalInvested} interest={totalInterest} />
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
                      <th className="py-2 text-right">Opening</th>
                      <th className="py-2 text-right">Deposit</th>
                      <th className="py-2 text-right">Interest</th>
                      <th className="py-2 text-right">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.year}</td>
                        <td className="py-1.5 text-right">{fmt(row.opening)}</td>
                        <td className="py-1.5 text-right">{fmt(row.deposit)}</td>
                        <td className="py-1.5 text-right text-green-600">{fmt(row.interest)}</td>
                        <td className="py-1.5 text-right font-medium">{fmt(row.closing)}</td>
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
        <Link href="/calculator/fd" className="text-sm text-orange-600 hover:underline">→ FD Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is PPF?", "Public Provident Fund (PPF) is a government-backed long-term savings scheme with a 15-year lock-in period. It offers guaranteed, tax-free returns and is one of the safest investment options in India."],
          ["What is the current PPF interest rate?", "The current PPF interest rate is 7.1% per annum (as of FY 2024-25). The rate is set by the government and reviewed quarterly."],
          ["What are the tax benefits of PPF?", "PPF enjoys EEE (Exempt-Exempt-Exempt) tax status: your investment up to ₹1.5 lakh qualifies for deduction under Section 80C, the interest earned is tax-free, and the maturity amount is also tax-free."],
          ["Can I extend PPF beyond 15 years?", "Yes, you can extend your PPF account in blocks of 5 years after the initial 15-year maturity. You can choose to extend with or without contributions."],
          ["What is the minimum and maximum PPF deposit?", "The minimum annual deposit is ₹500 and the maximum is ₹1,50,000. Deposits can be made in lump sum or up to 12 instalments per year."],
          ["Can I withdraw from PPF before maturity?", "Partial withdrawals are allowed from the 7th year onwards (up to 50% of the balance at the end of the 4th preceding year). Premature closure is allowed after 5 years under specific conditions like serious illness or higher education."],
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

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function DonutChart({ deposited, interest }: { deposited: number; interest: number }) {
  const total = deposited + interest;
  if (total === 0) return null;
  const dPct = (deposited / total) * 100;
  const iPct = (interest / total) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dStroke = (dPct / 100) * circumference;
  const iStroke = (iPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#fdba74" strokeWidth="24"
          strokeDasharray={`${iStroke} ${circumference}`} strokeDashoffset={0} />
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ea580c" strokeWidth="24"
          strokeDasharray={`${dStroke} ${circumference}`} strokeDashoffset={-iStroke} />
      </svg>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Deposited ({dPct.toFixed(1)}%)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> Interest ({iPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

function calcSSY(annualDeposit: number, girlAge: number, rate: number) {
  const depositYears = 15;
  const maturityYear = 21 - girlAge;
  const rows: { year: number; deposit: number; interest: number; balance: number }[] = [];
  let balance = 0;
  for (let y = 1; y <= maturityYear; y++) {
    const deposit = y <= depositYears ? annualDeposit : 0;
    balance += deposit;
    const interest = balance * (rate / 100);
    balance += interest;
    rows.push({ year: y, deposit, interest: Math.round(interest), balance: Math.round(balance) });
  }
  const totalDeposited = annualDeposit * depositYears;
  const totalInterest = Math.round(balance) - totalDeposited;
  return { rows, totalDeposited, totalInterest, maturityAmount: Math.round(balance), maturityYear };
}

export default function SukanyaSamriddhiCalculator() {
  const [deposit, setDeposit] = useState("50000");
  const [age, setAge] = useState("1");
  const [rate, setRate] = useState("8.2");
  const [showAllRows, setShowAllRows] = useState(false);

  const annualDeposit = Math.min(150000, Math.max(0, Number(deposit) || 0));
  const girlAge = Math.min(10, Math.max(0, Number(age) || 0));
  const interestRate = Number(rate) || 8.2;

  const { rows, totalDeposited, totalInterest, maturityAmount, maturityYear } = useMemo(
    () => calcSSY(annualDeposit, girlAge, interestRate),
    [annualDeposit, girlAge, interestRate]
  );

  const visibleRows = showAllRows ? rows : rows.slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Sukanya Samriddhi Yojana Calculator — SSY Maturity Calculator",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/sukanya-samriddhi",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        👧 Sukanya Samriddhi <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your SSY maturity amount, total interest earned, and year-wise growth for your girl child&apos;s Sukanya Samriddhi Yojana account.
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
              min={250} max={150000}
              placeholder="₹250 – ₹1,50,000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">Min ₹250, Max ₹1,50,000/year</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Girl&apos;s Current Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={0} max={10}
              placeholder="0–10 years"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">Account can be opened for girls aged 0–10</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">Current govt. rate: 8.2%</p>
          </div>
        </div>
      </div>

      {/* Results */}
      {maturityAmount > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">SSY Maturity Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Maturity Amount (after {maturityYear} years)</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(maturityAmount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Deposited (15 years)</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalDeposited)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest Earned</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalInterest)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xs text-green-700 font-medium">🎯 Tax Benefits</p>
                  <p className="text-sm text-green-800 mt-1">Deposits qualify for <strong>Section 80C</strong> deduction (up to ₹1.5L/year). Interest + maturity are <strong>100% tax-free</strong> (EEE status).</p>
                </div>
              </div>
              <DonutChart deposited={totalDeposited} interest={totalInterest} />
            </div>
          </div>

          {/* Year-wise Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details open={false}>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Breakdown
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Year</th>
                      <th className="py-2 text-right">Deposit</th>
                      <th className="py-2 text-right">Interest</th>
                      <th className="py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.year}</td>
                        <td className="py-1.5 text-right">{row.deposit > 0 ? fmt(row.deposit) : "—"}</td>
                        <td className="py-1.5 text-right">{fmt(row.interest)}</td>
                        <td className="py-1.5 text-right font-medium">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <button
                  onClick={() => setShowAllRows((v) => !v)}
                  className="mt-3 text-sm text-orange-600 hover:underline font-medium"
                >
                  {showAllRows ? "Show Less ↑" : `Show All ${rows.length} Years ↓`}
                </button>
              )}
            </details>
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/salary" className="text-sm text-orange-600 hover:underline">→ Salary Calculator</Link>
        <Link href="/calculator/rent-receipt" className="text-sm text-orange-600 hover:underline">→ Rent Receipt Generator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is Sukanya Samriddhi Yojana?", "SSY is a government-backed savings scheme for the girl child, launched under Beti Bachao Beti Padhao. It offers one of the highest interest rates among small savings schemes and full tax exemption."],
          ["Who can open an SSY account?", "A parent or legal guardian can open an SSY account for a girl child below 10 years of age. Maximum 2 accounts are allowed (one per girl child)."],
          ["What is the minimum and maximum deposit?", "Minimum deposit is ₹250 per year and maximum is ₹1,50,000 per year. Deposits must be made for 15 years from account opening."],
          ["When does the SSY account mature?", "The account matures 21 years after opening. Partial withdrawal (up to 50%) is allowed after the girl turns 18 for education or marriage."],
          ["Is SSY tax-free?", "Yes, SSY enjoys EEE (Exempt-Exempt-Exempt) status. Deposits qualify for 80C deduction, interest earned is tax-free, and the maturity amount is also fully tax-free."],
          ["What is the current SSY interest rate?", "The current SSY interest rate is 8.2% per annum (Q1 FY 2025-26), compounded annually. The rate is reviewed quarterly by the government."],
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

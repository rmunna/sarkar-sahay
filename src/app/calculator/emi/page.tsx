"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PRESETS = [
  { label: "🏠 Home Loan", rate: 8.5, years: 20, amount: 5000000 },
  { label: "🚗 Car Loan", rate: 9, years: 5, amount: 800000 },
  { label: "💳 Personal Loan", rate: 12, years: 3, amount: 500000 },
  { label: "🎓 Education Loan", rate: 8, years: 7, amount: 1000000 },
];

function calcEMI(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalAmount: 0 };
  if (annualRate === 0) {
    const emi = principal / months;
    return { emi, totalInterest: 0, totalAmount: principal };
  }
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  const emi = (principal * r * pow) / (pow - 1);
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;
  return { emi, totalInterest, totalAmount };
}

function buildAmortization(principal: number, annualRate: number, months: number) {
  const rows: { month: number; emi: number; principalPart: number; interestPart: number; balance: number }[] = [];
  if (principal <= 0 || months <= 0) return rows;
  const r = annualRate === 0 ? 0 : annualRate / 12 / 100;
  const { emi } = calcEMI(principal, annualRate, months);
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interestPart = balance * r;
    const principalPart = emi - interestPart;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: i, emi, principalPart, interestPart, balance });
  }
  return rows;
}

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = (principal / total) * 100;
  const iPct = (interest / total) * 100;
  // SVG donut via stroke-dasharray
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const pStroke = (pPct / 100) * circumference;
  const iStroke = (iPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        {/* Interest slice */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#fdba74" strokeWidth="24"
          strokeDasharray={`${iStroke} ${circumference}`} strokeDashoffset={0} />
        {/* Principal slice */}
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

export default function EMICalculator() {
  const [amount, setAmount] = useState("5000000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">("years");
  const [showAllRows, setShowAllRows] = useState(false);

  const months = tenureUnit === "years" ? (Number(tenure) || 0) * 12 : Number(tenure) || 0;
  const principal = Number(amount) || 0;
  const annualRate = Number(rate) || 0;

  const { emi, totalInterest, totalAmount } = useMemo(
    () => calcEMI(principal, annualRate, months),
    [principal, annualRate, months]
  );

  const amortization = useMemo(
    () => buildAmortization(principal, annualRate, months),
    [principal, annualRate, months]
  );

  const visibleRows = showAllRows ? amortization : amortization.slice(0, 12);

  function applyPreset(p: typeof PRESETS[number]) {
    setAmount(String(p.amount));
    setRate(String(p.rate));
    setTenure(String(p.years));
    setTenureUnit("years");
    setShowAllRows(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "EMI Calculator India — Home, Car, Personal & Education Loans",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/emi",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏦 EMI <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your monthly EMI, total interest payable, and view a full amortization schedule for home loans, car loans, personal loans and education loans.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-sm border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000000"
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
              placeholder="e.g. 8.5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Tenure</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="e.g. 20"
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
        </div>
      </div>

      {/* Results */}
      {emi > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">EMI Breakdown</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Monthly EMI</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(emi)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalInterest)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalAmount)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">Principal</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(principal)}</p>
                </div>
              </div>
              <DonutChart principal={principal} interest={totalInterest} />
            </div>
          </div>

          {/* Amortization Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details open={false}>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Amortization Schedule
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Month</th>
                      <th className="py-2 text-right">EMI</th>
                      <th className="py-2 text-right">Principal</th>
                      <th className="py-2 text-right">Interest</th>
                      <th className="py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.month} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">{row.month}</td>
                        <td className="py-1.5 text-right">{fmt(row.emi)}</td>
                        <td className="py-1.5 text-right">{fmt(row.principalPart)}</td>
                        <td className="py-1.5 text-right">{fmt(row.interestPart)}</td>
                        <td className="py-1.5 text-right">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {amortization.length > 12 && (
                <button
                  onClick={() => setShowAllRows((v) => !v)}
                  className="mt-3 text-sm text-orange-600 hover:underline font-medium"
                >
                  {showAllRows ? `Show Less ↑` : `Show All ${amortization.length} Months ↓`}
                </button>
              )}
            </details>
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator/hra-exemption" className="text-sm text-orange-600 hover:underline">→ HRA Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is EMI?", "EMI (Equated Monthly Instalment) is a fixed amount you pay every month to repay your loan. It includes both principal repayment and interest."],
          ["How is EMI calculated?", "EMI = P × r × (1+r)^n / ((1+r)^n − 1), where P is the principal amount, r is the monthly interest rate, and n is the total number of monthly instalments."],
          ["Does a higher tenure reduce EMI?", "Yes, a longer tenure reduces your monthly EMI but increases the total interest you pay over the loan period. A shorter tenure means higher EMI but less total interest."],
          ["Can I prepay my loan to reduce EMI?", "Yes, most banks allow part-prepayment which reduces either your EMI amount or loan tenure. Home loans typically have no prepayment penalty for floating-rate loans."],
          ["What is the difference between flat rate and reducing balance?", "Flat rate charges interest on the original principal throughout. Reducing balance (used by most banks) charges interest on the outstanding balance, which decreases over time — making it cheaper overall."],
          ["How does interest rate affect my EMI?", "Even a 0.5% change in interest rate can significantly impact your total outgo, especially for long-tenure loans like home loans. Always compare rates from multiple lenders."],
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

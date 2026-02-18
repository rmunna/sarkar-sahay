"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const FOIR = 0.5; // 50% Fixed Obligations to Income Ratio

function maxLoan(monthlyIncome: number, existingEMI: number, rate: number, months: number) {
  const availableEMI = monthlyIncome * FOIR - existingEMI;
  if (availableEMI <= 0 || months <= 0) return { maxLoanAmount: 0, emi: 0, totalInterest: 0 };
  if (rate === 0) {
    return { maxLoanAmount: availableEMI * months, emi: availableEMI, totalInterest: 0 };
  }
  const r = rate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  const maxLoanAmount = availableEMI * (pow - 1) / (r * pow);
  const totalAmount = availableEMI * months;
  return { maxLoanAmount, emi: availableEMI, totalInterest: totalAmount - maxLoanAmount };
}

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = (principal / total) * 100;
  const iPct = (interest / total) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const pStroke = (pPct / 100) * circumference;
  const iStroke = (iPct / 100) * circumference;

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

export default function HomeLoanEligibilityCalculator() {
  const [income, setIncome] = useState("100000");
  const [existingEMI, setExistingEMI] = useState("10000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");

  const monthlyIncome = Number(income) || 0;
  const emiVal = Number(existingEMI) || 0;
  const annualRate = Number(rate) || 0;
  const years = Number(tenure) || 0;
  const months = years * 12;

  const result = useMemo(() => maxLoan(monthlyIncome, emiVal, annualRate, months), [monthlyIncome, emiVal, annualRate, months]);

  const tenureComparison = useMemo(() => {
    return [10, 15, 20, 25, 30].map((y) => {
      const r = maxLoan(monthlyIncome, emiVal, annualRate, y * 12);
      return { years: y, ...r };
    });
  }, [monthlyIncome, emiVal, annualRate]);

  const availableEMI = monthlyIncome * FOIR - emiVal;

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Home Loan Eligibility Calculator India",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/home-loan-eligibility",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏠 Home Loan <span className="text-orange-600">Eligibility Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Find out the maximum home loan amount you can get based on your income, existing obligations, and the 50% FOIR (Fixed Obligations to Income Ratio) rule used by most Indian banks.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="20000" max="1000000" step="5000" value={income}
              onChange={(e) => setIncome(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Existing EMIs (₹/month)</label>
            <input type="number" value={existingEMI} onChange={(e) => setExistingEMI(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="0" max="500000" step="1000" value={existingEMI}
              onChange={(e) => setExistingEMI(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="6" max="15" step="0.1" value={rate}
              onChange={(e) => setRate(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Tenure (Years)</label>
            <input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="5" max="30" step="1" value={tenure}
              onChange={(e) => setTenure(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
        </div>
      </div>

      {/* Results */}
      {result.maxLoanAmount > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Eligibility</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Maximum Loan Amount</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(result.maxLoanAmount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Available EMI Capacity</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(availableEMI)}/mo</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.totalInterest)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">FOIR Used</p>
                  <p className="text-lg font-bold text-gray-900">{((emiVal + availableEMI) / monthlyIncome * 100).toFixed(1)}%</p>
                </div>
              </div>
              <DonutChart principal={result.maxLoanAmount} interest={result.totalInterest} />
            </div>
          </div>

          {/* Tenure Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Eligibility by Tenure</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                    <th className="py-2 text-left">Tenure</th>
                    <th className="py-2 text-right">Max Loan</th>
                    <th className="py-2 text-right">EMI</th>
                    <th className="py-2 text-right">Total Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {tenureComparison.map((row) => (
                    <tr key={row.years} className={`border-b border-gray-100 ${row.years === years ? "bg-orange-50 font-semibold" : ""}`}>
                      <td className="py-1.5 text-gray-600">{row.years} years</td>
                      <td className="py-1.5 text-right">{fmt(row.maxLoanAmount)}</td>
                      <td className="py-1.5 text-right">{fmt(row.emi)}</td>
                      <td className="py-1.5 text-right">{fmt(row.totalInterest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {availableEMI <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-red-700 font-medium">Your existing EMIs exceed 50% of your income. You may not be eligible for a home loan. Consider reducing existing obligations first.</p>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is FOIR?", "FOIR (Fixed Obligations to Income Ratio) is the percentage of your monthly income that goes towards EMIs and other fixed obligations. Most banks cap this at 40-60%, with 50% being the most common threshold."],
          ["How do banks calculate home loan eligibility?", "Banks consider your monthly income, age, existing liabilities, credit score, employer profile, and property value. This calculator uses the income-based method with 50% FOIR."],
          ["Can I improve my eligibility?", "Yes — pay off existing loans, add a co-applicant's income, opt for a longer tenure, negotiate a lower interest rate, or increase your down payment."],
          ["Does salary structure affect eligibility?", "Yes. Banks typically consider only the fixed components (basic + DA + HRA) of your salary. Variable pay and bonuses are partially or fully excluded."],
          ["What is the maximum home loan tenure?", "Most banks offer up to 30 years. However, the loan must be repaid before you turn 60-65 (retirement age), so younger applicants get longer tenures."],
          ["Is this calculator accurate?", "This gives an estimate based on the FOIR rule. Actual eligibility depends on credit score, employer category, property value, and bank-specific policies."],
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

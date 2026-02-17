"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function EPFCalculator() {
  const [currentAge, setCurrentAge] = useState("30");
  const [basicSalary, setBasicSalary] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [employeePct, setEmployeePct] = useState("12");
  const [employerPct, setEmployerPct] = useState("3.67");
  const [increment, setIncrement] = useState("5");
  const [result, setResult] = useState<null | { corpus: number; pension: number; chart: { age: number; balance: number }[] }>(null);

  function calculate() {
    const age = Number(currentAge) || 30;
    let salary = Number(basicSalary) || 0;
    let balance = Number(currentBalance) || 0;
    const empPct = (Number(employeePct) || 12) / 100;
    const erPct = (Number(employerPct) || 3.67) / 100;
    const inc = (Number(increment) || 5) / 100;
    const rate = 8.25 / 100 / 12; // Monthly EPF interest rate (FY 2025-26: 8.25%)
    const retireAge = 58;
    const years = Math.max(0, retireAge - age);
    const chart: { age: number; balance: number }[] = [{ age, balance }];

    for (let y = 0; y < years; y++) {
      const monthlyContrib = salary * (empPct + erPct);
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + rate) + monthlyContrib;
      }
      salary = salary * (1 + inc);
      chart.push({ age: age + y + 1, balance: Math.round(balance) });
    }

    // Rough pension: 4% SWR
    const pension = Math.round(balance * 0.04 / 12);
    setResult({ corpus: Math.round(balance), pension, chart });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "EPF Retirement Calculator India", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/epf", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🏦 EPF Retirement <span className="text-orange-600">Calculator</span></h1>
      <p className="text-gray-600 mb-6">Project your Employee Provident Fund corpus at age 58 based on your current salary, contributions, and expected increments. Interest rate used: 8.25% p.a. (FY 2025-26).</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
            <input type="number" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (₹/month)</label>
            <input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="e.g. 40000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current EPF Balance (₹)</label>
            <input type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Increment (%)</label>
            <input type="number" value={increment} onChange={(e) => setIncrement(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Contribution (%)</label>
            <input type="number" value={employeePct} onChange={(e) => setEmployeePct(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employer EPF Contribution (%)</label>
            <p className="text-xs text-gray-400 mb-1">EPF share (3.67% of 12% goes to EPF)</p>
            <input type="number" value={employerPct} onChange={(e) => setEmployerPct(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <button onClick={calculate} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Calculate EPF Corpus</button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
              <p className="text-sm text-gray-500">Corpus at 58</p>
              <p className="text-2xl font-bold text-orange-700">{fmt(result.corpus)}</p>
            </div>
            <div className="rounded-lg p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-gray-500">Est. Monthly Pension (4% SWR)</p>
              <p className="text-2xl font-bold text-green-700">{fmt(result.pension)}</p>
            </div>
          </div>
          {/* Simple bar chart */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Growth Chart</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-40 min-w-fit">
              {result.chart.filter((_, i) => i % Math.max(1, Math.floor(result.chart.length / 20)) === 0 || i === result.chart.length - 1).map((d) => {
                const pct = (d.balance / result.corpus) * 100;
                return (
                  <div key={d.age} className="flex flex-col items-center gap-1" style={{ minWidth: 28 }}>
                    <div className="bg-orange-500 rounded-t w-5" style={{ height: `${Math.max(2, pct * 1.3)}px` }} title={fmt(d.balance)} />
                    <span className="text-[10px] text-gray-500">{d.age}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/gratuity" className="text-sm text-orange-600 hover:underline">→ Gratuity Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is the EPF interest rate for FY 2025-26?", "The EPFO declared 8.25% interest rate for FY 2024-25. We use the same rate for projection. Actual rate may vary."],
          ["How is employer contribution split?", "Employer contributes 12% of basic salary — 3.67% goes to EPF and 8.33% to EPS (Employee Pension Scheme, capped at ₹15,000 basic)."],
          ["Can I withdraw EPF before retirement?", "Partial withdrawal is allowed for specific purposes like home purchase, medical emergency, or education after certain years of service."],
          ["Is EPF interest taxable?", "EPF interest on contributions exceeding ₹2.5 lakh per year is taxable from FY 2021-22 onwards."],
          ["What happens to EPF when I change jobs?", "You can transfer your EPF balance to your new employer using UAN on the EPFO portal. The balance continues to earn interest."],
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

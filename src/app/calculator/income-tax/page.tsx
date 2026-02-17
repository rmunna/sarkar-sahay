"use client";

import { useState } from "react";
import Link from "next/link";

/* FY 2025-26 Tax Slabs */
const NEW_SLABS = [
  { upto: 400000, rate: 0 },
  { upto: 800000, rate: 5 },
  { upto: 1200000, rate: 10 },
  { upto: 1600000, rate: 15 },
  { upto: 2000000, rate: 20 },
  { upto: 2400000, rate: 25 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_BELOW60 = [
  { upto: 250000, rate: 0 },
  { upto: 500000, rate: 5 },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_60_80 = [
  { upto: 300000, rate: 0 },
  { upto: 500000, rate: 5 },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_80PLUS = [
  { upto: 500000, rate: 0 },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

function calcTax(income: number, slabs: { upto: number; rate: number }[]) {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upto) - prev;
    tax += taxable * (slab.rate / 100);
    prev = slab.upto;
  }
  return tax;
}

function addCess(tax: number) {
  return tax + tax * 0.04;
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function IncomeTaxCalculator() {
  const [income, setIncome] = useState("");
  const [age, setAge] = useState<"below60" | "60-80" | "80+">("below60");
  const [ded80C, setDed80C] = useState("");
  const [ded80D, setDed80D] = useState("");
  const [dedHRA, setDedHRA] = useState("");
  const [dedOther, setDedOther] = useState("");
  const [result, setResult] = useState<null | { oldTax: number; newTax: number; oldTaxable: number; newTaxable: number }>(null);

  function calculate() {
    const gross = Number(income) || 0;
    const totalDeductions = (Number(ded80C) || 0) + (Number(ded80D) || 0) + (Number(dedHRA) || 0) + (Number(dedOther) || 0);

    // Old regime
    const oldSlabs = age === "80+" ? OLD_SLABS_80PLUS : age === "60-80" ? OLD_SLABS_60_80 : OLD_SLABS_BELOW60;
    const oldTaxable = Math.max(0, gross - totalDeductions - 50000); // 50k std deduction
    let oldTax = calcTax(oldTaxable, oldSlabs);
    // Rebate 87A old: taxable <= 5L → rebate up to 12500
    if (oldTaxable <= 500000) oldTax = Math.max(0, oldTax - 12500);
    oldTax = addCess(oldTax);

    // New regime
    const newTaxable = Math.max(0, gross - 75000); // 75k std deduction
    let newTax = calcTax(newTaxable, NEW_SLABS);
    // Rebate 87A new: taxable <= 12L (marginal relief applicable) → rebate up to ₹60,000
    if (newTaxable <= 1200000) newTax = Math.max(0, newTax - 60000);
    newTax = addCess(newTax);

    setResult({ oldTax, newTax, oldTaxable, newTaxable });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Income Tax Calculator India FY 2025-26",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/income-tax",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        💰 Income Tax <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your income tax under both Old and New regime for FY 2025-26 (AY 2026-27). Compare and pick the best option.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Gross Income (₹)</label>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 1200000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select value={age} onChange={(e) => setAge(e.target.value as typeof age)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="below60">Below 60</option>
              <option value="60-80">60 – 80 (Senior)</option>
              <option value="80+">80+ (Super Senior)</option>
            </select>
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Deductions (Old Regime only)</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section 80C (max ₹1.5L)</label>
            <input type="number" value={ded80C} onChange={(e) => setDed80C(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section 80D (Health Insurance)</label>
            <input type="number" value={ded80D} onChange={(e) => setDed80D(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">HRA Exemption</label>
            <input type="number" value={dedHRA} onChange={(e) => setDedHRA(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Other Deductions (80E, 80G, etc.)</label>
            <input type="number" value={dedOther} onChange={(e) => setDedOther(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <button onClick={calculate} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">
          Calculate Tax
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tax Comparison</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 border-2 ${result.oldTax <= result.newTax ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <p className="text-sm text-gray-500">Old Regime</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.oldTax)}</p>
              <p className="text-xs text-gray-500">Taxable: {fmt(result.oldTaxable)}</p>
              {result.oldTax <= result.newTax && <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">✓ Better</span>}
            </div>
            <div className={`rounded-lg p-4 border-2 ${result.newTax < result.oldTax ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <p className="text-sm text-gray-500">New Regime</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.newTax)}</p>
              <p className="text-xs text-gray-500">Taxable: {fmt(result.newTaxable)}</p>
              {result.newTax < result.oldTax && <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">✓ Better</span>}
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            You save <strong className="text-orange-600">{fmt(Math.abs(result.oldTax - result.newTax))}</strong> by choosing the {result.oldTax <= result.newTax ? "Old" : "New"} Regime.
          </p>
        </div>
      )}

      {/* Tax Slabs Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Tax Slabs FY 2025-26</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-orange-600 mb-2">New Regime</h3>
            <table className="w-full text-sm">
              <tbody>
                {[["0 – 4L", "Nil"], ["4 – 8L", "5%"], ["8 – 12L", "10%"], ["12 – 16L", "15%"], ["16 – 20L", "20%"], ["20 – 24L", "25%"], ["Above 24L", "30%"]].map(([range, rate]) => (
                  <tr key={range} className="border-b border-gray-100"><td className="py-1 text-gray-600">{range}</td><td className="py-1 font-medium text-right">{rate}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-orange-600 mb-2">Old Regime (Below 60)</h3>
            <table className="w-full text-sm">
              <tbody>
                {[["0 – 2.5L", "Nil"], ["2.5 – 5L", "5%"], ["5 – 10L", "20%"], ["Above 10L", "30%"]].map(([range, rate]) => (
                  <tr key={range} className="border-b border-gray-100"><td className="py-1 text-gray-600">{range}</td><td className="py-1 font-medium text-right">{rate}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/hra-exemption" className="text-sm text-orange-600 hover:underline">→ HRA Calculator</Link>
        <Link href="/calculator/epf" className="text-sm text-orange-600 hover:underline">→ EPF Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Which tax regime is better for me?", "If your total deductions (80C, 80D, HRA, etc.) exceed ₹3-4 lakh, the Old Regime may save more. Otherwise, the New Regime with its lower slab rates and ₹75,000 standard deduction is usually better."],
          ["What is the standard deduction for FY 2025-26?", "₹75,000 under the New Regime and ₹50,000 under the Old Regime for salaried individuals."],
          ["Is the new regime the default?", "Yes, from FY 2023-24 onwards the New Regime is the default. You must opt-in to the Old Regime."],
          ["What is the rebate under Section 87A?", "Under the New Regime, if taxable income is up to ₹12 lakh, you get a rebate of up to ₹60,000. Under the Old Regime, up to ₹5 lakh income gets ₹12,500 rebate."],
          ["Does this calculator include surcharge?", "This calculator includes 4% Health & Education Cess. Surcharge applies for incomes above ₹50 lakh and is not included in this simplified calculator."],
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

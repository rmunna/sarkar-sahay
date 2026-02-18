"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PT_STATES: Record<string, number> = {
  "Maharashtra": 200,
  "Karnataka": 200,
  "West Bengal": 200,
  "Andhra Pradesh": 200,
  "Telangana": 200,
  "Tamil Nadu": 0,
  "Gujarat": 200,
  "Madhya Pradesh": 208,
  "Kerala": 208,
  "Odisha": 200,
  "Other / None": 200,
};

function calcOldRegimeTax(taxableIncome: number, hra: number, _basicAnnual: number) {
  // Old regime slabs FY 2025-26
  // 80C: 1.5L, standard deduction: 75K, HRA exemption simplified
  const deductions = 150000 + 75000 + hra * 0.4 * 12; // simplified 80C + std + partial HRA
  let income = Math.max(0, taxableIncome - deductions);
  let tax = 0;
  const slabs = [
    [250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3],
  ];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    const taxable = Math.min(income, limit as number) - prev;
    if (taxable > 0) tax += taxable * (rate as number);
    prev = limit as number;
    if (income <= limit) break;
  }
  // Rebate u/s 87A
  if (income <= 500000) tax = 0;
  const cess = tax * 0.04;
  return tax + cess;
}

function calcNewRegimeTax(taxableIncome: number) {
  // New regime FY 2025-26 with 75K standard deduction
  let income = Math.max(0, taxableIncome - 75000);
  let tax = 0;
  const slabs = [
    [400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15],
    [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3],
  ];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    const taxable = Math.min(income, limit as number) - prev;
    if (taxable > 0) tax += taxable * (rate as number);
    prev = limit as number;
    if (income <= limit) break;
  }
  // Rebate u/s 87A for new regime
  if (income <= 1200000) tax = 0;
  const cess = tax * 0.04;
  return tax + cess;
}

export default function SalaryCalculator() {
  const [ctc, setCTC] = useState("1200000");
  const [basicPct, setBasicPct] = useState("40");
  const [hraPct, setHraPct] = useState("50");
  const [pfEnabled, setPfEnabled] = useState(true);
  const [employerPf, setEmployerPf] = useState(true);
  const [ptState, setPtState] = useState("Maharashtra");
  const [regime, setRegime] = useState<"old" | "new">("new");

  const result = useMemo(() => {
    const ctcVal = Number(ctc) || 0;
    const bPct = (Number(basicPct) || 40) / 100;
    const hPct = (Number(hraPct) || 50) / 100;
    const ptMonth = PT_STATES[ptState] ?? 200;

    let gross = ctcVal;
    const basicAnnual = gross * bPct;
    const basicMonth = basicAnnual / 12;
    const hraAnnual = basicAnnual * hPct;
    const hraMonth = hraAnnual / 12;

    const employerPfAnnual = employerPf ? Math.min(basicAnnual * 0.12, 21600 * 12 / 12) : 0;
    // If employer PF is part of CTC, gross = CTC - employer PF
    const actualGross = employerPf ? ctcVal - employerPfAnnual : ctcVal;
    const recalcBasicAnnual = actualGross * bPct;
    const recalcHraAnnual = recalcBasicAnnual * hPct;
    const specialAllowanceAnnual = actualGross - recalcBasicAnnual - recalcHraAnnual;

    const empPfAnnual = pfEnabled ? recalcBasicAnnual * 0.12 : 0;
    const ptAnnual = ptMonth * 12;

    const taxableGross = actualGross;
    const oldTax = calcOldRegimeTax(taxableGross, recalcHraAnnual / 12, recalcBasicAnnual);
    const newTax = calcNewRegimeTax(taxableGross);
    const tax = regime === "old" ? oldTax : newTax;

    const totalDeductionsAnnual = empPfAnnual + ptAnnual + tax;
    const netAnnual = actualGross - totalDeductionsAnnual;
    const netMonthly = netAnnual / 12;

    return {
      ctcVal,
      grossAnnual: actualGross,
      grossMonthly: actualGross / 12,
      basicAnnual: recalcBasicAnnual,
      basicMonthly: recalcBasicAnnual / 12,
      hraAnnual: recalcHraAnnual,
      hraMonthly: recalcHraAnnual / 12,
      specialAnnual: specialAllowanceAnnual,
      specialMonthly: specialAllowanceAnnual / 12,
      empPfAnnual,
      empPfMonthly: empPfAnnual / 12,
      employerPfAnnual,
      employerPfMonthly: employerPfAnnual / 12,
      ptAnnual,
      ptMonthly: ptMonth,
      taxAnnual: tax,
      taxMonthly: tax / 12,
      oldTax,
      newTax,
      netAnnual,
      netMonthly,
    };
  }, [ctc, basicPct, hraPct, pfEnabled, employerPf, ptState, regime]);

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Salary Calculator — CTC to In-Hand Salary Calculator India",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/salary",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        💰 Salary <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Convert your CTC to in-hand salary with detailed breakdown of PF, professional tax, HRA, income tax deductions for FY 2025-26.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual CTC (₹)</label>
            <input type="number" value={ctc} onChange={(e) => setCTC(e.target.value)}
              placeholder="e.g. 1200000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary %</label>
            <input type="number" value={basicPct} onChange={(e) => setBasicPct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HRA (% of Basic)</label>
            <input type="number" value={hraPct} onChange={(e) => setHraPct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax State</label>
            <select value={ptState} onChange={(e) => setPtState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
              {Object.keys(PT_STATES).map((s) => (
                <option key={s} value={s}>{s} (₹{PT_STATES[s]}/mo)</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pfEnabled} onChange={(e) => setPfEnabled(e.target.checked)}
              className="accent-orange-600" />
            Employee PF (12% of Basic)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={employerPf} onChange={(e) => setEmployerPf(e.target.checked)}
              className="accent-orange-600" />
            Employer PF included in CTC
          </label>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setRegime("new")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${regime === "new" ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              New Regime
            </button>
            <button onClick={() => setRegime("old")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${regime === "old" ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              Old Regime
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result.ctcVal > 0 && (
        <>
          {/* Take-home highlight */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center mb-4">
              <p className="text-sm text-gray-500">Monthly In-Hand Salary</p>
              <p className="text-3xl font-bold text-orange-600">{fmt(result.netMonthly)}</p>
              <p className="text-xs text-gray-400 mt-1">Annual: {fmt(result.netAnnual)}</p>
            </div>

            {/* Salary Slip */}
            <h2 className="text-lg font-bold text-gray-900 mb-3">📄 Salary Slip Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                    <th className="py-2 text-left">Component</th>
                    <th className="py-2 text-right">Monthly</th>
                    <th className="py-2 text-right">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 font-medium text-green-700">
                    <td className="py-1.5">Gross Salary</td>
                    <td className="py-1.5 text-right">{fmt(result.grossMonthly)}</td>
                    <td className="py-1.5 text-right">{fmt(result.grossAnnual)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pl-4 text-gray-600">Basic Salary</td>
                    <td className="py-1.5 text-right">{fmt(result.basicMonthly)}</td>
                    <td className="py-1.5 text-right">{fmt(result.basicAnnual)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pl-4 text-gray-600">HRA</td>
                    <td className="py-1.5 text-right">{fmt(result.hraMonthly)}</td>
                    <td className="py-1.5 text-right">{fmt(result.hraAnnual)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pl-4 text-gray-600">Special Allowance</td>
                    <td className="py-1.5 text-right">{fmt(result.specialMonthly)}</td>
                    <td className="py-1.5 text-right">{fmt(result.specialAnnual)}</td>
                  </tr>
                  <tr className="border-b border-gray-200 h-2" />
                  <tr className="border-b border-gray-100 text-red-600">
                    <td className="py-1.5 font-medium">Deductions</td>
                    <td className="py-1.5 text-right">−{fmt(result.empPfMonthly + result.ptMonthly + result.taxMonthly)}</td>
                    <td className="py-1.5 text-right">−{fmt(result.empPfAnnual + result.ptAnnual + result.taxAnnual)}</td>
                  </tr>
                  {pfEnabled && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pl-4 text-gray-600">Employee PF</td>
                      <td className="py-1.5 text-right">−{fmt(result.empPfMonthly)}</td>
                      <td className="py-1.5 text-right">−{fmt(result.empPfAnnual)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pl-4 text-gray-600">Professional Tax</td>
                    <td className="py-1.5 text-right">−{fmt(result.ptMonthly)}</td>
                    <td className="py-1.5 text-right">−{fmt(result.ptAnnual)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pl-4 text-gray-600">Income Tax ({regime === "new" ? "New" : "Old"} Regime)</td>
                    <td className="py-1.5 text-right">−{fmt(result.taxMonthly)}</td>
                    <td className="py-1.5 text-right">−{fmt(result.taxAnnual)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-300 font-bold text-orange-600">
                    <td className="py-2">Net Take-Home</td>
                    <td className="py-2 text-right">{fmt(result.netMonthly)}</td>
                    <td className="py-2 text-right">{fmt(result.netAnnual)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {employerPf && (
              <p className="text-xs text-gray-400 mt-2">* Employer PF contribution: {fmt(result.employerPfMonthly)}/month ({fmt(result.employerPfAnnual)}/year) — deducted from CTC before gross.</p>
            )}
          </div>

          {/* Old vs New Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📊 Old vs New Regime Comparison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg border-2 p-4 text-center ${regime === "old" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                <p className="text-sm text-gray-500 font-medium">Old Regime Tax</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(result.oldTax)}</p>
                <p className="text-xs text-gray-400">per year</p>
              </div>
              <div className={`rounded-lg border-2 p-4 text-center ${regime === "new" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                <p className="text-sm text-gray-500 font-medium">New Regime Tax</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(result.newTax)}</p>
                <p className="text-xs text-gray-400">per year</p>
              </div>
            </div>
            <p className="text-sm text-center mt-3 text-gray-600">
              {result.oldTax < result.newTax
                ? "✅ Old regime saves you more — consider claiming deductions!"
                : result.newTax < result.oldTax
                ? "✅ New regime is better for you — simpler with lower tax!"
                : "Both regimes result in the same tax."}
            </p>
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/sukanya-samriddhi" className="text-sm text-orange-600 hover:underline">→ Sukanya Samriddhi Calculator</Link>
        <Link href="/calculator/rent-receipt" className="text-sm text-orange-600 hover:underline">→ Rent Receipt Generator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is CTC?", "CTC (Cost to Company) is the total amount a company spends on an employee per year, including basic salary, allowances, PF contribution, insurance, and other benefits."],
          ["What is the difference between CTC and in-hand salary?", "In-hand salary is what you actually receive after deducting PF, professional tax, and income tax from your gross salary. Employer PF and other benefits are part of CTC but not your take-home."],
          ["What is Professional Tax?", "Professional Tax is a state-level tax deducted from your salary. Most states charge ₹200/month (₹2,400/year). Some states like Tamil Nadu don't charge it."],
          ["Should I choose Old or New tax regime?", "New regime is simpler with lower rates but no deductions. Old regime allows 80C, HRA, and other deductions. If your deductions exceed ₹3-4 lakh, old regime may be better."],
          ["How is PF calculated?", "Employee PF is 12% of basic salary. Employer also contributes 12% (split into 8.33% EPS + 3.67% EPF). PF is typically calculated on basic salary up to ₹15,000/month for statutory compliance."],
          ["What is HRA and how does it help in tax saving?", "HRA (House Rent Allowance) is a salary component. Under the old regime, you can claim HRA exemption if you pay rent — calculated as the least of actual HRA, 50%/40% of basic, or rent minus 10% of basic."],
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

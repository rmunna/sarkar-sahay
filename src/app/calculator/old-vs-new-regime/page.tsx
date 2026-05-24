"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ---- Tax Slabs ----

// Old Regime slabs (below 60 years)
function calcOldRegimeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  // Slab: 0–2.5L = 0%, 2.5L–5L = 5%, 5L–10L = 20%, >10L = 30%
  const slabs = [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, slab.limit) - prev;
    tax += taxable * slab.rate;
    prev = slab.limit;
  }
  // Rebate u/s 87A: if taxable income ≤ 5L, tax = 0
  if (taxableIncome <= 500000) tax = 0;
  return tax;
}

// New Regime slabs (FY 2024-25, Budget 2024)
function calcNewRegimeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  // Slab: 0–3L = 0%, 3L–7L = 5%, 7L–10L = 10%, 10L–12L = 15%, 12L–15L = 20%, >15L = 30%
  const slabs = [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.10 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, slab.limit) - prev;
    tax += taxable * slab.rate;
    prev = slab.limit;
  }
  // Rebate u/s 87A: if taxable income ≤ 7L, tax = 0
  if (taxableIncome <= 700000) tax = 0;
  return tax;
}

function addSurchargeAndCess(tax: number, income: number): number {
  if (tax <= 0) return 0;
  let surcharge = 0;
  if (income > 50000000) surcharge = tax * 0.37;
  else if (income > 20000000) surcharge = tax * 0.25;
  else if (income > 10000000) surcharge = tax * 0.15;
  else if (income > 5000000) surcharge = tax * 0.10;
  const cess = (tax + surcharge) * 0.04;
  return Math.round(tax + surcharge + cess);
}

interface OldInputs {
  section80C: string;
  section80D: string;
  hraExemption: string;
  nps80CCD: string;
  homeLoanInterest: string;
  otherDeductions: string;
}

export default function OldVsNewTaxRegime() {
  const [grossSalary, setGrossSalary] = useState("1200000");
  const [otherIncome, setOtherIncome] = useState("0");
  const [oldInputs, setOldInputs] = useState<OldInputs>({
    section80C: "150000",
    section80D: "25000",
    hraExemption: "0",
    nps80CCD: "50000",
    homeLoanInterest: "0",
    otherDeductions: "0",
  });

  const gross = Number(grossSalary) || 0;
  const other = Number(otherIncome) || 0;
  const totalIncome = gross + other;

  const result = useMemo(() => {
    // === OLD REGIME ===
    const stdDeduction = Math.min(50000, gross); // standard deduction
    const c80 = Math.min(Number(oldInputs.section80C) || 0, 150000);
    const d80 = Math.min(Number(oldInputs.section80D) || 0, 100000);
    const hra = Number(oldInputs.hraExemption) || 0;
    const nps = Math.min(Number(oldInputs.nps80CCD) || 0, 50000);
    const homeLoan = Math.min(Number(oldInputs.homeLoanInterest) || 0, 200000);
    const otherDed = Number(oldInputs.otherDeductions) || 0;

    const totalOldDeductions = stdDeduction + c80 + d80 + hra + nps + homeLoan + otherDed;
    const oldTaxableIncome = Math.max(0, totalIncome - totalOldDeductions);
    const oldBaseTax = calcOldRegimeTax(oldTaxableIncome);
    const oldTotalTax = addSurchargeAndCess(oldBaseTax, oldTaxableIncome);
    const oldEffectiveRate = totalIncome > 0 ? (oldTotalTax / totalIncome) * 100 : 0;
    const oldInHand = totalIncome - oldTotalTax;

    // === NEW REGIME ===
    const newStdDeduction = Math.min(75000, gross); // ₹75K from Budget 2024
    const newTaxableIncome = Math.max(0, totalIncome - newStdDeduction);
    const newBaseTax = calcNewRegimeTax(newTaxableIncome);
    const newTotalTax = addSurchargeAndCess(newBaseTax, newTaxableIncome);
    const newEffectiveRate = totalIncome > 0 ? (newTotalTax / totalIncome) * 100 : 0;
    const newInHand = totalIncome - newTotalTax;

    const savings = oldTotalTax - newTotalTax;
    const betterRegime = savings > 0 ? "new" : savings < 0 ? "old" : "equal";

    return {
      old: { deductions: totalOldDeductions, taxableIncome: oldTaxableIncome, baseTax: oldBaseTax, totalTax: oldTotalTax, effectiveRate: oldEffectiveRate, inHand: oldInHand },
      new: { deductions: newStdDeduction, taxableIncome: newTaxableIncome, baseTax: newBaseTax, totalTax: newTotalTax, effectiveRate: newEffectiveRate, inHand: newInHand },
      savings: Math.abs(savings),
      betterRegime,
    };
  }, [gross, other, oldInputs, totalIncome]);

  function setOld(field: keyof OldInputs, val: string) {
    setOldInputs((prev) => ({ ...prev, [field]: val }));
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Old vs New Tax Regime Calculator India FY 2024-25",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/old-vs-new-regime",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        ⚖️ Old vs New <span className="text-orange-600">Tax Regime</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Compare income tax under the old and new tax regimes for FY 2024-25. Enter your income and deductions to find which regime saves more tax.
      </p>

      {/* Income inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">💰 Income Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Annual Salary (₹)</label>
            <input type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)}
              placeholder="e.g. 1200000" className={inputClass.replace("text-sm", "")} />
            <p className="text-xs text-gray-400 mt-1">Before any deductions</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Income (₹)</label>
            <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)}
              placeholder="e.g. 50000" className={inputClass.replace("text-sm", "")} />
            <p className="text-xs text-gray-400 mt-1">Interest, rent, freelance, etc.</p>
          </div>
        </div>
      </div>

      {/* Old regime deductions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">📋 Old Regime Deductions</h2>
        <p className="text-xs text-gray-500 mb-4">These deductions are <strong>not available</strong> in the new regime (except standard deduction)</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Section 80C — LIC, PF, ELSS, etc. (max ₹1.5L)</label>
            <input type="number" value={oldInputs.section80C} onChange={(e) => setOld("section80C", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Section 80D — Health Insurance Premium (max ₹25K/₹50K)</label>
            <input type="number" value={oldInputs.section80D} onChange={(e) => setOld("section80D", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>HRA Exemption (u/s 10(13A))</label>
            <input type="number" value={oldInputs.hraExemption} onChange={(e) => setOld("hraExemption", e.target.value)} className={inputClass} />
            <p className="text-xs text-gray-400 mt-0.5">Use HRA calculator to compute</p>
          </div>
          <div>
            <label className={labelClass}>80CCD(1B) — NPS Additional (max ₹50K)</label>
            <input type="number" value={oldInputs.nps80CCD} onChange={(e) => setOld("nps80CCD", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Home Loan Interest u/s 24(b) (max ₹2L)</label>
            <input type="number" value={oldInputs.homeLoanInterest} onChange={(e) => setOld("homeLoanInterest", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Other Deductions (80E, 80G, 80TTA, etc.)</label>
            <input type="number" value={oldInputs.otherDeductions} onChange={(e) => setOld("otherDeductions", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Results */}
      {totalIncome > 0 && (
        <>
          {/* Recommendation banner */}
          <div className={`rounded-xl p-5 mb-6 border-2 ${result.betterRegime === "new" ? "bg-green-50 border-green-400" : result.betterRegime === "old" ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-300"}`}>
            {result.betterRegime === "equal" ? (
              <p className="font-bold text-gray-700 text-lg">Both regimes result in equal tax</p>
            ) : (
              <>
                <p className="font-bold text-lg mb-1">
                  {result.betterRegime === "new" ? "✅ New Tax Regime is better" : "✅ Old Tax Regime is better"} for you
                </p>
                <p className="text-sm text-gray-700">
                  You save <strong>{fmt(result.savings)}</strong> per year by choosing the{" "}
                  <strong>{result.betterRegime === "new" ? "New" : "Old"} Regime</strong> = <strong>{fmt(result.savings / 12)}/month</strong>
                </p>
              </>
            )}
          </div>

          {/* Side-by-side comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Tax Comparison — FY 2024-25</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-2 text-left text-gray-500 font-medium">Details</th>
                    <th className="py-2 text-right font-bold text-blue-700 bg-blue-50 px-3 rounded-t-lg">Old Regime</th>
                    <th className="py-2 text-right font-bold text-green-700 bg-green-50 px-3 rounded-t-lg">New Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Gross Income", fmt(totalIncome), fmt(totalIncome)],
                    ["Standard Deduction", fmt(50000), fmt(75000)],
                    ["Other Deductions", fmt(result.old.deductions - 50000), "—"],
                    ["Total Deductions", fmt(result.old.deductions), fmt(result.new.deductions)],
                    ["Taxable Income", fmt(result.old.taxableIncome), fmt(result.new.taxableIncome)],
                    ["Income Tax", fmt(result.old.baseTax), fmt(result.new.baseTax)],
                    ["Tax + 4% Cess", fmt(result.old.totalTax), fmt(result.new.totalTax)],
                    ["Effective Rate", `${result.old.effectiveRate.toFixed(2)}%`, `${result.new.effectiveRate.toFixed(2)}%`],
                    ["In-Hand Income", fmt(result.old.inHand), fmt(result.new.inHand)],
                  ].map(([label, oldVal, newVal]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">{label}</td>
                      <td className={`py-2 text-right px-3 font-medium ${label === "Tax + 4% Cess" ? "text-blue-700 font-bold" : "text-gray-900"}`}>
                        {oldVal}
                      </td>
                      <td className={`py-2 text-right px-3 font-medium ${label === "Tax + 4% Cess" ? "text-green-700 font-bold" : "text-gray-900"}`}>
                        {newVal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slab-wise breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-base font-bold text-gray-900 select-none">
                📊 Tax Slab Comparison
              </summary>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {/* Old regime slabs */}
                <div>
                  <h3 className="text-sm font-bold text-blue-700 mb-2">Old Regime Slabs</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-400 border-b">
                      <th className="py-1 text-left">Income Slab</th>
                      <th className="py-1 text-right">Rate</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ["Up to ₹2.5 lakh", "0%"],
                        ["₹2.5L – ₹5L", "5%"],
                        ["₹5L – ₹10L", "20%"],
                        ["Above ₹10L", "30%"],
                      ].map(([slab, rate]) => (
                        <tr key={slab} className="border-b border-gray-50">
                          <td className="py-1 text-gray-700">{slab}</td>
                          <td className="py-1 text-right font-bold text-blue-700">{rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-1">87A rebate: 0 tax if taxable ≤ ₹5L</p>
                </div>
                {/* New regime slabs */}
                <div>
                  <h3 className="text-sm font-bold text-green-700 mb-2">New Regime Slabs (Budget 2024)</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-400 border-b">
                      <th className="py-1 text-left">Income Slab</th>
                      <th className="py-1 text-right">Rate</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ["Up to ₹3 lakh", "0%"],
                        ["₹3L – ₹7L", "5%"],
                        ["₹7L – ₹10L", "10%"],
                        ["₹10L – ₹12L", "15%"],
                        ["₹12L – ₹15L", "20%"],
                        ["Above ₹15L", "30%"],
                      ].map(([slab, rate]) => (
                        <tr key={slab} className="border-b border-gray-50">
                          <td className="py-1 text-gray-700">{slab}</td>
                          <td className="py-1 text-right font-bold text-green-700">{rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-1">87A rebate: 0 tax if taxable ≤ ₹7L</p>
                </div>
              </div>
            </details>
          </div>
        </>
      )}

      {/* Key differences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Old vs New Regime — Key Differences</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs text-gray-500 uppercase">
                <th className="py-2 text-left">Feature</th>
                <th className="py-2 text-center text-blue-700">Old Regime</th>
                <th className="py-2 text-center text-green-700">New Regime</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ["Standard Deduction", "₹50,000", "₹75,000 (Budget 2024)"],
                ["Section 80C (LIC, PF, ELSS)", "✅ Up to ₹1.5L", "❌ Not allowed"],
                ["Section 80D (Health Insurance)", "✅ Available", "❌ Not allowed"],
                ["HRA Exemption", "✅ Available", "❌ Not allowed"],
                ["NPS 80CCD(1B)", "✅ ₹50,000 extra", "❌ Not allowed"],
                ["Home Loan Interest 24(b)", "✅ Up to ₹2L", "❌ Not allowed"],
                ["Leave Travel Allowance", "✅ Exempt", "❌ Not allowed"],
                ["Rebate u/s 87A", "Up to ₹5L income", "Up to ₹7L income"],
                ["Default Regime", "Opt-in needed", "Default from FY24"],
                ["Best for", "High deductions (>₹3L)", "Low/no deductions"],
              ].map(([f, o, n]) => (
                <tr key={f} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700 font-medium">{f}</td>
                  <td className="py-2 text-center text-blue-800">{o}</td>
                  <td className="py-2 text-center text-green-800">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator/hra-exemption" className="text-sm text-orange-600 hover:underline">→ HRA Exemption Calculator</Link>
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Which tax regime is better for me?", "The new regime is generally better if your total deductions (80C + 80D + HRA + NPS + Home Loan interest) are less than ₹3–3.5 lakh. If your deductions exceed ₹3.5 lakh, the old regime usually results in lower tax. Use this calculator to find out for your specific situation."],
          ["Can I switch between old and new tax regime every year?", "Salaried employees (without business income) can switch between regimes every financial year at the time of filing ITR. However, if you have business income, you can switch from new to old regime only once in a lifetime."],
          ["What is the standard deduction in new regime for FY 2024-25?", "The standard deduction in the new tax regime is ₹75,000 for FY 2024-25 (increased from ₹50,000 in Budget 2024). In the old regime, the standard deduction remains ₹50,000."],
          ["Is NPS contribution deductible in new regime?", "Section 80CCD(1B) — the additional NPS deduction of ₹50,000 — is NOT available in the new regime. However, employer's contribution to NPS (Section 80CCD(2)) up to 10% of basic salary IS deductible in the new regime."],
          ["What is the rebate under Section 87A?", "Section 87A provides a tax rebate. In the old regime, if your taxable income is up to ₹5 lakh, you pay zero tax. In the new regime (FY 2024-25), if your taxable income is up to ₹7 lakh, you pay zero tax."],
          ["Is new regime default from FY 2023-24?", "Yes. From FY 2023-24, the new tax regime is the default. If you want to use the old regime, you must explicitly opt for it when filing ITR or by submitting Form 10IE before filing if you have business income."],
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

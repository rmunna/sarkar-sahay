"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── FY 2026-27 Tax Slabs (unchanged from FY 2025-26 per Budget 2026) ─── */

const NEW_SLABS = [
  { upto: 400000,  rate: 0  },
  { upto: 800000,  rate: 5  },
  { upto: 1200000, rate: 10 },
  { upto: 1600000, rate: 15 },
  { upto: 2000000, rate: 20 },
  { upto: 2400000, rate: 25 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_BELOW60 = [
  { upto: 250000,  rate: 0  },
  { upto: 500000,  rate: 5  },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_60_80 = [
  { upto: 300000,  rate: 0  },
  { upto: 500000,  rate: 5  },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

const OLD_SLABS_80PLUS = [
  { upto: 500000,  rate: 0  },
  { upto: 1000000, rate: 20 },
  { upto: Infinity, rate: 30 },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

interface Slab { upto: number; rate: number; }

function calcTaxWithBreakup(income: number, slabs: Slab[]) {
  let tax = 0;
  let prev = 0;
  const breakdown: { range: string; taxable: number; rate: number; tax: number }[] = [];
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upto) - prev;
    const slabTax  = taxable * (slab.rate / 100);
    tax += slabTax;
    if (taxable > 0) {
      const lo = prev === 0 ? "0" : fmt(prev);
      const hi = slab.upto === Infinity ? "above" : fmt(slab.upto);
      breakdown.push({ range: `${lo} – ${hi === "above" ? "above" : hi}`, taxable, rate: slab.rate, tax: slabTax });
    }
    prev = slab.upto;
  }
  return { tax, breakdown };
}

function applyMarginalRelief(tax: number, taxableIncome: number, zeroTaxLimit: number): number {
  // If income is within zero-tax limit — full rebate
  if (taxableIncome <= zeroTaxLimit) return 0;
  // If income is above zero-tax limit but tax > income above limit, cap it
  const incomeAboveLimit = taxableIncome - zeroTaxLimit;
  return Math.min(tax, incomeAboveLimit);
}

function addCess(tax: number): number { return tax + tax * 0.04; }

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const pct = (n: number, of: number) => of > 0 ? ((n / of) * 100).toFixed(1) + "%" : "0%";

/* ─── Result type ─────────────────────────────────────────────────────────── */

interface Result {
  oldTax: number;
  newTax: number;
  oldTaxable: number;
  newTaxable: number;
  oldRawTax: number;   // before cess
  newRawTax: number;   // before cess
  oldBreakdown: ReturnType<typeof calcTaxWithBreakup>["breakdown"];
  newBreakdown: ReturnType<typeof calcTaxWithBreakup>["breakdown"];
  gross: number;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function IncomeTaxCalculator() {
  const [income,    setIncome]    = useState("");
  const [age,       setAge]       = useState<"below60" | "60-80" | "80+">("below60");
  const [ded80C,    setDed80C]    = useState("");
  const [ded80D,    setDed80D]    = useState("");
  const [dedHRA,    setDedHRA]    = useState("");
  const [dedNPS,    setDedNPS]    = useState("");
  const [dedOther,  setDedOther]  = useState("");
  const [result,    setResult]    = useState<Result | null>(null);
  const [showBreak, setShowBreak] = useState(false);

  function calculate() {
    const gross = Number(income) || 0;

    // ── Old Regime ──────────────────────────────────────────────────────────
    const cap80C = Math.min(Number(ded80C) || 0, 150000);  // capped at ₹1.5L
    const cap80D = Number(ded80D)   || 0;
    const capHRA = Number(dedHRA)   || 0;
    const capNPS = Math.min(Number(dedNPS) || 0, 50000);   // 80CCD(1B) capped at ₹50K
    const capOther = Number(dedOther) || 0;

    const totalDeductions = cap80C + cap80D + capHRA + capNPS + capOther;
    const oldSlabs = age === "80+" ? OLD_SLABS_80PLUS : age === "60-80" ? OLD_SLABS_60_80 : OLD_SLABS_BELOW60;
    const oldTaxable = Math.max(0, gross - totalDeductions - 50000); // ₹50K std deduction

    const { tax: oldRawTax, breakdown: oldBreakdown } = calcTaxWithBreakup(oldTaxable, oldSlabs);
    const oldAfterRebate = applyMarginalRelief(
      oldRawTax <= 12500 ? Math.max(0, oldRawTax - 12500) : oldRawTax, // 87A old: rebate up to ₹12,500 for taxable ≤ ₹5L
      oldTaxable,
      500000
    );
    // Actually: for old regime, apply 87A first, then marginal relief
    let oldBeforeCess = oldRawTax;
    if (oldTaxable <= 500000) {
      // Full rebate (87A old) — then marginal relief keeps it zero
      oldBeforeCess = 0;
    } else {
      // Marginal relief: if income just above ₹5L, cap tax at income above ₹5L
      const marginalCapOld = oldTaxable - 500000;
      if (oldBeforeCess > marginalCapOld && oldRawTax - 12500 < oldBeforeCess) {
        oldBeforeCess = Math.min(oldBeforeCess, marginalCapOld);
      }
    }
    const oldTax = addCess(oldBeforeCess);

    // ── New Regime ──────────────────────────────────────────────────────────
    const newTaxable = Math.max(0, gross - 75000); // ₹75K std deduction
    const { tax: newRawTax, breakdown: newBreakdown } = calcTaxWithBreakup(newTaxable, NEW_SLABS);

    let newBeforeCess: number;
    if (newTaxable <= 1200000) {
      // 87A rebate — full zero tax for taxable ≤ ₹12L
      newBeforeCess = 0;
    } else {
      // Marginal relief: cap tax at income above ₹12L threshold
      const marginalCapNew = newTaxable - 1200000;
      newBeforeCess = Math.min(newRawTax, marginalCapNew);
    }
    const newTax = addCess(newBeforeCess);

    setResult({ oldTax, newTax, oldTaxable, newTaxable, oldRawTax, newRawTax, oldBreakdown, newBreakdown, gross });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Income Tax Calculator India FY 2026-27",
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
        Calculate your income tax under Old and New regime for{" "}
        <strong>FY 2026-27 (AY 2027-28)</strong>. Includes marginal relief & NPS deduction.
      </p>

      {/* ── Input form ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Gross Income (₹)</label>
            <input
              type="number" value={income} onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 1200000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select value={age} onChange={(e) => setAge(e.target.value as typeof age)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="below60">Below 60</option>
              <option value="60-80">60 – 80 (Senior Citizen)</option>
              <option value="80+">80+ (Super Senior Citizen)</option>
            </select>
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Deductions <span className="text-xs font-normal text-gray-500">(Old Regime only — ignored under New Regime)</span></p>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section 80C — PPF, ELSS, LIC… <span className="text-orange-600">(max ₹1.5L)</span></label>
            <input type="number" value={ded80C} onChange={(e) => setDed80C(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section 80D — Health Insurance</label>
            <input type="number" value={ded80D} onChange={(e) => setDed80D(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">HRA Exemption</label>
            <input type="number" value={dedHRA} onChange={(e) => setDedHRA(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section 80CCD(1B) — NPS <span className="text-orange-600">(max ₹50K)</span></label>
            <input type="number" value={dedNPS} onChange={(e) => setDedNPS(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Other Deductions (80E, 80G, 80TTA, etc.)</label>
            <input type="number" value={dedOther} onChange={(e) => setDedOther(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <button onClick={calculate}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">
          Calculate Tax
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tax Comparison — FY 2026-27</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Old regime card */}
            <div className={`rounded-lg p-4 border-2 ${result.oldTax <= result.newTax ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <p className="text-sm text-gray-500 mb-1">Old Regime</p>
              <p className="text-3xl font-bold text-gray-900">{fmt(result.oldTax)}</p>
              <p className="text-xs text-gray-400 mt-0.5">incl. 4% cess</p>
              <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                <p>Taxable income: <strong>{fmt(result.oldTaxable)}</strong></p>
                <p>Tax before cess: <strong>{fmt(result.oldRawTax)}</strong></p>
                <p>Effective rate: <strong>{pct(result.oldTax, result.gross)}</strong> of gross</p>
              </div>
              {result.oldTax <= result.newTax && (
                <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">✓ Better for you</span>
              )}
            </div>

            {/* New regime card */}
            <div className={`rounded-lg p-4 border-2 ${result.newTax < result.oldTax ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <p className="text-sm text-gray-500 mb-1">New Regime <span className="text-xs">(Default)</span></p>
              <p className="text-3xl font-bold text-gray-900">{fmt(result.newTax)}</p>
              <p className="text-xs text-gray-400 mt-0.5">incl. 4% cess</p>
              <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                <p>Taxable income: <strong>{fmt(result.newTaxable)}</strong></p>
                <p>Tax before cess: <strong>{fmt(result.newRawTax)}</strong></p>
                <p>Effective rate: <strong>{pct(result.newTax, result.gross)}</strong> of gross</p>
              </div>
              {result.newTax < result.oldTax && (
                <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">✓ Better for you</span>
              )}
            </div>
          </div>

          {result.oldTax !== result.newTax && (
            <p className="text-sm text-gray-700 mb-4">
              You save{" "}
              <strong className="text-orange-600">{fmt(Math.abs(result.oldTax - result.newTax))}</strong>{" "}
              per year by choosing the <strong>{result.oldTax <= result.newTax ? "Old" : "New"} Regime</strong>.
            </p>
          )}
          {result.oldTax === result.newTax && (
            <p className="text-sm text-gray-600 mb-4">Both regimes result in the same tax — go with whichever suits your financial goals.</p>
          )}

          {/* Tax breakdown toggle */}
          <button
            onClick={() => setShowBreak(!showBreak)}
            className="text-sm text-orange-600 hover:underline"
          >
            {showBreak ? "▲ Hide" : "▼ Show"} slab-by-slab breakdown
          </button>

          {showBreak && (
            <div className="mt-4 grid sm:grid-cols-2 gap-6">
              {/* Old regime breakdown */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Old Regime Breakdown</p>
                {result.oldBreakdown.length === 0
                  ? <p className="text-xs text-gray-400">Income below exemption limit</p>
                  : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 text-gray-400 font-normal">Range</th>
                          <th className="text-right py-1 text-gray-400 font-normal">Rate</th>
                          <th className="text-right py-1 text-gray-400 font-normal">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.oldBreakdown.map((r) => (
                          <tr key={r.range} className="border-b border-gray-50">
                            <td className="py-1 text-gray-600">{r.range}</td>
                            <td className="py-1 text-right text-gray-600">{r.rate}%</td>
                            <td className="py-1 text-right font-medium">{fmt(r.tax)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200">
                          <td colSpan={2} className="py-1 text-gray-600 font-semibold">Total (before cess)</td>
                          <td className="py-1 text-right font-bold">{fmt(result.oldRawTax)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
              </div>

              {/* New regime breakdown */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">New Regime Breakdown</p>
                {result.newBreakdown.length === 0
                  ? <p className="text-xs text-gray-400">Income below exemption limit</p>
                  : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 text-gray-400 font-normal">Range</th>
                          <th className="text-right py-1 text-gray-400 font-normal">Rate</th>
                          <th className="text-right py-1 text-gray-400 font-normal">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.newBreakdown.map((r) => (
                          <tr key={r.range} className="border-b border-gray-50">
                            <td className="py-1 text-gray-600">{r.range}</td>
                            <td className="py-1 text-right text-gray-600">{r.rate}%</td>
                            <td className="py-1 text-right font-medium">{fmt(r.tax)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200">
                          <td colSpan={2} className="py-1 text-gray-600 font-semibold">Total (before cess)</td>
                          <td className="py-1 text-right font-bold">{fmt(result.newRawTax)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                {result.newTaxable <= 1200000 && (
                  <p className="text-xs text-green-700 mt-2">✓ Section 87A rebate applied — zero tax (income ≤ ₹12L)</p>
                )}
                {result.newTaxable > 1200000 && result.newTaxable <= 1270588 && (
                  <p className="text-xs text-blue-700 mt-2">ℹ Marginal relief applied — tax capped at income above ₹12L</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Slab reference ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Tax Slabs FY 2026-27</h2>
        <p className="text-xs text-gray-500 mb-4">Same as FY 2025-26 — no changes in Union Budget 2026.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-orange-600 mb-2">New Regime <span className="font-normal text-gray-400">(Default)</span></h3>
            <table className="w-full text-sm">
              <thead>
                <tr><th className="text-left pb-1 text-xs text-gray-400 font-normal">Income</th><th className="text-right pb-1 text-xs text-gray-400 font-normal">Rate</th></tr>
              </thead>
              <tbody>
                {[["₹0 – ₹4L", "Nil"], ["₹4L – ₹8L", "5%"], ["₹8L – ₹12L", "10%"], ["₹12L – ₹16L", "15%"], ["₹16L – ₹20L", "20%"], ["₹20L – ₹24L", "25%"], ["Above ₹24L", "30%"]].map(([range, rate]) => (
                  <tr key={range} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-600">{range}</td>
                    <td className="py-1.5 font-medium text-right">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Std deduction ₹75,000 • 87A rebate up to ₹60,000 (zero tax ≤ ₹12L taxable)</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-orange-600 mb-2">Old Regime <span className="font-normal text-gray-400">(opt-in)</span></h3>
            <table className="w-full text-sm">
              <thead>
                <tr><th className="text-left pb-1 text-xs text-gray-400 font-normal">Income (Below 60)</th><th className="text-right pb-1 text-xs text-gray-400 font-normal">Rate</th></tr>
              </thead>
              <tbody>
                {[["₹0 – ₹2.5L", "Nil"], ["₹2.5L – ₹5L", "5%"], ["₹5L – ₹10L", "20%"], ["Above ₹10L", "30%"]].map(([range, rate]) => (
                  <tr key={range} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-600">{range}</td>
                    <td className="py-1.5 font-medium text-right">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Senior (60+): nil up to ₹3L • Super Senior (80+): nil up to ₹5L</p>
            <p className="text-xs text-gray-500 mt-1">Std deduction ₹50,000 • 87A rebate up to ₹12,500 (zero tax ≤ ₹5L taxable)</p>
          </div>
        </div>
      </div>

      {/* ── Cross-links ── */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/hra-exemption" className="text-sm text-orange-600 hover:underline">→ HRA Calculator</Link>
        <Link href="/calculator/epf" className="text-sm text-orange-600 hover:underline">→ EPF Calculator</Link>
        <Link href="/calculator/salary" className="text-sm text-orange-600 hover:underline">→ Salary Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* ── FAQ ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Which tax regime is better for FY 2026-27?", "If your total deductions (80C + 80D + HRA + NPS + others) exceed roughly ₹3.75 lakh, the Old Regime often saves more. For most salaried individuals with standard deductions only, the New Regime with its lower slabs is better. Use the calculator above to compare your exact numbers."],
          ["What is the standard deduction for FY 2026-27?", "₹75,000 under the New Regime and ₹50,000 under the Old Regime for salaried individuals and pensioners. The Budget 2026 made no changes to these."],
          ["Are there any tax changes in FY 2026-27?", "No. Budget 2026 did not change the income tax slabs, standard deduction, or rebate limits. The FY 2026-27 slabs are identical to FY 2025-26."],
          ["What is the rebate under Section 87A?", "Under the New Regime, taxable income up to ₹12 lakh gets a rebate of up to ₹60,000 — effectively zero tax. Under the Old Regime, up to ₹5 lakh taxable income gets ₹12,500 rebate. Marginal relief applies for incomes just above these limits."],
          ["What is marginal relief?", "If your income is slightly above ₹12 lakh (New Regime) or ₹5 lakh (Old Regime), your tax liability is capped at the amount by which your income exceeds that threshold — so you never pay more in tax than the extra income you earned. This calculator applies marginal relief automatically."],
          ["Can I claim NPS deduction?", "Yes — under the Old Regime, 80CCD(1B) allows an additional ₹50,000 NPS deduction on top of the ₹1.5L 80C limit. It is not available under the New Regime."],
          ["Does this calculator include surcharge?", "This calculator includes the 4% Health & Education Cess. Surcharge (10%–37%) applies for incomes above ₹50 lakh and is not included in this simplified calculator."],
          ["Is the new regime the default?", "Yes. From FY 2023-24 onwards the New Regime is the default for all taxpayers. You must explicitly opt-in to the Old Regime at the time of filing your ITR (or via your employer for TDS purposes)."],
        ].map(([q, a]) => (
          <details key={q as string} className="mb-3 group">
            <summary className="cursor-pointer font-medium text-gray-800 group-open:text-orange-600">{q}</summary>
            <p className="mt-1 text-sm text-gray-600 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

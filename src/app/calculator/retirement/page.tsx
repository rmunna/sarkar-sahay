"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        {segments.map((seg) => {
          const stroke = (seg.value / total) * circumference;
          const el = (
            <circle key={seg.label} cx="80" cy="80" r={radius} fill="none" stroke={seg.color} strokeWidth="24"
              strokeDasharray={`${stroke} ${circumference}`} strokeDashoffset={-offset} />
          );
          offset += stroke;
          return el;
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-sm justify-center">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label} ({((seg.value / total) * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState("30");
  const [retireAge, setRetireAge] = useState("60");
  const [monthlyExpense, setMonthlyExpense] = useState("50000");
  const [inflation, setInflation] = useState("6");
  const [returns, setReturns] = useState("10");
  const [existingSavings, setExistingSavings] = useState("500000");

  const age = Number(currentAge) || 0;
  const rAge = Number(retireAge) || 0;
  const expense = Number(monthlyExpense) || 0;
  const inflRate = Number(inflation) || 0;
  const retRate = Number(returns) || 0;
  const savings = Number(existingSavings) || 0;

  const yearsToRetire = Math.max(0, rAge - age);
  const yearsInRetirement = 25; // assume life expectancy 85

  const result = useMemo(() => {
    if (yearsToRetire <= 0 || expense <= 0) return null;

    // Monthly expense at retirement (inflation-adjusted)
    const annualExpenseNow = expense * 12;
    const annualExpenseAtRetire = annualExpenseNow * Math.pow(1 + inflRate / 100, yearsToRetire);

    // Corpus needed at retirement (present value of annuity with inflation during retirement)
    // Real rate during retirement
    const realRate = ((1 + retRate / 100) / (1 + inflRate / 100)) - 1;
    let corpus: number;
    if (realRate <= 0) {
      corpus = annualExpenseAtRetire * yearsInRetirement;
    } else {
      corpus = annualExpenseAtRetire * (1 - Math.pow(1 + realRate, -yearsInRetirement)) / realRate;
    }

    // Future value of existing savings
    const savingsFV = savings * Math.pow(1 + retRate / 100, yearsToRetire);
    const gap = Math.max(0, corpus - savingsFV);

    // Monthly SIP needed to fill gap
    const monthlyRate = retRate / 12 / 100;
    const totalMonths = yearsToRetire * 12;
    let monthlySIP: number;
    if (monthlyRate === 0) {
      monthlySIP = gap / totalMonths;
    } else {
      monthlySIP = gap * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // Projection table (yearly)
    const projection: { year: number; age: number; expense: number; savings: number }[] = [];
    let accumulated = savings;
    for (let y = 0; y <= yearsToRetire; y++) {
      const expAtYear = annualExpenseNow * Math.pow(1 + inflRate / 100, y);
      projection.push({ year: y, age: age + y, expense: expAtYear, savings: accumulated });
      accumulated = accumulated * (1 + retRate / 100) + monthlySIP * 12;
    }

    return {
      annualExpenseAtRetire,
      corpus,
      savingsFV,
      gap,
      monthlySIP,
      projection,
    };
  }, [age, yearsToRetire, expense, inflRate, retRate, savings, yearsInRetirement]);

  const SliderInput = ({ label, value, setValue, min, max, step, suffix }: {
    label: string; value: string; setValue: (v: string) => void;
    min: number; max: number; step: number; suffix?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => setValue(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(e.target.value)} className="w-full mt-1 accent-orange-600" />
      {suffix && <p className="text-xs text-gray-400 mt-0.5">{suffix}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Retirement Planning Calculator India",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/retirement",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🏖️ Retirement <span className="text-orange-600">Planning Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Plan your retirement with inflation-adjusted projections. Find out how much corpus you need and how much to save every month for a comfortable retirement.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <SliderInput label="Current Age" value={currentAge} setValue={setCurrentAge} min={18} max={65} step={1} />
          <SliderInput label="Retirement Age" value={retireAge} setValue={setRetireAge} min={40} max={70} step={1} />
          <SliderInput label="Monthly Expenses (₹)" value={monthlyExpense} setValue={setMonthlyExpense} min={10000} max={500000} step={5000} />
          <SliderInput label="Existing Savings (₹)" value={existingSavings} setValue={setExistingSavings} min={0} max={50000000} step={100000} />
          <SliderInput label="Expected Inflation (%)" value={inflation} setValue={setInflation} min={2} max={12} step={0.5} />
          <SliderInput label="Expected Returns (%)" value={returns} setValue={setReturns} min={4} max={18} step={0.5} />
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Retirement Plan Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Corpus Needed at {rAge}</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(result.corpus)}</p>
                </div>
                <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Monthly SIP Required</p>
                  <p className="text-3xl font-bold text-green-600">{fmt(result.monthlySIP)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Expense at Retirement (Annual)</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.annualExpenseAtRetire)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Gap After Existing Savings</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.gap)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">Existing Savings FV at {rAge}</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(result.savingsFV)}</p>
                </div>
              </div>
              <DonutChart segments={[
                { label: "Existing Savings (FV)", value: result.savingsFV, color: "#16a34a" },
                { label: "Gap to Fill", value: result.gap, color: "#ea580c" },
              ]} />
            </div>
          </div>

          {/* Projection Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📋 Year-wise Inflation-Adjusted Projection
              </summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Age</th>
                      <th className="py-2 text-right">Annual Expense</th>
                      <th className="py-2 text-right">Accumulated Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.projection.filter((_, i) => i % 5 === 0 || i === result.projection.length - 1).map((row) => (
                      <tr key={row.age} className={`border-b border-gray-100 ${row.age === rAge ? "bg-orange-50 font-semibold" : ""}`}>
                        <td className="py-1.5 text-gray-600">{row.age}</td>
                        <td className="py-1.5 text-right">{fmt(row.expense)}</td>
                        <td className="py-1.5 text-right">{fmt(row.savings)}</td>
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
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["How much corpus do I need for retirement?", "A common rule is 25-30x your annual expenses at retirement. This calculator uses a more precise annuity-based approach considering inflation and returns during retirement."],
          ["What inflation rate should I assume?", "India's long-term average inflation is 6-7%. Use 6% for conservative estimates. Healthcare inflation is higher (10-12%), so factor that in separately."],
          ["What returns can I expect?", "Equity mutual funds have historically returned 12-15% in India over 15+ years. A blended portfolio (equity + debt) might return 9-11%. Use a conservative estimate."],
          ["When should I start saving for retirement?", "As early as possible. Starting at 25 vs 35 can reduce your required monthly SIP by 50-60% due to compounding. Even small amounts early on make a huge difference."],
          ["Should I include EPF in existing savings?", "Yes, include your current EPF + PPF + NPS + mutual fund balances. These are all part of your retirement kitty."],
          ["What about pension income?", "If you expect pension (NPS annuity, government pension), you can reduce your monthly expense figure by that expected amount."],
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

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

function calcEMI(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalAmount: 0 };
  if (annualRate === 0) return { emi: principal / months, totalInterest: 0, totalAmount: principal };
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  const emi = (principal * r * pow) / (pow - 1);
  const totalAmount = emi * months;
  return { emi, totalInterest: totalAmount - principal, totalAmount };
}

export default function CarLoanCalculator() {
  const [carPrice, setCarPrice] = useState("1200000");
  const [downPayment, setDownPayment] = useState("240000");
  const [tenure, setTenure] = useState("5");
  const [rate, setRate] = useState("9");
  const [rtoPercent, setRtoPercent] = useState("10");
  const [insuranceAmt, setInsuranceAmt] = useState("40000");

  const price = Number(carPrice) || 0;
  const dp = Number(downPayment) || 0;
  const years = Number(tenure) || 0;
  const annualRate = Number(rate) || 0;
  const rtoPct = Number(rtoPercent) || 0;
  const insurance = Number(insuranceAmt) || 0;
  const months = years * 12;
  const loanAmount = Math.max(0, price - dp);

  const rtoCharges = price * rtoPct / 100;
  const onRoadPrice = price + rtoCharges + insurance;

  const { emi, totalInterest, totalAmount } = useMemo(
    () => calcEMI(loanAmount, annualRate, months),
    [loanAmount, annualRate, months]
  );

  const totalCostOfOwnership = dp + totalAmount + rtoCharges + insurance;

  // Depreciation schedule (15% per year)
  const depreciation = useMemo(() => {
    const rows: { year: number; value: number; loanOutstanding: number }[] = [];
    let value = onRoadPrice;
    let outstanding = loanAmount;
    const monthlyR = annualRate === 0 ? 0 : annualRate / 12 / 100;

    for (let y = 0; y <= Math.max(years, 10); y++) {
      rows.push({ year: y, value: Math.round(value), loanOutstanding: Math.round(Math.max(0, outstanding)) });
      value *= 0.85; // 15% depreciation
      // Reduce outstanding by 12 months of payments
      for (let m = 0; m < 12; m++) {
        if (outstanding <= 0) break;
        const interestPart = outstanding * monthlyR;
        const principalPart = emi - interestPart;
        outstanding = Math.max(0, outstanding - principalPart);
      }
    }
    return rows;
  }, [onRoadPrice, loanAmount, annualRate, emi, years]);

  // Break-even year
  const breakEvenYear = depreciation.find((r, i) => i > 0 && r.value <= r.loanOutstanding);

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Car Loan EMI & Cost of Ownership Calculator India",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/car-loan",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🚗 Car Loan & <span className="text-orange-600">Cost of Ownership Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate your car loan EMI, total interest, on-road price breakdown, depreciation schedule, and true cost of ownership. Understand when your car value equals loan outstanding.
      </p>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ex-Showroom Price (₹)</label>
            <input type="number" value={carPrice} onChange={(e) => setCarPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="200000" max="10000000" step="50000" value={carPrice}
              onChange={(e) => setCarPrice(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (₹)</label>
            <input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="0" max={carPrice} step="10000" value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Tenure (Years)</label>
            <input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="1" max="7" step="1" value={tenure}
              onChange={(e) => setTenure(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="6" max="18" step="0.1" value={rate}
              onChange={(e) => setRate(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RTO & Registration (%)</label>
            <input type="number" step="1" value={rtoPercent} onChange={(e) => setRtoPercent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="5" max="20" step="1" value={rtoPercent}
              onChange={(e) => setRtoPercent(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance (₹/year)</label>
            <input type="number" value={insuranceAmt} onChange={(e) => setInsuranceAmt(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="range" min="10000" max="200000" step="5000" value={insuranceAmt}
              onChange={(e) => setInsuranceAmt(e.target.value)} className="w-full mt-1 accent-orange-600" />
          </div>
        </div>
      </div>

      {/* On-Road Price Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🏷️ On-Road Price Breakdown</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-sm text-gray-600">Ex-Showroom Price</span>
              <span className="text-sm font-medium">{fmt(price)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-sm text-gray-600">RTO & Registration ({rtoPct}%)</span>
              <span className="text-sm font-medium">{fmt(rtoCharges)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-sm text-gray-600">Insurance (1st year)</span>
              <span className="text-sm font-medium">{fmt(insurance)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-orange-600">
              <span>On-Road Price</span>
              <span>{fmt(onRoadPrice)}</span>
            </div>
          </div>
          <DonutChart segments={[
            { label: "Ex-Showroom", value: price, color: "#ea580c" },
            { label: "RTO", value: rtoCharges, color: "#fdba74" },
            { label: "Insurance", value: insurance, color: "#16a34a" },
          ]} />
        </div>
      </div>

      {/* EMI Results */}
      {emi > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Loan & EMI Details</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Monthly EMI</p>
                  <p className="text-3xl font-bold text-orange-600">{fmt(emi)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Loan Amount</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(loanAmount)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalInterest)}</p>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-red-400 bg-red-50 p-3 text-center">
                  <p className="text-xs text-gray-500">Total Cost of Ownership</p>
                  <p className="text-xl font-bold text-red-600">{fmt(totalCostOfOwnership)}</p>
                </div>
              </div>
              <DonutChart segments={[
                { label: "Down Payment", value: dp, color: "#16a34a" },
                { label: "Principal", value: loanAmount, color: "#ea580c" },
                { label: "Interest", value: totalInterest, color: "#fdba74" },
                { label: "RTO + Insurance", value: rtoCharges + insurance, color: "#8b5cf6" },
              ]} />
            </div>
          </div>

          {/* Depreciation Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 select-none">
                📉 Depreciation vs Loan Outstanding
              </summary>
              {breakEvenYear && (
                <p className="text-sm text-red-600 mb-3 mt-2">
                  ⚠️ Warning: Car value drops below loan outstanding in Year {breakEvenYear.year} — you&apos;d be &quot;underwater&quot; on the loan.
                </p>
              )}
              {!breakEvenYear && (
                <p className="text-sm text-green-600 mb-3 mt-2">
                  ✅ Car value stays above loan outstanding throughout the tenure. Good financing structure!
                </p>
              )}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="py-2 text-left">Year</th>
                      <th className="py-2 text-right">Car Value</th>
                      <th className="py-2 text-right">Loan Outstanding</th>
                      <th className="py-2 text-right">Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depreciation.map((row) => {
                      const equity = row.value - row.loanOutstanding;
                      return (
                        <tr key={row.year} className={`border-b border-gray-100 ${equity < 0 ? "bg-red-50" : ""}`}>
                          <td className="py-1.5 text-gray-600">Year {row.year}</td>
                          <td className="py-1.5 text-right">{fmt(row.value)}</td>
                          <td className="py-1.5 text-right">{fmt(row.loanOutstanding)}</td>
                          <td className={`py-1.5 text-right font-medium ${equity < 0 ? "text-red-600" : "text-green-600"}`}>
                            {equity < 0 ? "-" : ""}{fmt(Math.abs(equity))}
                          </td>
                        </tr>
                      );
                    })}
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
        <Link href="/calculator/home-loan-eligibility" className="text-sm text-orange-600 hover:underline">→ Home Loan Eligibility</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["How much down payment should I make?", "Financial experts recommend at least 20% down payment. This reduces your EMI, total interest, and ensures you're not 'underwater' (owing more than the car is worth) from day one."],
          ["What is car depreciation rate in India?", "Cars typically depreciate 15-20% in the first year and 10-15% per year after that. After 5 years, a car is usually worth about 40-45% of its original on-road price."],
          ["Is a 7-year car loan a good idea?", "Longer tenures mean lower EMIs but significantly more interest. Also, you risk being underwater for most of the loan. 3-5 years is ideal for car loans."],
          ["What is included in on-road price?", "On-road price = ex-showroom price + RTO registration + road tax + insurance + other charges (handling, logistics, accessories). It's typically 10-15% more than ex-showroom."],
          ["Should I buy or lease a car?", "Buying makes sense if you drive a lot (>15,000 km/year) and keep cars for 5+ years. Leasing suits those who want a new car every 3 years without resale hassle."],
          ["Can I prepay a car loan?", "Yes, most banks allow prepayment after 6-12 months. Fixed-rate loans may have a 2-5% foreclosure charge. Floating-rate loans usually have no penalty."],
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

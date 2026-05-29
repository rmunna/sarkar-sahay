"use client";

import { useState } from "react";
import Link from "next/link";

// 7th CPC Pay Matrix Levels (Basic Pay starting cells)
const PAY_LEVELS = [
  { level: 1,  minPay: 18000,  label: "Level 1 — MTS, Peon, Constable",         group: "C" },
  { level: 2,  minPay: 19900,  label: "Level 2 — Chowkidar, LDC (some)",         group: "C" },
  { level: 3,  minPay: 21700,  label: "Level 3 — LDC, Havildar",                 group: "C" },
  { level: 4,  minPay: 25500,  label: "Level 4 — Clerk, Constable (CISF/CRPF)",   group: "C" },
  { level: 5,  minPay: 29200,  label: "Level 5 — JSA, Steno Grade D",            group: "C" },
  { level: 6,  minPay: 35400,  label: "Level 6 — ASO, Primary Teacher (PRT)",    group: "B" },
  { level: 7,  minPay: 44900,  label: "Level 7 — Section Officer, TGT",          group: "B" },
  { level: 8,  minPay: 47600,  label: "Level 8 — PGT, Asst Commandant",         group: "B" },
  { level: 9,  minPay: 53100,  label: "Level 9 — AAO, AEO",                     group: "B" },
  { level: 10, minPay: 56100,  label: "Level 10 — Gazetted Officer (Group A entry)", group: "A" },
  { level: 11, minPay: 67700,  label: "Level 11 — Dy SP, Asst Director",        group: "A" },
  { level: 12, minPay: 78800,  label: "Level 12 — Superintendent",              group: "A" },
  { level: 13, minPay: 123100, label: "Level 13 — Joint Director (Sr. Time Scale)", group: "A" },
  { level: 14, minPay: 144200, label: "Level 14 — Director",                    group: "A" },
];

// Current DA rate (updated periodically)
const CURRENT_DA_RATE = 55; // % — as of Jan 2026 (8th CPC transition ongoing)

const HRA_RATES: Record<string, number> = { X: 27, Y: 18, Z: 9 };
const TA_RATES: Record<string, number>  = { X: 7200, Y: 3600, Z: 1800 };

function fmt(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function SeventhPayCommissionPage() {
  const [levelIdx, setLevelIdx] = useState(5); // default Level 6
  const [increment, setIncrement] = useState<string>("0");
  const [cityClass, setCityClass] = useState<"X" | "Y" | "Z">("Y");
  const [daRate, setDaRate] = useState<string>(String(CURRENT_DA_RATE));

  const level = PAY_LEVELS[levelIdx];

  // Basic Pay after increments (each increment = 3% of current basic, compounded)
  const incrNum = Math.max(0, Math.min(parseInt(increment) || 0, 30));
  const basicPay = Math.round(level.minPay * Math.pow(1.03, incrNum) / 100) * 100;

  const da = Math.round((basicPay * (parseFloat(daRate) || 0)) / 100);
  const hra = Math.round((basicPay * HRA_RATES[cityClass]) / 100);
  const ta = TA_RATES[cityClass];
  const grossSalary = basicPay + da + hra + ta;

  // Standard deductions
  const nps = Math.round(basicPay * 0.10); // 10% of basic towards NPS (employee share)
  const cghs = 350; // nominal CGHS contribution (varies by level)
  const totalDeductions = nps + cghs;
  const inHandSalary = grossSalary - totalDeductions;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          {" / "}
          <Link href="/calculator" className="hover:text-orange-600">Calculators</Link>
          {" / "}
          <span className="text-gray-800 font-medium">7th Pay Commission</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">7th Pay Commission Salary Calculator</h1>
        <p className="text-gray-600 mb-8">
          Calculate your central government salary as per the 7th CPC Pay Matrix — including Basic Pay, DA, HRA, Transport Allowance, and in-hand salary.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="space-y-5">
            {/* Pay Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pay Level (7th CPC Pay Matrix)</label>
              <select
                value={levelIdx}
                onChange={(e) => setLevelIdx(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {PAY_LEVELS.map((l, i) => (
                  <option key={i} value={i}>
                    Level {l.level} — ₹{l.minPay.toLocaleString("en-IN")} ({l.group}) · {l.label.split("—")[1]?.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Increments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Annual Increments (years of service in this level)
              </label>
              <input
                type="number"
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
                min="0"
                max="30"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Each increment = +3% of basic pay, compounded annually</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* City Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City Category</label>
                <select
                  value={cityClass}
                  onChange={(e) => setCityClass(e.target.value as "X" | "Y" | "Z")}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="X">X — Delhi, Mumbai, Chennai, Kolkata, Hyderabad, Bengaluru (HRA 27%)</option>
                  <option value="Y">Y — State capitals + cities &gt;50L (HRA 18%)</option>
                  <option value="Z">Z — All other cities (HRA 9%)</option>
                </select>
              </div>
              {/* DA Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">DA Rate (%)</label>
                <input
                  type="number"
                  value={daRate}
                  onChange={(e) => setDaRate(e.target.value)}
                  min="0"
                  max="200"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1">Current: {CURRENT_DA_RATE}% (Jan 2026)</p>
              </div>
            </div>
          </div>

          {/* Result Breakdown */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-orange-200 flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm">Salary Breakdown</span>
              <span className="text-xs text-gray-400">{level.label.split("—")[0].trim()}</span>
            </div>
            <div className="divide-y divide-orange-100">
              {[
                { label: "Basic Pay", value: basicPay, note: `${incrNum} increment${incrNum !== 1 ? "s" : ""}` },
                { label: `Dearness Allowance (DA @ ${daRate}%)`, value: da },
                { label: `HRA (${HRA_RATES[cityClass]}% · City ${cityClass})`, value: hra },
                { label: `Transport Allowance (City ${cityClass})`, value: ta },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm text-gray-700">{row.label}</span>
                    {row.note && <span className="text-xs text-gray-400 ml-2">({row.note})</span>}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-orange-100">
                <span className="font-bold text-gray-900">Gross Salary</span>
                <span className="font-bold text-orange-700 text-lg">{fmt(grossSalary)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-sm text-gray-600">NPS (employee 10%)</span>
                <span className="text-sm text-red-500">− {fmt(nps)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-sm text-gray-600">CGHS premium (approx)</span>
                <span className="text-sm text-red-500">− {fmt(cghs)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 bg-green-50">
                <span className="font-bold text-gray-900">Approx. In-Hand Salary</span>
                <span className="font-bold text-green-700 text-xl">{fmt(inHandSalary)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            * Excludes income tax, professional tax, CGHS varies by grade. Actual salary may differ slightly.
          </p>
        </div>

        {/* Pay Matrix Summary Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">7th CPC Pay Matrix — All Levels</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 font-semibold text-gray-700">Level</th>
                  <th className="pb-2 font-semibold text-gray-700">Min Basic</th>
                  <th className="pb-2 font-semibold text-gray-700">Group</th>
                  <th className="pb-2 font-semibold text-gray-700">Common Posts</th>
                </tr>
              </thead>
              <tbody>
                {PAY_LEVELS.map((l) => (
                  <tr key={l.level} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 font-medium text-gray-900">{l.level}</td>
                    <td className="py-1.5 text-orange-600 font-semibold">₹{l.minPay.toLocaleString("en-IN")}</td>
                    <td className="py-1.5 text-gray-500">{l.group}</td>
                    <td className="py-1.5 text-gray-600 text-xs">{l.label.split("—")[1]?.trim()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">About 7th Pay Commission</h2>
          <p>
            The 7th Central Pay Commission (7th CPC) was implemented for central government employees from January 1, 2016. It revised salaries across all pay grades by replacing the old Grade Pay system with a new Pay Matrix of 18 levels.
          </p>
          <h3 className="text-base font-bold text-gray-900">Key Components of Your Salary</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Basic Pay:</strong> Determined by Pay Level and number of annual increments (3% per year)</li>
            <li><strong>DA (Dearness Allowance):</strong> Revised twice yearly (January and July). Currently {CURRENT_DA_RATE}% as of January 2026</li>
            <li><strong>HRA:</strong> 27% (X cities), 18% (Y cities), 9% (Z cities) of Basic Pay</li>
            <li><strong>Transport Allowance (TA):</strong> ₹7,200 (X), ₹3,600 (Y), ₹1,800 (Z) per month (+ DA on TA)</li>
            <li><strong>NPS:</strong> Employee contributes 10% of Basic + DA; government contributes 14%</li>
          </ul>
          <p className="text-xs text-gray-400">
            Note: The 8th Pay Commission has been announced for implementation from January 1, 2026. Salary structures may change once the 8th CPC report is accepted. This calculator reflects 7th CPC structure with current DA rates.
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const UNIVERSITY_SCALES: { label: string; scale: number; formula: string }[] = [
  { label: "CBSE 10-point (×9.5)", scale: 10, formula: "cbse" },
  { label: "Anna University (×10)", scale: 10, formula: "anna" },
  { label: "Mumbai University (×10)", scale: 10, formula: "mumbai" },
  { label: "VTU / Most Engineering (×10)", scale: 10, formula: "vtu" },
  { label: "Pune University (×9.5)", scale: 10, formula: "pune" },
  { label: "Custom scale", scale: 10, formula: "custom" },
];

function calcPercentage(cgpa: number, formula: string, customMultiplier: number): number {
  switch (formula) {
    case "cbse":   return cgpa * 9.5;
    case "anna":   return (cgpa / 10) * 100;
    case "mumbai": return (cgpa - 0.75) * 10;
    case "vtu":    return cgpa * 10;
    case "pune":   return cgpa * 9.5;
    case "custom": return cgpa * customMultiplier;
    default:       return cgpa * 9.5;
  }
}

function getGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: "Outstanding (O)", color: "text-green-700" };
  if (pct >= 75) return { label: "Distinction", color: "text-blue-700" };
  if (pct >= 60) return { label: "First Class", color: "text-indigo-700" };
  if (pct >= 50) return { label: "Second Class", color: "text-yellow-700" };
  if (pct >= 40) return { label: "Pass Class", color: "text-orange-700" };
  return { label: "Below Pass", color: "text-red-700" };
}

export default function CGPACalculatorPage() {
  const [cgpa, setCgpa] = useState<string>("");
  const [formulaIdx, setFormulaIdx] = useState(0);
  const [customMult, setCustomMult] = useState<string>("9.5");

  const cgpaNum = parseFloat(cgpa);
  const multNum = parseFloat(customMult) || 9.5;
  const formula = UNIVERSITY_SCALES[formulaIdx];
  const isCustom = formula.formula === "custom";

  const valid = !isNaN(cgpaNum) && cgpaNum > 0 && cgpaNum <= formula.scale;
  const pct = valid ? calcPercentage(cgpaNum, formula.formula, multNum) : null;
  const grade = pct !== null ? getGrade(pct) : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          {" / "}
          <Link href="/calculator" className="hover:text-orange-600">Calculators</Link>
          {" / "}
          <span className="text-gray-800 font-medium">CGPA to Percentage</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">CGPA to Percentage Calculator</h1>
        <p className="text-gray-600 mb-8">
          Convert your CGPA to percentage for job applications, higher studies, and university admissions. Supports CBSE, Anna University, VTU, Mumbai University, and custom scales.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="space-y-5">
            {/* University / Formula */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">University / Scale</label>
              <select
                value={formulaIdx}
                onChange={(e) => setFormulaIdx(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {UNIVERSITY_SCALES.map((s, i) => (
                  <option key={i} value={i}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Custom multiplier */}
            {isCustom && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Multiplier (Percentage = CGPA × ?)
                </label>
                <input
                  type="number"
                  value={customMult}
                  onChange={(e) => setCustomMult(e.target.value)}
                  step="0.1"
                  min="1"
                  max="20"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. 9.5"
                />
              </div>
            )}

            {/* CGPA Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Your CGPA (out of {formula.scale})
              </label>
              <input
                type="number"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                step="0.01"
                min="0"
                max={formula.scale}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={`Enter CGPA (0–${formula.scale})`}
              />
            </div>
          </div>

          {/* Result */}
          {pct !== null && grade && (
            <div className="mt-6 p-5 bg-orange-50 border border-orange-200 rounded-xl text-center">
              <p className="text-sm text-gray-500 mb-1">Your Percentage</p>
              <p className="text-5xl font-extrabold text-orange-600 mb-2">
                {pct.toFixed(2)}%
              </p>
              <p className={`text-base font-semibold ${grade.color}`}>{grade.label}</p>
            </div>
          )}

          {cgpa && !valid && (
            <p className="mt-4 text-sm text-red-500 text-center">
              Please enter a CGPA between 0 and {formula.scale}
            </p>
          )}
        </div>

        {/* Conversion Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            CGPA to Percentage — Quick Reference ({formula.label})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 font-semibold text-gray-700">CGPA</th>
                  <th className="pb-2 font-semibold text-gray-700">Percentage</th>
                  <th className="pb-2 font-semibold text-gray-700">Class</th>
                </tr>
              </thead>
              <tbody>
                {[9.5, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0].map((c) => {
                  const p = calcPercentage(c, formula.formula, multNum);
                  const g = getGrade(p);
                  return (
                    <tr key={c} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 font-medium text-gray-900">{c.toFixed(1)}</td>
                      <td className="py-2 text-orange-600 font-semibold">{p.toFixed(2)}%</td>
                      <td className={`py-2 text-xs ${g.color}`}>{g.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="prose prose-sm max-w-none text-gray-600 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">How to Convert CGPA to Percentage</h2>
          <p>
            Different universities use different formulas. The most common:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>CBSE:</strong> Percentage = CGPA × 9.5</li>
            <li><strong>Anna University:</strong> Percentage = (CGPA / 10) × 100 = CGPA × 10</li>
            <li><strong>VTU / Most Engineering Universities:</strong> Percentage = CGPA × 10</li>
            <li><strong>Mumbai University:</strong> Percentage = (CGPA − 0.75) × 10</li>
            <li><strong>Pune University:</strong> Percentage = CGPA × 9.5</li>
          </ul>
          <p>
            If your university uses a different formula, use the "Custom scale" option above and enter your multiplier as specified in your university's grading policy.
          </p>
          <h3 className="text-base font-bold text-gray-900 mt-4">Why Convert CGPA to Percentage?</h3>
          <p>
            Many government job applications (SSC, UPSC, PSC), private employers, and foreign universities ask for percentage rather than CGPA. Using the official formula from your university ensures accuracy in applications.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            * This calculator is for reference only. Always verify the conversion formula with your official university transcript or grading policy. Some universities include a specific conversion certificate that should be submitted with applications.
          </p>
        </div>
      </div>
    </main>
  );
}

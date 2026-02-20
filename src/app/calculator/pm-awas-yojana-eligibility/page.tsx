"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function PMAwasYojanaEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState("");
  const [ownsProperty, setOwnsProperty] = useState("");
  const [familyStatus, setFamilyStatus] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const incomeNum = Number(income);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (ownsProperty === "yes") {
      status = "not-eligible";
      reasons.push("You already own a pucca house — PMAY is for those without pucca housing.");
    }

    if (category === "EWS" && incomeNum <= 300000) {
      reasons.push("✅ EWS category: Annual income up to ₹3 lakh — eligible for up to ₹2.67 lakh subsidy.");
    } else if (category === "LIG" && incomeNum <= 600000) {
      reasons.push("✅ LIG category: Annual income ₹3-6 lakh — eligible for up to ₹2.67 lakh subsidy.");
    } else if (category === "MIG-I" && incomeNum <= 1200000) {
      reasons.push("✅ MIG-I category: Annual income ₹6-12 lakh — eligible for up to ₹2.35 lakh subsidy.");
    } else if (category === "MIG-II" && incomeNum <= 1800000) {
      reasons.push("✅ MIG-II category: Annual income ₹12-18 lakh — eligible for up to ₹2.30 lakh subsidy.");
    } else {
      if (status !== "not-eligible") status = "not-eligible";
      reasons.push("Your income does not match the selected category limit.");
    }

    if (familyStatus === "no") {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ PMAY prioritizes families where no adult male earning member exists (for EWS/LIG). You may still apply but priority may differ.");
    }

    if (status === "eligible" && ownsProperty !== "yes") {
      reasons.push("✅ You do not own a pucca house — basic eligibility met.");
    }

    setResult({ status, reasons });
  }

  function next() {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else calculate();
  }

  function prev() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  function reset() {
    setStep(1);
    setIncome("");
    setCategory("");
    setOwnsProperty("");
    setFamilyStatus("");
    setResult(null);
  }

  const canNext =
    (step === 1 && income !== "") ||
    (step === 2 && category !== "") ||
    (step === 3 && ownsProperty !== "") ||
    (step === 4 && familyStatus !== "");

  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PM Awas Yojana Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/pm-awas-yojana-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🏠 PM Awas Yojana <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you qualify for Pradhan Mantri Awas Yojana (PMAY) housing subsidy — up to ₹2.67 lakh interest subsidy on home loans.</p>

      {/* Scheme summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About PM Awas Yojana</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• Interest subsidy on home loans under Credit Linked Subsidy Scheme (CLSS)</li>
          <li>• 4 income categories: EWS (≤₹3L), LIG (₹3-6L), MIG-I (₹6-12L), MIG-II (₹12-18L)</li>
          <li>• Subsidy: ₹2.67 lakh (EWS/LIG), ₹2.35 lakh (MIG-I), ₹2.30 lakh (MIG-II)</li>
          <li>• Property must be in female family member&apos;s name (EWS/LIG)</li>
        </ul>
        <Link href="/guide/pm-awas-yojana-apply" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full PMAY guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is your annual household income?</h3>
              <input type="number" placeholder="e.g. 400000" value={income} onChange={(e) => setIncome(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Enter total annual household income in ₹</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: Select your income category</h3>
              <div className="space-y-2">
                {[
                  ["EWS", "EWS — Economically Weaker Section (up to ₹3 lakh/year)"],
                  ["LIG", "LIG — Low Income Group (₹3-6 lakh/year)"],
                  ["MIG-I", "MIG-I — Middle Income Group I (₹6-12 lakh/year)"],
                  ["MIG-II", "MIG-II — Middle Income Group II (₹12-18 lakh/year)"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${category === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="category" value={val} checked={category === val} onChange={(e) => setCategory(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Do you or any family member own a pucca house in India?</h3>
              <div className="space-y-2">
                {[["no", "No — We don't own a pucca house"], ["yes", "Yes — We already own a pucca house"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${ownsProperty === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="property" value={val} checked={ownsProperty === val} onChange={(e) => setOwnsProperty(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 4: Is the applicant the head of the family or a female family member?</h3>
              <div className="space-y-2">
                {[["yes", "Yes — Female member / head of family"], ["no", "No — Adult male earning member is applying"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${familyStatus === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="family" value={val} checked={familyStatus === val} onChange={(e) => setFamilyStatus(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={prev} disabled={step === 1} className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-30">← Back</button>
            <button onClick={next} disabled={!canNext} className="px-6 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-30 transition">
              {step === 4 ? "Check Eligibility" : "Next →"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className={`text-center p-6 rounded-xl mb-4 ${result.status === "eligible" ? "bg-green-50" : result.status === "may-be-eligible" ? "bg-yellow-50" : "bg-red-50"}`}>
            <p className={`text-3xl font-bold ${result.status === "eligible" ? "text-green-600" : result.status === "may-be-eligible" ? "text-yellow-600" : "text-red-500"}`}>
              {result.status === "eligible" ? "✅ LIKELY ELIGIBLE" : result.status === "may-be-eligible" ? "⚠️ MAY BE ELIGIBLE" : "❌ NOT ELIGIBLE"}
            </p>
            <p className="text-sm text-gray-600 mt-2">for PM Awas Yojana (PMAY)</p>
          </div>
          <div className="space-y-2 mb-4">
            {result.reasons.map((r, i) => (
              <p key={i} className="text-sm text-gray-700">{r}</p>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/pm-awas-yojana-apply" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/age-eligibility" className="text-sm text-orange-600 hover:underline">→ Age Eligibility Checker</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Who is eligible for PM Awas Yojana?", "Families without a pucca house in any part of India, falling under EWS (≤₹3L), LIG (₹3-6L), MIG-I (₹6-12L), or MIG-II (₹12-18L) income categories."],
          ["What is the subsidy amount under PMAY?", "EWS/LIG: up to ₹2.67 lakh, MIG-I: up to ₹2.35 lakh, MIG-II: up to ₹2.30 lakh as interest subsidy on home loan."],
          ["Can I apply if I already own a house?", "No. PMAY is for families who do not own a pucca house anywhere in India."],
          ["Is it mandatory for property to be in a woman's name?", "For EWS and LIG categories, the house must be in the name of a female member or jointly with a male member."],
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

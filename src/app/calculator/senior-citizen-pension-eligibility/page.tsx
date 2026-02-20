"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function SeniorCitizenPensionEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [bplStatus, setBplStatus] = useState("");
  const [existingPension, setExistingPension] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const ageNum = Number(age);
    const incomeNum = Number(income);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (ageNum < 60) {
      status = "not-eligible";
      reasons.push(`❌ Age ${ageNum} — must be 60 years or above for old age pension schemes.`);
    } else if (ageNum >= 80) {
      reasons.push(`✅ Age ${ageNum} — eligible for higher pension as super senior citizen (80+). IGNOAPS: ₹500/month (vs ₹200 for 60-79).`);
    } else {
      reasons.push(`✅ Age ${ageNum} — eligible for senior citizen pension schemes.`);
    }

    if (bplStatus === "yes") {
      reasons.push("✅ BPL status — priority for IGNOAPS (Indira Gandhi National Old Age Pension Scheme) and state pensions.");
    } else {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ Not BPL — IGNOAPS requires BPL status. However, many state pension schemes cover non-BPL senior citizens too.");
    }

    if (incomeNum > 0) {
      if (incomeNum <= 100000) {
        reasons.push("✅ Low income — qualifies for most senior citizen pension schemes.");
      } else if (incomeNum <= 300000) {
        reasons.push("ℹ️ Moderate income — eligible for some state pension schemes. Central IGNOAPS requires BPL status.");
      } else {
        if (status === "eligible") status = "may-be-eligible";
        reasons.push("⚠️ Higher income may limit eligibility for some pension schemes. State schemes have varying income limits.");
      }
    }

    if (existingPension === "govt") {
      status = "not-eligible";
      reasons.push("❌ Already receiving government pension — IGNOAPS excludes those with existing government pension.");
    } else if (existingPension === "other") {
      reasons.push("ℹ️ Receiving non-government pension — you may still be eligible for state old age pension schemes.");
    } else {
      reasons.push("✅ No existing pension — eligible for social security pension schemes.");
    }

    if (status === "eligible") {
      reasons.push("🎯 Central pension (IGNOAPS): ₹200-500/month + state top-up. Many states add ₹500-3,000/month extra.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 4) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setAge(""); setIncome(""); setBplStatus(""); setExistingPension(""); setResult(null); }

  const canNext = (step === 1 && age !== "") || (step === 2 && income !== "") || (step === 3 && bplStatus !== "") || (step === 4 && existingPension !== "");
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Senior Citizen Pension Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/senior-citizen-pension-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🧓 Senior Citizen Pension <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check eligibility for old age pension schemes — IGNOAPS, state pensions, and social security benefits for senior citizens.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About Senior Citizen Pension Schemes</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• IGNOAPS (Central): ₹200/month (60-79 yrs), ₹500/month (80+ yrs) for BPL</li>
          <li>• State top-ups: ₹500-3,000/month additional (varies by state)</li>
          <li>• Some states: UP ₹1,000/month, Delhi ₹2,500/month, Rajasthan ₹1,000/month</li>
          <li>• Also check: Senior Citizen Savings Scheme (SCSS) for 60+ with higher returns</li>
        </ul>
        <Link href="/guide/senior-citizen-savings-scheme" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read Senior Citizen Savings guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is the applicant&apos;s age?</h3>
              <input type="number" min="1" max="120" placeholder="e.g. 65" value={age} onChange={(e) => setAge(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Must be 60+ for most pension schemes. 80+ gets higher benefits.</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: What is the annual family income?</h3>
              <input type="number" placeholder="e.g. 50000" value={income} onChange={(e) => setIncome(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Total annual family income in ₹</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Do you have a BPL (Below Poverty Line) card?</h3>
              <div className="space-y-2">
                {[["yes", "Yes — BPL card holder"], ["no", "No — Not a BPL card holder"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${bplStatus === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="bpl" value={val} checked={bplStatus === val} onChange={(e) => setBplStatus(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 4: Are you receiving any existing pension?</h3>
              <div className="space-y-2">
                {[["none", "No — Not receiving any pension"], ["govt", "Yes — Government pension (central/state)"], ["other", "Yes — Private/other pension"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${existingPension === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="pension" value={val} checked={existingPension === val} onChange={(e) => setExistingPension(e.target.value)} className="accent-orange-600" />
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
            <p className="text-sm text-gray-600 mt-2">for Senior Citizen Pension Schemes</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/senior-citizen-savings-scheme" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["What is the pension amount under IGNOAPS?", "₹200/month for 60-79 years, ₹500/month for 80+ years. States add their own top-up — Delhi gives ₹2,500, UP gives ₹1,000."],
          ["Can I get both central and state pension?", "State pensions usually include the IGNOAPS component. The total amount you receive = central + state top-up."],
          ["What documents are needed to apply?", "Age proof (Aadhaar, voter ID), BPL card/ration card, bank passbook, passport photo, and income certificate."],
          ["How to apply for old age pension?", "Apply through your state's social welfare department, district office, or online portal. In UP: sspy-up.gov.in, Delhi: edistrict.delhigovt.nic.in."],
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

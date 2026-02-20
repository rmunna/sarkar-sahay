"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function PMKisanEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [ownsLand, setOwnsLand] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [isInstitutional, setIsInstitutional] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (ownsLand === "no") {
      status = "not-eligible";
      reasons.push("❌ PM-KISAN is for families with cultivable land holding. Landless farmers are not covered.");
    } else {
      reasons.push("✅ You own cultivable land — basic eligibility met.");
    }

    if (incomeSource === "farming") {
      reasons.push("✅ Primary income from farming — this scheme is meant for farmer families.");
    } else if (incomeSource === "mixed") {
      reasons.push("ℹ️ Mixed income — you may still qualify if the family holds cultivable land.");
    } else {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ Non-farming income source — eligibility depends on land ownership records.");
    }

    if (isInstitutional === "yes") {
      status = "not-eligible";
      reasons.push("❌ Institutional land holders (trusts, companies, etc.) are excluded from PM-KISAN.");
    } else {
      reasons.push("✅ Not an institutional land holder.");
    }

    if (exclusion === "govt") {
      status = "not-eligible";
      reasons.push("❌ Former/present government employees, MPs, MLAs, Ministers, and constitutional post holders are excluded.");
    } else if (exclusion === "tax") {
      status = "not-eligible";
      reasons.push("❌ Income tax payers (in last assessment year) are excluded from PM-KISAN.");
    } else if (exclusion === "pension") {
      status = "not-eligible";
      reasons.push("❌ Persons receiving pension ≥ ₹10,000/month (excluding MTS/Class IV) are excluded.");
    } else if (exclusion === "professional") {
      status = "not-eligible";
      reasons.push("❌ Professionals (doctors, engineers, lawyers, CAs) registered with professional bodies are excluded.");
    } else {
      reasons.push("✅ No exclusion criteria apply.");
    }

    if (status === "eligible") {
      reasons.push("🎯 You can receive ₹6,000/year (₹2,000 × 3 instalments) directly in your bank account.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 4) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setOwnsLand(""); setIncomeSource(""); setIsInstitutional(""); setExclusion(""); setResult(null); }

  const canNext = (step === 1 && ownsLand !== "") || (step === 2 && incomeSource !== "") || (step === 3 && isInstitutional !== "") || (step === 4 && exclusion !== "");
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PM Kisan Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/pm-kisan-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🌾 PM Kisan <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you qualify for PM-KISAN — ₹6,000 per year direct income support for farmer families.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About PM Kisan Samman Nidhi</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• ₹6,000/year in 3 equal instalments of ₹2,000 each</li>
          <li>• Direct bank transfer (DBT) — money goes straight to your account</li>
          <li>• All landholding farmer families eligible (no land size limit since 2019)</li>
          <li>• Over 11 crore farmers benefit from this scheme</li>
        </ul>
        <Link href="/guide/pm-kisan-samman-nidhi" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full PM-KISAN guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: Do you or your family own cultivable agricultural land?</h3>
              <div className="space-y-2">
                {[["yes", "Yes — We own cultivable land"], ["no", "No — We don't own any agricultural land"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${ownsLand === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="land" value={val} checked={ownsLand === val} onChange={(e) => setOwnsLand(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: What is your primary income source?</h3>
              <div className="space-y-2">
                {[["farming", "Farming / Agriculture"], ["mixed", "Mixed — Farming + other sources"], ["non-farming", "Non-farming (service, business, etc.)"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${incomeSource === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="income" value={val} checked={incomeSource === val} onChange={(e) => setIncomeSource(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Is the land held by an institution (trust, company, etc.)?</h3>
              <div className="space-y-2">
                {[["no", "No — Land is in individual/family name"], ["yes", "Yes — Institutional land holding"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${isInstitutional === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="institutional" value={val} checked={isInstitutional === val} onChange={(e) => setIsInstitutional(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 4: Do any of these exclusions apply to you?</h3>
              <div className="space-y-2">
                {[
                  ["none", "None of the below apply to me"],
                  ["govt", "Current/former govt employee, MP, MLA, Minister"],
                  ["tax", "Income tax payer (filed ITR in last assessment year)"],
                  ["pension", "Receiving pension ≥ ₹10,000/month"],
                  ["professional", "Registered professional (doctor, lawyer, CA, engineer)"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${exclusion === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="exclusion" value={val} checked={exclusion === val} onChange={(e) => setExclusion(e.target.value)} className="accent-orange-600" />
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
            <p className="text-sm text-gray-600 mt-2">for PM Kisan Samman Nidhi</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/pm-kisan-samman-nidhi" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["Is there a land size limit for PM-KISAN?", "No. Since February 2019, all landholding farmer families are eligible regardless of land size. Earlier, only small/marginal farmers (up to 2 hectares) were covered."],
          ["Can government employees get PM-KISAN?", "No. Current and former government employees (except MTS/Class IV), MPs, MLAs, and Ministers are excluded."],
          ["How do I register for PM-KISAN?", "Register at pmkisan.gov.in or through your local Common Service Centre (CSC). You need Aadhaar, bank account, and land records."],
          ["When are PM-KISAN instalments paid?", "Three instalments per year: April-July (₹2,000), August-November (₹2,000), December-March (₹2,000)."],
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

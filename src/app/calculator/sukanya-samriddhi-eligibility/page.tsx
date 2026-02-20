"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function SukanyaSamriddhiEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [childAge, setChildAge] = useState("");
  const [guardianStatus, setGuardianStatus] = useState("");
  const [existingAccounts, setExistingAccounts] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const ageNum = Number(childAge);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (ageNum > 10) {
      status = "not-eligible";
      reasons.push(`❌ Girl child must be below 10 years of age at account opening. Age entered: ${ageNum} years.`);
    } else {
      reasons.push(`✅ Girl child age ${ageNum} — eligible (must be under 10).`);
      reasons.push(`ℹ️ Account matures 21 years from opening. Partial withdrawal allowed after age 18 for higher education/marriage.`);
    }

    if (guardianStatus === "none") {
      status = "not-eligible";
      reasons.push("❌ Account must be opened by natural or legal guardian (parent/court-appointed guardian).");
    } else {
      reasons.push("✅ Guardian status confirmed — natural/legal guardian can open the account.");
    }

    if (existingAccounts === "2plus") {
      status = "not-eligible";
      reasons.push("❌ Maximum 2 SSY accounts per family (one per girl child, max 2 girls). Exception: twins/triplets as 2nd birth.");
    } else if (existingAccounts === "1") {
      reasons.push("✅ One existing account — you can open one more (max 2 per family).");
    } else {
      reasons.push("✅ No existing SSY accounts — you can open up to 2 (one per girl child).");
    }

    if (status === "eligible") {
      reasons.push("🎯 Current interest rate: 8.2% p.a. (Q1 FY 2025-26). Min deposit: ₹250/year, Max: ₹1.5 lakh/year. Tax-free under Section 80C.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 3) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setChildAge(""); setGuardianStatus(""); setExistingAccounts(""); setResult(null); }

  const canNext = (step === 1 && childAge !== "") || (step === 2 && guardianStatus !== "") || (step === 3 && existingAccounts !== "");
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Sukanya Samriddhi Yojana Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/sukanya-samriddhi-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">👧 Sukanya Samriddhi <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you can open a Sukanya Samriddhi Yojana (SSY) account for your girl child — 8.2% interest, tax-free returns.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About Sukanya Samriddhi Yojana</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• Interest rate: 8.2% p.a. (highest among small savings schemes)</li>
          <li>• For girl child aged 0-10 years at account opening</li>
          <li>• Min ₹250/year, Max ₹1.5 lakh/year deposit</li>
          <li>• Deposit for 15 years, maturity at 21 years from opening</li>
          <li>• EEE tax benefit — exempt at deposit, interest, and maturity</li>
        </ul>
        <Link href="/guide/sukanya-samriddhi-yojana" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full SSY guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is the girl child&apos;s current age?</h3>
              <input type="number" min="0" max="18" placeholder="e.g. 5" value={childAge} onChange={(e) => setChildAge(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Child must be below 10 years at account opening</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: Who will be the guardian?</h3>
              <div className="space-y-2">
                {[["parent", "Natural parent (father/mother)"], ["legal", "Legal guardian (court-appointed)"], ["none", "No guardian available"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${guardianStatus === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="guardian" value={val} checked={guardianStatus === val} onChange={(e) => setGuardianStatus(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: How many SSY accounts does the family already have?</h3>
              <div className="space-y-2">
                {[["0", "None — This will be the first"], ["1", "One — For another girl child"], ["2plus", "Two or more already"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${existingAccounts === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="accounts" value={val} checked={existingAccounts === val} onChange={(e) => setExistingAccounts(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={prev} disabled={step === 1} className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-30">← Back</button>
            <button onClick={next} disabled={!canNext} className="px-6 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-30 transition">
              {step === 3 ? "Check Eligibility" : "Next →"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className={`text-center p-6 rounded-xl mb-4 ${result.status === "eligible" ? "bg-green-50" : result.status === "may-be-eligible" ? "bg-yellow-50" : "bg-red-50"}`}>
            <p className={`text-3xl font-bold ${result.status === "eligible" ? "text-green-600" : result.status === "may-be-eligible" ? "text-yellow-600" : "text-red-500"}`}>
              {result.status === "eligible" ? "✅ ELIGIBLE" : result.status === "may-be-eligible" ? "⚠️ MAY BE ELIGIBLE" : "❌ NOT ELIGIBLE"}
            </p>
            <p className="text-sm text-gray-600 mt-2">for Sukanya Samriddhi Yojana</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/sukanya-samriddhi-yojana" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/sukanya-samriddhi" className="text-sm text-orange-600 hover:underline">→ SSY Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Can I open SSY for a girl above 10 years?", "No. The girl child must be below 10 years of age at the time of account opening. No exceptions."],
          ["How many SSY accounts can a family have?", "Maximum 2 — one per girl child. Exception: if the 2nd birth results in twins/triplets, a 3rd account may be allowed."],
          ["Where can I open an SSY account?", "At any post office or authorized commercial bank (SBI, PNB, ICICI, etc.)."],
          ["What if I can't deposit the minimum ₹250?", "The account becomes inactive. It can be revived by paying ₹50 penalty + minimum deposit for each default year."],
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

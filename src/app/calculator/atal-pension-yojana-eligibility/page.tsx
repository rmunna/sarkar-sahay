"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function AtalPensionYojanaEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [age, setAge] = useState("");
  const [hasBankAccount, setHasBankAccount] = useState("");
  const [isTaxPayer, setIsTaxPayer] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const ageNum = Number(age);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (ageNum < 18 || ageNum > 40) {
      status = "not-eligible";
      reasons.push(`❌ Age must be between 18-40 years. You entered ${ageNum} years.`);
    } else {
      reasons.push(`✅ Age ${ageNum} — within eligible range (18-40 years).`);
      const pensionAge = 60;
      const contributionYears = pensionAge - ageNum;
      reasons.push(`ℹ️ You'll contribute for ${contributionYears} years until age 60, when pension starts.`);
    }

    if (hasBankAccount === "no") {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ A savings bank account is mandatory for APY. Open one first to enrol.");
    } else {
      reasons.push("✅ Bank account available — required for auto-debit of contributions.");
    }

    if (isTaxPayer === "yes") {
      status = "not-eligible";
      reasons.push("❌ Income tax payers are NOT eligible for APY (as per Oct 2022 rules).");
    } else {
      reasons.push("✅ Non-tax payer — eligible for APY.");
    }

    if (status === "eligible") {
      reasons.push("🎯 You can choose pension of ₹1,000 to ₹5,000/month starting at age 60.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 3) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setAge(""); setHasBankAccount(""); setIsTaxPayer(""); setResult(null); }

  const canNext = (step === 1 && age !== "") || (step === 2 && hasBankAccount !== "") || (step === 3 && isTaxPayer !== "");
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Atal Pension Yojana Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/atal-pension-yojana-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">👴 Atal Pension Yojana <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you qualify for APY — guaranteed pension of ₹1,000 to ₹5,000/month after age 60.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About Atal Pension Yojana</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• Guaranteed pension: ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000/month</li>
          <li>• Age: 18-40 years (contributions for minimum 20 years)</li>
          <li>• Government co-contributes 50% for eligible subscribers (first 5 years)</li>
          <li>• Spouse receives same pension after subscriber&apos;s death</li>
        </ul>
        <Link href="/guide/atal-pension-yojana-apy" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full APY guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is your current age?</h3>
              <input type="number" min="1" max="100" placeholder="e.g. 25" value={age} onChange={(e) => setAge(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">APY is open to citizens aged 18-40 years</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: Do you have a savings bank account?</h3>
              <div className="space-y-2">
                {[["yes", "Yes — I have a savings bank account"], ["no", "No — I don't have a bank account"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${hasBankAccount === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="bank" value={val} checked={hasBankAccount === val} onChange={(e) => setHasBankAccount(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Are you an income tax payer?</h3>
              <div className="space-y-2">
                {[["no", "No — I don't file/pay income tax"], ["yes", "Yes — I am an income tax payer"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${isTaxPayer === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="tax" value={val} checked={isTaxPayer === val} onChange={(e) => setIsTaxPayer(e.target.value)} className="accent-orange-600" />
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
            <p className="text-sm text-gray-600 mt-2">for Atal Pension Yojana</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/atal-pension-yojana-apy" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["What is the minimum contribution for APY?", "It depends on your age and chosen pension. At age 18, ₹42/month gets you ₹1,000/month pension. At age 40, it's ₹291/month for ₹1,000 pension."],
          ["Can tax payers join APY?", "No. Since October 2022, income tax payers are not eligible to join APY. Existing subscribers who become tax payers may continue."],
          ["What happens if I miss contributions?", "A penalty of ₹1-10/month is charged. After 6 months of non-payment, the account is frozen. After 12 months, it may be closed."],
          ["Can I exit APY before 60?", "Premature exit is allowed only in exceptional cases like terminal illness. You'll get only your contributions + interest (no govt contribution)."],
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

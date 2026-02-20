"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function MudraLoanEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [businessType, setBusinessType] = useState("");
  const [turnover, setTurnover] = useState("");
  const [loanCategory, setLoanCategory] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const turnoverNum = Number(turnover);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (businessType === "none") {
      status = "not-eligible";
      reasons.push("❌ MUDRA loans are for non-corporate, non-farm small/micro enterprises. You need a business or a plan to start one.");
    } else if (businessType === "corporate") {
      status = "not-eligible";
      reasons.push("❌ Corporate entities are not eligible for MUDRA loans. This scheme is for micro/small enterprises only.");
    } else {
      reasons.push(`✅ Business type: ${businessType === "existing" ? "Existing" : "New"} small/micro enterprise — eligible for MUDRA loan.`);
    }

    if (loanCategory === "shishu") {
      reasons.push("📋 Shishu category: Loans up to ₹50,000. No collateral needed. Ideal for starting small businesses.");
      if (turnoverNum > 0 && turnoverNum > 1000000) {
        reasons.push("ℹ️ Your turnover suggests you may qualify for a higher category (Kishore/Tarun).");
      }
    } else if (loanCategory === "kishore") {
      reasons.push("📋 Kishore category: Loans ₹50,001 to ₹5 lakh. For growing businesses. Business plan may be required.");
      if (turnoverNum > 0 && turnoverNum < 100000) {
        if (status === "eligible") status = "may-be-eligible";
        reasons.push("⚠️ Low turnover — banks may prefer Shishu category for your business size.");
      }
    } else if (loanCategory === "tarun") {
      reasons.push("📋 Tarun category: Loans ₹5,00,001 to ₹10 lakh. For well-established small businesses. Detailed business plan required.");
      if (turnoverNum > 0 && turnoverNum < 500000) {
        if (status === "eligible") status = "may-be-eligible";
        reasons.push("⚠️ Turnover below ₹5 lakh — banks may require stronger business case for Tarun category.");
      }
    }

    if (turnoverNum > 10000000) {
      status = "not-eligible";
      reasons.push("❌ Turnover exceeds ₹1 crore — MUDRA is for micro enterprises with turnover up to ₹1 crore.");
    } else if (turnoverNum > 0) {
      reasons.push(`ℹ️ Annual turnover: ₹${turnoverNum.toLocaleString("en-IN")} — within MUDRA eligibility.`);
    }

    if (status === "eligible") {
      reasons.push("🎯 Apply at any bank, NBFC, or MFI. No collateral for Shishu loans. Interest rates: 8-12% typically.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 3) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setBusinessType(""); setTurnover(""); setLoanCategory(""); setResult(null); }

  const canNext = (step === 1 && businessType !== "") || (step === 2 && turnover !== "") || (step === 3 && loanCategory !== "");
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "MUDRA Loan Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/mudra-loan-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">💼 MUDRA Loan <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you qualify for Pradhan Mantri MUDRA Yojana — loans up to ₹10 lakh for small businesses without collateral.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About MUDRA Loan (PMMY)</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• <strong>Shishu:</strong> Up to ₹50,000 — for starting a business</li>
          <li>• <strong>Kishore:</strong> ₹50,001 to ₹5 lakh — for growing businesses</li>
          <li>• <strong>Tarun:</strong> ₹5,00,001 to ₹10 lakh — for established enterprises</li>
          <li>• No collateral required for loans up to ₹10 lakh</li>
          <li>• Available at all banks, NBFCs, and microfinance institutions</li>
        </ul>
        <Link href="/guide/mudra-loan-apply-online" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full MUDRA Loan guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is your business status?</h3>
              <div className="space-y-2">
                {[
                  ["existing", "Existing small/micro business"],
                  ["new", "Planning to start a new business"],
                  ["corporate", "Corporate / large enterprise"],
                  ["none", "No business / not planning one"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${businessType === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="business" value={val} checked={businessType === val} onChange={(e) => setBusinessType(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: What is your annual business turnover?</h3>
              <input type="number" placeholder="e.g. 500000 (enter 0 if new business)" value={turnover} onChange={(e) => setTurnover(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Annual turnover in ₹. Enter 0 if starting a new business.</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Which loan category do you need?</h3>
              <div className="space-y-2">
                {[
                  ["shishu", "Shishu — Up to ₹50,000 (starting small)"],
                  ["kishore", "Kishore — ₹50,001 to ₹5 lakh (growing business)"],
                  ["tarun", "Tarun — ₹5,00,001 to ₹10 lakh (established business)"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${loanCategory === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="loancat" value={val} checked={loanCategory === val} onChange={(e) => setLoanCategory(e.target.value)} className="accent-orange-600" />
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
              {result.status === "eligible" ? "✅ LIKELY ELIGIBLE" : result.status === "may-be-eligible" ? "⚠️ MAY BE ELIGIBLE" : "❌ NOT ELIGIBLE"}
            </p>
            <p className="text-sm text-gray-600 mt-2">for MUDRA Loan (PMMY)</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/mudra-loan-apply-online" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["Who can apply for MUDRA loan?", "Any Indian citizen with a non-farm, non-corporate small/micro enterprise. Includes shopkeepers, vendors, artisans, food stall owners, repair shops, etc."],
          ["Is collateral required for MUDRA loans?", "No collateral or guarantor needed for loans up to ₹10 lakh. This is a key feature of the MUDRA scheme."],
          ["What is the interest rate on MUDRA loans?", "Interest rates vary by bank, typically 8-12% per annum. Shishu loans often have lower rates. No specific rate is mandated by RBI."],
          ["Can I get MUDRA loan for agriculture?", "No. MUDRA is for non-farm income generating activities. For agriculture, check PM-KISAN, Kisan Credit Card, or NABARD schemes."],
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

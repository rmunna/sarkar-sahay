"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function UjjwalaYojanaEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [bplStatus, setBplStatus] = useState("");
  const [existingLPG, setExistingLPG] = useState("");
  const [householdStatus, setHouseholdStatus] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (bplStatus === "bpl") {
      reasons.push("✅ BPL household — primary target group for PM Ujjwala Yojana.");
    } else if (bplStatus === "secc") {
      reasons.push("✅ Listed in SECC 2011 — eligible for Ujjwala Yojana.");
    } else if (bplStatus === "sc-st") {
      reasons.push("✅ SC/ST household — eligible under Ujjwala 2.0 expanded coverage.");
    } else if (bplStatus === "pmay") {
      reasons.push("✅ PMAY beneficiary — eligible under Ujjwala 2.0.");
    } else if (bplStatus === "apl") {
      status = "may-be-eligible";
      reasons.push("⚠️ APL households may be eligible under Ujjwala 2.0 if covered under other welfare schemes. Check with your local distributor.");
    }

    if (existingLPG === "yes") {
      status = "not-eligible";
      reasons.push("❌ Your household already has an LPG connection. Ujjwala is for households without LPG.");
    } else {
      reasons.push("✅ No existing LPG connection — basic eligibility met.");
    }

    if (householdStatus === "female-head") {
      reasons.push("✅ Adult woman of the household — LPG connection will be in her name.");
    } else if (householdStatus === "no-female") {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ Connection is issued in the name of an adult woman. If no adult woman in household, special provisions may apply.");
    } else {
      reasons.push("✅ Adult woman available in household to receive the connection.");
    }

    if (status === "eligible") {
      reasons.push("🎯 Benefits: Free LPG connection + first refill + stove. Deposit-free connection under Ujjwala 2.0. Apply at nearest LPG distributor.");
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 3) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setBplStatus(""); setExistingLPG(""); setHouseholdStatus(""); setResult(null); }

  const canNext = (step === 1 && bplStatus !== "") || (step === 2 && existingLPG !== "") || (step === 3 && householdStatus !== "");
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ujjwala Yojana Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/ujjwala-yojana-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🔥 Ujjwala Yojana <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if you qualify for PM Ujjwala Yojana — free LPG gas connection for BPL and underprivileged households.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About PM Ujjwala Yojana</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• Free LPG connection for BPL/underprivileged households</li>
          <li>• Ujjwala 2.0: Free first refill + hot plate (stove)</li>
          <li>• Deposit-free connection — no upfront cost</li>
          <li>• Connection in the name of adult woman of the household</li>
          <li>• Over 10 crore connections provided since launch</li>
        </ul>
        <Link href="/guide/lpg-subsidy-ujjwala-yojana" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full Ujjwala Yojana guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is your household&apos;s economic category?</h3>
              <div className="space-y-2">
                {[
                  ["bpl", "BPL — Below Poverty Line card holder"],
                  ["secc", "Listed in SECC 2011 database"],
                  ["sc-st", "SC/ST household"],
                  ["pmay", "PM Awas Yojana (PMAY) beneficiary"],
                  ["apl", "APL / Others"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${bplStatus === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="bpl" value={val} checked={bplStatus === val} onChange={(e) => setBplStatus(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: Does your household already have an LPG connection?</h3>
              <div className="space-y-2">
                {[["no", "No — We don't have an LPG connection"], ["yes", "Yes — We already have LPG"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${existingLPG === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="lpg" value={val} checked={existingLPG === val} onChange={(e) => setExistingLPG(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: Is there an adult woman (18+) in the household?</h3>
              <div className="space-y-2">
                {[
                  ["female-head", "Yes — She will be the applicant"],
                  ["female-member", "Yes — Adult woman is a family member"],
                  ["no-female", "No adult woman in the household"],
                ].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${householdStatus === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="household" value={val} checked={householdStatus === val} onChange={(e) => setHouseholdStatus(e.target.value)} className="accent-orange-600" />
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
            <p className="text-sm text-gray-600 mt-2">for PM Ujjwala Yojana</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/lpg-subsidy-ujjwala-yojana" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["What documents are needed for Ujjwala Yojana?", "Aadhaar card, BPL card/ration card, bank account passbook, passport-size photo, and address proof."],
          ["Can I apply online for Ujjwala?", "You can apply at your nearest LPG distributor (HP, Bharat, Indane). Some states offer online application through their portals."],
          ["What if my household already has LPG?", "If any member of the household already has an LPG connection, you cannot get another one under Ujjwala."],
          ["What is Ujjwala 2.0?", "Launched in 2021, Ujjwala 2.0 provides deposit-free LPG connections with free first refill and hot plate. No address proof needed — self-declaration accepted."],
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

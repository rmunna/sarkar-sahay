"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;
type Result = "eligible" | "not-eligible" | "may-be-eligible";

export default function AyushmanBharatEligibility() {
  const [step, setStep] = useState<Step>(1);
  const [income, setIncome] = useState("");
  const [familySize, setFamilySize] = useState("");
  const [category, setCategory] = useState("");
  const [hasInsurance, setHasInsurance] = useState("");
  const [result, setResult] = useState<{ status: Result; reasons: string[] } | null>(null);

  function calculate() {
    const incomeNum = Number(income);
    const reasons: string[] = [];
    let status: Result = "eligible";

    if (incomeNum > 500000) {
      status = "not-eligible";
      reasons.push("❌ Annual family income exceeds ₹5 lakh — PMJAY targets economically weaker families (based on SECC 2011 data).");
    } else {
      reasons.push("✅ Family income within PMJAY target range.");
    }

    if (category === "bpl" || category === "secc") {
      reasons.push("✅ BPL/SECC listed families get priority under Ayushman Bharat.");
    } else if (category === "apl") {
      if (status === "eligible") status = "may-be-eligible";
      reasons.push("⚠️ APL families may not be automatically covered. Check your SECC inclusion status at mera.pmjay.gov.in.");
    }

    if (hasInsurance === "yes") {
      reasons.push("ℹ️ Having existing insurance doesn't disqualify you, but PMJAY covers up to ₹5 lakh/family/year for secondary & tertiary care.");
    }

    const size = Number(familySize);
    if (size > 0) {
      reasons.push(`ℹ️ Family of ${size} — PMJAY covers ₹5 lakh per family per year (not per person). All family members are covered.`);
    }

    setResult({ status, reasons });
  }

  function next() { if (step < 4) setStep((s) => (s + 1) as Step); else calculate(); }
  function prev() { if (step > 1) setStep((s) => (s - 1) as Step); }
  function reset() { setStep(1); setIncome(""); setFamilySize(""); setCategory(""); setHasInsurance(""); setResult(null); }

  const canNext = (step === 1 && income !== "") || (step === 2 && familySize !== "") || (step === 3 && category !== "") || (step === 4 && hasInsurance !== "");
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const radioCls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ayushman Bharat Eligibility Checker", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: "https://www.citizennest.com/calculator/ayushman-bharat-eligibility", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🏥 Ayushman Bharat <span className="text-orange-600">Eligibility Checker</span></h1>
      <p className="text-gray-600 mb-6">Check if your family qualifies for Ayushman Bharat PM-JAY — free health insurance cover of ₹5 lakh per family per year.</p>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="font-bold text-orange-800 mb-2">📋 About Ayushman Bharat (PM-JAY)</h2>
        <ul className="text-sm text-orange-900 space-y-1">
          <li>• ₹5 lakh health cover per family per year for secondary & tertiary care</li>
          <li>• Covers 1,950+ treatment packages including surgeries, medical procedures</li>
          <li>• No cap on family size — all members covered</li>
          <li>• Cashless treatment at 29,000+ empanelled hospitals across India</li>
        </ul>
        <Link href="/guide/ayushman-bharat-health-card" className="text-sm text-orange-600 hover:underline mt-2 inline-block">→ Read full Ayushman Bharat guide</Link>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-gray-200"}`} />))}
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 1: What is your annual family income?</h3>
              <input type="number" placeholder="e.g. 200000" value={income} onChange={(e) => setIncome(e.target.value)} className={selectCls} />
              <p className="text-xs text-gray-400 mt-1">Total annual income of the family in ₹</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 2: How many members in your family?</h3>
              <input type="number" min="1" max="20" placeholder="e.g. 5" value={familySize} onChange={(e) => setFamilySize(e.target.value)} className={selectCls} />
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 3: What is your family&apos;s economic category?</h3>
              <div className="space-y-2">
                {[["bpl", "BPL — Below Poverty Line card holder"], ["secc", "SECC listed — Included in SECC 2011 database"], ["apl", "APL / Others — Above Poverty Line"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${category === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="category" value={val} checked={category === val} onChange={(e) => setCategory(e.target.value)} className="accent-orange-600" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Step 4: Does your family have any existing health insurance?</h3>
              <div className="space-y-2">
                {[["no", "No — No existing health insurance"], ["yes", "Yes — We have private/employer insurance"]].map(([val, label]) => (
                  <label key={val} className={`${radioCls} ${hasInsurance === val ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="insurance" value={val} checked={hasInsurance === val} onChange={(e) => setHasInsurance(e.target.value)} className="accent-orange-600" />
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
            <p className="text-sm text-gray-600 mt-2">for Ayushman Bharat PM-JAY</p>
          </div>
          <div className="space-y-2 mb-4">{result.reasons.map((r, i) => (<p key={i} className="text-sm text-gray-700">{r}</p>))}</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition">Check Again</button>
            <Link href="/guide/ayushman-bharat-health-card" className="px-4 py-2 text-sm rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition">Read Full Guide →</Link>
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
          ["How do I check if I'm covered under Ayushman Bharat?", "Visit mera.pmjay.gov.in and enter your mobile number or ration card number to check if your family is in the SECC database."],
          ["What does ₹5 lakh cover include?", "It covers hospitalisation, surgery, diagnostics, medicines, pre & post hospitalisation expenses across 1,950+ treatment packages."],
          ["Can I use Ayushman Bharat with existing insurance?", "Yes. PMJAY can be used alongside other insurance. It covers what other insurance may not."],
          ["Is there an age limit for Ayushman Bharat?", "No age limit. All family members — from newborns to senior citizens — are covered."],
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

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const GST_RATES = [5, 12, 18, 28];

const PRESETS = [
  { label: "🍽️ Restaurant", rate: 5 },
  { label: "👕 Clothing", rate: 12 },
  { label: "📱 Electronics", rate: 18 },
  { label: "💎 Luxury", rate: 28 },
];

function calcGST(amount: number, rate: number, inclusive: boolean, interState: boolean) {
  if (amount <= 0 || rate <= 0) return { base: 0, cgst: 0, sgst: 0, igst: 0, total: 0, gstAmount: 0 };

  let base: number, gstAmount: number, total: number;
  if (inclusive) {
    base = amount / (1 + rate / 100);
    gstAmount = amount - base;
    total = amount;
  } else {
    base = amount;
    gstAmount = amount * (rate / 100);
    total = amount + gstAmount;
  }

  return {
    base,
    cgst: interState ? 0 : gstAmount / 2,
    sgst: interState ? 0 : gstAmount / 2,
    igst: interState ? gstAmount : 0,
    total,
    gstAmount,
  };
}

function DonutChart({ base, gst }: { base: number; gst: number }) {
  const total = base + gst;
  if (total === 0) return null;
  const bPct = (base / total) * 100;
  const gPct = (gst / total) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gStroke = (gPct / 100) * circumference;
  const bStroke = (bPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#fdba74" strokeWidth="24"
          strokeDasharray={`${gStroke} ${circumference}`} strokeDashoffset={0} />
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ea580c" strokeWidth="24"
          strokeDasharray={`${bStroke} ${circumference}`} strokeDashoffset={-gStroke} />
      </svg>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Base ({bPct.toFixed(1)}%)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-300" /> GST ({gPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export default function GSTCalculator() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("18");
  const [customRate, setCustomRate] = useState(false);
  const [inclusive, setInclusive] = useState(false);
  const [interState, setInterState] = useState(false);

  const result = useMemo(
    () => calcGST(Number(amount) || 0, Number(rate) || 0, inclusive, interState),
    [amount, rate, inclusive, interState]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "GST Calculator — Calculate CGST, SGST & IGST Online",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/gst",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🧾 GST <span className="text-orange-600">Calculator</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Calculate GST-inclusive or GST-exclusive prices instantly. Get CGST, SGST, or IGST breakdowns for any amount.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => { setRate(String(p.rate)); setCustomRate(false); }}
            className="text-sm border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
          >
            {p.label} ({p.rate}%)
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
            {customRate ? (
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="flex gap-2 flex-wrap">
                {GST_RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(String(r))}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${Number(rate) === r ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {r}%
                  </button>
                ))}
                <button
                  onClick={() => setCustomRate(true)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Custom
                </button>
              </div>
            )}
            {customRate && (
              <button onClick={() => setCustomRate(false)} className="text-xs text-orange-600 mt-1 hover:underline">← Standard rates</button>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} className="accent-orange-600" />
            GST-Inclusive (amount includes GST)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} className="accent-orange-600" />
            Inter-State (IGST instead of CGST+SGST)
          </label>
        </div>
      </div>

      {/* Results */}
      {result.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">GST Breakdown</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-3xl font-bold text-orange-600">{fmt(result.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">Base Price</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(result.base)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">GST Amount</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(result.gstAmount)}</p>
                </div>
              </div>
              {interState ? (
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xs text-gray-500">IGST ({rate}%)</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(result.igst)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">CGST ({Number(rate) / 2}%)</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.cgst)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">SGST ({Number(rate) / 2}%)</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(result.sgst)}</p>
                  </div>
                </div>
              )}
            </div>
            <DonutChart base={result.base} gst={result.gstAmount} />
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/sip" className="text-sm text-orange-600 hover:underline">→ SIP Calculator</Link>
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is GST?", "GST (Goods and Services Tax) is a comprehensive indirect tax levied on the supply of goods and services in India. It replaced multiple earlier taxes like VAT, service tax, and excise duty."],
          ["What is the difference between CGST, SGST and IGST?", "CGST (Central GST) and SGST (State GST) are levied on intra-state transactions, each being half of the total GST rate. IGST (Integrated GST) is levied on inter-state transactions at the full rate."],
          ["What are the GST slab rates in India?", "India has four main GST slab rates: 5%, 12%, 18%, and 28%. Essential items are at 0% or 5%, while luxury and sin goods attract 28% plus cess."],
          ["How to calculate GST from an inclusive price?", "To find the base price from a GST-inclusive amount, divide by (1 + GST rate/100). For example, ₹1,180 at 18% GST: Base = 1180 / 1.18 = ₹1,000."],
          ["Is GST applicable on all goods?", "No. Essential items like fresh fruits, vegetables, milk, and grains are GST-exempt (0%). Petroleum products, alcohol, and electricity are outside GST."],
          ["What is reverse charge under GST?", "Under reverse charge mechanism (RCM), the recipient of goods/services pays GST directly to the government instead of the supplier. This applies to certain notified goods and services."],
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

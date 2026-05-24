import type { Metadata } from "next";
import Link from "next/link";
import { getAllStates, getAllRTOs } from "@/lib/rto";

export const revalidate = 7776000;

export const metadata: Metadata = {
  title: "RTO Code List India — All State Vehicle Registration Codes | CitizenNest",
  description: "Find RTO codes for all states in India. Search by state, city, or vehicle registration number prefix. Complete list of 640+ Regional Transport Office codes.",
  alternates: { canonical: "https://www.citizennest.com/rto" },
};

const POPULAR_RTOS = ["DL-01", "MH-01", "KA-01", "TN-22", "GJ-01", "AP-28", "UP-15", "WB-01", "RJ-14", "PB-01", "HR-26", "MP-09"];

export default function RTOHomePage() {
  const states = getAllStates();
  const all = getAllRTOs();
  const popular = all.filter((r) => POPULAR_RTOS.includes(r.code));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "RTO Codes", item: "https://www.citizennest.com/rto" },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🚗 RTO Code <span className="text-orange-600">List India</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Find Regional Transport Office (RTO) codes for all {states.length} states and UTs in India. {all.length}+ RTOs indexed with vehicle registration prefix details.
      </p>

      {/* Vehicle prefix explainer */}
      <div className="bg-gray-900 rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">How to read a vehicle number</p>
        <div className="flex items-center gap-2 text-white font-black text-2xl tracking-[0.15em] mb-3">
          <span className="text-yellow-400">MH</span>
          <span className="text-yellow-400">12</span>
          <span className="text-gray-600 font-normal text-base">·</span>
          <span className="text-blue-400">AB</span>
          <span className="text-gray-600 font-normal text-base">·</span>
          <span className="text-green-400">1234</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div><span className="text-yellow-400 font-bold">MH12</span> <span className="text-gray-400">= Pune (MH-12 RTO)</span></div>
          <div><span className="text-blue-400 font-bold">AB</span> <span className="text-gray-400">= Series letters</span></div>
          <div><span className="text-green-400 font-bold">1234</span> <span className="text-gray-400">= Unique number</span></div>
        </div>
      </div>

      {/* Popular RTOs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">🔥 Popular RTOs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {popular.map((r) => (
            <Link
              key={r.slug}
              href={`/rto/${r.slug}`}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
            >
              <div className="bg-gray-900 text-white text-xs font-black px-2 py-1 rounded tracking-wider shrink-0">
                {r.code.replace("-", "")}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm group-hover:text-orange-600">{r.code}</p>
                <p className="text-xs text-gray-500 truncate">{r.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by state */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Browse by State / UT</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {states.map((s) => (
            <Link
              key={s.stateSlug}
              href={`/rto?state=${s.stateSlug}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition"
            >
              <span className="text-sm text-gray-700 font-medium">{s.state}</span>
              <span className="text-xs text-gray-400">{s.count} RTOs</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ Car Loan EMI Calculator</Link>
        <Link href="/hsn" className="text-sm text-orange-600 hover:underline">→ HSN Code Search</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is an RTO code?", "An RTO code is a 4-character alphanumeric code assigned to each Regional Transport Office in India. It consists of a 2-letter state code (e.g., MH for Maharashtra) followed by a 2-digit number (e.g., 12 for Pune). Vehicles registered at that RTO carry this code in their number plates."],
          ["How to find owner details using vehicle number?", "You can check vehicle owner details on the Parivahan portal (parivahan.gov.in) or the mParivahan app. Enter the full registration number to get owner name, RTO, fuel type, and insurance details."],
          ["What does MH mean in vehicle number?", "MH is the state code for Maharashtra. So MH-01 is the Mumbai (Central) RTO, MH-12 is the Pune RTO, and so on."],
          ["How many RTOs are there in India?", "India has over 1,300 RTOs and sub-RTOs across all states and union territories. Our database covers 640+ major RTOs."],
          ["What is the difference between RTO and DTO?", "RTO (Regional Transport Office) is the main transport authority in a region. DTO (District Transport Office) is a district-level office under the RTO. Both issue registration certificates, driving licences, and vehicle permits."],
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

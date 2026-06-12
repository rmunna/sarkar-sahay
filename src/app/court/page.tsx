import type { Metadata } from "next";
import Link from "next/link";
import { getAllCourts, getAllStates, getHighCourts } from "@/lib/court";


export const metadata: Metadata = {
  title: "Court Case Status India — High Courts & District Courts",
  description:
    "Check court case status online for all Indian High Courts and District Courts. Search by CNR number, case number, party name or FIR. Direct links to eCourts portal.",
  alternates: { canonical: "https://www.citizennest.com/court" },
};

const BASE_URL = "https://www.citizennest.com";

export default function CourtHomePage() {
  const highCourts = getHighCourts();
  const states = getAllStates();
  const total = getAllCourts().length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Court Case Status", item: `${BASE_URL}/court` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How can I check my court case status online in India?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can check court case status on the eCourts portal (services.ecourts.gov.in) using your CNR number, case number, party name, or FIR number. CitizenNest provides direct links to each court's case status page.",
            },
          },
          {
            "@type": "Question",
            name: "What is a CNR number?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CNR (Case Number Record) is a unique 16-character identifier assigned to every case in Indian courts. Format: [State(2)][District(2)][Establishment(2)][CaseNo(6)][Year(4)]. Example: DLST010000122024.",
            },
          },
          {
            "@type": "Question",
            name: "Is the eCourts portal free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, the eCourts portal (ecourts.gov.in) is a free government service. You can check case status, download orders, and view cause lists at no charge.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        ⚖️ Court Case Status <span className="text-orange-600">India</span>
      </h1>
      <p className="text-gray-600 mb-8">
        Check case status for any Indian court — High Courts, District Courts, and the Supreme Court.{" "}
        <strong className="text-gray-800">{total} courts</strong> with direct eCourts links.
      </p>

      {/* Quick tools */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/court/cnr"
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5 hover:border-orange-500 hover:bg-orange-100 transition group"
        >
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-bold text-gray-900 group-hover:text-orange-700">CNR Number Decoder</div>
          <div className="text-sm text-gray-600 mt-1">
            Decode any 16-character CNR number — find which court and district your case belongs to.
          </div>
        </Link>
        <Link
          href="/court/supreme-court"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:bg-orange-50 transition group"
        >
          <div className="text-2xl mb-2">🏛️</div>
          <div className="font-bold text-gray-900 group-hover:text-orange-700">Supreme Court of India</div>
          <div className="text-sm text-gray-600 mt-1">
            Check SLP, Writ Petition, Civil Appeal status on the Supreme Court case status portal.
          </div>
        </Link>
      </div>

      {/* High Courts grid */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">High Courts</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="grid sm:grid-cols-2">
          {highCourts.map((court, i) => (
            <Link
              key={court.slug}
              href={`/court/${court.stateSlug}/${court.slug}`}
              className={`flex items-center justify-between px-4 py-3 hover:bg-orange-50 group transition border-b border-gray-100 ${
                i % 2 === 0 ? "sm:border-r border-gray-100" : ""
              }`}
            >
              <div>
                <div className="text-sm font-medium text-gray-800 group-hover:text-orange-600">
                  {court.name}
                </div>
                <div className="text-xs text-gray-400">{court.city}, {court.state}</div>
              </div>
              <span className="text-xs text-gray-300 shrink-0 ml-2">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by state */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by State</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="grid sm:grid-cols-2">
          {states.map((s, i) => (
            <Link
              key={s.stateSlug}
              href={`/court/${s.stateSlug}`}
              className={`flex justify-between items-center px-4 py-3 hover:bg-orange-50 group transition border-b border-gray-100 ${
                i % 2 === 0 ? "sm:border-r border-gray-100" : ""
              }`}
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                {s.state}
              </span>
              <span className="text-xs text-gray-400 shrink-0 ml-2">
                {s.count} {s.count === 1 ? "court" : "courts"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-900 mb-3">How to Check Case Status Online</h2>
        <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
          <li>Select your court from the list above (High Court or District Court).</li>
          <li>Choose your search type: CNR Number, Case Number, Party Name, or FIR Number.</li>
          <li>Click "Search on eCourts" — you will be taken to the official government portal.</li>
          <li>View hearing dates, orders, and case history on the eCourts portal.</li>
        </ol>
      </div>

      {/* Cross links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/ifsc" className="text-sm text-orange-600 hover:underline">→ IFSC Code Finder</Link>
        <Link href="/pincode" className="text-sm text-orange-600 hover:underline">→ PIN Code Finder</Link>
        <Link href="/rto" className="text-sm text-orange-600 hover:underline">→ RTO Codes</Link>
      </div>
    </div>
  );
}

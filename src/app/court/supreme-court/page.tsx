import type { Metadata } from "next";
import Link from "next/link";
import { getSupremeCourt } from "@/lib/court";
import CourtCaseSearch from "@/components/CourtCaseSearch";

export const revalidate = 7776000;

export const metadata: Metadata = {
  title: "Supreme Court of India Case Status — Check Online",
  description:
    "Check Supreme Court of India case status online. Search SLP, Writ Petition, Civil Appeal, Criminal Appeal by case number or party name. Direct link to the official SCI portal.",
  alternates: { canonical: "https://www.citizennest.com/court/supreme-court" },
};

const BASE_URL = "https://www.citizennest.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Court Case Status", item: `${BASE_URL}/court` },
        { "@type": "ListItem", position: 3, name: "Supreme Court of India", item: `${BASE_URL}/court/supreme-court` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How to check Supreme Court case status online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Go to the Supreme Court's official portal at main.sci.gov.in and use the 'Case Status' section. You can search by diary number, case number, or party name. The portal is updated daily.",
          },
        },
        {
          "@type": "Question",
          name: "What is an SLP in the Supreme Court?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SLP stands for Special Leave Petition. It is filed under Article 136 of the Constitution to appeal against any judgment or order of any court or tribunal in India. The Supreme Court may grant or refuse leave to appeal.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between SLP and appeal in Supreme Court?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An appeal lies as of right in specific cases (Articles 132–135), while an SLP (Special Leave Petition under Article 136) is a discretionary remedy where the party prays for leave to appeal. Most cases reach the Supreme Court via SLP.",
          },
        },
      ],
    },
  ],
};

export default function SupremeCourtPage() {
  const court = getSupremeCourt();
  if (!court) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/court" className="hover:text-orange-600">Court Case Status</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">Supreme Court of India</span>
      </nav>

      <div className="flex items-start gap-3 mb-2">
        <span className="text-3xl">🏛️</span>
        <h1 className="text-2xl font-bold text-gray-900">
          Supreme Court of India — Case Status
        </h1>
      </div>
      <p className="text-gray-600 mb-6">
        Check case status for SLPs, Writ Petitions, Civil Appeals and more on the Supreme Court portal.
        Established in <strong>{court.established}</strong>.
      </p>

      {/* Search widget */}
      <CourtCaseSearch
        caseStatusUrl={court.caseStatusUrl}
        courtName={court.shortName}
        isSupremeCourt={true}
      />

      {/* Case types */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mt-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Types of Cases in the Supreme Court</h2>
        <div className="grid grid-cols-2 gap-2">
          {court.caseTypes.map((ct) => (
            <div key={ct.code} className="flex items-start gap-2 text-sm">
              <span className="font-mono font-bold text-orange-700 shrink-0 mt-0.5">{ct.code}</span>
              <span className="text-gray-600">{ct.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key links */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Official Supreme Court Links</h2>
        <div className="space-y-2">
          {[
            { label: "Case Status Search", url: court.caseStatusUrl },
            { label: "Advocate Case Status", url: court.advocateUrl! },
            { label: "Daily Cause List", url: court.causeListUrl! },
            { label: "Supreme Court Website", url: court.website },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
            >
              <span className="text-sm text-gray-700 group-hover:text-orange-700">{label}</span>
              <span className="text-xs text-gray-400 group-hover:text-orange-500">↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Court info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-900 mb-2">About the Supreme Court</h2>
        <p className="text-sm text-amber-800 mb-3">{court.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Address</p>
            <p className="text-amber-900 font-medium">{court.address}</p>
          </div>
          {court.phone && (
            <div>
              <p className="text-gray-500 text-xs">Phone</p>
              <p className="text-amber-900 font-medium">{court.phone}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/court" className="text-sm text-orange-600 hover:underline">← All Courts</Link>
        <Link href="/court/cnr" className="text-sm text-orange-600 hover:underline">→ CNR Decoder</Link>
      </div>
    </div>
  );
}

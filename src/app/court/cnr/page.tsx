import type { Metadata } from "next";
import Link from "next/link";
import CNRDecoder from "./CNRDecoder";

export const revalidate = 7776000;

export const metadata: Metadata = {
  title: "CNR Number Decoder — What Does My CNR Mean?",
  description:
    "Decode any 16-character CNR (Case Number Record) number. Find out which state, district, and court your case belongs to. Free tool — no registration required.",
  alternates: { canonical: "https://www.citizennest.com/court/cnr" },
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
        { "@type": "ListItem", position: 3, name: "CNR Decoder", item: `${BASE_URL}/court/cnr` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a CNR number in Indian courts?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CNR stands for Case Number Record. It is a unique 16-character alphanumeric code assigned to every case filed in any Indian court under the eCourts system. The format is: [State Code (2)] + [District Code (2)] + [Establishment Code (2)] + [Case Number (6)] + [Year (4)].",
          },
        },
        {
          "@type": "Question",
          name: "Where can I find my CNR number?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Your CNR number is printed on the case filing receipt given by the court when you file a case, on any order copy or certified copy issued by the court, and on the eCourts portal after searching by your case number.",
          },
        },
        {
          "@type": "Question",
          name: "How do I use a CNR number to check case status?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Go to the eCourts portal at services.ecourts.gov.in, select your state and district, and enter the CNR number in the search field. You can also use CitizenNest's court pages which pre-fill the eCourts URL for your court.",
          },
        },
      ],
    },
  ],
};

export default function CNRPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/court" className="hover:text-orange-600">Court Case Status</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">CNR Number Decoder</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        CNR Number Decoder
      </h1>
      <p className="text-gray-600 mb-6">
        Enter your 16-character CNR number to find out which court, district, and year it belongs to.
      </p>

      {/* Decoder widget (client component) */}
      <CNRDecoder />

      {/* What is CNR */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">What is a CNR Number?</h2>
        <p className="text-sm text-gray-600 mb-4">
          CNR (Case Number Record) is a unique 16-character identifier assigned to every case filed in any
          Indian court under the eCourts system. It allows tracking of cases across hearings and transfers.
        </p>

        {/* Visual breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">CNR Format</p>
          <div className="flex flex-wrap gap-1 font-mono text-sm mb-3">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">DL</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">ST</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">01</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">000012</span>
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">2024</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center">
            <div>
              <div className="font-bold text-red-700 mb-1">DL</div>
              <div className="text-gray-500">State Code<br/>(2 chars)</div>
            </div>
            <div>
              <div className="font-bold text-blue-700 mb-1">ST</div>
              <div className="text-gray-500">District Code<br/>(2 chars)</div>
            </div>
            <div>
              <div className="font-bold text-green-700 mb-1">01</div>
              <div className="text-gray-500">Establishment<br/>(2 chars)</div>
            </div>
            <div>
              <div className="font-bold text-purple-700 mb-1">000012</div>
              <div className="text-gray-500">Case Number<br/>(6 chars)</div>
            </div>
            <div>
              <div className="font-bold text-amber-700 mb-1">2024</div>
              <div className="text-gray-500">Filing Year<br/>(4 chars)</div>
            </div>
          </div>
        </div>

        <h3 className="font-medium text-gray-800 mb-2">State Codes Reference</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {[
            ["DL", "Delhi"], ["MH", "Maharashtra"], ["KA", "Karnataka"], ["TN", "Tamil Nadu"],
            ["UP", "Uttar Pradesh"], ["RJ", "Rajasthan"], ["GJ", "Gujarat"], ["WB", "West Bengal"],
            ["AP", "Andhra Pradesh"], ["TS", "Telangana"], ["KL", "Kerala"], ["BR", "Bihar"],
            ["MP", "Madhya Pradesh"], ["PB", "Punjab"], ["OR", "Odisha"], ["AS", "Assam"],
          ].map(([code, name]) => (
            <div key={code} className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1">
              <span className="font-mono font-bold text-orange-700 shrink-0">{code}</span>
              <span className="text-gray-600 truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Where to find CNR */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-900 mb-2">Where to Find Your CNR Number</h2>
        <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
          <li>On the filing receipt issued when you register the case</li>
          <li>On any order copy or certified copy from the court</li>
          <li>On the eCourts portal — search by case number, then note the CNR</li>
          <li>On Vakalatnama or pleadings filed by your advocate</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/court" className="text-sm text-orange-600 hover:underline">← All Courts</Link>
      </div>
    </div>
  );
}

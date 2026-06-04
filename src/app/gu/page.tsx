import { getAllGujaratiGuides } from "@/lib/guides-gu";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — ગુજરાત સરકારી સેવાઓ માટે ગુજરાતી માર્ગદર્શિકા",
  description: "ગુજરાત સરકારી સેવાઓ માટે સરળ ગુજરાતી માર્ગદર્શિકા — રેશન કાર્ડ, જ્ઞાન શક્તિ, આધાર, જાતિ અને આવક પ્રમાણપત્ર, i-Khedut, ગ્રામ પંચાયત સેવાઓ અને વધુ.",
  openGraph: {
    title: "CitizenNest — ગુજરાત સરકારી સેવાઓ માટે ગુજરાતી માર્ગદર્શિકા",
    description: "ગુજરાત સરકારી સેવાઓ માટે સરળ ગુજરાતી માર્ગદર્શિકા.",
    url: `${BASE_URL}/gu`,
    siteName: "CitizenNest",
    locale: "gu_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/gu`,
    languages: {
      en: BASE_URL,
      gu: `${BASE_URL}/gu`,
    },
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Identity Documents": "🪪",
  "Government Schemes": "🏦",
  "State Schemes": "🏛️",
  "Tax & Finance": "💰",
  "Certificates": "📜",
  "Food & Ration": "🍚",
  "Property & Legal": "🏠",
};

const CATEGORY_LABELS_GU: Record<string, string> = {
  "Identity Documents": "ઓળખ દસ્તાવેજો",
  "Government Schemes": "સરકારી યોજનાઓ",
  "State Schemes": "રાજ્ય યોજનાઓ",
  "Tax & Finance": "કર અને નાણાં",
  "Certificates": "પ્રમાણપત્રો",
  "Food & Ration": "ખોરાક અને રેશન",
  "Property & Legal": "મિલકત અને કાયદો",
};

export default function GujaratiHome() {
  const allGuides = getAllGujaratiGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="gu">
      <div className="flex justify-end mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
        >
          🇬🇧 English
        </Link>
      </div>

      <section className="text-center py-14 md:py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 font-medium mb-6">
          🇮🇳 ગુજરાત સરકારી સેવાઓ માટે વિશ્વસનીય માર્ગદર્શક
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          સરકારી સેવાઓ,{" "}
          <span className="text-orange-600">સરળ ગુજરાતીમાં</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          રેશન કાર્ડ, i-Khedut, જ્ઞાન શક્તિ, આધાર, જાતિ-આવક પ્રમાણપત્ર અને વધુ —
          બધું પગલે પગલે ગુજરાતીમાં. હંમેશા ચોક્કસ. હંમેશા મફત.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            બધી માર્ગદર્શિકાઓ
          </a>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:border-orange-300 hover:text-orange-600 transition"
          >
            English Version
          </Link>
        </div>
      </section>

      <section id="guides" className="py-10">
        {Object.entries(byCategory).map(([category, guides]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>{CATEGORY_ICONS[category] || "📋"}</span>
              {CATEGORY_LABELS_GU[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/gu/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} વાંચવાનો સમય</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>નોંધ:</strong> CitizenNest એક સ્વતંત્ર માહિતી વેબસાઇટ છે. કોઈ સરકારી સંસ્થા સાથે સંબંધિત નથી.
        </p>
      </div>
    </div>
  );
}

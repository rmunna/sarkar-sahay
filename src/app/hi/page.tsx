import { getAllHindiGuides } from "@/lib/guides-hi";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — भारत सरकारी सेवाओं की स्टेप-बाय-स्टेप गाइड",
  description: "भारत की सरकारी सेवाओं के लिए आसान हिन्दी गाइड — आधार, पैन कार्ड, राशन कार्ड, पासपोर्ट, सरकारी योजनाएँ और बहुत कुछ।",
  openGraph: {
    title: "CitizenNest — भारत सरकारी सेवाओं की स्टेप-बाय-स्टेप गाइड",
    description: "भारत की सरकारी सेवाओं के लिए आसान हिन्दी गाइड।",
    url: `${BASE_URL}/hi`,
    siteName: "CitizenNest",
    locale: "hi_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/hi`,
    languages: {
      en: BASE_URL,
      hi: `${BASE_URL}/hi`,
    },
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Identity Documents": "🪪",
  "Government Schemes": "🏦",
  "Tax & Finance": "💰",
  "Certificates": "📜",
  "Food & Ration": "🍚",
};

const CATEGORY_LABELS_HI: Record<string, string> = {
  "Identity Documents": "पहचान दस्तावेज़",
  "Government Schemes": "सरकारी योजनाएँ",
  "Tax & Finance": "टैक्स और वित्त",
  "Certificates": "प्रमाण पत्र",
  "Food & Ration": "खाद्य और राशन",
};

export default function HindiHome() {
  const allGuides = getAllHindiGuides();

  // Group by category
  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="hi">
      {/* Language Switcher */}
      <div className="flex justify-end mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
        >
          🇬🇧 English
        </Link>
      </div>

      {/* Hero */}
      <section className="text-center py-14 md:py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 font-medium mb-6">
          🇮🇳 सरकारी सेवाओं की भरोसेमंद गाइड
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          सरकारी सेवाएँ,{" "}
          <span className="text-orange-600">आसान भाषा में</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          आधार, पैन कार्ड, पासपोर्ट, राशन कार्ड, सरकारी योजनाएँ — सब कुछ स्टेप-बाय-स्टेप हिन्दी में।
          हमेशा सही जानकारी। हमेशा मुफ़्त।
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            सभी गाइड देखें
          </a>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:border-orange-300 hover:text-orange-600 transition"
          >
            English Version
          </Link>
        </div>
      </section>

      {/* Guides by Category */}
      <section id="guides" className="py-10">
        {Object.entries(byCategory).map(([category, guides]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>{CATEGORY_ICONS[category] || "📋"}</span>
              {CATEGORY_LABELS_HI[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/hi/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} पढ़ने का समय</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Footer note */}
      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>अस्वीकरण:</strong> CitizenNest एक स्वतंत्र सूचनात्मक वेबसाइट है। किसी भी सरकारी संस्था से संबद्ध नहीं है।
        </p>
      </div>
    </div>
  );
}

import { getAllOdiaGuides } from "@/lib/guides-or";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — ଓଡ଼ିଶା ସରକାରୀ ସେବାର ଓଡ଼ିଆ ଗାଇଡ୍",
  description: "ଓଡ଼ିଶା ସରକାରୀ ସେବାର ସହଜ ଓଡ଼ିଆ ଗାଇଡ୍ — ସୁଭଦ୍ରା ଯୋଜନା, KALIA, ବିଜୁ ସ୍ୱାସ୍ଥ୍ୟ କଲ୍ୟାଣ, ଭୂ ଅଭିଲେଖ, ଜାତି ଓ ଆୟ ପ୍ରମାଣପତ୍ର ଏବଂ ଆହୁରି ଅଧିକ।",
  openGraph: {
    title: "CitizenNest — ଓଡ଼ିଶା ସରକାରୀ ସେବାର ଓଡ଼ିଆ ଗାଇଡ୍",
    description: "ଓଡ଼ିଶା ସରକାରୀ ସେବାର ସହଜ ଓଡ଼ିଆ ଗାଇଡ୍।",
    url: `${BASE_URL}/or`,
    siteName: "CitizenNest",
    locale: "or_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/or`,
    languages: {
      en: BASE_URL,
      or: `${BASE_URL}/or`,
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

const CATEGORY_LABELS_OR: Record<string, string> = {
  "Identity Documents": "ପରିଚୟ ଦଲିଲ",
  "Government Schemes": "ସରକାରୀ ଯୋଜନା",
  "State Schemes": "ରାଜ୍ୟ ଯୋଜନା",
  "Tax & Finance": "କର ଓ ଆର୍ଥିକ ସେବା",
  "Certificates": "ପ୍ରମାଣପତ୍ର",
  "Food & Ration": "ଖାଦ୍ୟ ଓ ରେଶନ",
  "Property & Legal": "ସମ୍ପତ୍ତି ଓ ଆଇନ",
};

export default function OdiaHome() {
  const allGuides = getAllOdiaGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="or">
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
          🇮🇳 ଓଡ଼ିଶା ସରକାରୀ ସେବାର ବିଶ୍ୱସ୍ତ ଗାଇଡ୍
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          ସରକାରୀ ସେବା,{" "}
          <span className="text-orange-600">ସହଜ ଓଡ଼ିଆରେ</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ସୁଭଦ୍ରା ଯୋଜନା, KALIA, ବିଜୁ ସ୍ୱାସ୍ଥ୍ୟ କଲ୍ୟାଣ, ଭୂ ଅଭିଲେଖ ଏବଂ ଆହୁରି ଅଧିକ —
          ସବୁ ପଦକ୍ରମରେ ଓଡ଼ିଆରେ। ସର୍ବଦା ସଠିକ। ସର୍ବଦା ମାଗଣା।
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            ସମସ୍ତ ଗାଇଡ୍
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
              {CATEGORY_LABELS_OR[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/or/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} ପଢ଼ିବା ସମୟ</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>ଟିପ୍ପଣୀ:</strong> CitizenNest ଏକ ସ୍ୱାଧୀନ ସୂଚନା ୱେବସାଇଟ୍। କୌଣସି ସରକାରୀ ସଂସ୍ଥା ସହ ସମ୍ପର୍କ ନାହିଁ।
        </p>
      </div>
    </div>
  );
}

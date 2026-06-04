import { getAllBengaliGuides } from "@/lib/guides-bn";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — পশ্চিমবঙ্গ সরকারি সেবার বাংলা গাইড",
  description: "পশ্চিমবঙ্গ সরকারি সেবার সহজ বাংলা গাইড — অন্নপূর্ণা ভান্ডার, যুব শক্তি ভরসা কার্ড, রেশন কার্ড, বাংলার ভূমি, আধার, জাতি ও আয় সার্টিফিকেট এবং আরও অনেক কিছু।",
  openGraph: {
    title: "CitizenNest — পশ্চিমবঙ্গ সরকারি সেবার বাংলা গাইড",
    description: "পশ্চিমবঙ্গ সরকারি সেবার সহজ বাংলা গাইড।",
    url: `${BASE_URL}/bn`,
    siteName: "CitizenNest",
    locale: "bn_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/bn`,
    languages: {
      en: BASE_URL,
      bn: `${BASE_URL}/bn`,
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

const CATEGORY_LABELS_BN: Record<string, string> = {
  "Identity Documents": "পরিচয় দলিল",
  "Government Schemes": "সরকারি প্রকল্প",
  "State Schemes": "রাজ্য প্রকল্প",
  "Tax & Finance": "কর ও আর্থিক সেবা",
  "Certificates": "শংসাপত্র",
  "Food & Ration": "খাদ্য ও রেশন",
  "Property & Legal": "সম্পত্তি ও আইনি",
};

export default function BengaliHome() {
  const allGuides = getAllBengaliGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="bn">
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
          🇮🇳 পশ্চিমবঙ্গ সরকারি সেবার নির্ভরযোগ্য গাইড
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          সরকারি সেবা,{" "}
          <span className="text-orange-600">সহজ বাংলায়</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          অন্নপূর্ণা ভান্ডার, যুব শক্তি ভরসা কার্ড, রেশন কার্ড, বাংলার ভূমি এবং আরও অনেক সেবা —
          ধাপে ধাপে বাংলায়। সবসময় নির্ভুল। সবসময় বিনামূল্যে।
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            সব গাইড দেখুন
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
              {CATEGORY_LABELS_BN[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/bn/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} পড়ার সময়</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>দ্রষ্টব্য:</strong> CitizenNest একটি স্বাধীন তথ্য ওয়েবসাইট। কোনো সরকারি সংস্থার সাথে সম্পর্কিত নয়।
        </p>
      </div>
    </div>
  );
}

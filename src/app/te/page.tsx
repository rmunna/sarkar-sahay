import { getAllTeluguGuides } from "@/lib/guides-te";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — భారత ప్రభుత్వ సేవలకు తెలుగు వెబ్‌సైట్",
  description: "భారత ప్రభుత్వ సేవలకు సులభమైన తెలుగు గైడ్ — ఆధార్, పాన్ కార్డ్, రేషన్ కార్డ్, పాస్పోర్ట్, ప్రభుత్వ పథకాలు మరియు మరిన్ని.",
  openGraph: {
    title: "CitizenNest — భారత ప్రభుత్వ సేవలకు తెలుగు వెబ్‌సైట్",
    description: "భారత ప్రభుత్వ సేవలకు సులభమైన తెలుగు గైడ్.",
    url: `${BASE_URL}/te`,
    siteName: "CitizenNest",
    locale: "te_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/te`,
    languages: {
      en: BASE_URL,
      te: `${BASE_URL}/te`,
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
};

const CATEGORY_LABELS_TE: Record<string, string> = {
  "Identity Documents": "గుర్తింపు పత్రాలు",
  "Government Schemes": "ప్రభుత్వ పథకాలు",
  "State Schemes": "రాష్ట్ర పథకాలు",
  "Tax & Finance": "పన్ను & ఆర్థికం",
  "Certificates": "సర్టిఫికేట్లు",
  "Food & Ration": "ఆహారం & రేషన్",
};

export default function TeluguHome() {
  const allGuides = getAllTeluguGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="te">
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
          🇮🇳 ప్రభుత్వ సేవలకు నమ్మకమైన గైడ్
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          ప్రభుత్వ సేవలు,{" "}
          <span className="text-orange-600">సులభమైన భాషలో</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ఆధార్, పాన్ కార్డ్, పాస్పోర్ట్, రేషన్ కార్డ్, ప్రభుత్వ పథకాలు — అన్నీ దశలవారీగా తెలుగులో.
          ఎల్లప్పుడూ సరైన సమాచారం. ఎల్లప్పుడూ ఉచితంగా.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            అన్ని గైడులు చూడండి
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
              {CATEGORY_LABELS_TE[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/te/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} చదివే సమయం</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>నోటీసు:</strong> CitizenNest ఒక స్వతంత్ర సమాచార వెబ్‌సైట్. ఏ ప్రభుత్వ సంస్థతోనూ అనుబంధించబడలేదు.
        </p>
      </div>
    </div>
  );
}

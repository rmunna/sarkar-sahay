import { getAllTamilGuides } from "@/lib/guides-ta";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — இந்திய அரசு சேவைகளுக்கான தமிழ் வழிகாட்டி",
  description: "இந்திய அரசு சேவைகளுக்கான எளிய தமிழ் வழிகாட்டி — ஆதார், பான் கார்டு, ரேஷன் கார்டு, பாஸ்போர்ட், அரசு திட்டங்கள் மற்றும் பலவும்.",
  openGraph: {
    title: "CitizenNest — இந்திய அரசு சேவைகளுக்கான தமிழ் வழிகாட்டி",
    description: "இந்திய அரசு சேவைகளுக்கான எளிய தமிழ் வழிகாட்டி.",
    url: `${BASE_URL}/ta`,
    siteName: "CitizenNest",
    locale: "ta_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/ta`,
    languages: {
      en: BASE_URL,
      ta: `${BASE_URL}/ta`,
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

const CATEGORY_LABELS_TA: Record<string, string> = {
  "Identity Documents": "அடையாள ஆவணங்கள்",
  "Government Schemes": "அரசு திட்டங்கள்",
  "State Schemes": "மாநில திட்டங்கள்",
  "Tax & Finance": "வரி & நிதி",
  "Certificates": "சான்றிதழ்கள்",
  "Food & Ration": "உணவு & ரேஷன்",
};

export default function TamilHome() {
  const allGuides = getAllTamilGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="ta">
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
          🇮🇳 அரசு சேவைகளுக்கான நம்பகமான வழிகாட்டி
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          அரசு சேவைகள்,{" "}
          <span className="text-orange-600">எளிய மொழியில்</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ஆதார், பான் கார்டு, பாஸ்போர்ட், ரேஷன் கார்டு, அரசு திட்டங்கள் — அனைத்தும் படிப்படியாக தமிழில்.
          எப்போதும் சரியான தகவல். எப்போதும் இலவசம்.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            அனைத்து வழிகாட்டிகளும்
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
              {CATEGORY_LABELS_TA[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/ta/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} படிக்கும் நேரம்</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>அறிவிப்பு:</strong> CitizenNest ஒரு சுயாதீன தகவல் வலைத்தளம். எந்த அரசு நிறுவனத்துடனும் தொடர்பில்லை.
        </p>
      </div>
    </div>
  );
}

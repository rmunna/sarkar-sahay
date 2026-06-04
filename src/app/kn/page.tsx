import { getAllKannadaGuides } from "@/lib/guides-kn";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವೆಗಳಿಗೆ ಕನ್ನಡ ಮಾರ್ಗದರ್ಶಿ",
  description: "ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವೆಗಳಿಗೆ ಸರಳ ಕನ್ನಡ ಮಾರ್ಗದರ್ಶಿ — ಶಕ್ತಿ ಕಾರ್ಡ್, ಗೃಹ ಲಕ್ಷ್ಮಿ, ಯುವ ನಿಧಿ, ಗೃಹ ಜ್ಯೋತಿ, ಸೇವಾ ಸಿಂಧು, ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಭೂಮಿ ದಾಖಲೆ ಮತ್ತು ಇನ್ನಷ್ಟು.",
  openGraph: {
    title: "CitizenNest — ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವೆಗಳಿಗೆ ಕನ್ನಡ ಮಾರ್ಗದರ್ಶಿ",
    description: "ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವೆಗಳಿಗೆ ಸರಳ ಕನ್ನಡ ಮಾರ್ಗದರ್ಶಿ.",
    url: `${BASE_URL}/kn`,
    siteName: "CitizenNest",
    locale: "kn_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/kn`,
    languages: {
      en: BASE_URL,
      kn: `${BASE_URL}/kn`,
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

const CATEGORY_LABELS_KN: Record<string, string> = {
  "Identity Documents": "ಗುರುತಿನ ದಾಖಲೆಗಳು",
  "Government Schemes": "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
  "State Schemes": "ರಾಜ್ಯ ಯೋಜನೆಗಳು",
  "Tax & Finance": "ತೆರಿಗೆ & ಹಣಕಾಸು",
  "Certificates": "ಪ್ರಮಾಣಪತ್ರಗಳು",
  "Food & Ration": "ಆಹಾರ & ರೇಷನ್",
  "Property & Legal": "ಆಸ್ತಿ & ಕಾನೂನು",
};

export default function KannadaHome() {
  const allGuides = getAllKannadaGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="kn">
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
          🇮🇳 ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವೆಗಳ ನಂಬಿಕಾರ್ಹ ಮಾರ್ಗದರ್ಶಿ
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          ಸರ್ಕಾರಿ ಸೇವೆಗಳು,{" "}
          <span className="text-orange-600">ಸರಳ ಕನ್ನಡದಲ್ಲಿ</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ಶಕ್ತಿ ಕಾರ್ಡ್, ಗೃಹ ಲಕ್ಷ್ಮಿ, ಯುವ ನಿಧಿ, ಗೃಹ ಜ್ಯೋತಿ, ಸೇವಾ ಸಿಂಧು ಮತ್ತು ಇನ್ನಷ್ಟು —
          ಎಲ್ಲವನ್ನೂ ಹಂತ ಹಂತವಾಗಿ ಕನ್ನಡದಲ್ಲಿ.
          ಯಾವಾಗಲೂ ನಿಖರ. ಯಾವಾಗಲೂ ಉಚಿತ.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            ಎಲ್ಲಾ ಮಾರ್ಗದರ್ಶಿಗಳು
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
              {CATEGORY_LABELS_KN[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/kn/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} ಓದುವ ಸಮಯ</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>ಸೂಚನೆ:</strong> CitizenNest ಒಂದು ಸ್ವತಂತ್ರ ಮಾಹಿತಿ ವೆಬ್‌ಸೈಟ್. ಯಾವುದೇ ಸರ್ಕಾರಿ ಸಂಸ್ಥೆಯೊಂದಿಗೆ ಸಂಬಂಧ ಹೊಂದಿಲ್ಲ.
        </p>
      </div>
    </div>
  );
}

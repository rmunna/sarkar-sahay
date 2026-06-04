import { getAllMarathiGuides } from "@/lib/guides-mr";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — महाराष्ट्र सरकारी सेवांसाठी मराठी मार्गदर्शिका",
  description: "महाराष्ट्र सरकारी सेवांसाठी सोपी मराठी मार्गदर्शिका — लाडकी बहीण योजना, रेशन कार्ड, जात प्रमाणपत्र, उत्पन्न प्रमाणपत्र, महाजन कार्ड आणि बरेच काही।",
  openGraph: {
    title: "CitizenNest — महाराष्ट्र सरकारी सेवांसाठी मराठी मार्गदर्शिका",
    description: "महाराष्ट्र सरकारी सेवांसाठी सोपी मराठी मार्गदर्शिका।",
    url: `${BASE_URL}/mr`,
    siteName: "CitizenNest",
    locale: "mr_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/mr`,
    languages: {
      en: BASE_URL,
      mr: `${BASE_URL}/mr`,
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

const CATEGORY_LABELS_MR: Record<string, string> = {
  "Identity Documents": "ओळख कागदपत्रे",
  "Government Schemes": "सरकारी योजना",
  "State Schemes": "राज्य योजना",
  "Tax & Finance": "कर व आर्थिक सेवा",
  "Certificates": "प्रमाणपत्रे",
  "Food & Ration": "अन्न व रेशन",
  "Property & Legal": "मालमत्ता व कायदा",
};

export default function MarathiHome() {
  const allGuides = getAllMarathiGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="mr">
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
          🇮🇳 महाराष्ट्र सरकारी सेवांचा विश्वासार्ह मार्गदर्शक
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          सरकारी सेवा,{" "}
          <span className="text-orange-600">सोप्या मराठीत</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          लाडकी बहीण योजना, रेशन कार्ड, जात प्रमाणपत्र, उत्पन्न प्रमाणपत्र आणि बरेच काही —
          सर्व पायऱ्या मराठीत. नेहमी अचूक. नेहमी मोफत.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            सर्व मार्गदर्शिका
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
              {CATEGORY_LABELS_MR[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/mr/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} वाचण्याची वेळ</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>टीप:</strong> CitizenNest एक स्वतंत्र माहिती संकेतस्थळ आहे. कोणत्याही सरकारी संस्थेशी संबंधित नाही.
        </p>
      </div>
    </div>
  );
}

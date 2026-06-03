import { getAllMalayalamGuides } from "@/lib/guides-ml";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "CitizenNest — ഇന്ത്യൻ സർക്കാർ സേവനങ്ങൾക്കുള്ള മലയാളം ഗൈഡ്",
  description: "ഇന്ത്യൻ സർക്കാർ സേവനങ്ങൾക്കുള്ള ലളിതമായ മലയാളം ഗൈഡ് — ആധാർ, പാൻ കാർഡ്, റേഷൻ കാർഡ്, പാസ്പോർട്ട്, സർക്കാർ പദ്ധതികൾ, കൂടുതൽ.",
  openGraph: {
    title: "CitizenNest — ഇന്ത്യൻ സർക്കാർ സേവനങ്ങൾക്കുള്ള മലയാളം ഗൈഡ്",
    description: "ഇന്ത്യൻ സർക്കാർ സേവനങ്ങൾക്കുള്ള ലളിതമായ മലയാളം ഗൈഡ്.",
    url: `${BASE_URL}/ml`,
    siteName: "CitizenNest",
    locale: "ml_IN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/ml`,
    languages: {
      en: BASE_URL,
      ml: `${BASE_URL}/ml`,
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

const CATEGORY_LABELS_ML: Record<string, string> = {
  "Identity Documents": "ഐഡന്റിറ്റി രേഖകൾ",
  "Government Schemes": "സർക്കാർ പദ്ധതികൾ",
  "State Schemes": "സംസ്ഥാന പദ്ധതികൾ",
  "Tax & Finance": "നികുതി & ധനകാര്യം",
  "Certificates": "സർട്ടിഫിക്കറ്റുകൾ",
  "Food & Ration": "ഭക്ഷണം & റേഷൻ",
};

export default function MalayalamHome() {
  const allGuides = getAllMalayalamGuides();

  const byCategory: Record<string, typeof allGuides> = {};
  allGuides.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <div lang="ml">
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
          🇮🇳 സർക്കാർ സേവനങ്ങൾക്കുള്ള വിശ്വസ്ത ഗൈഡ്
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          സർക്കാർ സേവനങ്ങൾ,{" "}
          <span className="text-orange-600">ലളിതമായ ഭാഷയിൽ</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ആധാർ, പാൻ കാർഡ്, പാസ്പോർട്ട്, റേഷൻ കാർഡ്, സർക്കാർ പദ്ധതികൾ — എല്ലാം ഘട്ടം ഘട്ടമായി മലയാളത്തിൽ.
          എപ്പോഴും ശരിയായ വിവരം. എപ്പോഴും സൗജന്യം.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#guides"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            എല്ലാ ഗൈഡുകളും
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
              {CATEGORY_LABELS_ML[category] || category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/ml/guide/${guide.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{guide.description}</p>
                  {guide.readingTime && (
                    <span className="inline-block mt-3 text-xs text-gray-400">{guide.readingTime} വായിക്കാനുള്ള സമയം</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-center py-8 text-sm text-gray-400">
        <p>
          <strong>അറിയിപ്പ്:</strong> CitizenNest ഒരു സ്വതന്ത്ര വിവര വെബ്‌സൈറ്റ് ആണ്. ഒരു സർക്കാർ സ്ഥാപനവുമായി ബന്ധപ്പെട്ടിട്ടില്ല.
        </p>
      </div>
    </div>
  );
}

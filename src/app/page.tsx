import { getAllGuides, getCategories } from "@/lib/guides";

const CATEGORY_ICONS: Record<string, string> = {
  "Identity Documents": "🪪",
  "Government Schemes": "🏦",
  "State Schemes": "🏛️",
  "Tax & Finance": "💰",
  "Jobs & Exams": "📝",
  "Certificates": "📜",
  "Utilities": "💡",
  "Property & Legal": "🏠",
  "Food & Ration": "🍚",
};

export default function Home() {
  const allGuides = getAllGuides();
  const categories = getCategories();
  // Show 12 guides on homepage (sorted alphabetically by title)
  const guides = [...allGuides]
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 12);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-14 md:py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 font-medium mb-6">
          🇮🇳 Trusted by thousands of Indians
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          Government Services,{" "}
          <span className="text-orange-600">Made Simple</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Step-by-step guides for every Indian government service — Aadhaar, PAN,
          Passport, Schemes, Jobs & more. Always accurate. Always free.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="/categories"
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            Browse All Guides
          </a>
          <a
            href="/about"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:border-orange-300 hover:text-orange-600 transition"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <a
                key={cat.name}
                href={`/categories#${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <span className="text-2xl">
                  {CATEGORY_ICONS[cat.name] || "📋"}
                </span>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition text-sm">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {cat.count} {cat.count === 1 ? "guide" : "guides"}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Latest Guides */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Latest Guides
            <span className="text-base font-normal text-gray-400 ml-2">
              ({allGuides.length} total)
            </span>
          </h2>
          <a
            href="/categories"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all {allGuides.length} guides →
          </a>
        </div>
        {guides.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-xl text-gray-400 font-medium">
              Guides are being generated...
            </p>
            <p className="text-gray-400 mt-2">
              Our AI agents are researching and writing. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <a key={guide.slug} href={`/guide/${guide.slug}`} className="guide-card group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{CATEGORY_ICONS[guide.category] || "📋"}</span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {guide.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition mb-2 leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {guide.description}
                  </p>
                  {guide.readingTime && (
                    <div className="text-xs text-gray-400">
                      <span>{guide.readingTime} read</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
            {allGuides.length > 12 && (
              <div className="text-center mt-8">
                <a
                  href="/categories"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
                >
                  View All {allGuides.length} Guides
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Why Trust SarkarSahay?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-bold text-gray-900 mb-2">Verified Information</h3>
            <p className="text-sm text-gray-500">
              Every guide is cross-checked against official .gov.in sources.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-bold text-gray-900 mb-2">Always Updated</h3>
            <p className="text-sm text-gray-500">
              We monitor policy changes and update guides regularly.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-bold text-gray-900 mb-2">Official Links</h3>
            <p className="text-sm text-gray-500">
              Every guide links to the official government website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

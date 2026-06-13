import { getAllGuides, getCategories } from "@/lib/guides";
import { getActiveUpdates } from "@/lib/updates";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

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

// Popular guides — curated from GSC top performers (updated periodically)
const POPULAR_SLUGS = [
  "voter-id-application-rejected-fix",
  "voter-id-download-not-working-fix",
  "yuva-sathi-scheme-west-bengal-status",
  "irctc-login-problems-fix",
  "aadhaar-card-apply-online",
  "pan-card-apply-online",
  "passport-apply-online",
  "nrega-job-card-check-online",
  "ration-card-apply-online",
  "income-tax-return-filing-guide",
  "pm-kisan-samman-nidhi-check-status",
  "rrb-ntpc-exam-guide",
];

export default function Home() {
  const allGuides = getAllGuides();
  const totalGuides = allGuides.length;
  const categories = getCategories();
  // Show popular guides first, fill remaining slots alphabetically
  const popularGuides = POPULAR_SLUGS
    .map((s) => allGuides.find((g) => g.slug === s))
    .filter(Boolean) as typeof allGuides;
  const remainingSlots = 12 - popularGuides.length;
  const fillerGuides = remainingSlots > 0
    ? allGuides
        .filter((g) => !POPULAR_SLUGS.includes(g.slug))
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, remainingSlots)
    : [];
  const guides = [...popularGuides, ...fillerGuides].map(
    ({ slug, title, description, category, readingTime }) => ({
      slug, title, description, category, readingTime,
    })
  );
  const allUpdates = getActiveUpdates();

  return (
    <div>
      {/* Hero */}
      <section className="text-center pt-12 pb-14 md:pt-16 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[var(--line)] rounded-full text-sm text-slate-600 font-medium mb-6 shadow-sm">
          <span className="text-orange-500">●</span> Trusted by lakhs of citizens · {totalGuides.toLocaleString("en-IN")}+ guides
        </div>
        <h1 className="text-4xl md:text-[3.25rem] font-extrabold text-[var(--ink)] mb-5 leading-[1.08] tracking-tight">
          Government services,{" "}
          <span className="text-orange-600">made simple</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Clear, step-by-step guides for every Indian government service — Aadhaar, PAN,
          passport, schemes, jobs and more. Always accurate. Always free.
        </p>
        {/* Search Bar */}
        <div className="mt-8 flex justify-center">
          <SearchBar />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link prefetch={false} href="/eligibility" className="btn-primary">
            🎯 Check scheme eligibility
          </Link>
          <Link prefetch={false} href="/schemes" className="btn-secondary">
            Browse 3,500+ schemes
          </Link>
          <Link prefetch={false} href="/categories" className="btn-secondary">
            All guides
          </Link>
        </div>
      </section>

      {/* Latest Updates */}
      {(() => {
        const updates = getActiveUpdates().slice(0, 6);
        if (updates.length === 0) return null;
        return (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🔴 Latest Job & Exam Updates
              </h2>
              <Link prefetch={false} href="/updates" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {updates.map((u) => (
                <Link prefetch={false}
                  key={u.slug}
                  href={`/update/${u.slug}`}
                  className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-600">{u.organization}</span>
                      {u.vacancies && (
                        <span className="text-xs text-gray-500">
                          {typeof u.vacancies === "number" ? `${u.vacancies.toLocaleString("en-IN")} posts` : u.vacancies}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
                      {u.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{u.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link prefetch={false}
                key={cat.name}
                href={`/categories#${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <span className="text-2xl">
                  {CATEGORY_ICONS[cat.name] || "📋"}
                </span>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition text-sm">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {cat.count} {cat.count === 1 ? "guide" : "guides"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Guides */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🔥 Popular Guides
            <span className="text-base font-normal text-gray-500 ml-2">
              ({totalGuides} total)
            </span>
          </h2>
          <Link prefetch={false}
            href="/categories"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all {totalGuides} guides →
          </Link>
        </div>
        {guides.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-xl text-gray-500 font-medium">
              Guides are being generated...
            </p>
            <p className="text-gray-500 mt-2">
              Our AI agents are researching and writing. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link key={guide.slug} href={`/guide/${guide.slug}`} className="guide-card group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{CATEGORY_ICONS[guide.category] || "📋"}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                    <div className="text-xs text-gray-500">
                      <span>{guide.readingTime} read</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
            {totalGuides > 12 && (
              <div className="text-center mt-8">
                <Link prefetch={false}
                  href="/categories"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
                >
                  View All {totalGuides} Guides
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Why Trust CitizenNest?
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

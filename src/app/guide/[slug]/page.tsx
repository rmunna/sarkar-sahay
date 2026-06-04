import fs from "fs";
import path from "path";
import { getGuideBySlug, getGuideRawContent, getRelatedGuides } from "@/lib/guides";
import TelegramCTA from "@/components/TelegramCTA";
import AdUnit from "@/components/AdUnit";
import TOCSidebar from "@/components/TOCSidebar";
import { getRelatedUpdatesForGuide } from "@/lib/cross-links";
import { getAllHindiGuideSlugs } from "@/lib/guides-hi";
import { getAllTamilGuideSlugs } from "@/lib/guides-ta";
import { getAllMalayalamGuideSlugs } from "@/lib/guides-ml";
import { getAllTeluguGuideSlugs } from "@/lib/guides-te";
import { getAllKannadaGuideSlugs } from "@/lib/guides-kn";
import { generateFAQSchema, generateArticleSchema, generateHowToSchema, extractFAQs } from "@/lib/faq-schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const AD_SLOT_GUIDE = process.env.NEXT_PUBLIC_AD_SLOT_DATA || "";

interface Props {
  params: Promise<{ slug: string }>;
}

// ISR: render on first request, cache for 24 hours. Avoids pre-rendering 1,982 pages at build time.
export const dynamicParams = true;
export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  return []; // No pages pre-rendered at build time — all served via ISR
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${BASE_URL}/guide/${guide.slug}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "en_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/guide/${guide.slug}`,
      languages: {
        en: `${BASE_URL}/guide/${guide.slug}`,
        ...(getAllHindiGuideSlugs().includes(guide.slug) ? { hi: `${BASE_URL}/hi/guide/${guide.slug}` } : {}),
        ...(getAllTamilGuideSlugs().includes(guide.slug) ? { ta: `${BASE_URL}/ta/guide/${guide.slug}` } : {}),
        ...(getAllMalayalamGuideSlugs().includes(guide.slug) ? { ml: `${BASE_URL}/ml/guide/${guide.slug}` } : {}),
        ...(getAllTeluguGuideSlugs().includes(guide.slug) ? { te: `${BASE_URL}/te/guide/${guide.slug}` } : {}),
        ...(getAllKannadaGuideSlugs().includes(guide.slug) ? { kn: `${BASE_URL}/kn/guide/${guide.slug}` } : {}),
      },
    },
  };
}

// Extract headings from HTML for TOC
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    headings.push({ id, text, level: parseInt(match[1]) });
  }
  return headings;
}

// Add IDs to headings in HTML
function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

// Get category color
function getCategoryStyle(category: string): { bg: string; text: string; border: string } {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    "Identity Documents": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "Government Schemes": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "Tax & Finance": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Jobs & Exams": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Certificates": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    "Utilities": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    "Property & Legal": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    "Food & Ration": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  };
  return styles[category] || { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const rawContent = getGuideRawContent(slug);
  const faqs = rawContent ? extractFAQs(rawContent) : [];
  const faqSchema = generateFAQSchema(faqs);
  const howToSchema = rawContent ? generateHowToSchema({ title: guide.title, description: guide.description, slug: guide.slug, rawContent }) : null;
  const articleSchema = generateArticleSchema(guide);
  const headings = extractHeadings(guide.contentHtml);
  const contentWithIds = addHeadingIds(guide.contentHtml);
  const catStyle = getCategoryStyle(guide.category);
  const relatedGuides = getRelatedGuides(slug, 4); // Cap at 4 to avoid orphaned card
  const relatedUpdates = getRelatedUpdatesForGuide(slug, 4);

  // Language availability
  const hasHindi    = getAllHindiGuideSlugs().includes(slug);
  const hasTamil    = getAllTamilGuideSlugs().includes(slug);
  const hasMalayalam = getAllMalayalamGuideSlugs().includes(slug);
  const hasTelugu   = getAllTeluguGuideSlugs().includes(slug);
  const hasKannada  = getAllKannadaGuideSlugs().includes(slug);
  const hasOtherLang = hasHindi || hasTamil || hasMalayalam || hasTelugu || hasKannada;

  // Last modified date from file system
  const guideFilePath = path.join(process.cwd(), `content/guides/${slug}.md`);
  const lastModified = fs.existsSync(guideFilePath)
    ? fs.statSync(guideFilePath).mtime.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: guide.category,
        item: `${BASE_URL}/categories#${guide.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${BASE_URL}/guide/${guide.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Language Switcher — all available languages */}
      {hasOtherLang && (
        <div className="flex justify-end gap-2 mb-4 flex-wrap">
          {hasHindi && (
            <Link
              href={`/hi/guide/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              🇮🇳 हिन्दी
            </Link>
          )}
          {hasTamil && (
            <Link
              href={`/ta/guide/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              🇮🇳 தமிழ்
            </Link>
          )}
          {hasMalayalam && (
            <Link
              href={`/ml/guide/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              🇮🇳 മലയാളം
            </Link>
          )}
          {hasTelugu && (
            <Link
              href={`/te/guide/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              🇮🇳 తెలుగు
            </Link>
          )}
          {hasKannada && (
            <Link
              href={`/kn/guide/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              🇮🇳 ಕನ್ನಡ
            </Link>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-600 transition">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/categories" className="hover:text-orange-600 transition">Guides</Link>
        <span className="mx-2">›</span>
        <Link
          href={`/categories#${guide.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
          className="hover:text-orange-600 transition"
        >
          {guide.category}
        </Link>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
        {/* Main Content */}
        <article className="bg-white rounded-2xl border border-gray-100 border-t-4 border-t-[#0f2744] shadow-sm px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          {/* Header */}
          <header className="mb-8">
            <span className={`category-badge ${catStyle.bg} ${catStyle.text} border ${catStyle.border} mb-4`}>
              {guide.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4 leading-tight">
              {guide.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-5">
              {guide.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                CitizenNest Editorial Team
              </span>
              {guide.readingTime && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {guide.readingTime} read
                </span>
              )}
              {lastModified && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Updated {lastModified}
                </span>
              )}
            </div>
          </header>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>Disclaimer:</strong> This is an independent informational guide.
              We are NOT affiliated with any government body. Always verify on official websites.
            </div>
          </div>

          {/* Quick Links - Official Sites (moved above ad for prominence) */}
          {guide.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Official Links
              </h2>
              <div className="flex flex-wrap gap-2">
                {guide.officialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {new URL(link).hostname.replace("www.", "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mobile TOC — visible only below lg, zero-JS collapsible */}
          {headings.length > 3 && (
            <details className="lg:hidden mb-6 rounded-xl border border-gray-200 bg-gray-50 group">
              <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer select-none list-none flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                  Jump to section
                </span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <nav className="px-4 pb-3 pt-1 space-y-0.5 border-t border-gray-200 mt-0">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-sm text-gray-600 hover:text-orange-600 py-1 transition-colors ${h.level === 3 ? "pl-4 text-xs text-gray-500" : "font-medium"}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </details>
          )}

          {/* Ad — after header info, before content body */}
          <AdUnit slot={AD_SLOT_GUIDE} format="auto" className="mb-8" />

          {/* Article Content */}
          <div
            className="guide-content"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          {/* Ad — after article body */}
          <AdUnit slot={AD_SLOT_GUIDE} format="auto" className="my-8" />

          {/* Latest Updates for this exam/scheme */}
          {relatedUpdates.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Updates</h2>
              <div className="flex flex-col gap-3">
                {relatedUpdates.map((ru) => (
                  <Link
                    key={ru.slug}
                    href={`/update/${ru.slug}`}
                    className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-100 transition group"
                  >
                    <span className="flex-shrink-0 text-xl">
                      {ru.stage === "result" ? "📊" : ru.stage === "admit-card" ? "🎫" : ru.stage === "answer-key" ? "🔑" : ru.stage === "cutoff" ? "📉" : "📢"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 leading-snug truncate">
                        {ru.title}
                      </p>
                      {ru.publishedDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(ru.publishedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <svg className="ml-auto flex-shrink-0 w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Telegram CTA — category-aware copy */}
          <TelegramCTA category={guide.category} />

          {/* Related Guides — 4 guides in 2-col grid (no orphan) */}
          {relatedGuides.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedGuides.map((rg) => (
                  <Link
                    key={rg.slug}
                    href={`/guide/${rg.slug}`}
                    className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition"
                  >
                    <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">
                      {rg.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{rg.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Browse all categories
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition"
            >
              Back to home
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </article>

        {/* Table of Contents Sidebar — client component with scroll-tracking */}
        {headings.length > 3 && (
          <aside className="hidden lg:block">
            <TOCSidebar headings={headings} />
          </aside>
        )}
      </div>
    </>
  );
}

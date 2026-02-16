import { getGuideBySlug, getAllGuideSlugs, getGuideRawContent } from "@/lib/guides";
import { generateFAQSchema, generateArticleSchema, extractFAQs } from "@/lib/faq-schema";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkarsahay.in";
  return {
    title: `${guide.title} — SarkarSahay`,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${BASE_URL}/guide/${guide.slug}`,
      siteName: "SarkarSahay",
      type: "article",
      locale: "en_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/guide/${guide.slug}`,
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
  const articleSchema = generateArticleSchema(guide);
  const headings = extractHeadings(guide.contentHtml);
  const contentWithIds = addHeadingIds(guide.contentHtml);
  const catStyle = getCategoryStyle(guide.category);

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

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-orange-600 transition">Home</a>
        <span className="mx-2">›</span>
        <a href="/categories" className="hover:text-orange-600 transition">Guides</a>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{guide.category}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
        {/* Main Content */}
        <article>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Updated: {guide.lastUpdated}
              </span>
              {guide.readingTime && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {guide.readingTime} read
                </span>
              )}
            </div>
          </header>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>Disclaimer:</strong> This is an independent informational guide.
              We are NOT affiliated with any government body. Always verify on official websites.
            </div>
          </div>

          {/* Quick Links - Official Sites */}
          {guide.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
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

          {/* Article Content */}
          <div
            className="guide-content"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          {/* Bottom navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
            <a
              href="/categories"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Browse all categories
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition"
            >
              Back to home
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </article>

        {/* Table of Contents Sidebar */}
        {headings.length > 3 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                On this page
              </h3>
              <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`toc-link ${heading.level === 3 ? "pl-6 text-xs" : ""}`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

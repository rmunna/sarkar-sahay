import { getOdiaGuideBySlug, getOdiaGuideRawContent, getRelatedOdiaGuides } from "@/lib/guides-or";
import { generateFAQSchema, generateArticleSchema, generateHowToSchema, extractFAQs } from "@/lib/faq-schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getOdiaGuideBySlug(slug);
  if (!guide) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${BASE_URL}/or/guide/${guide.slug}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "or_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/or/guide/${guide.slug}`,
      languages: {
        en: `${BASE_URL}/guide/${guide.slug}`,
        or: `${BASE_URL}/or/guide/${guide.slug}`,
      },
    },
  };
}

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    // Odia Unicode range: ଀-୿
    const id = text.toLowerCase().replace(/[^a-z0-9଀-୿\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
    headings.push({ id, text, level: parseInt(match[1]) });
  }
  return headings;
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText.toLowerCase().replace(/[^a-z0-9଀-୿\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

function getCategoryStyle(category: string): { bg: string; text: string; border: string } {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    "Identity Documents": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "Government Schemes": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "State Schemes": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "Tax & Finance": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Certificates": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    "Food & Ration": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  };
  return styles[category] || { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
}

export default async function OdiaGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getOdiaGuideBySlug(slug);
  if (!guide) notFound();

  const rawContent = getOdiaGuideRawContent(slug);
  const faqs = rawContent ? extractFAQs(rawContent) : [];
  const faqSchema = generateFAQSchema(faqs);
  const howToSchema = rawContent ? generateHowToSchema({ title: guide.title, description: guide.description, slug: guide.slug, rawContent }) : null;
  const articleSchema = generateArticleSchema(guide);
  const headings = extractHeadings(guide.contentHtml);
  const contentWithIds = addHeadingIds(guide.contentHtml);
  const catStyle = getCategoryStyle(guide.category);
  const relatedGuides = getRelatedOdiaGuides(slug, 4);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ହୋମ", item: `${BASE_URL}/or` },
      { "@type": "ListItem", position: 2, name: guide.category, item: `${BASE_URL}/or` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${BASE_URL}/or/guide/${guide.slug}` },
    ],
  };

  return (
    <div lang="or">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="flex justify-end mb-4">
        <Link href={`/guide/${slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition">
          🇬🇧 English
        </Link>
      </div>

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/or" className="hover:text-orange-600 transition">ହୋମ</Link>
        <span className="mx-2">›</span>
        <Link href="/or" className="hover:text-orange-600 transition">ଗାଇଡ୍</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{guide.category}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
        <article className="bg-white rounded-2xl border border-gray-100 border-t-4 border-t-[#0f2744] shadow-sm px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <header className="mb-8">
            <span className={`category-badge ${catStyle.bg} ${catStyle.text} border ${catStyle.border} mb-4`}>
              {guide.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4 leading-tight">{guide.title}</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-5">{guide.description}</p>
            {guide.readingTime && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {guide.readingTime} ପଢ଼ିବା ସମୟ
              </div>
            )}
          </header>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>ଟିପ୍ପଣୀ:</strong> ଏହା ଏକ ସ୍ୱାଧୀନ ତଥ୍ୟ ଗାଇଡ୍। ଆମେ କୌଣସି ସରକାରୀ ସଂସ୍ଥା ସହ ସଂଯୁକ୍ତ ନୁହଁ। ସର୍ବଦା ଅଧିକୃତ ୱେବସାଇଟ୍‌ରେ ଯାଞ୍ଚ କରନ୍ତୁ।
            </div>
          </div>

          {guide.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                ଅଧିକୃତ ଲିଙ୍କ
              </h2>
              <div className="flex flex-wrap gap-2">
                {guide.officialLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {new URL(link).hostname.replace("www.", "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="guide-content" dangerouslySetInnerHTML={{ __html: contentWithIds }} />

          {relatedGuides.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ସମ୍ବନ୍ଧିତ ଗାଇଡ୍</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedGuides.map((rg) => (
                  <Link key={rg.slug} href={`/or/guide/${rg.slug}`}
                    className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition">
                    <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">{rg.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{rg.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
            <Link href="/or" className="text-sm text-gray-500 hover:text-orange-600 transition">← ସମସ୍ତ ଗାଇଡ୍</Link>
            <Link href={`/guide/${slug}`} className="text-sm text-gray-500 hover:text-orange-600 transition">English →</Link>
          </div>
        </article>

        {headings.length > 3 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-[#0f2744] uppercase tracking-wider mb-3">ଏହି ପୃଷ୍ଠାରେ</h3>
              <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {headings.map((heading) => (
                  <a key={heading.id} href={`#${heading.id}`}
                    className={`toc-link ${heading.level === 3 ? "pl-6 text-xs" : ""}`}>
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

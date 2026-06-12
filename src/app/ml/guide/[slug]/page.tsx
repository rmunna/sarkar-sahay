import { getMalayalamGuideBySlug, getMalayalamGuideRawContent, getRelatedMalayalamGuides, getAllMalayalamGuideSlugs } from "@/lib/guides-ml";
import { generateFAQSchema, generateArticleSchema, generateHowToSchema, extractFAQs } from "@/lib/faq-schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllMalayalamGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getMalayalamGuideBySlug(slug);
  if (!guide) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${BASE_URL}/ml/guide/${guide.slug}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "ml_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/ml/guide/${guide.slug}`,
      languages: {
        en: `${BASE_URL}/guide/${guide.slug}`,
        ml: `${BASE_URL}/ml/guide/${guide.slug}`,
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
    const id = text.toLowerCase().replace(/[^a-z0-9ഀ-ൿ\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
    headings.push({ id, text, level: parseInt(match[1]) });
  }
  return headings;
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText.toLowerCase().replace(/[^a-z0-9ഀ-ൿ\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

function getCategoryStyle(category: string): { bg: string; text: string; border: string } {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    "Government Schemes": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "State Schemes": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "Identity Documents": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "Certificates": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  };
  return styles[category] || { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
}

export default async function MalayalamGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getMalayalamGuideBySlug(slug);
  if (!guide) notFound();

  const rawContent = getMalayalamGuideRawContent(slug);
  const faqs = rawContent ? extractFAQs(rawContent) : [];
  const faqSchema = generateFAQSchema(faqs);
  const howToSchema = rawContent ? generateHowToSchema({ title: guide.title, description: guide.description, slug: guide.slug, rawContent }) : null;
  const articleSchema = generateArticleSchema(guide);
  const headings = extractHeadings(guide.contentHtml);
  const contentWithIds = addHeadingIds(guide.contentHtml);
  const catStyle = getCategoryStyle(guide.category);
  const relatedGuides = getRelatedMalayalamGuides(slug, 5);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ഹോം", item: `${BASE_URL}/ml` },
      { "@type": "ListItem", position: 2, name: guide.category, item: `${BASE_URL}/ml` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${BASE_URL}/ml/guide/${guide.slug}` },
    ],
  };

  return (
    <div lang="ml">
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
        <Link href="/ml" className="hover:text-orange-600 transition">ഹോം</Link>
        <span className="mx-2">›</span>
        <Link href="/ml" className="hover:text-orange-600 transition">ഗൈഡ്</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{guide.category}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
        <article>
          <header className="mb-8">
            <span className={`category-badge ${catStyle.bg} ${catStyle.text} border ${catStyle.border} mb-4`}>
              {guide.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4 leading-tight">
              {guide.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-5">{guide.description}</p>
            {guide.readingTime && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {guide.readingTime} വായിക്കാനുള്ള സമയം
              </div>
            )}
          </header>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>അറിയിപ്പ്:</strong> ഇത് ഒരു സ്വതന്ത്ര വിവര ഗൈഡ് ആണ്. ഞങ്ങൾ ഒരു സർക്കാർ സ്ഥാപനവുമായി ബന്ധപ്പെട്ടിട്ടില്ല. ദയവായി എല്ലായ്പ്പോഴും ഔദ്യോഗിക വെബ്‌സൈറ്റ് പരിശോധിക്കുക.
            </div>
          </div>

          {guide.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">ഔദ്യോഗിക ലിങ്കുകൾ</h2>
              <div className="flex flex-wrap gap-2">
                {guide.officialLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition">
                    {new URL(link).hostname.replace("www.", "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="guide-content" dangerouslySetInnerHTML={{ __html: contentWithIds }} />

          {relatedGuides.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ബന്ധപ്പെട്ട ഗൈഡുകൾ</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedGuides.map((rg) => (
                  <Link key={rg.slug} href={`/ml/guide/${rg.slug}`}
                    className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition">
                    <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">{rg.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{rg.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link href="/ml" className="text-sm text-gray-500 hover:text-orange-600 transition">← എല്ലാ ഗൈഡുകളും</Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition">English Home →</Link>
          </div>
        </article>

        {headings.length > 3 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ഈ പേജിൽ</h3>
              <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {headings.map((heading) => (
                  <a key={heading.id} href={`#${heading.id}`} className={`toc-link ${heading.level === 3 ? "pl-6 text-xs" : ""}`}>
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

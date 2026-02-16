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

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  // Generate structured data
  const rawContent = getGuideRawContent(slug);
  const faqs = rawContent ? extractFAQs(rawContent) : [];
  const faqSchema = generateFAQSchema(faqs);
  const articleSchema = generateArticleSchema(guide);

  return (
    <>
      {/* JSON-LD Structured Data */}
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

      <article className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a
            href="/categories"
            className="text-sm font-medium text-orange-600 uppercase mb-2 inline-block hover:underline"
          >
            {guide.category}
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{guide.title}</h1>
          <p className="text-lg text-gray-600 mb-4">{guide.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>📅 Last updated: {guide.lastUpdated}</span>
            {guide.readingTime && <span>⏱️ {guide.readingTime} read</span>}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800">
          ⚠️ <strong>Disclaimer:</strong> This is an independent informational guide. We are
          NOT affiliated with any government body. Always verify details on official
          government websites. Links provided below.
        </div>

        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-orange-600 prose-table:text-sm prose-th:bg-gray-50 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
        />

        {guide.officialLinks.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-bold text-blue-900 mb-3">
              🔗 Official Links
            </h2>
            <ul className="space-y-2">
              {guide.officialLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline text-sm break-all"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related guides suggestion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Found this helpful? Browse more guides on{" "}
            <a href="/categories" className="text-orange-600 hover:underline">
              all categories
            </a>{" "}
            or go back to the{" "}
            <a href="/" className="text-orange-600 hover:underline">
              homepage
            </a>
            .
          </p>
        </div>
      </article>
    </>
  );
}

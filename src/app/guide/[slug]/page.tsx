import { getGuideBySlug, getAllGuideSlugs } from "@/lib/guides";
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
  return {
    title: `${guide.title} — SarkarSahay`,
    description: guide.description,
    keywords: guide.keywords,
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="text-sm font-medium text-orange-600 uppercase mb-2">
          {guide.category}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{guide.title}</h1>
        <p className="text-gray-600 mb-4">{guide.description}</p>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Last updated: {guide.lastUpdated}</span>
          {guide.readingTime && <span>· {guide.readingTime} read</span>}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800">
        ⚠️ <strong>Disclaimer:</strong> This is an independent guide. Always verify details on official government websites. Links provided below.
      </div>

      <div
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-orange-600"
        dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
      />

      {guide.officialLinks.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-3">🔗 Official Links</h2>
          <ul className="space-y-2">
            {guide.officialLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline text-sm"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

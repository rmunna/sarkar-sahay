import { getHindiUpdateBySlug, getAllHindiUpdateSlugs, getRelatedHindiUpdates } from "@/lib/updates-hi";
import TelegramCTA from "@/components/TelegramCTA";
import AdUnit from "@/components/AdUnit";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const AD_SLOT_UPDATE = process.env.NEXT_PUBLIC_AD_SLOT_DATA || "6012591181";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllHindiUpdateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const update = await getHindiUpdateBySlug(slug);
  if (!update) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    title: update.title,
    description: update.description,
    keywords: update.keywords,
    openGraph: {
      title: update.title,
      description: update.description,
      url: `${BASE_URL}/hi/update/${update.slug}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "hi_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/hi/update/${update.slug}`,
      languages: {
        "en-IN": `${BASE_URL}/update/${update.slug}`,
      },
    },
  };
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText
      .toLowerCase()
      .replace(/[^a-z0-9ऀ-ॿ\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

const stageInfo: Record<string, { label: string; icon: string; color: string }> = {
  notification: { label: "अधिसूचना", icon: "📢", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "admit-card": { label: "प्रवेश पत्र", icon: "🎫", color: "bg-purple-100 text-purple-800 border-purple-200" },
  "exam-schedule": { label: "परीक्षा तिथि", icon: "📅", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "answer-key": { label: "उत्तर कुंजी", icon: "🔑", color: "bg-teal-100 text-teal-800 border-teal-200" },
  result: { label: "परिणाम", icon: "📊", color: "bg-green-100 text-green-800 border-green-200" },
  cutoff: { label: "कट ऑफ", icon: "📉", color: "bg-rose-100 text-rose-800 border-rose-200" },
  eligibility: { label: "पात्रता", icon: "✅", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  salary: { label: "वेतन", icon: "💰", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  syllabus: { label: "पाठ्यक्रम", icon: "📚", color: "bg-sky-100 text-sky-800 border-sky-200" },
  registration: { label: "आवेदन", icon: "📝", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

export default async function HindiUpdatePage({ params }: Props) {
  const { slug } = await params;
  const update = await getHindiUpdateBySlug(slug);
  if (!update) notFound();

  const contentWithIds = addHeadingIds(update.contentHtml);
  const relatedUpdates = getRelatedHindiUpdates(slug, 5);
  const stage = stageInfo[update.stage] || stageInfo["notification"];
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: update.title,
    description: update.description,
    datePublished: update.publishedDate,
    inLanguage: "hi-IN",
    author: { "@type": "Organization", name: "CitizenNest", url: BASE_URL },
    publisher: { "@type": "Organization", name: "CitizenNest", url: BASE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/hi" className="hover:text-orange-600 transition">होम</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{update.organization}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10 items-start">
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${stage.color}`}>
                {stage.icon} {stage.label}
              </span>
              <span className="text-xs text-gray-400">{update.organization}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {update.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              {update.description}
            </p>
            {update.readingTime && (
              <span className="text-sm text-gray-400">पढ़ने का समय: {update.readingTime}</span>
            )}
          </header>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>अस्वीकरण:</strong> यह एक स्वतंत्र सूचनात्मक मार्गदर्शिका है।
              हम {update.organization} या किसी सरकारी संस्था से संबद्ध नहीं हैं। आवेदन से पहले सदैव आधिकारिक वेबसाइट पर सत्यापन करें।
            </div>
          </div>

          {/* Official Links */}
          {update.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">
                आधिकारिक लिंक
              </h2>
              <div className="flex flex-wrap gap-2">
                {update.officialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition"
                  >
                    {(() => { try { return new URL(link).hostname.replace("www.", ""); } catch { return link; } })()}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Ad */}
          <AdUnit slot={AD_SLOT_UPDATE} format="horizontal" className="mb-8" />

          {/* Content */}
          <div
            className="guide-content"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          <AdUnit slot={AD_SLOT_UPDATE} format="auto" className="my-8" />

          <TelegramCTA />

          {/* Related Hindi Updates */}
          {relatedUpdates.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">संबंधित जानकारी</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedUpdates.map((ru) => {
                  const ruStage = stageInfo[ru.stage] || stageInfo["notification"];
                  return (
                    <Link
                      key={ru.slug}
                      href={`/hi/update/${ru.slug}`}
                      className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${ruStage.color}`}>
                          {ruStage.icon} {ruStage.label}
                        </span>
                        <span className="text-xs text-gray-400">{ru.organization}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug">{ru.title}</h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between gap-4">
            <Link href="/hi" className="text-sm text-gray-500 hover:text-orange-600 transition">
              ← होम
            </Link>
            <Link href={`/update/${slug}`} className="text-sm text-gray-500 hover:text-orange-600 transition">
              English →
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}

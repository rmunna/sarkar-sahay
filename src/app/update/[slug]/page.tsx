import { getUpdateBySlug, getAllUpdateSlugs, getUpdateRawContent, getRelatedUpdates } from "@/lib/updates";
import { generateFAQSchema, extractFAQs } from "@/lib/faq-schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllUpdateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const update = await getUpdateBySlug(slug);
  if (!update) return {};
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citizennest.com";
  return {
    title: update.title,
    description: update.description,
    keywords: update.keywords,
    openGraph: {
      title: update.title,
      description: update.description,
      url: `${BASE_URL}/update/${update.slug}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "en_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/update/${update.slug}`,
    },
  };
}

// Add IDs to headings in HTML
function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

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

// Format date for display
function formatDate(dateStr: string): string {
  if (!dateStr) return "TBA";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// Date label display names
const dateLabels: Record<string, string> = {
  notificationDate: "Notification Date",
  lastDateToApply: "Last Date to Apply",
  lastDateFeePayment: "Last Date for Fee Payment",
  examDate: "Exam Date",
  admitCardDate: "Admit Card Available",
  resultDate: "Result Date",
  interviewDate: "Interview Date",
  documentVerificationDate: "Document Verification",
};

// Stage display info
const stageInfo: Record<string, { label: string; icon: string; color: string }> = {
  notification: { label: "Notification", icon: "📢", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "admit-card": { label: "Admit Card", icon: "🎫", color: "bg-purple-100 text-purple-800 border-purple-200" },
  "exam-schedule": { label: "Exam Schedule", icon: "📅", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "answer-key": { label: "Answer Key", icon: "🔑", color: "bg-teal-100 text-teal-800 border-teal-200" },
  result: { label: "Result", icon: "📊", color: "bg-green-100 text-green-800 border-green-200" },
  cutoff: { label: "Cutoff", icon: "📉", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

// Status badge
function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-100 text-green-800 border-green-200" };
    case "expired":
      return { label: "Expired", className: "bg-gray-100 text-gray-600 border-gray-200" };
    case "superseded":
      return { label: "Updated", className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  }
}

export default async function UpdatePage({ params }: Props) {
  const { slug } = await params;
  const update = await getUpdateBySlug(slug);
  if (!update) notFound();

  const rawContent = getUpdateRawContent(slug);
  const faqs = rawContent ? extractFAQs(rawContent) : [];
  const faqSchema = generateFAQSchema(faqs);
  const headings = extractHeadings(update.contentHtml);
  const contentWithIds = addHeadingIds(update.contentHtml);
  const relatedUpdates = getRelatedUpdates(slug, 5);
  const stage = stageInfo[update.stage] || stageInfo["notification"];
  const statusBadge = getStatusBadge(update.status);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citizennest.com";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: update.title,
    description: update.description,
    datePublished: update.publishedDate,
    publisher: {
      "@type": "Organization",
      name: "CitizenNest",
      url: BASE_URL,
    },
    mainEntityOfPage: `${BASE_URL}/update/${update.slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Updates", item: `${BASE_URL}/updates` },
      { "@type": "ListItem", position: 3, name: update.organization, item: `${BASE_URL}/updates` },
      { "@type": "ListItem", position: 4, name: update.title, item: `${BASE_URL}/update/${update.slug}` },
    ],
  };

  // JobPosting schema for government job notifications
  const jobPostingSchema = (update.category === "Government Jobs" && update.type === "notification") ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: update.examName || update.title,
    description: update.description,
    datePosted: update.publishedDate,
    validThrough: update.importantDates?.lastDateToApply || update.expiryDate || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: update.organization,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    },
    employmentType: "FULL_TIME",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
  } : null;

  // Important dates for display
  const dates = Object.entries(update.importantDates || {}).filter(
    ([, val]) => val && val !== "" && val !== "TBA" && val !== "null"
  );

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-600 transition">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/updates" className="hover:text-orange-600 transition">Updates</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{update.organization}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">
        {/* Main Content */}
        <article>
          {/* Header */}
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${stage.color}`}>
                {stage.icon} {stage.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              <span className="text-xs text-gray-400">{update.organization}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {update.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              {update.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {update.readingTime && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {update.readingTime} read
                </span>
              )}
              {update.publishedDate && (
                <span>Published: {formatDate(update.publishedDate)}</span>
              )}
              {update.vacancies && (
                <span className="font-semibold text-orange-600">
                  {typeof update.vacancies === "number"
                    ? `${update.vacancies.toLocaleString("en-IN")} Vacancies`
                    : update.vacancies}
                </span>
              )}
            </div>
          </header>

          {/* Expired Warning */}
          {update.status === "expired" && (
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6 text-sm text-gray-600 flex gap-3">
              <span className="text-lg leading-none mt-0.5">⏰</span>
              <div>
                <strong>This update has expired.</strong> The application deadline has passed.
                Check for the latest notification from {update.organization}.
              </div>
            </div>
          )}

          {/* Important Dates Card */}
          {dates.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-orange-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                📅 Important Dates
              </h2>
              <div className="grid gap-2">
                {dates.map(([key, val]) => {
                  const label = dateLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                  const isUpcoming = val && new Date(val) > new Date();
                  return (
                    <div
                      key={key}
                      className={`flex justify-between items-center py-1.5 px-3 rounded-lg ${isUpcoming ? "bg-white border border-orange-100" : "bg-orange-50"}`}
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className={`text-sm font-semibold ${isUpcoming ? "text-orange-700" : "text-gray-600"}`}>
                        {formatDate(val!)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <strong>Disclaimer:</strong> This is an independent informational guide.
              We are NOT affiliated with {update.organization} or any government body. Always verify on official websites before applying.
            </div>
          </div>

          {/* Official Links */}
          {update.officialLinks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Official Links
              </h2>
              <div className="flex flex-wrap gap-2">
                {update.officialLinks.map((link, i) => (
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
                    {(() => { try { return new URL(link).hostname.replace("www.", ""); } catch { return link; } })()}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stage Navigation — related stages of the same exam */}
          {update.relatedStages && update.relatedStages.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                📋 {update.examName} — All Stages
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-700`}>
                  {stage.icon} {stage.label} (Current)
                </span>
                {update.relatedStages.map((rs) => {
                  const rsInfo = stageInfo[rs.stage] || stageInfo["notification"];
                  const isAvailable = rs.status === "available" || rs.status === "active";
                  return isAvailable ? (
                    <Link
                      key={rs.slug}
                      href={`/update/${rs.slug}`}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition"
                    >
                      {rsInfo.icon} {rsInfo.label}
                    </Link>
                  ) : (
                    <span
                      key={rs.slug}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-400"
                    >
                      {rsInfo.icon} {rsInfo.label} (Upcoming)
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Article Content */}
          <div
            className="guide-content"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          {/* Related Updates */}
          {relatedUpdates.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Updates</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedUpdates.map((ru) => {
                  const ruStage = stageInfo[ru.stage] || stageInfo["notification"];
                  return (
                    <Link
                      key={ru.slug}
                      href={`/update/${ru.slug}`}
                      className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${ruStage.color}`}>
                          {ruStage.icon} {ruStage.label}
                        </span>
                        <span className="text-xs text-gray-400">{ru.organization}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">
                        {ru.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{ru.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
            <Link
              href="/updates"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All updates
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

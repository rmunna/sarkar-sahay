import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchemeBySlug, getAllSchemeSlugs, getRelatedSchemes, getGuideForScheme, getSchemeDetail, isRichDetail, hasHindiScheme } from "@/lib/schemes-data";
import { getGuideMeta } from "@/lib/guides";
import { renderMarkdown } from "@/lib/markdown";
import TOCSidebar from "@/components/TOCSidebar";

export const dynamicParams = false;
// Fully static: rich scheme pages serve direct from the edge (no Worker 503s),
// like the rest of the prerendered content.

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSchemeSlugs().map((slug) => ({ slug }));
}

function stateLabel(slug: string | null) {
  if (!slug) return "All India";
  return slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function catLabel(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Markdown → plain text (for FAQ answers, reading-time, meta). */
function toText(md?: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** myScheme's "how to apply" text crams every "Step N:" onto consecutive lines
 * with only single newlines, so Markdown renders them as ONE paragraph. Force a
 * paragraph break before each step marker (English "Step 3" / Hindi "चरण 3") so
 * they render as a clean, scannable list. */
function normalizeSteps(md?: string): string {
  return (md || "")
    .replace(/\r/g, "")
    .replace(/[ \t]*\n*[ \t]*(\**\s*(?:Step|चरण)\s*\d+\s*[:.)।])/gi, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Build real, data-backed FAQs from the scheme detail (no fabrication —
 * every answer comes from the scheme's own fields). Powers visible Q&A +
 * FAQPage schema, the biggest gap vs. the top-ranked guides. */
function buildFaqs(name: string, where: string, level: string, detail: import("@/lib/schemes-data").SchemeFullDetail | null) {
  if (!detail) return [] as { q: string; a: string }[];
  const faqs: { q: string; a: string }[] = [];
  const ben = toText(detail.benefitsMd);
  const elig = toText(detail.eligibilityMd);
  const apply = toText(detail.applicationMd);
  if (detail.briefDescription) faqs.push({ q: `What is the ${name} scheme?`, a: detail.briefDescription });
  if (ben) faqs.push({ q: `What benefits does ${name} provide?`, a: ben.slice(0, 600) });
  if (elig) faqs.push({ q: `Who is eligible for ${name}?`, a: elig.slice(0, 600) });
  if (apply) faqs.push({ q: `How do I apply for ${name}?`, a: `${detail.applicationMode ? detail.applicationMode + " application. " : ""}${apply.slice(0, 600)}` });
  if (detail.nodalDept) faqs.push({ q: `Which department runs ${name}?`, a: `${name} is administered by ${detail.nodalDept}.` });
  faqs.push({ q: `Is ${name} a central or state scheme?`, a: level === "state" ? `${name} is a state government scheme for ${where}.` : `${name} is a central government scheme available across India.` });
  return faqs.slice(0, 6);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) return {};
  const detail = getSchemeDetail(s.msSlug ?? slug);
  const where = s.level === "state" ? stateLabel(s.state) : "India";
  // Front-load the high-intent keyword ("How to Apply") and use the short name
  // so it survives Google's ~60-char title truncation. Full name stays in H1.
  const shortName = s.name.length <= 42 ? s.name : (s.name.split(/\s+[-–—:]\s*/)[0].trim() || s.name);
  const title = `${shortName}: How to Apply, Eligibility & Benefits (${where})`;
  const description = (detail?.briefDescription || s.benefitSummary || `${s.name}: eligibility, benefits and how to apply.`).slice(0, 160);
  // Index only when the page carries real content (benefits + eligibility);
  // thin/un-ingested schemes stay noindex,follow to avoid scaled-content penalty.
  const rich = isRichDetail(detail) || s.source !== "myscheme";
  // Link to the Hindi version only when a real Hindi page exists for this scheme.
  const hasHi = hasHindiScheme(slug);
  return {
    title,
    description,
    robots: rich ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `https://www.citizennest.com/scheme/${slug}`,
      ...(hasHi ? { languages: {
        en: `https://www.citizennest.com/scheme/${slug}`,
        hi: `https://www.citizennest.com/hi/scheme/${slug}`,
      } } : {}),
    },
    openGraph: { title, description, url: `https://www.citizennest.com/scheme/${slug}`, siteName: "CitizenNest", locale: "en_IN" },
  };
}

export default async function SchemePage({ params }: Props) {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) notFound();

  const where = s.level === "state" ? stateLabel(s.state) : "All India";
  const detail = getSchemeDetail(s.msSlug ?? slug);
  // short, readable name for keyword-rich section headings (full name can be long)
  const shortName = s.name.length <= 38 ? s.name : (s.name.split(/\s+[-–—:]\s*/)[0].trim() || s.name);
  const d = s.detail || {};
  const tags = (detail ? [] : (d.tags || s.categories || [])).filter(Boolean);
  const related = getRelatedSchemes(s, 10);
  const guideSlug = getGuideForScheme(slug);
  const guide = guideSlug ? getGuideMeta(guideSlug) : null;

  // render the myScheme markdown fields (rich content) to HTML
  const [aboutHtml, benefitsHtml, eligHtml, exclHtml, applyHtml] = await Promise.all([
    renderMarkdown(detail?.descriptionMd),
    renderMarkdown(detail?.benefitsMd),
    renderMarkdown(detail?.eligibilityMd),
    renderMarkdown(detail?.exclusionsMd),
    renderMarkdown(normalizeSteps(detail?.applicationMd)),
  ]);
  const nodalDept = detail?.nodalDept || d.ministry || null;
  const beneficiary = detail?.schemeFor || d.schemeFor || null;
  const officialUrl = detail?.references?.[0]?.url || s.officialLink;

  const faqs = buildFaqs(s.name, where, s.level, detail);
  // reading time + freshness from the real content
  const words = [detail?.descriptionMd, detail?.benefitsMd, detail?.eligibilityMd, detail?.applicationMd]
    .map(toText).join(" ").split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(2, Math.round(words / 200));
  const updated = detail?.fetchedAt
    ? new Date(detail.fetchedAt + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;
  // "on this page" sections that actually rendered
  const toc = [
    aboutHtml && ["about", `What is ${shortName}?`],
    benefitsHtml && ["benefits", `${shortName} Benefits`],
    ["facts", "Quick facts"],
    ["eligibility", `${shortName} Eligibility`],
    exclHtml && ["exclusions", "Who is not eligible"],
    ["apply", `How to apply for ${shortName}`],
    faqs.length > 0 && ["faqs", `${shortName} FAQs`],
  ].filter(Boolean) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "Schemes", item: "https://www.citizennest.com/schemes" },
          { "@type": "ListItem", position: 3, name: s.name, item: `https://www.citizennest.com/scheme/${slug}` },
        ],
      },
      {
        "@type": "GovernmentService",
        name: s.name,
        description: detail?.briefDescription || s.benefitSummary,
        serviceType: (s.categories || [s.schemeCategory]).join(", "),
        areaServed: where,
        provider: { "@type": "GovernmentOrganization", name: nodalDept || "Government of India" },
      },
      ...(faqs.length > 0 ? [{
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }] : []),
      ...(detail?.applicationMd ? [{
        "@type": "HowTo",
        name: `How to apply for ${s.name}`,
        step: toText(detail.applicationMd).split(/(?=Step\s*\d+)/i).map(t => t.trim()).filter(t => t.length > 8).slice(0, 12)
          .map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t.slice(0, 300) })),
      }] : []),
    ],
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-500 mb-5 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-blue-600">Home</Link><span>/</span>
        <Link href="/schemes" className="hover:text-blue-600">Schemes</Link><span>/</span>
        <span className="text-gray-800 line-clamp-1">{s.name}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">
        <article className="min-w-0 bg-white rounded-2xl border border-gray-100 border-t-4 border-t-[#0f2744] shadow-sm px-6 py-8 sm:px-8 lg:px-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{s.name}</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">{where}</span>
        <span className="rounded-full bg-gray-100 text-gray-700 px-2.5 py-1">{catLabel(s.schemeCategory)}</span>
        {s.level === "central" && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">Central scheme</span>}
        {detail?.benefitType && <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-1">{detail.benefitType}</span>}
        {beneficiary && <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1">For: {beneficiary}</span>}
      </div>

      {/* Freshness + reading time */}
      {detail && (
        <p className="mt-3 text-xs text-gray-400">
          {readMins} min read{updated ? ` · Updated ${updated}` : ""} · Sourced from myScheme (Govt. of India)
        </p>
      )}

      {/* On this page — mobile only (desktop uses the sticky sidebar) */}
      {toc.length > 2 && (
        <details className="lg:hidden mt-5 rounded-xl border border-gray-200 bg-gray-50 group">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">On this page</summary>
          <ul className="px-4 pb-3 space-y-1 text-sm">
            {toc.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="text-blue-600 hover:underline">{label}</a></li>
            ))}
          </ul>
        </details>
      )}

      {/* About */}
      {(aboutHtml || s.benefitSummary) && (
        <section id="about" className="mt-6 scroll-mt-20">
          <h2 className="sec-h2">What is {shortName}?</h2>
          {aboutHtml
            ? <div className="guide-content" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
            : <p className="text-gray-800 leading-relaxed">{s.benefitSummary}</p>}
        </section>
      )}

      {/* Benefits */}
      {benefitsHtml && (
        <section id="benefits" className="mt-6 scroll-mt-20">
          <h2 className="sec-h2">{shortName} Benefits</h2>
          <div className="guide-content" dangerouslySetInnerHTML={{ __html: benefitsHtml }} />
        </section>
      )}

      {/* Full step-by-step guide, where we have one */}
      {guide && (
        <Link href={`/guide/${guideSlug}`} className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 hover:bg-blue-100 transition">
          <span className="text-xl">📖</span>
          <span>
            <span className="block text-sm font-semibold text-blue-900">Read our full step-by-step guide</span>
            <span className="block text-sm text-blue-800/80 mt-0.5">{guide.title} →</span>
          </span>
        </Link>
      )}

      {/* Quick facts */}
      <section id="facts" className="mt-6 scroll-mt-20">
        <h2 className="sec-h2">{shortName} — Quick Facts</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {nodalDept && <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 w-44 align-top">Nodal Ministry / Dept</td><td className="px-4 py-3 text-gray-900">{nodalDept}</td></tr>}
              <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">Coverage</td><td className="px-4 py-3 text-gray-900">{s.level === "state" ? `State scheme — ${where}` : "Central (All India)"}</td></tr>
              <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">Category</td><td className="px-4 py-3 text-gray-900">{(s.categories || [s.schemeCategory]).map(catLabel).join(", ")}</td></tr>
              {detail?.benefitType && <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">Benefit type</td><td className="px-4 py-3 text-gray-900">{detail.benefitType}</td></tr>}
              {beneficiary && <tr><td className="px-4 py-3 font-medium text-gray-600 align-top">Beneficiary</td><td className="px-4 py-3 text-gray-900">{beneficiary}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className="mt-6 scroll-mt-20">
        <h2 className="sec-h2">{shortName} Eligibility — Who Can Apply?</h2>
        {eligHtml
          ? <div className="guide-content" dangerouslySetInnerHTML={{ __html: eligHtml }} />
          : s.eligibility?.otherRequirements?.length
            ? <ul className="list-disc pl-5 text-gray-800 space-y-1">{s.eligibility.otherRequirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
            : <p className="text-gray-700">Eligibility depends on your age, income, category and state. Use our <Link href="/eligibility" className="text-blue-600 font-medium hover:underline">free eligibility checker</Link> or the official page for full criteria.</p>}
      </section>

      {/* Exclusions */}
      {exclHtml && (
        <section id="exclusions" className="mt-6 scroll-mt-20">
          <h2 className="sec-h2">Who is Not Eligible for {shortName}?</h2>
          <div className="guide-content" dangerouslySetInnerHTML={{ __html: exclHtml }} />
        </section>
      )}

      {/* How to apply */}
      <section id="apply" className="mt-6 scroll-mt-20">
        <h2 className="sec-h2">How to Apply for {shortName}{detail?.applicationMode ? ` (${detail.applicationMode})` : ""}</h2>
        {applyHtml && <div className="guide-content" dangerouslySetInnerHTML={{ __html: applyHtml }} />}
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/eligibility" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Check your eligibility →</Link>
        </div>
      </section>

      {/* Official references */}
      {detail?.references && detail.references.length > 0 && (
        <section className="mt-6">
          <h2 className="sec-h2 !text-xl">Official sources</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {detail.references.slice(0, 5).map((r, i) => (
              <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{r.title || r.url}</a></li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQs — real Q&A from the scheme data (FAQPage schema above) */}
      {faqs.length > 0 && (
        <section id="faqs" className="mt-8 scroll-mt-20">
          <h2 className="sec-h2">{shortName} — Frequently Asked Questions</h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {faqs.map((f, i) => (
              <details key={i} open className="group p-4">
                <summary className="cursor-pointer list-none font-medium text-gray-900 flex items-start justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition shrink-0">▾</span>
                </summary>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.slice(0, 12).map((t) => <span key={t} className="text-xs rounded bg-gray-100 text-gray-600 px-2 py-1">{t}</span>)}
        </div>
      )}

      {/* Related — internal links, keeps the page useful + spreads equity */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="sec-h2">
            Related {catLabel(s.schemeCategory).toLowerCase()} schemes{s.state ? ` in ${where}` : ""}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {related.map((r) => (
              <li key={r.slug ?? r.id}>
                <Link href={`/scheme/${r.slug ?? r.id}`} className="text-sm text-blue-700 hover:underline">{r.name}</Link>
              </li>
            ))}
          </ul>
          <Link href="/schemes" className="mt-3 inline-block text-sm text-gray-500 hover:underline">Browse all government schemes →</Link>
        </section>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Scheme information sourced from the Government of India&apos;s myScheme portal and official department sources.
        Always confirm eligibility and apply via the official scheme page. CitizenNest is an independent platform.
      </p>
        </article>

        {/* Sticky right-rail TOC (desktop), like the guides */}
        <aside className="hidden lg:block">
          <TOCSidebar headings={toc.map(([id, text]) => ({ id, text, level: 2 }))} />
        </aside>
      </div>
    </main>
  );
}

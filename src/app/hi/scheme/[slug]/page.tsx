import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchemeBySlug, getTopHindiSchemeSlugs, getRelatedSchemes, getGuideForScheme, getSchemeDetail } from "@/lib/schemes-data";
import { renderMarkdown } from "@/lib/markdown";
import TOCSidebar from "@/components/TOCSidebar";

export const dynamicParams = false;
// Fully static, like the English scheme pages — served direct from the edge.

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getTopHindiSchemeSlugs().map((slug) => ({ slug }));
}

function stateLabel(slug: string | null) {
  if (!slug) return "पूरे भारत";
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

/** Force a paragraph break before each step marker ("Step N" / "चरण N") so the
 * how-to-apply steps render as separate, scannable blocks instead of one run-on
 * paragraph (myScheme sends them with only single newlines). */
function normalizeSteps(md?: string): string {
  return (md || "")
    .replace(/\r/g, "")
    .replace(/[ \t]*\n*[ \t]*(\**\s*(?:Step|चरण)\s*\d+\s*[:.)।])/gi, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Real, data-backed Hindi FAQs (every answer comes from the scheme's own
 * Hindi fields — no fabrication). Powers visible Q&A + FAQPage schema. */
function buildFaqs(name: string, where: string, level: string, detail: import("@/lib/schemes-data").SchemeFullDetail | null) {
  if (!detail) return [] as { q: string; a: string }[];
  const faqs: { q: string; a: string }[] = [];
  const ben = toText(detail.benefitsMd);
  const elig = toText(detail.eligibilityMd);
  const apply = toText(detail.applicationMd);
  if (detail.briefDescription) faqs.push({ q: `${name} योजना क्या है?`, a: detail.briefDescription });
  if (ben) faqs.push({ q: `${name} के तहत क्या लाभ मिलते हैं?`, a: ben.slice(0, 600) });
  if (elig) faqs.push({ q: `${name} के लिए कौन पात्र है?`, a: elig.slice(0, 600) });
  if (apply) faqs.push({ q: `${name} के लिए आवेदन कैसे करें?`, a: `${detail.applicationMode ? detail.applicationMode + " आवेदन। " : ""}${apply.slice(0, 600)}` });
  if (detail.nodalDept) faqs.push({ q: `${name} किस विभाग द्वारा चलाई जाती है?`, a: `${name} का संचालन ${detail.nodalDept} द्वारा किया जाता है।` });
  faqs.push({ q: `क्या ${name} केंद्रीय या राज्य योजना है?`, a: level === "state" ? `${name} ${where} के लिए एक राज्य सरकार की योजना है।` : `${name} एक केंद्र सरकार की योजना है जो पूरे भारत में उपलब्ध है।` });
  return faqs.slice(0, 6);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) return {};
  const detail = getSchemeDetail(s.msSlug ?? slug, "hi");
  const where = s.level === "state" ? stateLabel(s.state) : "भारत";
  // Mirror the guide title pattern (short handle so it survives SERP truncation).
  let handle = s.name.length <= 42 ? s.name : (s.name.split(/\s+[-–—:]\s*/)[0].trim() || s.name);
  if (handle.length > 30 && detail?.shortTitle) {
    const stt = detail.shortTitle.trim().replace(/\s*-\s*/g, "-");
    if (stt.includes("-") && stt.length <= 12) handle = stt;
  }
  const place = s.level === "state" ? `${where} ` : "";
  const title = `${handle} ऑनलाइन आवेदन — स्टेप-बाय-स्टेप ${place}गाइड`;
  const description = (detail?.briefDescription || s.benefitSummary || `${s.name}: पात्रता, लाभ और आवेदन प्रक्रिया।`).slice(0, 160);
  const BASE_URL = "https://www.citizennest.com";
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/hi/scheme/${slug}`,
      languages: {
        en: `${BASE_URL}/scheme/${slug}`,
        hi: `${BASE_URL}/hi/scheme/${slug}`,
      },
    },
    openGraph: { title, description, url: `${BASE_URL}/hi/scheme/${slug}`, siteName: "CitizenNest", locale: "hi_IN" },
  };
}

export default async function HindiSchemePage({ params }: Props) {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) notFound();

  const where = s.level === "state" ? stateLabel(s.state) : "पूरे भारत";
  const detail = getSchemeDetail(s.msSlug ?? slug, "hi");
  const shortName = s.name.length <= 38 ? s.name : (s.name.split(/\s+[-–—:]\s*/)[0].trim() || s.name);
  const related = getRelatedSchemes(s, 10);
  const guideSlug = getGuideForScheme(slug);

  const [aboutHtml, benefitsHtml, eligHtml, exclHtml, applyHtml] = await Promise.all([
    renderMarkdown(detail?.descriptionMd),
    renderMarkdown(detail?.benefitsMd),
    renderMarkdown(detail?.eligibilityMd),
    renderMarkdown(detail?.exclusionsMd),
    renderMarkdown(normalizeSteps(detail?.applicationMd)),
  ]);
  const nodalDept = detail?.nodalDept || null;
  const beneficiary = detail?.schemeFor || null;

  const faqs = buildFaqs(s.name, where, s.level, detail);
  const words = [detail?.descriptionMd, detail?.benefitsMd, detail?.eligibilityMd, detail?.applicationMd]
    .map(toText).join(" ").split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(2, Math.round(words / 200));
  const updated = detail?.fetchedAt
    ? new Date(detail.fetchedAt + "T00:00:00Z").toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const toc = [
    aboutHtml && ["about", `${shortName} क्या है?`],
    benefitsHtml && ["benefits", `${shortName} के लाभ`],
    ["facts", "मुख्य तथ्य"],
    ["eligibility", "पात्रता"],
    exclHtml && ["exclusions", "कौन पात्र नहीं है"],
    ["apply", "आवेदन कैसे करें"],
    faqs.length > 0 && ["faqs", "अक्सर पूछे जाने वाले प्रश्न"],
  ].filter(Boolean) as [string, string][];

  const BASE_URL = "https://www.citizennest.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "होम", item: `${BASE_URL}/hi` },
          { "@type": "ListItem", position: 2, name: "योजनाएँ", item: `${BASE_URL}/schemes` },
          { "@type": "ListItem", position: 3, name: s.name, item: `${BASE_URL}/hi/scheme/${slug}` },
        ],
      },
      {
        "@type": "GovernmentService",
        name: s.name,
        description: detail?.briefDescription || s.benefitSummary,
        serviceType: (s.categories || [s.schemeCategory]).join(", "),
        areaServed: where,
        provider: { "@type": "GovernmentOrganization", name: nodalDept || "भारत सरकार" },
        inLanguage: "hi",
      },
      ...(faqs.length > 0 ? [{
        "@type": "FAQPage",
        inLanguage: "hi",
        mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }] : []),
      ...(detail?.applicationMd ? [{
        "@type": "HowTo",
        name: `${s.name} के लिए आवेदन कैसे करें`,
        inLanguage: "hi",
        step: toText(detail.applicationMd).split(/(?=Step\s*\d+|चरण\s*\d+)/i).map(t => t.trim()).filter(t => t.length > 8).slice(0, 12)
          .map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t.slice(0, 300) })),
      }] : []),
    ],
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8" lang="hi">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Language switcher */}
      <div className="flex justify-end mb-4">
        <Link href={`/scheme/${slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition">
          🇬🇧 English
        </Link>
      </div>

      <nav className="text-sm text-gray-500 mb-5 flex flex-wrap gap-1 items-center">
        <Link href="/hi" className="hover:text-orange-600">होम</Link><span>/</span>
        <Link href="/schemes" className="hover:text-orange-600">योजनाएँ</Link><span>/</span>
        <span className="text-gray-800 line-clamp-1">{s.name}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">
        <article className="min-w-0 bg-white rounded-2xl border border-gray-100 border-t-4 border-t-[#0f2744] shadow-sm px-6 py-8 sm:px-8 lg:px-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{s.name} ऑनलाइन आवेदन — स्टेप-बाय-स्टेप {s.level === "state" ? `${where} ` : ""}गाइड</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-orange-50 text-orange-700 px-2.5 py-1">{where}</span>
            <span className="rounded-full bg-gray-100 text-gray-700 px-2.5 py-1">{catLabel(s.schemeCategory)}</span>
            {s.level === "central" && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">केंद्रीय योजना</span>}
            {detail?.benefitType && <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-1">{detail.benefitType}</span>}
            {beneficiary && <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1">के लिए: {beneficiary}</span>}
          </div>

          {detail && (
            <p className="mt-3 text-xs text-gray-400">
              {readMins} मिनट पढ़ें{updated ? ` · अपडेट ${updated}` : ""}
            </p>
          )}

          {/* On this page — mobile only (desktop uses the sticky sidebar) */}
          {toc.length > 2 && (
            <details className="lg:hidden mt-5 rounded-xl border border-gray-200 bg-gray-50 group">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">इस पेज पर</summary>
              <ul className="px-4 pb-3 space-y-1 text-sm">
                {toc.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-orange-600 hover:underline">{label}</a></li>
                ))}
              </ul>
            </details>
          )}

          {/* About */}
          {(aboutHtml || s.benefitSummary) && (
            <section id="about" className="mt-6 scroll-mt-20">
              <h2 className="sec-h2">{shortName} क्या है?</h2>
              {aboutHtml
                ? <div className="guide-content" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
                : <p className="text-gray-800 leading-relaxed">{s.benefitSummary}</p>}
            </section>
          )}

          {/* Benefits */}
          {benefitsHtml && (
            <section id="benefits" className="mt-6 scroll-mt-20">
              <h2 className="sec-h2">{shortName} के लाभ</h2>
              <div className="guide-content" dangerouslySetInnerHTML={{ __html: benefitsHtml }} />
            </section>
          )}

          {/* Full step-by-step Hindi guide, where one exists */}
          {guideSlug && (
            <Link href={`/hi/guide/${guideSlug}`} className="mt-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100 transition">
              <span className="text-xl">📖</span>
              <span>
                <span className="block text-sm font-semibold text-[#9a3412]">पूरी स्टेप-बाय-स्टेप गाइड पढ़ें</span>
                <span className="block text-sm text-orange-800/80 mt-0.5">{s.name} — आवेदन गाइड →</span>
              </span>
            </Link>
          )}

          {/* Quick facts */}
          <section id="facts" className="mt-6 scroll-mt-20">
            <h2 className="sec-h2">{shortName} — मुख्य तथ्य</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {nodalDept && <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 w-44 align-top">नोडल मंत्रालय / विभाग</td><td className="px-4 py-3 text-gray-900">{nodalDept}</td></tr>}
                  <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">कवरेज</td><td className="px-4 py-3 text-gray-900">{s.level === "state" ? `राज्य योजना — ${where}` : "केंद्रीय (पूरे भारत)"}</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">श्रेणी</td><td className="px-4 py-3 text-gray-900">{(s.categories || [s.schemeCategory]).map(catLabel).join(", ")}</td></tr>
                  {detail?.benefitType && <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">लाभ का प्रकार</td><td className="px-4 py-3 text-gray-900">{detail.benefitType}</td></tr>}
                  {beneficiary && <tr><td className="px-4 py-3 font-medium text-gray-600 align-top">लाभार्थी</td><td className="px-4 py-3 text-gray-900">{beneficiary}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Eligibility */}
          <section id="eligibility" className="mt-6 scroll-mt-20">
            <h2 className="sec-h2">{shortName} पात्रता — कौन आवेदन कर सकता है?</h2>
            {eligHtml
              ? <div className="guide-content" dangerouslySetInnerHTML={{ __html: eligHtml }} />
              : <p className="text-gray-700">पात्रता आपकी आयु, आय, श्रेणी और राज्य पर निर्भर करती है। हमारा <Link href="/eligibility" className="text-orange-600 font-medium hover:underline">मुफ्त पात्रता जाँच</Link> उपयोग करें या पूरी जानकारी के लिए आधिकारिक पेज देखें।</p>}
          </section>

          {/* Exclusions */}
          {exclHtml && (
            <section id="exclusions" className="mt-6 scroll-mt-20">
              <h2 className="sec-h2">{shortName} के लिए कौन पात्र नहीं है?</h2>
              <div className="guide-content" dangerouslySetInnerHTML={{ __html: exclHtml }} />
            </section>
          )}

          {/* How to apply */}
          <section id="apply" className="mt-6 scroll-mt-20">
            <h2 className="sec-h2">{shortName} के लिए आवेदन कैसे करें{detail?.applicationMode ? ` (${detail.applicationMode})` : ""}</h2>
            {applyHtml && <div className="guide-content" dangerouslySetInnerHTML={{ __html: applyHtml }} />}
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/eligibility" className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">अपनी पात्रता जाँचें →</Link>
            </div>
          </section>

          {/* Official references */}
          {detail?.references && detail.references.length > 0 && (
            <section className="mt-6">
              <h2 className="sec-h2 !text-xl">आधिकारिक स्रोत</h2>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {detail.references.slice(0, 5).map((r, i) => (
                  <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">{r.title || r.url}</a></li>
                ))}
              </ul>
            </section>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <section id="faqs" className="mt-8 scroll-mt-20">
              <h2 className="sec-h2">{shortName} — अक्सर पूछे जाने वाले प्रश्न</h2>
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

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="sec-h2">
                संबंधित {catLabel(s.schemeCategory).toLowerCase()} योजनाएँ{s.state ? ` — ${where}` : ""}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((r) => (
                  <li key={r.slug ?? r.id}>
                    <Link href={`/hi/scheme/${r.slug ?? r.id}`} className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition">
                      <span className="text-sm font-semibold text-gray-800 leading-snug">{r.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/schemes" className="mt-3 inline-block text-sm text-gray-500 hover:underline">सभी सरकारी योजनाएँ देखें →</Link>
            </section>
          )}

          <p className="mt-8 text-xs text-gray-500">
            योजना की जानकारी भारत सरकार के myScheme पोर्टल और आधिकारिक विभागीय स्रोतों से ली गई है।
            कृपया पात्रता की पुष्टि करें और आधिकारिक पेज से ही आवेदन करें। CitizenNest एक स्वतंत्र प्लेटफ़ॉर्म है।
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

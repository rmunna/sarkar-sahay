import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchemeBySlug, getAllSchemeSlugs, getRelatedSchemes } from "@/lib/schemes-data";

export const dynamicParams = false;
export const revalidate = 604800;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) return {};
  const where = s.level === "state" ? stateLabel(s.state) : "India";
  const title = `${s.name} — Eligibility, Benefits & How to Apply (${where})`;
  const description = (s.benefitSummary || `${s.name}: eligibility, benefits and how to apply.`).slice(0, 160);
  return {
    title,
    description,
    // Curated, structured schemes are index-worthy; the broad myScheme catalog
    // pages are intentionally noindex,follow until they carry deeper content —
    // avoids thin/scaled-content penalties while keeping them useful + linkable.
    robots: s.source === "myscheme" ? { index: false, follow: true } : undefined,
    alternates: { canonical: `https://www.citizennest.com/scheme/${slug}` },
    openGraph: { title, description, url: `https://www.citizennest.com/scheme/${slug}`, siteName: "CitizenNest", locale: "en_IN" },
  };
}

export default async function SchemePage({ params }: Props) {
  const { slug } = await params;
  const s = getSchemeBySlug(slug);
  if (!s) notFound();

  const where = s.level === "state" ? stateLabel(s.state) : "All India";
  const d = s.detail || {};
  const tags = (d.tags || s.categories || []).filter(Boolean);
  const related = getRelatedSchemes(s, 10);

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
        description: s.benefitSummary,
        serviceType: (s.categories || [s.schemeCategory]).join(", "),
        areaServed: where,
        provider: { "@type": "GovernmentOrganization", name: d.ministry || "Government of India" },
      },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-500 mb-5 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-blue-600">Home</Link><span>/</span>
        <Link href="/schemes" className="hover:text-blue-600">Schemes</Link><span>/</span>
        <span className="text-gray-800 line-clamp-1">{s.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">{s.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">{where}</span>
        <span className="rounded-full bg-gray-100 text-gray-700 px-2.5 py-1">{catLabel(s.schemeCategory)}</span>
        {s.level === "central" && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">Central scheme</span>}
        {d.schemeFor && <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1">For: {d.schemeFor}</span>}
      </div>

      {/* What is it */}
      {s.benefitSummary && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">About this scheme</h2>
          <p className="text-gray-800 leading-relaxed">{s.benefitSummary}</p>
        </section>
      )}

      {/* Quick facts */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick facts</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {d.ministry && <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 w-44 align-top">Nodal Ministry / Dept</td><td className="px-4 py-3 text-gray-900">{d.ministry}</td></tr>}
              <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">Coverage</td><td className="px-4 py-3 text-gray-900">{s.level === "state" ? `State scheme — ${where}` : "Central (All India)"}</td></tr>
              <tr className="border-b border-gray-100"><td className="px-4 py-3 font-medium text-gray-600 align-top">Category</td><td className="px-4 py-3 text-gray-900">{(s.categories || [s.schemeCategory]).map(catLabel).join(", ")}</td></tr>
              {d.schemeFor && <tr><td className="px-4 py-3 font-medium text-gray-600 align-top">Beneficiary</td><td className="px-4 py-3 text-gray-900">{d.schemeFor}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Who can apply</h2>
        {s.eligibility?.otherRequirements?.length ? (
          <ul className="list-disc pl-5 text-gray-800 space-y-1">
            {s.eligibility.otherRequirements.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        ) : (
          <p className="text-gray-700">
            Eligibility depends on your age, income, category and state. Use our{" "}
            <Link href="/eligibility" className="text-blue-600 font-medium hover:underline">free eligibility checker</Link>{" "}
            to see if you qualify for this and other schemes, or check the official page for the full criteria.
          </p>
        )}
      </section>

      {/* How to apply / CTA */}
      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h2 className="text-base font-semibold text-blue-900">How to apply</h2>
        <p className="mt-1 text-sm text-blue-900/80">Check your eligibility first, then apply on the official government portal.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/eligibility" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Check eligibility →</Link>
          {s.officialLink && <a href={s.officialLink} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-300 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">Official scheme page ↗</a>}
        </div>
      </section>

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.slice(0, 12).map((t) => <span key={t} className="text-xs rounded bg-gray-100 text-gray-600 px-2 py-1">{t}</span>)}
        </div>
      )}

      {/* Related — internal links, keeps the page useful + spreads equity */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
    </main>
  );
}

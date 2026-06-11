import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchemeBySlug, getAllSchemeSlugs } from "@/lib/schemes-data";

export const dynamicParams = false; // prerender all; unknown slugs 404 (no runtime fs on Workers)
export const revalidate = 604800; // 7 days

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
  const tags = d.tags || s.categories || [];

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

  const Row = ({ label, value }: { label: string; value: string }) => (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3 font-medium text-gray-600 w-44 align-top">{label}</td>
      <td className="px-4 py-3 text-gray-900">{value}</td>
    </tr>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-500 mb-5 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-blue-600">Home</Link><span>/</span>
        <Link href="/schemes" className="hover:text-blue-600">Schemes</Link><span>/</span>
        <span className="text-gray-800">{s.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">{s.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">{where}</span>
        <span className="rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 capitalize">{s.schemeCategory.replace(/-/g, " ")}</span>
        {s.level === "central" && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">Central scheme</span>}
      </div>

      {s.benefitSummary && <p className="mt-5 text-gray-800 leading-relaxed">{s.benefitSummary}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {d.ministry && <Row label="Nodal Ministry / Dept" value={d.ministry} />}
            <Row label="Level" value={s.level === "state" ? `State — ${where}` : "Central (All India)"} />
            <Row label="Category" value={(s.categories || [s.schemeCategory]).join(", ")} />
            {d.schemeFor && <Row label="Beneficiary" value={d.schemeFor} />}
          </tbody>
        </table>
      </div>

      {/* Curated schemes carry structured eligibility worth surfacing */}
      {s.eligibility?.otherRequirements?.length ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Eligibility</h2>
          <ul className="list-disc pl-5 text-gray-800 space-y-1">
            {s.eligibility.otherRequirements.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      ) : null}

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.slice(0, 12).map((t) => (
            <span key={t} className="text-xs rounded bg-gray-100 text-gray-600 px-2 py-1">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/eligibility" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Check if you&apos;re eligible →
        </Link>
        {s.officialLink && (
          <a href={s.officialLink} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Official scheme page ↗
          </a>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-500">
        Scheme information sourced from the Government of India&apos;s myScheme portal and official department sources.
        Always confirm eligibility and apply via the official scheme page. CitizenNest is an independent platform.
      </p>
    </main>
  );
}

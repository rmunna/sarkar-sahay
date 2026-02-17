import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES, getStateBySlug, getGuidesForState } from "@/lib/states";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  const guides = getGuidesForState(slug);
  return {
    title: `Government Schemes in ${state.name}`,
    description: `Browse ${guides.length} government schemes, services, and guides for ${state.name}. Step-by-step instructions on CitizenNest.`,
    openGraph: {
      title: `Government Schemes in ${state.name} — CitizenNest`,
      description: `${guides.length} guides for government services in ${state.name}.`,
      url: `${BASE_URL}/state/${slug}`,
    },
    alternates: { canonical: `${BASE_URL}/state/${slug}` },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const guides = getGuidesForState(slug);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Government Schemes in ${state.name}`,
    numberOfItems: guides.length,
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${BASE_URL}/guide/${g.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/states" className="hover:text-orange-600">States</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{state.name}</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Government Schemes in {state.name}
      </h1>
      <p className="text-gray-600 mb-8">
        Browse {guides.length} government scheme{guides.length !== 1 ? "s" : ""} and service guide{guides.length !== 1 ? "s" : ""} available for residents of {state.name}.
      </p>

      {guides.length === 0 ? (
        <p className="text-gray-500">No guides available for this state yet. Check back soon!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition"
            >
              <h2 className="font-semibold text-gray-900 mb-1 line-clamp-2">{g.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2">{g.description}</p>
              <span className="inline-block mt-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                {g.category}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

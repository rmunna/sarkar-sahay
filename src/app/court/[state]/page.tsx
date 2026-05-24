import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtsByState, getAllStateParams } from "@/lib/court";

export const dynamicParams = true;
export const revalidate = 7776000;

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return getAllStateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const courts = getCourtsByState(state);
  if (!courts.length) return {};

  const stateName = courts[0].state;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  return {
    title: `${stateName} Court Case Status — High Court & District Courts`,
    description: `Check court case status for ${stateName}. Find ${courts.length} courts including ${courts.map((c) => c.shortName).slice(0, 3).join(", ")}. Search by CNR, case number, or party name.`,
    alternates: { canonical: `${BASE_URL}/court/${state}` },
  };
}

export default async function StateCourtPage({ params }: Props) {
  const { state } = await params;
  const courts = getCourtsByState(state);
  if (!courts.length) notFound();

  const stateName = courts[0].state;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const highCourts = courts.filter((c) => c.type === "high");
  const districtCourts = courts.filter((c) => c.type === "district");
  const supreme = courts.filter((c) => c.type === "supreme");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Court Case Status", item: `${BASE_URL}/court` },
          { "@type": "ListItem", position: 3, name: stateName, item: `${BASE_URL}/court/${state}` },
        ],
      },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/court" className="hover:text-orange-600">Court Case Status</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{stateName}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {stateName} Court Case Status
      </h1>
      <p className="text-gray-600 mb-6">
        Select a court to check case status, cause list, or advocate details online.
      </p>

      {/* Supreme Court (if Delhi) */}
      {supreme.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3 uppercase tracking-wide text-xs">Supreme Court</h2>
          {supreme.map((court) => (
            <Link
              key={court.slug}
              href="/court/supreme-court"
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50 transition group"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-orange-700">{court.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{court.city} · Est. {court.established}</div>
              </div>
              <span className="text-orange-500 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* High Courts */}
      {highCourts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">High Court</h2>
          <div className="space-y-2">
            {highCourts.map((court) => (
              <Link
                key={court.slug}
                href={`/court/${state}/${court.slug}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50 transition group"
              >
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-orange-700">{court.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {court.city}
                    {court.established && ` · Est. ${court.established}`}
                    {" · "}{court.caseTypes.length} case types
                  </div>
                </div>
                <span className="text-orange-500 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* District Courts */}
      {districtCourts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">District Courts</h2>
          <div className="space-y-2">
            {districtCourts.map((court) => (
              <Link
                key={court.slug}
                href={`/court/${state}/${court.slug}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50 transition group"
              >
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-orange-700">{court.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{court.city}</div>
                </div>
                <span className="text-orange-500 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-4">
        <Link href="/court" className="text-sm text-orange-600 hover:underline">← All Courts</Link>
        <Link href="/court/cnr" className="text-sm text-orange-600 hover:underline">→ CNR Decoder</Link>
      </div>
    </div>
  );
}

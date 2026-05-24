import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtBySlug, getCourtsByState, getAllCourtParams, buildEcourtsUrl } from "@/lib/court";
import CourtCaseSearch from "@/components/CourtCaseSearch";

export const dynamicParams = true;
export const revalidate = 7776000;

interface Props {
  params: Promise<{ state: string; court: string }>;
}

export async function generateStaticParams() {
  return getAllCourtParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { court: courtSlug } = await params;
  const court = getCourtBySlug(courtSlug);
  if (!court) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  return {
    title: `${court.name} Case Status — Check Online`,
    description: `Check case status for ${court.name} online. Search by CNR number, case number, party name${court.type === "district" ? ", or FIR number" : ""}. Direct link to eCourts portal.`,
    alternates: { canonical: `${BASE_URL}/court/${court.stateSlug}/${court.slug}` },
  };
}

export default async function CourtDetailPage({ params }: Props) {
  const { state, court: courtSlug } = await params;
  const court = getCourtBySlug(courtSlug);
  if (!court || court.stateSlug !== state) notFound();

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const otherCourts = getCourtsByState(state).filter(
    (c) => c.slug !== courtSlug && c.type !== "supreme"
  );
  const isHighCourt = court.type === "high";
  const ecourtsUrl = buildEcourtsUrl(court);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Court Case Status", item: `${BASE_URL}/court` },
          { "@type": "ListItem", position: 3, name: court.state, item: `${BASE_URL}/court/${state}` },
          { "@type": "ListItem", position: 4, name: court.shortName, item: `${BASE_URL}/court/${state}/${court.slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How to check ${court.name} case status online?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `You can check ${court.name} case status on the eCourts portal. Use the search widget above to search by CNR number, case number, or party name. Click "Search on eCourts" to open the official government portal with your search pre-filled.`,
            },
          },
          {
            "@type": "Question",
            name: `What is the official website of ${court.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The official website of ${court.name} is ${court.website}. For case status, use ${court.caseStatusUrl}.`,
            },
          },
          {
            "@type": "Question",
            name: `What types of cases does ${court.shortName} handle?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${court.name} handles: ${court.caseTypes.map((ct) => ct.name).join(", ")}.`,
            },
          },
        ],
      },
      {
        "@type": "GovernmentOrganization",
        name: court.name,
        url: court.website,
        address: {
          "@type": "PostalAddress",
          streetAddress: court.address,
          addressCountry: "IN",
        },
        ...(court.phone ? { telephone: court.phone } : {}),
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
        <Link href={`/court/${state}`} className="hover:text-orange-600">{court.state}</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{court.shortName}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {court.name} — Case Status
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {court.city}, {court.state}
        {court.established && <> · Est. {court.established}</>}
      </p>

      {/* Search widget */}
      <CourtCaseSearch
        caseStatusUrl={court.caseStatusUrl}
        courtName={court.shortName}
        ecourtsStateCode={court.ecourtsStateCode}
        ecourtsDistCode={court.ecourtsDistCode}
        isHighCourt={isHighCourt}
      />

      {/* Quick links row */}
      <div className="flex flex-wrap gap-2 mt-4 mb-6">
        <a
          href={ecourtsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-50 transition"
        >
          eCourts Portal ↗
        </a>
        {court.advocateUrl && (
          <a
            href={court.advocateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
          >
            Advocate Search ↗
          </a>
        )}
        {court.causeListUrl && (
          <a
            href={court.causeListUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
          >
            Cause List ↗
          </a>
        )}
        <a
          href={court.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
        >
          Official Website ↗
        </a>
      </div>

      {/* Court info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">About {court.shortName}</h2>
        <p className="text-sm text-gray-600 mb-4">{court.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
            <p className="text-gray-700">{court.address}</p>
          </div>
          {court.phone && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
              <p className="text-gray-700">{court.phone}</p>
            </div>
          )}
        </div>

        {/* Case types */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Case Types</p>
          <div className="flex flex-wrap gap-1.5">
            {court.caseTypes.map((ct) => (
              <span
                key={ct.code}
                className="inline-flex items-center gap-1.5 text-xs bg-orange-50 border border-orange-100 text-orange-800 px-2 py-1 rounded-full"
                title={ct.name}
              >
                <span className="font-mono font-bold">{ct.code}</span>
                <span className="text-orange-600 hidden sm:inline">— {ct.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How to search guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-900 mb-3">
          How to Check {court.shortName} Case Status
        </h2>
        <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
          <li>
            <strong>By CNR Number</strong> — Fastest. Enter the 16-character CNR from your filing receipt.
          </li>
          <li>
            <strong>By Case Number</strong> — Enter case type (e.g., {court.caseTypes[0]?.code ?? "WP"}), number, and year from court notices.
          </li>
          <li>
            <strong>By Party Name</strong> — Enter petitioner or respondent name (min. 3 characters).
          </li>
          {!isHighCourt && (
            <li>
              <strong>By FIR Number</strong> — For criminal cases, enter FIR number, year, and police station.
            </li>
          )}
          <li>
            Click "Search on eCourts" — opens the official government portal with your search pre-filled.
          </li>
        </ol>
      </div>

      {/* Other courts in state */}
      {otherCourts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Other Courts in {court.state}
          </h2>
          <div className="space-y-2">
            {otherCourts.map((c) => (
              <Link
                key={c.slug}
                href={`/court/${state}/${c.slug}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-orange-300 hover:bg-orange-50 transition group"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800 group-hover:text-orange-700">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.city}</div>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/court/${state}`} className="text-sm text-orange-600 hover:underline">
          ← {court.state} Courts
        </Link>
        <Link href="/court/cnr" className="text-sm text-orange-600 hover:underline">
          → CNR Decoder
        </Link>
        <Link href="/court" className="text-sm text-orange-600 hover:underline">
          → All Courts
        </Link>
      </div>
    </div>
  );
}

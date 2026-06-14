import { getDistrictsByState, getAllStateParams, getStateName, getPincodesByDistrict, getPincodePath, getPincodeCanonicalUrl } from "@/lib/pincode";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ state: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllStateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const districts = getDistrictsByState(state);
  if (!districts.length) return {};

  const stateName = getStateName(state);
  const total = districts.reduce((s, d) => s + d.count, 0);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  return {
    title: `${stateName} PIN Codes — All Districts & Areas`,
    description: `Complete list of ${total} PIN codes across ${districts.length} districts in ${stateName}. Find PIN code for any city, town or village in ${stateName}.`,
    alternates: { canonical: `${BASE_URL}/pincode/${state}` },
  };
}

export default async function StatePincodePage({ params }: Props) {
  const { state } = await params;

  // Legacy redirect: /pincode/560043 → /pincode/karnataka/bengaluru/banaswadi-560043
  if (/^\d{6}$/.test(state)) {
    const canonical = getPincodeCanonicalUrl(state);
    if (canonical) permanentRedirect(canonical);
    notFound();
  }

  const districts = getDistrictsByState(state);
  if (!districts.length) notFound();

  const stateName = getStateName(state);
  const total = districts.reduce((s, d) => s + d.count, 0);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  // Sample pincodes from the largest district for "popular" section
  const largestDistrict = [...districts].sort((a, b) => b.count - a.count)[0];
  const samplePincodes = getPincodesByDistrict(state, largestDistrict.districtSlug).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "PIN Codes", item: `${BASE_URL}/pincode` },
          { "@type": "ListItem", position: 3, name: stateName, item: `${BASE_URL}/pincode/${state}` },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/pincode" className="hover:text-orange-600">PIN Codes</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{stateName}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {stateName} PIN Codes
      </h1>
      <p className="text-gray-600 mb-6">
        Browse <strong>{total} PIN codes</strong> across <strong>{districts.length} districts</strong> in {stateName}.
        Select a district to find the PIN code for any area or post office.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total PIN Codes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{districts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Districts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hidden sm:block">
          <p className="text-2xl font-bold text-gray-800">{stateName.slice(0, 2).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-0.5">State</p>
        </div>
      </div>

      {/* Districts grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Browse by District</p>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-0">
          {districts.map((d, i) => (
            <Link
              key={d.districtSlug}
              href={`/pincode/${state}/${d.districtSlug}`}
              className={`flex items-center justify-between px-4 py-3 hover:bg-orange-50 group transition ${i % 2 === 0 && i !== districts.length - 1 ? "sm:border-r border-gray-100" : ""} border-b border-gray-100`}
            >
              <span className="font-medium text-gray-800 group-hover:text-orange-600">
                {d.district}
              </span>
              <span className="text-sm text-gray-400 shrink-0 ml-2">
                {d.count} PIN codes
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sample pincodes from largest district */}
      {samplePincodes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Popular PIN Codes in {largestDistrict.district}
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {samplePincodes.map((r) => (
              <Link
                key={r.pincode}
                href={getPincodePath(r)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
              >
                <span className="font-mono font-bold text-orange-700 shrink-0">{r.pincode}</span>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{r.postOffice}</span>
              </Link>
            ))}
          </div>
          <Link
            href={`/pincode/${state}/${largestDistrict.districtSlug}`}
            className="mt-3 inline-block text-sm text-orange-600 hover:underline"
          >
            View all {largestDistrict.district} PIN codes →
          </Link>
        </div>
      )}

      {/* Back links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/pincode" className="text-sm text-orange-600 hover:underline">
          ← All States
        </Link>
        <Link href="/ifsc" className="text-sm text-orange-600 hover:underline">
          → IFSC Code Finder
        </Link>
      </div>
    </div>
  );
}

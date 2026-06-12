import { getPincodesByDistrict, getAllDistrictParams, getStateName, getPincodePath } from "@/lib/pincode";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ state: string; district: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllDistrictParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, district } = await params;
  const records = getPincodesByDistrict(state, district);
  if (!records.length) return {};

  const stateName = records[0].state;
  const districtName = records[0].district;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  return {
    title: `${districtName} PIN Codes — All Areas & Post Offices | ${stateName}`,
    description: `Complete list of ${records.length} PIN codes in ${districtName} district, ${stateName}. Find PIN code for any area, locality or post office in ${districtName}.`,
    alternates: { canonical: `${BASE_URL}/pincode/${state}/${district}` },
  };
}

export default async function DistrictPincodePage({ params }: Props) {
  const { state, district } = await params;
  const records = getPincodesByDistrict(state, district);
  if (!records.length) notFound();

  const stateName = records[0].state;
  const districtName = records[0].district;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "PIN Codes", item: `${BASE_URL}/pincode` },
          { "@type": "ListItem", position: 3, name: stateName, item: `${BASE_URL}/pincode/${state}` },
          { "@type": "ListItem", position: 4, name: districtName, item: `${BASE_URL}/pincode/${state}/${district}` },
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
        <Link href={`/pincode/${state}`} className="hover:text-orange-600">{stateName}</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{districtName}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {districtName} PIN Codes
      </h1>
      <p className="text-gray-600 mb-6">
        Complete list of <strong>{records.length} PIN codes</strong> in {districtName} district, {stateName}.
        Find the PIN code for any area, locality or post office.
      </p>

      {/* PIN code grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-600">{records.length} PIN codes in {districtName}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {records.map((r) => (
            <Link
              key={r.pincode}
              href={getPincodePath(r)}
              className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 group transition"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-orange-700 text-lg w-20 shrink-0">
                  {r.pincode}
                </span>
                <div>
                  <p className="font-medium text-gray-800 group-hover:text-orange-600">
                    {r.postOffice}
                  </p>
                  {r.places.length > 1 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.places.filter(p => p !== r.postOffice).slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              {r.taluk && (
                <span className="text-xs text-gray-400 hidden sm:block shrink-0 ml-2">
                  {r.taluk}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Back links */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/pincode/${state}`} className="text-sm text-orange-600 hover:underline">
          ← All {stateName} PIN Codes
        </Link>
        <Link href="/pincode" className="text-sm text-orange-600 hover:underline">
          ← Browse All States
        </Link>
        <Link href="/ifsc" className="text-sm text-orange-600 hover:underline">
          → IFSC Code Finder
        </Link>
      </div>
    </div>
  );
}

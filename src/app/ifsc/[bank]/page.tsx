import {
  getBranchesByBank,
  getCitiesByBank,
  getAllBankParams,
  BANK_DISPLAY_NAMES,
  BANK_IFSC_PREFIX,
} from "@/lib/ifsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import IFSCSearchWidget from "@/components/IFSCSearchWidget";

interface Props {
  params: Promise<{ bank: string }>;
}

export const revalidate = 2592000; // 30 days

export async function generateStaticParams() {
  return getAllBankParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bank } = await params;
  const bankName = BANK_DISPLAY_NAMES[bank];
  if (!bankName) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    title: `${bankName} IFSC Code — All Branch Codes`,
    description: `${bankName} IFSC codes for all branches across India. Find ${bankName} branch IFSC code by city — Bangalore, Mumbai, Delhi, Chennai, Hyderabad and more.`,
    keywords: [
      `${bankName.toLowerCase()} ifsc code`,
      `${bank} ifsc code all branches`,
      `${bankName.toLowerCase()} branch ifsc code`,
      `${BANK_IFSC_PREFIX[bank] || ""} ifsc code`,
    ],
    alternates: { canonical: `${BASE_URL}/ifsc/${bank}` },
  };
}

export default async function BankIFSCPage({ params }: Props) {
  const { bank } = await params;
  const bankName = BANK_DISPLAY_NAMES[bank];
  if (!bankName) notFound();

  const branches = getBranchesByBank(bank);
  if (!branches.length) notFound();

  const cities = getCitiesByBank(bank).slice(0, 50); // top 50 cities
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "IFSC Codes", item: `${BASE_URL}/ifsc` },
      { "@type": "ListItem", position: 3, name: bankName, item: `${BASE_URL}/ifsc/${bank}` },
    ],
  };

  // Group branches by city for display (top cities)
  const topCities = cities.slice(0, 20);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex gap-1 items-center">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/ifsc" className="hover:text-blue-600">IFSC Codes</Link>
          <span>/</span>
          <span className="text-gray-800">{bankName}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {bankName} IFSC Code — All Branches
        </h1>
        <p className="text-gray-600 mb-6">
          {branches.length.toLocaleString()} branches across India •{" "}
          IFSC prefix: <span className="font-mono font-bold text-blue-700">{BANK_IFSC_PREFIX[bank]}</span>
        </p>

        {/* Search */}
        <div className="mb-8">
          <IFSCSearchWidget
            defaultBank={bank}
            placeholder={`Search ${bankName} branches by name or city…`}
          />
        </div>

        {/* Cities grid */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Browse by City</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-10">
          {topCities.map(({ city, citySlug, count }) => (
            <div key={citySlug} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition">
              <div className="font-medium text-gray-800 text-sm capitalize">
                {city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{count} branches</div>
              <div className="mt-2 space-y-1">
                {branches
                  .filter((b) => b.citySlug === citySlug)
                  .slice(0, 3)
                  .map((b) => (
                    <Link
                      key={b.ifsc}
                      href={`/ifsc/${bank}/${b.pageSlug}`}
                      className="block text-xs text-blue-600 hover:underline truncate"
                    >
                      {b.branchDisplay}
                    </Link>
                  ))}
                {count > 3 && (
                  <span className="text-xs text-gray-400">+{count - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full branch list — top 200 */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All {bankName} Branches</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">City</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">State</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">IFSC Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.slice(0, 200).map((b) => (
                <tr key={b.ifsc} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ifsc/${bank}/${b.pageSlug}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {b.branchDisplay}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 capitalize">{b.city.toLowerCase()}</td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">{b.state.toLowerCase()}</td>
                  <td className="px-4 py-2.5 font-mono text-blue-700 font-semibold">{b.ifsc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {branches.length > 200 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              Showing 200 of {branches.length.toLocaleString()} branches.
              Search your city above to find specific branches.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

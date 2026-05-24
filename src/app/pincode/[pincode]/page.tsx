import { getPincodeData, getAllPincodeParams, getNearbyPincodes } from "@/lib/pincode";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";

interface Props {
  params: Promise<{ pincode: string }>;
}

export const dynamicParams = true;
export const revalidate = 7776000; // 90 days — pin codes rarely change

export async function generateStaticParams() {
  // Pre-build all 19K pincodes — they're tiny pages, fast to generate
  return getAllPincodeParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pincode } = await params;
  const data = getPincodeData(pincode);
  if (!data) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const areas = data.places.slice(0, 3).join(", ");
  const title = `${pincode} PIN Code — ${data.district}, ${data.state}`;
  const description = `${pincode} is the PIN code for ${areas} area in ${data.district} district, ${data.state}. Find post office details, area names and nearby PIN codes.`;

  return {
    title,
    description,
    keywords: [
      `${pincode} pin code`,
      `${pincode} area name`,
      `${pincode} post office`,
      `${data.district} pin code`,
      `${data.places[0]?.toLowerCase()} pin code`,
    ].filter(Boolean),
    alternates: { canonical: `${BASE_URL}/pincode/${pincode}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/pincode/${pincode}`,
      siteName: "CitizenNest",
      locale: "en_IN",
    },
  };
}

export default async function PincodePage({ params }: Props) {
  const { pincode } = await params;
  const data = getPincodeData(pincode);
  if (!data) notFound();

  const nearby = getNearbyPincodes(data, 8);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "PIN Codes", item: `${BASE_URL}/pincode` },
      { "@type": "ListItem", position: 3, name: pincode, item: `${BASE_URL}/pincode/${pincode}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the PIN code ${pincode}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `PIN code ${pincode} belongs to ${data.places.slice(0, 3).join(", ")} area in ${data.district} district, ${data.state}.`,
        },
      },
      {
        "@type": "Question",
        name: `Which post office serves PIN code ${pincode}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The post office serving PIN code ${pincode} is ${data.postOffice} in ${data.district}, ${data.state}.`,
        },
      },
      {
        "@type": "Question",
        name: `Which areas fall under PIN code ${pincode}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The following areas/localities fall under PIN code ${pincode}: ${data.places.join(", ")}.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/pincode" className="hover:text-blue-600">PIN Codes</Link>
          <span>/</span>
          <span className="text-gray-800">{pincode}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          PIN Code {pincode}
        </h1>
        <p className="text-gray-600 mb-6">{data.district}, {data.state}</p>

        {/* PIN hero */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-blue-600 font-medium mb-1">PIN Code</p>
          <p className="text-5xl font-mono font-bold text-blue-800 tracking-widest mb-3">{pincode}</p>
          <CopyButton text={pincode} label="Copy PIN Code" />
        </div>

        {/* Details table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ["PIN Code", pincode],
                ["Post Office", data.postOffice],
                ["District", data.district],
                ["Taluk / Block", data.taluk || "—"],
                ["State", data.state],
                ["Country", "India"],
              ].map(([label, value]) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 w-40">{label}</td>
                  <td className="px-4 py-3 text-gray-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Areas / Localities */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">
            Areas & Localities under PIN {pincode}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.places.map((place) => (
              <span key={place} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                {place}
              </span>
            ))}
          </div>
        </div>

        {/* What is a PIN code */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-sm text-amber-900">
          <h2 className="font-semibold mb-2">What does PIN code {pincode} mean?</h2>
          <p>
            PIN (Postal Index Number) is a 6-digit code used by India Post to identify delivery post offices.
            The first digit <strong>{pincode[0]}</strong> indicates the postal zone
            ({getPinZone(pincode[0])}),
            the next two digits identify the postal circle and district,
            and the last three digits identify the specific delivery post office.
          </p>
        </div>

        {/* FAQs */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: `What is the PIN code ${pincode}?`,
                a: `PIN code ${pincode} belongs to ${data.places.slice(0, 3).join(", ")} area in ${data.district} district, ${data.state}.`,
              },
              {
                q: `Which areas fall under PIN code ${pincode}?`,
                a: `The areas under PIN code ${pincode} include: ${data.places.join(", ")}.`,
              },
              {
                q: `Which post office handles PIN code ${pincode}?`,
                a: `${data.postOffice} post office handles deliveries for PIN code ${pincode} in ${data.district}, ${data.state}.`,
              },
            ].map(({ q, a }) => (
              <details key={q} className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:bg-gray-50 text-sm">{q}</summary>
                <p className="px-4 pb-3 text-sm text-gray-700">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Nearby PINs */}
        {nearby.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Nearby PIN Codes in {data.district}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {nearby.map((n) => (
                <Link
                  key={n.pincode}
                  href={`/pincode/${n.pincode}`}
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition text-center"
                >
                  <div className="font-mono font-bold text-blue-700">{n.pincode}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{n.postOffice}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related links */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Related Tools</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/ifsc", label: "IFSC Code Finder" },
              { href: "/guide/micr-code-what-is-how-to-find", label: "MICR Code Guide" },
              { href: "/guide/neft-rtgs-imps-upi-difference", label: "NEFT vs RTGS vs IMPS" },
              { href: "/pincode", label: "Browse All PIN Codes" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="text-sm text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function getPinZone(firstDigit: string): string {
  const zones: Record<string, string> = {
    "1": "Delhi, Haryana, Punjab, HP, J&K",
    "2": "Uttar Pradesh, Uttarakhand",
    "3": "Rajasthan, Gujarat",
    "4": "Maharashtra, Goa, MP, Chhattisgarh",
    "5": "Andhra Pradesh, Telangana, Karnataka",
    "6": "Tamil Nadu, Kerala",
    "7": "West Bengal, Odisha, NE States",
    "8": "Bihar, Jharkhand",
    "9": "Army Post Office (APO)",
  };
  return zones[firstDigit] || "India";
}

import { getPincodeBySlug, getAllPincodeSlugParams, getNearbyPincodes, getPincodePath, getPincodeSlug } from "@/lib/pincode";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";
import AdUnit from "@/components/AdUnit";

const AD_SLOT_DATA = process.env.NEXT_PUBLIC_AD_SLOT_DATA || "";

interface Props {
  params: Promise<{ state: string; district: string; slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 7776000; // 90 days

export async function generateStaticParams() {
  // Return empty — all 19,238 pincode pages are served by ISR on first request (90-day cache).
  // Pre-rendering all of them adds 15+ minutes to every deploy with zero SEO benefit.
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, district, slug } = await params;
  const data = getPincodeBySlug(state, district, slug);
  if (!data) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const primaryArea = data.postOffice;
  const otherAreas = data.places.filter((p) => p !== primaryArea).slice(0, 2);
  const title = `${primaryArea} PIN Code ${data.pincode} — ${data.district}, ${data.state}`;
  const description = `The PIN code of ${primaryArea} is ${data.pincode}. ${primaryArea} is in ${data.district} district, ${data.state}.${otherAreas.length ? ` Also covers: ${otherAreas.join(", ")}.` : ""} Find areas, post office and nearby PIN codes.`;

  return {
    title,
    description,
    keywords: [
      `${primaryArea.toLowerCase()} pin code`,
      `pin code of ${primaryArea.toLowerCase()}`,
      `${primaryArea.toLowerCase()} postal code`,
      `${data.pincode} pin code`,
      `${data.pincode} area name`,
      `${data.district.toLowerCase()} pin code`,
      ...data.places.map((p) => `${p.toLowerCase()} pin code`),
    ],
    alternates: { canonical: `${BASE_URL}${getPincodePath(data)}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${getPincodePath(data)}`,
      siteName: "CitizenNest",
      locale: "en_IN",
    },
  };
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

export default async function PincodePage({ params }: Props) {
  const { state, district, slug } = await params;
  const data = getPincodeBySlug(state, district, slug);
  if (!data) notFound();

  const nearby = getNearbyPincodes(data, 8);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const primaryArea = data.postOffice;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "PIN Codes", item: `${BASE_URL}/pincode` },
          { "@type": "ListItem", position: 3, name: data.state, item: `${BASE_URL}/pincode/${data.stateSlug}` },
          { "@type": "ListItem", position: 4, name: data.district, item: `${BASE_URL}/pincode/${data.stateSlug}/${data.districtSlug}` },
          { "@type": "ListItem", position: 5, name: `${primaryArea} ${data.pincode}`, item: `${BASE_URL}${getPincodePath(data)}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is the PIN code of ${primaryArea}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The PIN code of ${primaryArea} is ${data.pincode}. ${primaryArea} is located in ${data.district} district, ${data.state}.`,
            },
          },
          {
            "@type": "Question",
            name: `Which areas fall under PIN code ${data.pincode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The areas under PIN code ${data.pincode} include: ${data.places.join(", ")}.`,
            },
          },
          {
            "@type": "Question",
            name: `Which post office serves ${primaryArea}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${data.postOffice} post office (PIN ${data.pincode}) serves ${primaryArea} and nearby areas in ${data.district}, ${data.state}.`,
            },
          },
          {
            "@type": "Question",
            name: `What is the postal code of ${primaryArea}, ${data.district}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The postal code (PIN code) of ${primaryArea}, ${data.district} is ${data.pincode}. It falls under the ${data.state} postal circle.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span>›</span>
          <Link href="/pincode" className="hover:text-orange-600">PIN Codes</Link>
          <span>›</span>
          <Link href={`/pincode/${data.stateSlug}`} className="hover:text-orange-600">{data.state}</Link>
          <span>›</span>
          <Link href={`/pincode/${data.stateSlug}/${data.districtSlug}`} className="hover:text-orange-600">{data.district}</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">{data.pincode}</span>
        </nav>

        {/* H1 — area name first, number second */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {primaryArea} PIN Code — {data.pincode}
        </h1>
        <p className="text-gray-600 mb-6">
          The PIN code of <strong>{primaryArea}</strong> is <strong>{data.pincode}</strong>. {data.district}, {data.state}.
        </p>

        {/* PIN hero */}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-orange-600 font-medium mb-1">PIN Code of {primaryArea}</p>
          <p className="text-5xl font-mono font-bold text-orange-700 tracking-widest mb-3">{data.pincode}</p>
          <CopyButton text={data.pincode} label="Copy PIN Code" />
        </div>

        {/* Details table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ["PIN Code", data.pincode],
                ["Area / Locality", primaryArea],
                ["Post Office", data.postOffice],
                ["Taluk / Block", data.taluk || "—"],
                ["District", data.district],
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
        {data.places.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">
              Areas & Localities under PIN {data.pincode}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.places.map((place) => (
                <span
                  key={place}
                  className={`text-sm px-3 py-1 rounded-full border ${place === primaryArea ? "bg-orange-100 border-orange-300 text-orange-800 font-medium" : "bg-gray-100 border-gray-200 text-gray-700"}`}
                >
                  {place}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PIN code meaning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-sm text-amber-900">
          <h2 className="font-semibold mb-2">What does PIN code {data.pincode} mean?</h2>
          <p>
            PIN (Postal Index Number) {data.pincode} belongs to the{" "}
            <strong>{getPinZone(data.pincode[0])}</strong> postal zone (digit {data.pincode[0]}).
            The next two digits <strong>{data.pincode.slice(1, 3)}</strong> identify the postal
            circle and district, and the last three digits <strong>{data.pincode.slice(3)}</strong>{" "}
            identify the {data.postOffice} delivery post office.
          </p>
        </div>

        {/* Ad — before FAQs */}
        <AdUnit slot={AD_SLOT_DATA} className="mb-6" />

        {/* FAQs */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: `What is the PIN code of ${primaryArea}?`,
                a: `The PIN code of ${primaryArea} is ${data.pincode}. It is located in ${data.district} district, ${data.state}.`,
              },
              {
                q: `Which areas fall under PIN code ${data.pincode}?`,
                a: `The areas under PIN code ${data.pincode} include: ${data.places.join(", ")}.`,
              },
              {
                q: `Which post office handles ${primaryArea}?`,
                a: `${data.postOffice} post office (PIN ${data.pincode}) handles mail delivery for ${data.places.join(", ")} in ${data.district}, ${data.state}.`,
              },
            ].map(({ q, a }) => (
              <details key={q} className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:bg-gray-50 text-sm">
                  {q}
                </summary>
                <p className="px-4 pb-3 text-sm text-gray-700">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Ad — before nearby PINs */}
        <AdUnit slot={AD_SLOT_DATA} className="mb-4" />

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
                  href={getPincodePath(n)}
                  className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:bg-orange-50 transition text-center"
                >
                  <div className="font-mono font-bold text-orange-700">{n.pincode}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{n.postOffice}</div>
                </Link>
              ))}
            </div>
            <Link
              href={`/pincode/${data.stateSlug}/${data.districtSlug}`}
              className="mt-3 inline-block text-sm text-orange-600 hover:underline"
            >
              View all {data.district} PIN codes →
            </Link>
          </div>
        )}

        {/* Related links */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Related Tools</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: `/pincode/${data.stateSlug}`, label: `${data.state} PIN Codes` },
              { href: `/pincode/${data.stateSlug}/${data.districtSlug}`, label: `${data.district} PIN Codes` },
              { href: "/ifsc", label: "IFSC Code Finder" },
              { href: "/pincode", label: "Browse All PIN Codes" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-orange-600 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

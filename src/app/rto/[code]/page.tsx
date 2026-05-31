import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getRTOBySlug, getAllRTOParams, getRTOsByState } from "@/lib/rto";
import AdUnit from "@/components/AdUnit";

const AD_SLOT_DATA = process.env.NEXT_PUBLIC_AD_SLOT_DATA || "";

export const dynamicParams = true;
export const revalidate = 7776000; // 90 days

export async function generateStaticParams() {
  return getAllRTOParams();
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const rto = getRTOBySlug(code);
  if (!rto) return { title: "RTO Not Found" };
  return {
    title: `${rto.code} RTO — ${rto.name}, ${rto.state} | Vehicle Registration`,
    description: `${rto.code} is the RTO code for ${rto.name} in ${rto.city}, ${rto.state}. Find vehicle registration details, services offered, and other RTOs in ${rto.state}.`,
    alternates: { canonical: `https://www.citizennest.com/rto/${rto.slug}` },
  };
}

export default async function RTOCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rto = getRTOBySlug(code);
  if (!rto) notFound();

  const stateRTOs = getRTOsByState(rto.stateSlug).filter((r) => r.slug !== rto.slug).slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "RTO Codes", item: "https://www.citizennest.com/rto" },
          { "@type": "ListItem", position: 3, name: rto.state, item: `https://www.citizennest.com/rto?state=${rto.stateSlug}` },
          { "@type": "ListItem", position: 4, name: rto.code, item: `https://www.citizennest.com/rto/${rto.slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is RTO code ${rto.code}?`,
            acceptedAnswer: { "@type": "Answer", text: `${rto.code} is the RTO (Regional Transport Office) code for ${rto.name} located in ${rto.city}, ${rto.state}. Vehicles registered under this RTO will have number plates starting with ${rto.code.replace("-", "")}.` },
          },
          {
            "@type": "Question",
            name: `Where is RTO ${rto.code} located?`,
            acceptedAnswer: { "@type": "Answer", text: `RTO ${rto.code} — ${rto.name} is located in ${rto.city}, ${rto.state}, India.` },
          },
          {
            "@type": "Question",
            name: `What do vehicle number plates starting with ${rto.code.replace("-", "")} mean?`,
            acceptedAnswer: { "@type": "Answer", text: `Vehicle number plates starting with ${rto.code.replace("-", "")} indicate that the vehicle is registered with the ${rto.name} (RTO ${rto.code}) in ${rto.city}, ${rto.state}.` },
          },
        ],
      },
    ],
  };

  const vehiclePrefix = rto.code.replace("-", "");

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/rto" className="hover:text-orange-600">RTO Codes</Link>
        <span>›</span>
        <Link href={`/rto?state=${rto.stateSlug}`} className="hover:text-orange-600">{rto.state}</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{rto.code}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">RTO Code</p>
            <h1 className="text-4xl font-extrabold text-orange-600 mb-1">{rto.code}</h1>
            <h2 className="text-xl font-semibold text-gray-900">{rto.name}</h2>
            <p className="text-gray-500 mt-1">{rto.city}, {rto.state}</p>
          </div>
          <div className="text-center bg-gray-900 rounded-xl px-5 py-3 shrink-0">
            <p className="text-xs text-gray-400 mb-1">Vehicle Prefix</p>
            <p className="text-2xl font-black text-white tracking-widest">{vehiclePrefix}</p>
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500">RTO Code</p>
            <p className="font-bold text-gray-900">{rto.code}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500">City</p>
            <p className="font-bold text-gray-900">{rto.city}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500">State</p>
            <p className="font-bold text-gray-900">{rto.state}</p>
          </div>
        </div>
      </div>

      {/* Vehicle number plate format */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">Vehicle Number Plate Format</h2>
        <div className="bg-gray-900 rounded-xl p-4 text-center mb-4">
          <div className="flex items-center justify-center gap-1 text-white font-black text-xl tracking-[0.2em]">
            <span className="text-yellow-400">{vehiclePrefix}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-blue-400">XX</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-green-400">YYYY</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Example: {vehiclePrefix} · AB · 1234</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
            <span className="text-gray-500">{vehiclePrefix}</span>
            <p className="text-xs text-gray-400 mt-0.5 ml-3.5">State + RTO Code</p>
          </div>
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
            <span className="text-gray-500">XX</span>
            <p className="text-xs text-gray-400 mt-0.5 ml-3.5">Series letters</p>
          </div>
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
            <span className="text-gray-500">YYYY</span>
            <p className="text-xs text-gray-400 mt-0.5 ml-3.5">4-digit number</p>
          </div>
        </div>
      </div>

      {/* Ad — after hero, before services */}
      <AdUnit slot={AD_SLOT_DATA} className="mb-6" />

      {/* Services */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">Services at RTO {rto.code}</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "🚗 New vehicle registration",
            "🔄 Transfer of ownership",
            "📋 Driving licence (DL) services",
            "🔍 Fitness certificate for vehicles",
            "📝 RC (Registration Certificate) renewal",
            "🚕 Permit for commercial vehicles",
            "🔢 Fancy/VIP number plate booking",
            "🏍️ Hypothecation addition/removal",
          ].map((s) => (
            <div key={s} className="flex items-start gap-2 py-1">
              <span>{s}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Most services are available online at <a href="https://parivahan.gov.in" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">parivahan.gov.in</a>
        </p>
      </div>

      {/* Other RTOs in state */}
      {stateRTOs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Other RTOs in {rto.state}
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {stateRTOs.map((r) => (
              <Link
                key={r.slug}
                href={`/rto/${r.slug}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition"
              >
                <span className="font-semibold text-orange-600">{r.code}</span>
                <span className="text-sm text-gray-600 truncate ml-2">{r.name}</span>
              </Link>
            ))}
          </div>
          <Link href={`/rto?state=${rto.stateSlug}`} className="mt-3 inline-block text-sm text-orange-600 hover:underline">
            View all {rto.state} RTOs →
          </Link>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/rto" className="text-sm text-orange-600 hover:underline">→ RTO Code Search</Link>
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ Car Loan EMI Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* Ad — before FAQ */}
      <AdUnit slot={AD_SLOT_DATA} className="mb-6" />

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          [`What is RTO code ${rto.code}?`, `${rto.code} is the Regional Transport Office code for ${rto.name} in ${rto.city}, ${rto.state}. Vehicles registered here carry the prefix ${vehiclePrefix} on their number plates.`],
          [`How to find owner details of a ${vehiclePrefix} vehicle?`, `You can find vehicle owner details for any ${vehiclePrefix}-series vehicle on the Parivahan portal (parivahan.gov.in) using the vehicle registration number. Click on "Vehicle Related Services" → "Know Your Vehicle Details".`],
          [`What documents are required for vehicle registration at ${rto.code}?`, `Documents required include: Form 20 (application), insurance certificate, address proof, identity proof, PAN card, temporary registration (if applicable), and invoice/sale letter from dealer. For new vehicles, the dealer usually handles registration.`],
          [`How to transfer vehicle from ${rto.code} to another RTO?`, `To transfer a vehicle to another RTO, you must apply for NOC (No Objection Certificate) from ${rto.name}. Submit Form 28 along with RC, insurance, PUC, and address proof. After getting NOC, register in the new RTO within 1 month.`],
          [`Can I book a VIP number at ${rto.code}?`, `Yes, you can book fancy/VIP vehicle registration numbers online at parivahan.gov.in under "Fancy Number Booking". Availability and pricing vary based on the number series.`],
        ].map(([q, a]) => (
          <details key={q} className="mb-3 group">
            <summary className="cursor-pointer font-medium text-gray-800 group-open:text-orange-600">{q}</summary>
            <p className="mt-1 text-sm text-gray-600 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

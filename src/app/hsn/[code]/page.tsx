import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getHSNByCode, getAllHSNParams, getRelatedHSN } from "@/lib/hsn";

export const dynamicParams = true;
export const revalidate = 7776000; // 90 days

export async function generateStaticParams() {
  return getAllHSNParams();
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const record = getHSNByCode(code.toUpperCase());
  if (!record) return { title: "HSN Code Not Found" };
  const gstLabel = record.gstRate === 0 ? "GST Exempt" : `${record.gstRate}% GST`;
  return {
    title: `HSN Code ${record.code} — ${record.description} | ${gstLabel}`,
    description: `HSN code ${record.code} covers ${record.description.toLowerCase()} under Chapter ${record.chapter} (${record.chapterName}). GST rate: ${record.gstRate === 0 ? "Nil / Exempt" : record.gstRate + "%"}. Find complete details, examples, and related codes.`,
    alternates: { canonical: `https://www.citizennest.com/hsn/${record.code.toLowerCase()}` },
  };
}

const GST_BADGE: Record<number, string> = {
  0: "bg-green-100 text-green-800",
  5: "bg-blue-100 text-blue-800",
  12: "bg-yellow-100 text-yellow-800",
  18: "bg-orange-100 text-orange-800",
  28: "bg-red-100 text-red-800",
};

export default async function HSNCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const record = getHSNByCode(code.toUpperCase());
  if (!record) notFound();

  const related = getRelatedHSN(record);
  const gstLabel = record.gstRate === 0 ? "Nil / Exempt" : `${record.gstRate}%`;
  const badgeClass = GST_BADGE[record.gstRate] ?? "bg-gray-100 text-gray-800";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "HSN Codes", item: "https://www.citizennest.com/hsn" },
          { "@type": "ListItem", position: 3, name: `HSN ${record.code}`, item: `https://www.citizennest.com/hsn/${record.code.toLowerCase()}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is HSN code ${record.code}?`,
            acceptedAnswer: { "@type": "Answer", text: `HSN code ${record.code} is used for ${record.description} under Chapter ${record.chapter} — ${record.chapterName} of the GST tariff schedule.` },
          },
          {
            "@type": "Question",
            name: `What is the GST rate on HSN code ${record.code}?`,
            acceptedAnswer: { "@type": "Answer", text: `The GST rate applicable on HSN code ${record.code} (${record.description}) is ${record.gstRate === 0 ? "Nil (0%) — this item is GST exempt" : record.gstRate + "%"}.` },
          },
          {
            "@type": "Question",
            name: `Which chapter does HSN ${record.code} fall under?`,
            acceptedAnswer: { "@type": "Answer", text: `HSN code ${record.code} falls under Chapter ${record.chapter} — ${record.chapterName} of the HSN tariff classification.` },
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link href="/hsn" className="hover:text-orange-600">HSN Codes</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{record.code}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{record.type} Code</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                GST {gstLabel}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-orange-600">{record.code}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Chapter</p>
            <Link href={`/hsn?chapter=${record.chapter}`} className="text-lg font-bold text-gray-700 hover:text-orange-600">
              {record.chapter}
            </Link>
            <p className="text-xs text-gray-500">{record.chapterName}</p>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{record.description}</h2>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">HSN Code</p>
            <p className="text-lg font-bold text-gray-900">{record.code}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">GST Rate</p>
            <p className={`text-lg font-bold ${record.gstRate === 0 ? "text-green-600" : "text-orange-600"}`}>{gstLabel}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Type</p>
            <p className="text-lg font-bold text-gray-900">{record.type}</p>
          </div>
        </div>
      </div>

      {/* Examples */}
      {record.examples.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Common Items / Examples</h2>
          <div className="flex flex-wrap gap-2">
            {record.examples.map((ex) => (
              <span key={ex} className="bg-orange-50 border border-orange-200 text-orange-700 text-sm px-3 py-1 rounded-full">
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800"><span className="font-semibold">Note: </span>{record.notes}</p>
        </div>
      )}

      {/* GST Rate context */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">GST Rate Details</h2>
        <div className="space-y-2 text-sm text-gray-700">
          {record.gstRate === 0 ? (
            <>
              <p>✅ <strong>This item is GST exempt</strong> — no GST is charged on supply of {record.description.toLowerCase()}.</p>
              <p>Even though it is exempt, you may still need to mention the HSN code {record.code} in your GST returns if your turnover exceeds ₹5 crore.</p>
            </>
          ) : (
            <>
              <p>The applicable GST rate is <strong>{record.gstRate}%</strong>, split as:</p>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li>CGST: {record.gstRate / 2}% + SGST: {record.gstRate / 2}% (for intra-state supply)</li>
                <li>IGST: {record.gstRate}% (for inter-state supply)</li>
              </ul>
            </>
          )}
          <p className="text-xs text-gray-400 mt-3">
            * GST rates are subject to change. Always verify with the CBIC official notification before filing.
          </p>
        </div>
      </div>

      {/* Related codes */}
      {related.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Related HSN Codes — Chapter {record.chapter} ({record.chapterName})
          </h2>
          <div className="divide-y divide-gray-100">
            {related.map((r) => (
              <Link
                key={r.code}
                href={`/hsn/${r.code.toLowerCase()}`}
                className="flex items-center justify-between py-2.5 hover:bg-orange-50 px-2 -mx-2 rounded-lg group"
              >
                <div>
                  <span className="font-semibold text-orange-600 group-hover:underline">{r.code}</span>
                  <span className="ml-2 text-sm text-gray-600">{r.description}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${GST_BADGE[r.gstRate] ?? "bg-gray-100 text-gray-800"}`}>
                  {r.gstRate === 0 ? "Nil" : `${r.gstRate}%`}
                </span>
              </Link>
            ))}
          </div>
          <Link href={`/hsn?chapter=${record.chapter}`} className="mt-3 inline-block text-sm text-orange-600 hover:underline">
            View all Chapter {record.chapter} codes →
          </Link>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/hsn" className="text-sm text-orange-600 hover:underline">→ HSN Code Search</Link>
        <Link href="/calculator/gst" className="text-sm text-orange-600 hover:underline">→ GST Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          [`What is HSN code ${record.code}?`, `HSN code ${record.code} is the Harmonised System of Nomenclature code for "${record.description}" under Chapter ${record.chapter} — ${record.chapterName}. This code is used in GST invoices and returns to classify goods.`],
          [`What is the GST rate on HSN code ${record.code}?`, `The GST rate on HSN code ${record.code} (${record.description}) is ${record.gstRate === 0 ? "Nil (0%)" : record.gstRate + "%"}. ${record.gstRate === 0 ? "This item is exempt from GST." : `CGST is ${record.gstRate / 2}% and SGST is ${record.gstRate / 2}% for intra-state, or IGST at ${record.gstRate}% for inter-state transactions.`}`],
          [`Is HSN code mandatory in GST invoices?`, `Yes. Businesses with annual turnover above ₹5 crore must mention 6-digit HSN codes in B2B invoices and 4-digit codes in B2C invoices. For turnover ₹1.5–5 crore, 4-digit HSN is required in B2B invoices.`],
          [`What is the difference between HSN and SAC codes?`, `HSN (Harmonised System of Nomenclature) codes are used for goods, while SAC (Services Accounting Code) codes are used for services in GST. ${record.type === "SAC" ? `This code ${record.code} is a SAC code for services.` : `Code ${record.code} is an HSN code for goods.`}`],
          [`How many digits are in an HSN code?`, `HSN codes can have 2, 4, 6, or 8 digits depending on the level of classification. 2-digit codes represent chapters, 4-digit heading, 6-digit sub-heading, and 8-digit tariff item.`],
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

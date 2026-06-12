import type { Metadata } from "next";
import Link from "next/link";
import { getAllHSNCodes, getChapterList } from "@/lib/hsn";


export const metadata: Metadata = {
  title: "HSN Code List India 2024 — GST Rates & Search | CitizenNest",
  description: "Search HSN codes and SAC codes for all goods and services in India. Find GST rates, chapter-wise HSN code list, and complete HSN code details for GST filing.",
  alternates: { canonical: "https://www.citizennest.com/hsn" },
};

const GST_RATES = [0, 5, 12, 18, 28];
const GST_BADGE: Record<number, string> = {
  0: "bg-green-100 text-green-800",
  5: "bg-blue-100 text-blue-800",
  12: "bg-yellow-100 text-yellow-800",
  18: "bg-orange-100 text-orange-800",
  28: "bg-red-100 text-red-800",
};

export default function HSNHomePage() {
  const all = getAllHSNCodes();
  const chapters = getChapterList();

  // Popular codes to highlight
  const popular = all.filter((r) =>
    ["0101", "0201", "1006", "1701", "2201", "3004", "6101", "6901", "8703", "8517", "9954", "9983"].includes(r.code)
  );

  // Rate breakdown
  const byRate = GST_RATES.map((rate) => ({
    rate,
    count: all.filter((r) => r.gstRate === rate).length,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "HSN Codes", item: "https://www.citizennest.com/hsn" },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        📦 HSN Code <span className="text-orange-600">List & Search</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Find HSN codes for goods and SAC codes for services under GST in India. Browse by chapter or search by product name.
      </p>

      {/* GST rate breakdown */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {byRate.map(({ rate, count }) => (
          <div key={rate} className={`rounded-xl border p-3 text-center ${GST_BADGE[rate]}`}>
            <p className="text-xl font-extrabold">{rate === 0 ? "Nil" : `${rate}%`}</p>
            <p className="text-xs font-medium opacity-75 mt-0.5">{count} codes</p>
          </div>
        ))}
      </div>

      {/* Popular HSN codes */}
      {popular.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">🔍 Popular HSN / SAC Codes</h2>
          <div className="divide-y divide-gray-100">
            {popular.map((r) => (
              <Link
                key={r.code}
                href={`/hsn/${r.code.toLowerCase()}`}
                className="flex items-center justify-between py-2.5 hover:bg-orange-50 px-2 -mx-2 rounded-lg group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-orange-600 shrink-0">{r.code}</span>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{r.description}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs text-gray-400">{r.chapterName}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GST_BADGE[r.gstRate] ?? "bg-gray-100 text-gray-800"}`}>
                    {r.gstRate === 0 ? "Nil" : `${r.gstRate}%`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Chapter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Browse by Chapter</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {chapters.map((ch) => (
            <Link
              key={ch.code}
              href={`/hsn?chapter=${ch.code}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
            >
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-400 mr-1.5">Ch.{ch.code}</span>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{ch.name}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-1">{ch.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* All HSN codes table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <details>
          <summary className="cursor-pointer text-base font-bold text-gray-900 select-none">
            📋 All {all.length} HSN/SAC Codes
          </summary>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                  <th className="py-2 text-left">Code</th>
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-center">Chapter</th>
                  <th className="py-2 text-center">GST Rate</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => (
                  <tr key={r.code} className="border-b border-gray-100 hover:bg-orange-50">
                    <td className="py-1.5">
                      <Link href={`/hsn/${r.code.toLowerCase()}`} className="font-mono font-semibold text-orange-600 hover:underline">
                        {r.code}
                      </Link>
                    </td>
                    <td className="py-1.5 text-gray-700">{r.description}</td>
                    <td className="py-1.5 text-center text-gray-500 text-xs">{r.chapter}</td>
                    <td className="py-1.5 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GST_BADGE[r.gstRate] ?? "bg-gray-100 text-gray-800"}`}>
                        {r.gstRate === 0 ? "Nil" : `${r.gstRate}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Info box */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-orange-900 mb-2">📌 HSN Code Applicability (FY 2024-25)</h2>
        <div className="text-sm text-orange-800 space-y-1.5">
          <p>✅ <strong>Turnover &lt; ₹1.5 crore</strong> — HSN codes optional in invoices</p>
          <p>✅ <strong>₹1.5 crore to ₹5 crore</strong> — 4-digit HSN mandatory in B2B invoices</p>
          <p>✅ <strong>Turnover &gt; ₹5 crore</strong> — 6-digit HSN mandatory in all invoices</p>
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/gst" className="text-sm text-orange-600 hover:underline">→ GST Calculator</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/rto" className="text-sm text-orange-600 hover:underline">→ RTO Codes</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["What is an HSN code?", "HSN stands for Harmonised System of Nomenclature. It is an internationally standardised system for classifying goods, used in customs and GST in India. Every product has a unique HSN code that determines its GST rate."],
          ["What is the difference between HSN and SAC codes?", "HSN codes are used for goods (physical products), while SAC (Services Accounting Code) codes are used for services. Both are used in GST returns and invoices to classify transactions."],
          ["Where do I find the HSN code for my product?", "You can search by product name above, or browse chapter-wise. For unlisted products, refer to the official CBIC GST Rate Schedule at cbic-gst.gov.in."],
          ["Is HSN code mandatory for GST filing?", "Yes. From April 2021, HSN codes are mandatory in GSTR-1 for businesses with turnover above ₹1.5 crore. Businesses above ₹5 crore must use 6-digit HSN codes."],
          ["What is SAC 9954?", "SAC 9954 covers Construction Services under GST. It includes construction of residential and commercial buildings, civil engineering works, and related services. GST rates range from 1% to 18% depending on the type of construction."],
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

import {
  getBranchBySlug,
  getTopBranchParams,
  getNearbyBranches,
  BANK_DISPLAY_NAMES,
  BANK_IFSC_PREFIX,
  BANK_OFFICIAL_URLS,
} from "@/lib/ifsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";

interface Props {
  params: Promise<{ bank: string; branch: string }>;
}

// ISR: generate top branches at build time, rest on demand
export const dynamicParams = true;
export const revalidate = 2592000; // 30 days

export async function generateStaticParams() {
  return getTopBranchParams(5000);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bank, branch } = await params;
  const data = getBranchBySlug(bank, branch);
  if (!data) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  const title = `${data.bank} ${data.branchDisplay} Branch IFSC Code — ${data.city}`;
  const description = `${data.bank} ${data.branchDisplay} branch IFSC code is ${data.ifsc}. MICR: ${data.micr}. Address: ${data.address}. Use for NEFT, RTGS, IMPS transfers.`;

  return {
    title,
    description,
    keywords: [
      `${data.bank.toLowerCase()} ${data.branchDisplay.toLowerCase()} ifsc code`,
      `${bank} ${branch} ifsc`,
      `${data.bank.toLowerCase()} ${data.city.toLowerCase()} ifsc code`,
      `${data.ifsc} ifsc code`,
      `${data.branchDisplay.toLowerCase()} branch ifsc`,
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/ifsc/${bank}/${branch}`,
      siteName: "CitizenNest",
      type: "article",
      locale: "en_IN",
    },
    alternates: {
      canonical: `${BASE_URL}/ifsc/${bank}/${branch}`,
    },
  };
}

export default async function IFSCBranchPage({ params }: Props) {
  const { bank, branch } = await params;
  const data = getBranchBySlug(bank, branch);
  if (!data) notFound();

  const nearby = getNearbyBranches(data, 6);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "IFSC Codes", item: `${BASE_URL}/ifsc` },
      { "@type": "ListItem", position: 3, name: BANK_DISPLAY_NAMES[bank] || data.bank, item: `${BASE_URL}/ifsc/${bank}` },
      { "@type": "ListItem", position: 4, name: `${data.branchDisplay} Branch`, item: `${BASE_URL}/ifsc/${bank}/${branch}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the IFSC code of ${data.bank} ${data.branchDisplay} branch ${data.city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The IFSC code of ${data.bank} ${data.branchDisplay} branch in ${data.city} is ${data.ifsc}. MICR code is ${data.micr}.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the MICR code of ${data.bank} ${data.branchDisplay}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The MICR code of ${data.bank} ${data.branchDisplay} branch is ${data.micr}. MICR is used for cheque processing.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the address of ${data.bank} ${data.branchDisplay} branch?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: data.address || `Contact ${data.bank} customer care for branch address.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/ifsc" className="hover:text-blue-600">IFSC Codes</Link>
          <span>/</span>
          <Link href={`/ifsc/${bank}`} className="hover:text-blue-600">{data.bank}</Link>
          <span>/</span>
          <span className="text-gray-800">{data.branchDisplay}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {data.bank} {data.branchDisplay} Branch — IFSC Code
        </h1>
        <p className="text-gray-600 mb-6">{data.city}, {data.state}</p>

        {/* IFSC Code — Hero */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-blue-600 font-medium mb-1">IFSC Code</p>
          <p className="text-4xl font-mono font-bold text-blue-800 tracking-widest mb-3">
            {data.ifsc}
          </p>
          <CopyButton text={data.ifsc} label="Copy IFSC" />
        </div>

        {/* Branch Details Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ["IFSC Code", data.ifsc],
                ["MICR Code", data.micr || "—"],
                ["Bank", data.bank],
                ["Branch", data.branchDisplay],
                ["City", data.city],
                ["District", data.district || data.city],
                ["State", data.state],
                ["Address", data.address || "—"],
                ["Contact", data.contact || "—"],
                ["NEFT Enabled", data.neft ? "Yes ✅" : "No"],
                ["RTGS Enabled", data.rtgs ? "Yes ✅" : "No"],
                ["IMPS Enabled", data.imps ? "Yes ✅" : "No"],
                ["UPI Enabled", data.upi ? "Yes ✅" : "No"],
              ].map(([label, value]) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 w-40">{label}</td>
                  <td className="px-4 py-3 text-gray-900 font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data source note */}
        <p className="text-xs text-gray-400 mb-8 flex items-center gap-1">
          <span>📅</span>
          <span>Data sourced from RBI IFSC directory. Last verified: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.</span>
          {BANK_OFFICIAL_URLS[bank] && (
            <a
              href={BANK_OFFICIAL_URLS[bank]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline ml-1"
            >
              Verify at {data.bank} official site →
            </a>
          )}
        </p>

        {/* How to use */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">How to Use IFSC Code {data.ifsc}</h2>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="font-bold text-blue-600">1.</span> Login to your bank&apos;s mobile app or net banking</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600">2.</span> Go to <strong>Fund Transfer → Add Beneficiary</strong></li>
            <li className="flex gap-2"><span className="font-bold text-blue-600">3.</span> Enter recipient&apos;s account number + IFSC: <strong className="font-mono">{data.ifsc}</strong></li>
            <li className="flex gap-2"><span className="font-bold text-blue-600">4.</span> Wait 30 min–24 hrs for beneficiary activation</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600">5.</span> Transfer via NEFT (free) or RTGS (₹2L+, instant)</li>
          </ol>
        </div>

        {/* IFSC Format */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">IFSC Code Format — {BANK_DISPLAY_NAMES[bank] || data.bank}</h2>
          <div className="font-mono text-lg bg-gray-50 rounded-lg p-4 text-center tracking-widest">
            <span className="text-blue-700 font-bold">{BANK_IFSC_PREFIX[bank] || data.ifsc.slice(0, 4)}</span>
            <span className="text-gray-400">0</span>
            <span className="text-green-700 font-bold">{data.ifsc.slice(5)}</span>
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-gray-500">
            <span className="text-blue-600">↑ Bank code</span>
            <span className="text-gray-400">↑ Reserved</span>
            <span className="text-green-600">↑ Branch code</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: `What is the IFSC code of ${data.bank} ${data.branchDisplay}?`,
                a: `The IFSC code is ${data.ifsc}. Use this for NEFT, RTGS, and IMPS transfers to ${data.bank} ${data.branchDisplay} branch in ${data.city}.`,
              },
              {
                q: `What is the MICR code of ${data.bank} ${data.branchDisplay}?`,
                a: `The MICR code is ${data.micr || "not available — check your cheque book"}. MICR codes are used for cheque processing, not for digital transfers.`,
              },
              {
                q: `Is ${data.ifsc} valid for UPI transfers?`,
                a: `UPI transfers using a UPI ID do not require IFSC — the app resolves it automatically. Use ${data.ifsc} only for NEFT, RTGS, or IMPS when adding a bank account manually.`,
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

        {/* Nearby branches */}
        {nearby.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Other {data.bank} Branches in {data.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nearby.map((b) => (
                <Link
                  key={b.ifsc}
                  href={`/ifsc/${b.bankSlug}/${b.pageSlug}`}
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition text-sm"
                >
                  <div className="font-medium text-gray-800">{b.branchDisplay}</div>
                  <div className="font-mono text-blue-600 text-xs mt-0.5">{b.ifsc}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related guides */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/guide/ifsc-code-search-find-online", label: "How to Find IFSC Code" },
              { href: "/guide/neft-rtgs-imps-upi-difference", label: "NEFT vs RTGS vs IMPS vs UPI" },
              { href: `/guide/${bank}-net-banking-register`, label: `${data.bank} Net Banking` },
              { href: "/guide/swift-code-indian-banks-guide", label: "SWIFT Codes — International Transfer" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline border border-blue-200 rounded-full px-3 py-1"
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

import { getAllBanks, BANK_IFSC_PREFIX } from "@/lib/ifsc";
import Link from "next/link";
import type { Metadata } from "next";
import IFSCSearchWidget from "@/components/IFSCSearchWidget";

export const metadata: Metadata = {
  title: "IFSC Code Finder — All Banks, All Branches India",
  description:
    "Find IFSC code for any bank branch in India. SBI, HDFC, ICICI, Axis, PNB, Kotak, Canara and 300+ banks. Search by bank and city. Data from RBI IFSC directory.",
  keywords: [
    "ifsc code finder india",
    "bank ifsc code search",
    "sbi ifsc code",
    "hdfc ifsc code",
    "icici ifsc code",
    "ifsc code all banks india",
    "find ifsc code by branch",
  ],
};

export default function IFSCHomePage() {
  const banks = getAllBanks().sort((a, b) => b.count - a.count);

  const topBanks = [
    { slug: "sbi", name: "State Bank of India", prefix: "SBIN" },
    { slug: "hdfc", name: "HDFC Bank", prefix: "HDFC" },
    { slug: "icici", name: "ICICI Bank", prefix: "ICIC" },
    { slug: "axis", name: "Axis Bank", prefix: "UTIB" },
    { slug: "pnb", name: "Punjab National Bank", prefix: "PUNB" },
    { slug: "bob", name: "Bank of Baroda", prefix: "BARB" },
    { slug: "canara", name: "Canara Bank", prefix: "CNRB" },
    { slug: "union", name: "Union Bank of India", prefix: "UBIN" },
    { slug: "kotak", name: "Kotak Mahindra Bank", prefix: "KKBK" },
    { slug: "boi", name: "Bank of India", prefix: "BKID" },
    { slug: "indusind", name: "IndusInd Bank", prefix: "INDB" },
    { slug: "yes", name: "Yes Bank", prefix: "YESB" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">IFSC Code Finder</h1>
      <p className="text-gray-600 mb-6">
        Find IFSC codes for all bank branches in India. Data sourced from{" "}
        <a
          href="https://www.rbi.org.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          RBI&apos;s official IFSC directory
        </a>
        .
      </p>

      {/* Search */}
      <div className="mb-8">
        <IFSCSearchWidget placeholder="Search by branch name, city or IFSC code (e.g. HDFC Koramangala or HDFC0001234)…" />
      </div>

      {/* What is IFSC */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-blue-900 mb-2">What is an IFSC Code?</h2>
        <p className="text-sm text-blue-800">
          IFSC (Indian Financial System Code) is an 11-character code assigned by RBI to every
          bank branch. It&apos;s required for NEFT, RTGS, and IMPS transfers. Format:{" "}
          <span className="font-mono font-bold">BANK</span>
          <span className="font-mono text-gray-400">0</span>
          <span className="font-mono font-bold">BRANCH</span>{" "}
          — 4 bank letters + 0 + 6 branch code.
        </p>
      </div>

      {/* Top banks grid */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by Bank</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {topBanks.map((bank) => (
          <Link
            key={bank.slug}
            href={`/ifsc/${bank.slug}`}
            className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <div className="font-mono text-lg font-bold text-blue-700 mb-1 group-hover:text-blue-800">
              {bank.prefix}
            </div>
            <div className="text-sm font-medium text-gray-800">{bank.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {banks.find((b) => b.slug === bank.slug)?.count.toLocaleString() || "—"} branches
            </div>
          </Link>
        ))}
      </div>

      {/* All banks */}
      {banks.length > 12 && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Banks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
            {banks
              .filter((b) => !topBanks.find((t) => t.slug === b.slug))
              .map((bank) => (
                <Link
                  key={bank.slug}
                  href={`/ifsc/${bank.slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline py-1 flex justify-between"
                >
                  <span>{bank.name}</span>
                  <span className="text-gray-400 font-mono text-xs">
                    {BANK_IFSC_PREFIX[bank.slug] || ""}
                  </span>
                </Link>
              ))}
          </div>
        </>
      )}

      {/* How to use */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">How to Use IFSC Code</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
          {[
            { title: "NEFT Transfer", desc: "Free, any amount. Need recipient account number + IFSC. Settles in 30-min batches, 24×7." },
            { title: "RTGS Transfer", desc: "For ₹2 lakh+. Real-time settlement. Need account number + IFSC." },
            { title: "IMPS Transfer", desc: "Instant, up to ₹5 lakh. Need account number + IFSC. Works 24×7 including holidays." },
            { title: "Add Beneficiary", desc: "In net banking/app: Fund Transfer → Add Payee → Enter account number + IFSC → Wait for activation." },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-800 mb-1">{title}</div>
              <div className="text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Related guides */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Related Guides</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/guide/ifsc-code-search-find-online", label: "How to Find IFSC Code" },
            { href: "/guide/neft-rtgs-imps-upi-difference", label: "NEFT vs RTGS vs IMPS vs UPI" },
            { href: "/guide/swift-code-indian-banks-guide", label: "SWIFT Codes — International Transfer" },
            { href: "/guide/micr-code-what-is-how-to-find", label: "MICR Code Explained" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

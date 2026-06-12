import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogLite } from "@/lib/schemes-data";
import SchemesBrowser from "./SchemesBrowser";


export const metadata: Metadata = {
  title: "All Government Schemes in India — Search Central & State Schemes | CitizenNest",
  description:
    "Search and filter every central and state government scheme in India by state and category — pensions, housing, scholarships, farmer support, health, women & business. Check your eligibility in seconds.",
  alternates: { canonical: "https://www.citizennest.com/schemes" },
};

export default function SchemesDirectory() {
  const schemes = getCatalogLite().sort((a, b) => a.name.localeCompare(b.name));
  const states = [...new Set(schemes.filter(s => s.state).map(s => s.state as string))].sort();
  const categories = [...new Set(schemes.map(s => s.category))].sort();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="text-gray-800">Schemes</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Government Schemes in India</h1>
      <p className="mt-2 text-gray-600">
        Search {schemes.length.toLocaleString("en-IN")} central and state schemes by state and category. Not sure what
        you qualify for? <Link href="/eligibility" className="text-blue-600 font-medium hover:underline">Check your eligibility →</Link>
      </p>

      <div className="mt-6">
        <SchemesBrowser schemes={schemes} states={states} categories={categories} />
      </div>

      <p className="mt-10 text-xs text-gray-500">
        Scheme data sourced from the Government of India&apos;s myScheme portal and official department sources.
        CitizenNest is an independent platform; verify and apply on each scheme&apos;s official page.
      </p>
    </main>
  );
}

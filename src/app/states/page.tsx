import { Metadata } from "next";
import Link from "next/link";
import { getAllStatesWithCounts } from "@/lib/states";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "Government Schemes by State",
  description:
    "Browse government schemes, services, and guides organized by Indian state. Find what's available in your state on CitizenNest.",
  openGraph: {
    title: "Government Schemes by State — CitizenNest",
    description: "Find government schemes and guides for your state.",
    url: `${BASE_URL}/states`,
  },
  alternates: { canonical: `${BASE_URL}/states` },
};

export default function StatesIndexPage() {
  const states = getAllStatesWithCounts();

  return (
    <>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">States</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Government Schemes by State
      </h1>
      <p className="text-gray-600 mb-8">
        Select your state to browse all available government schemes and service guides.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {states.map((s) => (
          <Link
            key={s.slug}
            href={`/state/${s.slug}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition"
          >
            <span className="font-semibold text-gray-900">{s.name}</span>
            <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {s.count} guide{s.count !== 1 ? "s" : ""}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

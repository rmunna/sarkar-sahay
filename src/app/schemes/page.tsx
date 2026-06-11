import type { Metadata } from "next";
import Link from "next/link";
import { getAllSchemes } from "@/lib/schemes-data";

export const revalidate = 604800;

export const metadata: Metadata = {
  title: "All Government Schemes in India — Central & State Directory | CitizenNest",
  description:
    "Browse every central and state government scheme in India by category — pensions, housing, scholarships, farmer support, health, women & business. Check your eligibility in seconds.",
  alternates: { canonical: "https://www.citizennest.com/schemes" },
};

function catLabel(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

export default function SchemesDirectory() {
  const all = getAllSchemes();
  const byCat = new Map<string, { name: string; slug: string }[]>();
  for (const s of all) {
    const c = s.schemeCategory || "other";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c)!.push({ name: s.name, slug: s.slug ?? s.id });
  }
  const cats = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="text-gray-800">Schemes</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Government Schemes in India</h1>
      <p className="mt-2 text-gray-600">
        Browse {all.length.toLocaleString("en-IN")} central and state government schemes by category. Not sure what
        you qualify for? <Link href="/eligibility" className="text-blue-600 font-medium hover:underline">Check your eligibility →</Link>
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm text-blue-900">Answer 6 quick questions and see every scheme you may be eligible for.</span>
        <Link href="/eligibility" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap">
          Find my schemes
        </Link>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 text-sm">
        {cats.map(([slug, list]) => (
          <a key={slug} href={`#${slug}`} className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50">
            {catLabel(slug)} ({list.length})
          </a>
        ))}
      </nav>

      {cats.map(([slug, list]) => (
        <section key={slug} id={slug} className="mt-8 scroll-mt-20">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
            {catLabel(slug)} <span className="text-sm font-normal text-gray-500">({list.length})</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {list.sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
              <li key={s.slug}>
                <Link href={`/scheme/${s.slug}`} className="text-sm text-blue-700 hover:underline">{s.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-10 text-xs text-gray-500">
        Scheme data sourced from the Government of India&apos;s myScheme portal and official department sources.
        CitizenNest is an independent platform; verify and apply on each scheme&apos;s official page.
      </p>
    </main>
  );
}

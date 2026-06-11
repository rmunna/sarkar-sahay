import type { Metadata } from "next";
import Link from "next/link";
import { getCuratedSchemes, getCatalogLite, getSchemeStates } from "@/lib/schemes-data";
import EligibilityChecker from "./EligibilityChecker";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Government Scheme Eligibility Checker 2026 — Find Schemes You Qualify For",
  description:
    "Free tool: answer 6 questions (age, state, income, category, occupation) and instantly see which of 3,500+ central & state government schemes you may be eligible for — pensions, housing, scholarships, farmer support, health & more.",
  alternates: { canonical: "https://www.citizennest.com/eligibility" },
};

const FAQS = [
  {
    q: "How do I find out which government schemes I am eligible for?",
    a: "Enter your age, gender, state, family income, category and occupation in the checker above. It compares your profile against the eligibility rules of 3,500+ central and state government schemes and lists every scheme you may qualify for, with links to apply.",
  },
  {
    q: "Is this eligibility result official?",
    a: "No. CitizenNest is an independent platform. Results are indicative, based on published government eligibility criteria. The final decision always rests with the scheme authority — verify on each scheme's official page before applying.",
  },
  {
    q: "Is the scheme eligibility checker free?",
    a: "Yes, completely free. No sign-up, no charges. We never ask for Aadhaar, bank details or any document — only the basic profile details needed to match schemes.",
  },
  {
    q: "Which government schemes are covered?",
    a: "Both central (all-India) schemes like PM-Kisan, Ayushman Bharat and Atal Pension Yojana, and state schemes across 36 states and UTs — pensions, housing, scholarships, farmer support, women's welfare, health insurance, business loans and more.",
  },
];

export default function EligibilityPage() {
  const curated = getCuratedSchemes();
  const catalog = getCatalogLite();
  const states = getSchemeStates();

  const catCounts = new Map<string, number>();
  for (const s of catalog) catCounts.set(s.category, (catCounts.get(s.category) ?? 0) + 1);
  const categories = [...catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.citizennest.com" },
          { "@type": "ListItem", position: 2, name: "Scheme Eligibility Checker", item: "https://www.citizennest.com/eligibility" },
        ],
      },
      { "@type": "WebApplication", name: "Government Scheme Eligibility Checker", applicationCategory: "GovernmentApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } },
      { "@type": "FAQPage", mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="text-gray-800">Eligibility Checker</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Government Scheme Eligibility Checker</h1>
      <p className="mt-2 text-gray-600">
        Answer 6 quick questions and instantly see which of{" "}
        <strong>{catalog.length.toLocaleString("en-IN")}+ central and state government schemes</strong> you may qualify for —
        pensions, housing, scholarships, farmer support, health cover and more. Free, no sign-up.
      </p>

      <div className="mt-6">
        <EligibilityChecker curated={curated} catalog={catalog} states={states} />
      </div>

      {/* Crawlable content — internal links by category (results above are client-side) */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Browse government schemes by category</h2>
        <p className="mt-1 text-sm text-gray-600">Or explore the full directory of {catalog.length.toLocaleString("en-IN")} schemes.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(([slug, n]) => (
            <Link key={slug} href="/schemes" className="rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              {slug.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase())} <span className="text-gray-400">({n})</span>
            </Link>
          ))}
          <Link href="/schemes" className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">All schemes →</Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Popular schemes to check</h2>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {curated.map(s => (
            <li key={s.id}><Link href={s.guidePath} className="text-sm text-blue-700 hover:underline">{s.name}</Link></li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Frequently asked questions</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {FAQS.map(f => (
            <div key={f.q} className="py-3">
              <h3 className="text-sm font-semibold text-gray-800">{f.q}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-500">
        Scheme data sourced from the Government of India&apos;s myScheme portal and official department sources.
        CitizenNest is an independent platform, not affiliated with any government; eligibility shown is indicative.
      </p>
    </main>
  );
}

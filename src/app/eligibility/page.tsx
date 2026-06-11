import type { Metadata } from "next";
import { getSchemesForMatcher, getSchemeStates } from "@/lib/schemes-data";
import EligibilityChecker from "./EligibilityChecker";

export const revalidate = 86400; // daily — scheme DB updates with content pipeline

export const metadata: Metadata = {
  title: "Government Scheme Eligibility Checker 2026 — Which Schemes Can You Get?",
  description:
    "Answer 6 quick questions (age, state, income, category, occupation) and instantly see every central and state government scheme you may be eligible for, with how-to-apply guides.",
  alternates: { canonical: "https://www.citizennest.com/eligibility" },
};

export default function EligibilityPage() {
  const schemes = getSchemesForMatcher();
  const states = getSchemeStates();

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
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I find out which government schemes I am eligible for?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Enter your age, gender, state, family income, category and occupation in the checker above. It compares your profile against the published eligibility rules of central and state government schemes and lists every scheme you may qualify for, with step-by-step application guides.",
            },
          },
          {
            "@type": "Question",
            name: "Is this eligibility result official?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. CitizenNest is an independent information platform. The checker uses eligibility rules published by government sources, but the final decision always rests with the scheme authority. Verify on the official website linked with each scheme before applying.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Government Scheme Eligibility Checker
      </h1>
      <p className="mt-2 text-gray-600">
        {schemes.length > 0
          ? `Answer 6 quick questions and see which of ${schemes.length} central and state schemes you may qualify for — pensions, housing, scholarships, health cover, farmer support and more.`
          : "Answer 6 quick questions and see which central and state schemes you may qualify for."}
      </p>

      <div className="mt-6">
        <EligibilityChecker schemes={schemes} states={states} />
      </div>

      <section className="mt-10 text-sm text-gray-600 space-y-2">
        <h2 className="text-base font-semibold text-gray-800">How this checker works</h2>
        <p>
          Every scheme in this database is extracted from CitizenNest&apos;s verified guides, which cite official
          government sources and are refreshed when schemes change. A scheme appears in your results only when
          every condition it publishes (age, income, category, occupation, state) is met by your answers.
          Conditions we cannot check automatically — like specific documents or land ownership — are shown
          under &quot;Also check&quot; so you can verify them yourself.
        </p>
        <p>
          <strong>Disclaimer:</strong> CitizenNest is an independent platform, not affiliated with any government.
          Eligibility shown here is indicative; the scheme authority&apos;s decision is final.
        </p>
      </section>
    </main>
  );
}

import { getActiveUpdates, getOrganizations } from "@/lib/updates";
import type { Metadata } from "next";
import UpdatesFilter from "./updates-filter";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: "Latest Government Exam Updates 2026 — Notifications, Results, Admit Cards",
  description:
    "Latest government job notifications, exam results, admit cards and cutoffs for SSC, UPSC, NTA, RRB, IBPS, State PSC and more. Updated automatically.",
  alternates: { canonical: `${BASE_URL}/updates` },
  openGraph: {
    title: "Latest Government Exam Updates 2026",
    description: "Notifications, results, admit cards & cutoffs for SSC, UPSC, NTA, RRB, IBPS and more.",
    url: `${BASE_URL}/updates`,
    siteName: "CitizenNest",
    locale: "en_IN",
  },
};

export default function UpdatesPage() {
  const updates = getActiveUpdates();
  const orgs = getOrganizations();

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest Government Exam Updates",
    description: "Government job notifications, exam results, admit cards and cutoffs",
    url: `${BASE}/updates`,
    numberOfItems: updates.length,
    itemListElement: updates.slice(0, 20).map((u, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/update/${u.slug}`,
      name: u.title,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Updates", item: `${BASE}/updates` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest Updates</h1>
        <p className="text-gray-600">
          Government job notifications, exam schedules, admit cards, results &amp; cutoffs — updated automatically.
        </p>
      </div>

      <UpdatesFilter updates={updates} orgs={orgs} />
    </>
  );
}

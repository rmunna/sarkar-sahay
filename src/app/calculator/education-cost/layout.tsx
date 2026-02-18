import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Education Cost Calculator — Plan Your Child's Future Education Expenses",
  description:
    "Free education cost calculator for India. Estimate future cost of IIT, MBBS, MBA IIM, engineering, and abroad education. Calculate SIP and lumpsum needed today.",
  alternates: { canonical: "https://www.citizennest.com/calculator/education-cost" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

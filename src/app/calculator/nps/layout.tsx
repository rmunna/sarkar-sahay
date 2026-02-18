import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NPS Calculator — Estimate National Pension Scheme Returns",
  description:
    "Free NPS calculator for India. Estimate your retirement corpus, annuity income, and lump sum from NPS contributions.",
  alternates: { canonical: "https://www.citizennest.com/calculator/nps" },
};

export default function NPSLayout({ children }: { children: React.ReactNode }) {
  return children;
}

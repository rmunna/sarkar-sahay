import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPF Calculator — Public Provident Fund Maturity Calculator",
  description:
    "Free PPF calculator for India. Calculate PPF maturity amount, interest earned, and tax savings under Section 80C for 15+ year investment.",
  alternates: { canonical: "https://www.citizennest.com/calculator/ppf" },
};

export default function PPFLayout({ children }: { children: React.ReactNode }) {
  return children;
}

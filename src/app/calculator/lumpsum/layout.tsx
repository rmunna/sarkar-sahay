import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lumpsum Calculator — Calculate One-Time Investment Returns",
  description:
    "Free lumpsum investment calculator for India. Estimate maturity amount, total returns, and CAGR. Compare with FD returns side by side.",
  alternates: { canonical: "https://www.citizennest.com/calculator/lumpsum" },
};

export default function LumpsumLayout({ children }: { children: React.ReactNode }) {
  return children;
}

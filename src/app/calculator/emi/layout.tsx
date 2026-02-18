import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EMI Calculator — Calculate Monthly EMI for Home, Car, Personal & Education Loans",
  description:
    "Free EMI calculator for India. Calculate monthly EMI, total interest, and view amortization schedule for home loans, car loans, personal loans and more.",
  alternates: { canonical: "https://www.citizennest.com/calculator/emi" },
};

export default function EMILayout({ children }: { children: React.ReactNode }) {
  return children;
}

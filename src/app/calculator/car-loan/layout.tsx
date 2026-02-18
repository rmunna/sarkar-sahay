import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Car Loan EMI & Cost of Ownership Calculator — Total Car Buying Cost in India",
  description:
    "Free car loan calculator for India. Calculate EMI, total interest, depreciation schedule, on-road price breakdown, and break-even analysis for your car purchase.",
  alternates: { canonical: "https://www.citizennest.com/calculator/car-loan" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

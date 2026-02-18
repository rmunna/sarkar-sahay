import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retirement Planning Calculator — How Much Do You Need to Retire in India?",
  description:
    "Free retirement calculator for India. Calculate retirement corpus needed, monthly savings required, and get an inflation-adjusted projection for a comfortable retirement.",
  alternates: { canonical: "https://www.citizennest.com/calculator/retirement" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

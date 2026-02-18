import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interest Calculator — Simple & Compound Interest Online",
  description:
    "Free simple and compound interest calculator for India. Compare both side by side with year-wise breakdown and visual charts.",
  alternates: { canonical: "https://www.citizennest.com/calculator/interest" },
};

export default function InterestLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FD Calculator — Fixed Deposit Maturity & Interest Calculator",
  description:
    "Free FD calculator for India. Calculate fixed deposit maturity amount with different compounding frequencies for SBI, post office & more.",
  alternates: { canonical: "https://www.citizennest.com/calculator/fd" },
};

export default function FDLayout({ children }: { children: React.ReactNode }) {
  return children;
}

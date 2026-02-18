import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Loan Eligibility Calculator — Check Maximum Loan Amount You Can Get",
  description:
    "Free home loan eligibility calculator for India. Check maximum loan amount based on your income, existing EMIs, and FOIR ratio. Compare eligibility across different tenures.",
  alternates: { canonical: "https://www.citizennest.com/calculator/home-loan-eligibility" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

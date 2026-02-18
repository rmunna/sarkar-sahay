import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salary Calculator — CTC to In-Hand Salary Calculator India",
  description:
    "Free salary calculator for India. Convert CTC to in-hand salary with PF, professional tax, HRA, and income tax deductions for FY 2025-26.",
  alternates: { canonical: "https://www.citizennest.com/calculator/salary" },
};

export default function SalaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

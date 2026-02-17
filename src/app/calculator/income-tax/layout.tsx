import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Income Tax Calculator FY 2025-26 — Old vs New Regime",
  description: "Free income tax calculator for India FY 2025-26. Compare tax under old and new regime, enter deductions (80C, 80D, HRA), and find the best option.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

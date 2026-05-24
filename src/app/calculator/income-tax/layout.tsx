import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Income Tax Calculator FY 2026-27 — Old vs New Regime",
  description: "Free income tax calculator for India FY 2026-27 (AY 2027-28). Compare tax under old and new regime, enter deductions (80C, 80D, HRA, NPS), and find the best option. Includes marginal relief.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

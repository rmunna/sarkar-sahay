import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Age & Eligibility Checker — Exams, Schemes & Services",
  description: "Enter your date of birth to check eligibility for UPSC, SSC, NDA, voter ID, Atal Pension Yojana, and more government exams and schemes.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

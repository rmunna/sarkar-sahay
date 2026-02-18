import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government Job Eligibility Checker — Check Your Eligibility for SSC, UPSC, Banking & More",
  description:
    "Free tool to check your eligibility for 25+ government exams — UPSC, SSC, IBPS, RRB, Defence. Enter your details and instantly see which exams you qualify for.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

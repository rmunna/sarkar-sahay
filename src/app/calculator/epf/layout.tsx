import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "EPF Retirement Calculator — Corpus at 58",
  description: "Project your EPF corpus at retirement age 58. Enter salary, contributions, and increment to see year-by-year growth chart and pension estimate.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

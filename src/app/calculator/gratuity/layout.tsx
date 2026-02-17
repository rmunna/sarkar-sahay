import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Gratuity Calculator — Government & Private Sector",
  description: "Calculate your gratuity amount based on last drawn salary and years of service. Covers both government and private sector with tax-free limits.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

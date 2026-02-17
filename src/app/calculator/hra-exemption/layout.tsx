import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HRA Exemption Calculator — Section 10(13A)",
  description: "Calculate your HRA exemption and taxable HRA amount. Enter basic salary, DA, HRA received, and rent paid to get instant results.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

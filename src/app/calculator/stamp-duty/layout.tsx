import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Stamp Duty Calculator — All Major Indian States",
  description: "Calculate stamp duty and registration charges for property in Maharashtra, Karnataka, Delhi, UP, TN, and more. Gender-based concessions included.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

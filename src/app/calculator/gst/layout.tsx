import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GST Calculator — Calculate CGST, SGST & IGST Online",
  description:
    "Free GST calculator for India. Calculate GST-inclusive and GST-exclusive prices, CGST, SGST, IGST with presets for common items.",
  alternates: { canonical: "https://www.citizennest.com/calculator/gst" },
};

export default function GSTLayout({ children }: { children: React.ReactNode }) {
  return children;
}

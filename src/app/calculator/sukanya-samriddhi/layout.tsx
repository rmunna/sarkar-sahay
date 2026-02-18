import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sukanya Samriddhi Yojana Calculator — SSY Maturity Calculator",
  description:
    "Free Sukanya Samriddhi calculator. Calculate SSY maturity amount, interest earned for your girl child's education and marriage fund.",
  alternates: { canonical: "https://www.citizennest.com/calculator/sukanya-samriddhi" },
};

export default function SSYLayout({ children }: { children: React.ReactNode }) {
  return children;
}

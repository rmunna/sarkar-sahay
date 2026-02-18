import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIP Calculator — Calculate Mutual Fund SIP Returns Online",
  description:
    "Free SIP calculator for India. Estimate your mutual fund SIP returns, total wealth, and view year-wise growth projection.",
  alternates: { canonical: "https://www.citizennest.com/calculator/sip" },
};

export default function SIPLayout({ children }: { children: React.ReactNode }) {
  return children;
}

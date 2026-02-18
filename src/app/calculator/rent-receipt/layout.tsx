import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rent Receipt Generator — Free Printable Rent Receipts for HRA",
  description:
    "Generate free rent receipts for HRA tax exemption claims. Printable monthly receipts with landlord details, PAN, and payment info.",
  alternates: { canonical: "https://www.citizennest.com/calculator/rent-receipt" },
};

export default function RentReceiptLayout({ children }: { children: React.ReactNode }) {
  return children;
}

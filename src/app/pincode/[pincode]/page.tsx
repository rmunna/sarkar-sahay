/**
 * Legacy redirect: /pincode/560043 → /pincode/karnataka/bengaluru/banaswadi-560043
 * Keeps old URLs working with a permanent 301 redirect.
 */
import { permanentRedirect, notFound } from "next/navigation";
import { getPincodeCanonicalUrl } from "@/lib/pincode";

export const dynamicParams = true;

export default async function LegacyPincodePage({
  params,
}: {
  params: Promise<{ pincode: string }>;
}) {
  const { pincode } = await params;

  // Only handle 6-digit numeric pincodes
  if (!/^\d{6}$/.test(pincode)) notFound();

  const canonical = getPincodeCanonicalUrl(pincode);
  if (!canonical) notFound();

  permanentRedirect(canonical);
}

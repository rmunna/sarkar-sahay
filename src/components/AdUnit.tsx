"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  className?: string;
}

/**
 * Manual AdSense ad unit — loads regardless of Auto Ads placement decisions.
 * Use on data/lookup pages (IFSC, RTO, Pincode, HSN) where Auto Ads skips
 * injection due to thin text content.
 *
 * Slot IDs are set via NEXT_PUBLIC_AD_SLOT_DATA (or other env vars).
 * See: AdSense → Ads → By ad unit → Display ads → Responsive → Create
 */
export default function AdUnit({ slot, format = "auto", className = "" }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount — prevents duplicate pushes on re-renders
    if (pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet — the global script will handle it
    }
  }, []);

  // Don't render if no slot ID is configured
  if (!slot) return null;

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7012449506814064"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

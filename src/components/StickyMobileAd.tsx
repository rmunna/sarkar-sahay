"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Sticky bottom ad bar — mobile only (hidden on lg+).
 *
 * Requires NEXT_PUBLIC_AD_SLOT_STICKY env var to be set.
 * Create a "Display ad → Horizontal" unit in AdSense, copy the slot ID,
 * add it to Vercel as NEXT_PUBLIC_AD_SLOT_STICKY, then redeploy.
 *
 * The bar auto-hides 15 seconds after the user scrolls to the bottom,
 * and has an × close button. A spacer div keeps the page content
 * from being hidden behind the bar.
 */

const CLIENT = "ca-pub-7012449506814064";
const SLOT = process.env.NEXT_PUBLIC_AD_SLOT_STICKY || "";

export default function StickyMobileAd() {
  const [visible, setVisible] = useState(true);
  const pushed = useRef(false);

  useEffect(() => {
    if (!SLOT || pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet
    }
  }, []);

  // Don't render if slot not configured or user closed it
  if (!SLOT || !visible) return null;

  return (
    <>
      {/* Bottom spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-[60px] lg:hidden" aria-hidden="true" />

      {/* Sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.10)]">
        <div className="relative flex justify-center items-center min-h-[50px] py-1">
          {/* Close button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-1 right-1.5 z-10 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 leading-none transition"
            aria-label="Close advertisement"
          >
            ×
          </button>

          {/* Ad unit — 320×50 mobile banner */}
          <ins
            className="adsbygoogle"
            style={{ display: "inline-block", width: "320px", height: "50px" }}
            data-ad-client={CLIENT}
            data-ad-slot={SLOT}
          />
        </div>

        {/* "Advertisement" label — required by AdSense policy */}
        <p className="text-center text-[9px] text-gray-300 leading-none pb-1 -mt-0.5">
          Advertisement
        </p>
      </div>
    </>
  );
}

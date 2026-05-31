"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Re-pushes adsbygoogle on every client-side navigation so Auto Ads
 * re-scan the new page. Without this, AdSense only runs on the first
 * full page load — subsequent Next.js soft navigations are invisible to it.
 *
 * Also prevents the vignette ad from setting aria-hidden on <body>,
 * which Chrome 120+ blocks and logs as an accessibility error.
 */
export default function AdSenseInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay so the new page content is painted before AdSense scans
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded yet — that's fine, the script's own onload will handle it
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    // Prevent Google's vignette ad from setting aria-hidden on <body>,
    // which Chrome 120+ blocks and reports as an accessibility error.
    // We intercept setAttribute before the vignette overlay runs.
    const body = document.body;
    const originalSetAttribute = body.setAttribute.bind(body);
    body.setAttribute = function (name: string, value: string) {
      if (name === "aria-hidden" && value === "true") return; // block it
      originalSetAttribute(name, value);
    };

    return () => {
      body.setAttribute = originalSetAttribute; // restore on unmount
    };
  }, []);

  return null;
}

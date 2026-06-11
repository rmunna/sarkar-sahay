import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// CitizenNest on Cloudflare Workers (migrated off Vercel).
//
// Incremental cache = static-assets (read-only, zero extra cost; R2 is not
// enabled on the account). Build-prerendered ISR pages are served from the
// asset bundle. Pages NOT prerendered at build render on-demand each request
// (no write-back) — the long-tail data routes (IFSC branch, pincode) get their
// data from the D1 binding `citizennest_data`, not the filesystem, so that is
// fine. Content routes (guides/updates) are prerendered at build instead of
// rendering on-demand, because their markdown lives on a filesystem that does
// not exist on Workers at runtime.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

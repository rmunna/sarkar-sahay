import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// CitizenNest on Cloudflare Workers (migrated off Vercel).
// Incremental cache uses the Workers Static Assets / default cache; ISR pages
// revalidate per their `revalidate` exports. Long-tail data (IFSC, pincode)
// is served from the D1 binding `citizennest_data`, not the filesystem.
export default defineCloudflareConfig();

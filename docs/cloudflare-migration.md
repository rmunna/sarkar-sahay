# Cloudflare Migration Runbook

**Why:** citizennest.com was taken down by Vercel (`402 DEPLOYMENT_DISABLED`, billing). Decision (2026-06-11): move hosting to Cloudflare on the **free tier**, no Vercel spend, with cutover downtime measured in minutes (build + verify on Cloudflare first, flip DNS last).

**Adapter:** `@opennextjs/cloudflare` (OpenNext) — supports App Router, ISR, server components, API routes.

## The core blocker (now solved for IFSC)

`src/lib/*` reads 131 MB of JSON via `fs` at runtime; the long-tail programmatic
pages (IFSC 134,791 branches, pincode 19,238) are served by on-demand ISR that
reads those files per request. Workers have **no runtime fs** and a **3 MB (free)
/ 10 MB (paid) bundle cap**, so that data must move to a runtime binding.

**Chosen store: D1** (`citizennest-data`, id `3038c3c0-3d1a-4d64-b72a-eeba216f00ea`, region APAC).
SQLite is ideal for slug/IFSC lookups and fits the free tier (5 GB storage, 5M row-reads/day).

## Status

- [x] D1 database created (`citizennest-data`, APAC)
- [x] Schema: `data/d1/schema-ifsc.sql` (`ifsc_branches` + `ifsc_banks`, indexed for every query in `src/lib/ifsc.ts`)
- [x] Importer: `scripts/build-d1-ifsc.mjs` (chunked INSERTs — single big INSERT hit `SQLITE_TOOBIG`, so 100 rows/statement)
- [x] **Pilot imported & verified** — RBL bank (630 rows), all query paths confirmed against remote D1: getBranchBySlug, getBranchByIFSC, getBranchesByCity/nearby
- [x] D1-backed lib: `src/lib/ifsc-d1.ts` (async, D1 with fs fallback for build/dev; typechecks)
- [ ] Full IFSC import (all 19 banks, 134,791 rows)
- [ ] Move pincode (19k), then HSN/RTO/court if needed at runtime
- [ ] Install + configure `@opennextjs/cloudflare`, `wrangler.jsonc` for the Next app (separate from the detection worker's `wrangler.toml`)
- [ ] Switch IFSC page imports `./ifsc` → `./ifsc-d1` (add `await`); repeat per migrated lib
- [ ] `opennextjs-cloudflare build` + preview, verify a prerendered page and an on-demand branch page
- [ ] Point DNS to Cloudflare (cutover — the only downtime window)

## Known data quirk

8 of 638 RBL branches share a `page_slug` → the `UNIQUE(bank_slug, page_slug)`
index collapsed them to 630. This is a **pre-existing latent bug**: two distinct
branches map to one URL on the live site too (`.find()` returns the first). Decide
during full import whether to disambiguate slugs or accept the collision.

## Commands

```bash
# Full import (all banks)
node scripts/build-d1-ifsc.mjs
npx wrangler d1 execute citizennest-data --remote --file data/d1/schema-ifsc.sql -y
for f in data/d1/ifsc/*.sql; do npx wrangler d1 execute citizennest-data --remote --file "$f" -y; done

# Verify
npx wrangler d1 execute citizennest-data --remote --command "SELECT COUNT(*) FROM ifsc_branches" -y
```

`wrangler.jsonc` binding for the Next app:

```jsonc
{
  "d1_databases": [
    { "binding": "citizennest_data", "database_name": "citizennest-data", "database_id": "3038c3c0-3d1a-4d64-b72a-eeba216f00ea" }
  ]
}
```

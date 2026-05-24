# CLAUDE.md — CitizenNest (sarkar-sahay)

This file is read by Claude Code at the start of every session.
It contains project architecture, conventions, hard rules, and known gotchas.

---

## Project

**CitizenNest** — Indian government services + financial calculators for common Indian citizens.
- Live at: `https://www.citizennest.com`
- GitHub: `rmunna/sarkar-sahay`
- Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Vercel (Singapore)
- Content: guides in `content/guides/` (English) and `content/guides-hi/` (Hindi)

---

## Architecture — The Golden Rule

```
scripts/  →  data/  →  src/lib/  →  src/app/
```

1. **`scripts/`** — one-off data generation scripts (run locally, not at build time)
   - `npx tsx scripts/generate-xyz-data.ts`
   - Output goes to `data/`

2. **`data/`** — pre-built JSON files committed to git
   - Per-state / per-bank split (never one monolithic file)
   - Never commit `data/*/raw/` — too large

3. **`src/lib/`** — server-side data access with in-memory caching
   - Reads from `data/` using Node.js `fs`
   - One file per domain: `ifsc.ts`, `pincode.ts`, `hsn.ts`, `rto.ts`

4. **`src/app/`** — Next.js App Router pages
   - Server Components for data rendering (default)
   - `"use client"` ONLY for interactivity (calculators, search widgets, copy buttons)

---

## URL Structures

| Section | Pattern | Example |
|---------|---------|---------|
| PIN code | `/pincode/[state]/[district]/[postOffice-slug]-[pincode]` | `/pincode/karnataka/bengaluru/banaswadi-560043` |
| IFSC | `/ifsc/[bank]/[branch-slug]` | `/ifsc/hdfc/banaswadi-bangalore` |
| HSN | `/hsn/[code]` (lowercase) | `/hsn/1001` |
| RTO | `/rto/[slug]` | `/rto/ap-01` |
| Calculator | `/calculator/[slug]` | `/calculator/old-vs-new-regime` |
| Guide | `/guide/[slug]` | `/guide/aadhaar-card-download-online` |
| Hindi guide | `/hi/guide/[slug]` | `/hi/guide/aadhaar-card-download` |

**Pincode slugs**: `slugifyText(postOffice) + "-" + pincode`
e.g. "Banaswadi" + "560043" → `banaswadi-560043`

**RTO slugs**: lowercase state code + district number
e.g. `AP-01` → `ap-01`

---

## Key Lib Files & Exports

### `src/lib/ifsc.ts`
- `BANK_DISPLAY_NAMES` — bank slug → full name
- `BANK_OFFICIAL_URLS` — bank slug → correct official website URL
- `BANK_IFSC_PREFIX` — bank slug → 4-char IFSC prefix
- `getBranchBySlug(bank, branch)` — full branch record
- `searchBranches(query, bank?, limit)` — in-memory text search

### `src/lib/pincode.ts`
- `getPincodeSlug(record)` → `"banaswadi-560043"`
- `getPincodePath(record)` → `"/pincode/karnataka/bengaluru/banaswadi-560043"`
- `getPincodeBySlug(state, district, slug)` → full record
- `getPincodeData(pincode)` → look up by 6-digit number
- `getDistrictsByState(stateSlug)` → district list with counts
- `getPincodesByDistrict(stateSlug, districtSlug)` → all pincodes

### `src/lib/hsn.ts`
- `getHSNByCode(code)` → HSN/SAC record
- `searchHSN(query, limit)` → search by code or description
- `getChapterList()` → all chapters with counts

### `src/lib/rto.ts`
- `getRTOBySlug(slug)` → RTO record
- `getAllStates()` → state list with RTO counts

---

## Data Files

| Path | Contents |
|------|----------|
| `data/ifsc/{bank}.json` | All branches for one bank (19 banks) |
| `data/ifsc/index.json` | IFSC code → bank/branch lookup |
| `data/ifsc/banks.json` | Bank slug + branch count list |
| `data/pincode/{state}.json` | All pincodes for one state (35 states) |
| `data/pincode/index.json` | Pincode → {stateSlug, districtSlug, postOffice, ...} |
| `data/pincode/states.json` | State slug + count list |
| `data/hsn/index.json` | HSN code → record |
| `data/hsn/all.json` | All 206 HSN/SAC records as array |
| `data/hsn/chapters.json` | Chapter number → name |
| `data/rto/rto.json` | All 640 RTO records |
| `data/rto/by-state.json` | State slug → RTO array |

---

## ISR / Caching Settings

```ts
// Programmatic pages (IFSC, pincode, HSN, RTO) — rarely change
export const revalidate = 7776000; // 90 days

// Guide pages
export const revalidate = 86400; // 24 hours

// API routes
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1"; // Singapore for India latency
```

Always use `dynamicParams = true` on programmatic pages (never `false`).

---

## SEO Requirements (Every Programmatic Page)

### 1. JSON-LD schema — mandatory
```tsx
// Minimum: BreadcrumbList + FAQPage
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [...] },
    { "@type": "FAQPage", mainEntity: [...] },
  ],
};
```

### 2. H1 — keyword first, number second
```
✅  "Banaswadi PIN Code — 560043"
❌  "PIN Code 560043"

✅  "HDFC Bank Banaswadi Branch IFSC Code"
❌  "IFSC Code HDFC0001234"
```

### 3. Meta description — answer the query directly
```
✅  "The PIN code of Banaswadi is 560043. Located in Bengaluru district..."
❌  "560043 is a PIN code in Bengaluru district, Karnataka..."
```

### 4. FAQ questions — match actual search queries
```
✅  "What is the PIN code of Banaswadi?"   ← reverse lookup query
❌  "What is PIN code 560043?"             ← no one searches this
```

### 5. Canonical URL — always set
```tsx
alternates: { canonical: `https://www.citizennest.com/pincode/${state}/${district}/${slug}` }
```

---

## Design System

| Token | Value |
|-------|-------|
| Primary color | `orange-600` (#ea580c) |
| Light background | `orange-50` |
| Hover border | `orange-300` |
| Card border | `gray-200` rounded-xl |
| Success / exempt | `green-600` |
| Warning | `amber-50` border `amber-200` |

Card template:
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
```

Hero value display:
```tsx
<div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
  <p className="text-sm text-gray-500">Label</p>
  <p className="text-3xl font-bold text-orange-600">{value}</p>
</div>
```

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CopyButton` | `src/components/CopyButton.tsx` | Clipboard copy with "Copied ✓" feedback |
| `IFSCSearchWidget` | `src/components/IFSCSearchWidget.tsx` | Debounced IFSC search (client) |

`CopyButton` is a `"use client"` component. Always import it in Server Components — never inline `onClick` in Server Components.

---

## Hard Rules — Never Do These

### ❌ Affiliate blocks without real IDs
```tsx
// BANNED — removed from all pages in May 2025
<div>Sponsored — Open Demat on Upstox →</div>
```
No affiliate/sponsored blocks until real referral IDs are configured.

### ❌ Hardcoded bank URLs
```tsx
// BANNED
href="https://sbi.co.in"  // shown on HDFC page — this already happened once

// CORRECT
import { BANK_OFFICIAL_URLS } from "@/lib/ifsc";
href={BANK_OFFICIAL_URLS[bank]}
```

### ❌ Loading large JSON client-side
```tsx
// BANNED — ships 11MB to browser
import allBranches from "@/data/ifsc/sbi.json";

// CORRECT — server component or API route
const data = getBranchBySlug(bank, branch); // reads on server
```

### ❌ ₹ symbol in OG image titles
```tsx
// BANNED — Satori can't download the font glyph, build fails
name: "FD Calculator — ₹10,000 monthly"

// CORRECT
function sanitizeForOG(text: string) {
  return text.replace(/₹/g, "Rs.").replace(/…/g, "...");
}
```

### ❌ Bullet points (•) in YAML frontmatter
```yaml
# BANNED — breaks gray-matter parser
keywords:
  • aadhaar card download

# CORRECT
keywords:
  - aadhaar card download
```

### ❌ Edge Runtime with fs module
```ts
// BANNED — Edge Runtime has no Node.js fs
export const runtime = "edge";
// + any lib that uses fs.readFileSync

// CORRECT — use preferredRegion instead
export const preferredRegion = "sin1";
```

---

## Before Every Commit

```bash
npx tsc --noEmit   # must exit 0
```

If adding new page types, also run:
```bash
npx tsx scripts/generate-sitemap.ts
```

---

## Vercel / Deployment

- Region: `sin1` (Singapore) — set in `vercel.json` as `{ "regions": ["sin1"] }`
- API routes: export `preferredRegion = "sin1"` (can't use Edge Runtime because lib files use `fs`)
- Default Next.js region is `iad1` (Washington DC) — ~350ms for India vs ~60ms for Singapore

---

## Sitemap Structure

```
public/sitemap-index.xml          ← master index
public/sitemap.xml                ← guides, calculators, static pages
public/sitemap-ifsc-{bank}.xml    ← per-bank (19 files, ~134K URLs)
public/sitemap-pincode.xml        ← 19,238 individual pincode pages
public/sitemap-pincode-hubs.xml   ← 35 state + 630 district hub pages
public/sitemap-hsn.xml            ← 206 HSN/SAC code pages
public/sitemap-rto.xml            ← 640 RTO code pages
```

Regenerate with: `npx tsx scripts/generate-sitemap.ts`

---

## Content (Guides) Frontmatter

```yaml
---
title: "Aadhaar Card Download Online — Step by Step Guide"
description: "Learn how to download your Aadhaar card online..."
lastUpdated: "2025-05-24"       # YYYY-MM-DD format only
keywords:
  - aadhaar card download       # use - not •
  - uidai aadhaar download
---
```

---

## Behavioral Principles (Karpathy Guidelines)

### 1. Think Before Coding
Surface assumptions and tradeoffs — don't silently assume.
If a request is ambiguous, present interpretations before implementing.

### 2. Simplicity First
Deliver the minimum viable solution. No speculative features.
No abstractions for single-use code. No refactoring unrelated code.

### 3. Surgical Changes
Modify only what is necessary. Don't "improve" adjacent code, formatting, or comments.
Only remove code that your changes made obsolete.

### 4. Verify Before Committing
- `npx tsc --noEmit` must pass
- Check that internal links use the correct URL pattern
- Check that new bank-related code uses `BANK_OFFICIAL_URLS`, not hardcoded URLs
- If adding programmatic pages, update `scripts/generate-sitemap.ts`

---

## Known Gotchas (Learned the Hard Way)

| Gotcha | What happened | Fix |
|--------|--------------|-----|
| `sbi.co.in` on all bank pages | Hardcoded placeholder never replaced | Use `BANK_OFFICIAL_URLS[bank]` |
| ₹ in OG image = build fail | Satori fetches Google Font for U+20B9, gets 400 | `sanitizeForOG()` in OG route |
| YAML `•` in keywords = parse error | `gray-matter` chokes on bullet char | Use `-` for list items |
| `/pincode/state/karnataka` 404 | Home page linked wrong route | Correct is `/pincode/karnataka` |
| 260 branches instead of 134K | IFSC.json is a compressed index, not data | Use IFSC.csv via curl |
| Sponsored blocks on wrong pages | Demat ad on ICICI netbanking troubleshoot | Removed all sponsor blocks |
| `permanentRedirect()` = 308 not 301 | Next.js App Router behavior | Google treats same as 301 ✅ |

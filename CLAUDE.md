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

## Content Accuracy Rules — Government Scheme Guides

This section exists because factual errors were committed to production in May 2026:
wrong rupee amounts, wrong eligibility ages, schemes presented as "apply now" when
applications had closed, and Lakshmir Bhandar amounts that were 6 months out of date.
These rules are **mandatory**, not suggestions.

---

### Rule 1 — Source Hierarchy: Always Fetch Official Portals First

Before writing ANY scheme detail (amount, eligibility, dates, links), check sources in this order:

| Priority | Source type | Examples |
|----------|-------------|---------|
| **1 — Official** | State govt portal, scheme-specific `.gov.in` / `.nic.in` | `igr.assam.gov.in`, `orunodoi.assam.gov.in`, `arundhati.nic.in`, `tn.gov.in`, `wb.gov.in` |
| **2 — Official PDF** | Guidelines PDF linked from .gov.in page | Download and read — do not guess from PDF filename |
| **3 — National aggregators** | myscheme.gov.in, india.gov.in | Reasonably reliable but may lag |
| **4 — News (cross-check only)** | The Hindu, Indian Express, PTI | Use only to confirm; never as sole source |
| **❌ Never use alone** | sarkariyojana.com, egovtschemes.com, goodreturns.in, citizencompass.in, similar aggregators | Often correct but frequently wrong on amounts, dates, eligibility. Must be cross-checked against official source. |

**Procedure when an official page shows only PDF links (no inline text):**
- Try to fetch the PDF directly via `WebFetch`
- If the PDF is inaccessible, explicitly label the data as "per scheme guidelines" and add a note: "Verify exact figures at [official URL] before applying"
- Do NOT fill in the blanks with guesses or secondary sources

---

### Rule 2 — Six Fields That Must Be Verified from Official Sources

Every guide must have these verified — not inferred, not extrapolated:

| Field | Why it fails | What to verify |
|-------|-------------|----------------|
| **Rupee amount** | Schemes get revised; secondary sites quote old rates | Exact current figure from official G.O. or portal |
| **Age range** | Often wrong by 1–2 years in secondary sources | Both minimum and maximum age, e.g. "16–59" not "18–60" |
| **Eligibility exclusions** | Secondary sites omit key exclusions | Who is explicitly NOT eligible (govt employees, income tax payers, private institution grads, etc.) |
| **Application window** | Schemes open and close; secondary sites don't update | Is the portal currently accepting applications? Last date? |
| **Official links** | Broken or wrong URLs cause user harm | WebFetch every `officialLinks` URL before committing the guide |
| **Scheme status: promised vs live** | Manifesto promises ≠ implemented schemes | State clearly: "announced", "G.O. pending", "live — DBT flowing", or "application closed" |

---

### Rule 3 — Promised vs Live: Always Distinguish Explicitly

Every scheme in a guide must be tagged with one of these statuses:

| Tag | Meaning | When to use |
|-----|---------|-------------|
| **LIVE** | DBT/payments actively flowing | Confirmed from portal or news |
| **Notified** | G.O. issued, scheme operational, portal open | G.O. number available |
| **Announced** | CM/Cabinet announced, no G.O. yet | Speech or press release only |
| **Portal pending** | Notified but application portal not yet live | |
| **Application closed** | Was live, window has shut | State the last date explicitly |

❌ Never write "apply now" or "apply at [url]" for a scheme tagged Announced or Portal pending.
❌ Never write a step-by-step "How to apply" for a scheme that hasn't issued a G.O. yet.

---

### Rule 4 — Before Writing, Run This Checklist

```
[ ] Fetched the official government portal URL (not a secondary site)
[ ] Verified the rupee amount from the official source (not from another guide)
[ ] Verified the age range from the official source
[ ] Verified what categories are EXCLUDED (not just who is included)
[ ] Confirmed the application portal is currently open (or noted that it is closed/pending)
[ ] Checked every officialLinks URL responds (no 404, no 500)
[ ] Scheme status is tagged: LIVE / Notified / Announced / Portal pending / Application closed
[ ] No "apply immediately" language unless the portal is confirmed open today
```

If any item can't be checked (portal down, PDF inaccessible), add an explicit note in the guide:
> "Exact [amount/eligibility/date] could not be verified from the official portal at time of writing. Confirm at [URL] before applying."

---

### Rule 5 — Scheme Comparison Tables: Use Current Figures

When writing "old scheme vs new scheme" comparisons:
- Look up what the OLD scheme was paying at the time of transition — not at launch years ago
- Example mistake: Lakshmir Bhandar was quoted as ₹1,000 when it was actually ₹1,500 (TMC raised it Feb 2026 before the election)
- Always search: "[scheme name] amount [current year]" before filling in the "before" column

---

### Rule 6 — Official Links: Verify Before Committing

Every URL in `officialLinks` frontmatter and in guide body must be tested:

```bash
# Quick check — must return 2xx or 3xx, not 4xx/5xx
curl -IL --max-time 10 <url>
```

Or use WebFetch — if it returns 404/500/connection refused:
- Remove the broken link
- Replace with the parent domain (e.g. `assam.gov.in` instead of `assam.gov.in/scheme-page/154` if the sub-page is down)
- Add a note: "The scheme portal may not be live yet — check [parent domain] for updates"

Known broken patterns to watch for:
- `assam.gov.in/scheme-page/[id]` — IDs change frequently
- `jibon-prerana.assam.gov.in` — was unreachable during verification
- State portals returning HTTP 500 — use parent domain as fallback

---

### Rule 7 — New Government Schemes: Extra Caution

When writing guides for a newly elected government's schemes:
1. Distinguish what was in the **manifesto** vs what is in an actual **Government Order (G.O.)**
2. A G.O. has a number (e.g. "Notification No. 2411-WCD/O/AB-4/2026") — if you don't have a G.O. number, it's Announced, not Notified
3. Never state implementation dates from manifestos as confirmed — manifesto says "100 days", that is a target not a guarantee
4. For Day 1 / first cabinet decisions: cite the cabinet meeting date and source

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
| Arundhati Gold amount wrong | Wrote "10g gold ~₹55-75k" — official says ₹40,000 fixed | Always WebFetch `igr.assam.gov.in/schemes/arundhati-gold-scheme` |
| Arundhati marriage act wrong | Wrote "Special Marriage Act or Hindu Marriage Act" | Scheme requires Special Marriage Act 1954 ONLY |
| Orunodoi age range wrong | Wrote 18–60, correct is 16–59 | Verify age from `orunodoi.assam.gov.in` not secondary sites |
| Jibon Prerana application closed | Wrote "apply immediately" — window closed Nov 30, 2025 | Always check last date of application before writing how-to-apply |
| Jibon Prerana exclusions missed | Private institution grads, govt employee children excluded — not written | Fetch full eligibility including exclusions from official source |
| Lakshmir Bhandar stale amount | Wrote ₹1,000/₹1,200 — TMC raised to ₹1,500/₹1,700 in Feb 2026 | Search "[scheme] amount [current year]" before writing comparison tables |
| Yuva Shakti fake sites | Wrote "portal pending" — dozens of fake sites claimed to offer registration | Add scam warning for any unnotified scheme; never link unofficial portals |

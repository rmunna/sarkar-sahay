# CitizenNest Cloudflare Detection Worker

This worker replaces page-hash monitoring with item-level detection.

It does **not** treat whole-page text changes as actionable. Each source extractor returns announcement items, then the worker fingerprints `source + title + url`. Visitor counters, footer changes, random timestamps and layout changes should not create detections.

## What It Does

- Runs from Cloudflare Cron every 10 minutes.
- Scans configured tier-1/tier-2 official sources.
- Stores last-seen item fingerprints in Cloudflare KV.
- Records only new announcement items after the first baseline scan.
- Claims each detection fingerprint before generation so the same item is not handed to Gemini twice.
- Triggers the GitHub `Cloudflare Detection Publisher` workflow through `repository_dispatch`.
- Receives page-created callbacks for status updates and optional email.

## Files

- `workers/detection/index.mjs` — Worker code.
- `workers/detection/sources.json` — Source list and extraction strategies.
- `workers/detection/local-test.mjs` — Local dry-run/two-pass smoke test.
- `wrangler.toml` — Cloudflare Worker config.

## Source Strategies

- `ssc_api` — structured SSC notice API.
- `nta_notice_pdf` — NTA notice PDF timestamp extraction.
- `rss` — PIB/RBI RSS items.
- `official_links` — only official announcement-like links; no page text hash.

## Setup

Create KV namespaces:

```bash
npx wrangler kv namespace create MONITOR_STATE
npx wrangler kv namespace create MONITOR_STATE --preview
```

Paste the returned IDs into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MONITOR_STATE"
id = "..."
preview_id = "..."
```

Set admin token:

```bash
npx wrangler secret put MONITOR_ADMIN_TOKEN
```

Optional webhook:

```bash
npx wrangler secret put DETECTION_WEBHOOK_URL
npx wrangler secret put DETECTION_WEBHOOK_SECRET
```

GitHub handoff:

```bash
gh auth token | npx wrangler secret put GITHUB_DISPATCH_TOKEN
gh secret set CF_MONITOR_ADMIN_TOKEN --repo rmunna/sarkar-sahay --body "$MONITOR_ADMIN_TOKEN"
```

Deploy:

```bash
npm run monitor:cf:deploy
```

## Local Test

Dry-run one source:

```bash
npm run monitor:cf:test -- --source=nta
```

Two-pass baseline test:

```bash
npm run monitor:cf:test -- --source=all --tier=1 --twice
```

Expected behavior:

- Pass 1 stores the baseline and produces `0` detections.
- Pass 2 produces `0` detections if no source changed.

## Manual Scan

Dry-run scan:

```bash
curl "https://citizennest-detection.citizennest.workers.dev/scan?source=nta&dryRun=1"
```

Mutating scan:

```bash
curl -H "Authorization: Bearer $MONITOR_ADMIN_TOKEN" \
  "https://citizennest-detection.citizennest.workers.dev/scan?source=nta"
```

Recent detections:

```bash
curl -H "Authorization: Bearer $MONITOR_ADMIN_TOKEN" \
  "https://citizennest-detection.citizennest.workers.dev/detections/recent"
```

Processing status:

```bash
curl -H "Authorization: Bearer $MONITOR_ADMIN_TOKEN" \
  "https://citizennest-detection.citizennest.workers.dev/detections/status?fingerprints=abc123"
```

## Generation Flow

1. Cloudflare scans every 10 minutes.
2. First successful scan for a source stores a baseline and generates no pages.
3. A later unseen fingerprint is stored as a detection.
4. Detections below `MIN_DISPATCH_CONFIDENCE` are held and not sent to Gemini.
5. High-confidence detections are marked `queued`, then dispatched to GitHub once.
6. GitHub Actions runs `scripts/generate-updates-gemini.js --cloudflare-detections`.
7. The generator processes only the detected source IDs and the detected official URL/PDF.
8. If content is created, GitHub commits without `[skip vercel]`, submits the exact URL to Google Indexing API and IndexNow, then calls the Worker to mark the fingerprints `generated`.

The old `exam-monitor.yml` and `spike-detector.yml` scheduled triggers are disabled. They remain manual-only fallbacks.

## Email

The Worker has a `/notify/pages-created` endpoint. It sends via Cloudflare Email Sending only when an `EMAIL` binding is configured and `citizennest.com` is enabled for Email Sending. Without that binding, the endpoint returns a skipped response and does not fail the publishing workflow.

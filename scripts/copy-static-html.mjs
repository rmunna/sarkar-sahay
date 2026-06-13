#!/usr/bin/env node
/**
 * THE FREE-TIER FIX (do not remove — site goes down without it).
 *
 * A Next.js/OpenNext app serves every page through the Worker, and the free
 * Cloudflare plan caps each request at 10ms CPU. This app's cold-start is
 * 40–100ms, so ~60% of requests were killed with 1102 "Worker exceeded
 * resource limits" — the homepage and guides included.
 *
 * Fix: copy every pre-rendered *.html into the static-assets dir at its URL
 * path. Cloudflare Static Assets (run_worker_first unset) serves a matching
 * asset DIRECTLY, before the Worker ever runs — so static pages cost 0 Worker
 * CPU and can never 1102. The Worker is left to handle only the genuinely
 * dynamic D1 routes (IFSC branch, pincode leaf), which are low-volume.
 *
 * Runs automatically after `opennextjs-cloudflare build` (see package.json).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, ".next", "server", "app");
const ASSETS = path.join(ROOT, ".open-next", "assets");
const LIMIT = 20000; // Cloudflare Static Assets hard limit on file count

if (!fs.existsSync(APP) || !fs.existsSync(ASSETS)) {
  console.error("copy-static-html: build output missing — run after cf:build");
  process.exit(1);
}

let copied = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) {
      const dest = path.join(ASSETS, path.relative(APP, p));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(p, dest);
      copied++;
    }
  }
}
walk(APP);

let total = 0;
(function count(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? count(path.join(d, e.name)) : total++; })(ASSETS);

console.log(`copy-static-html: copied ${copied} pre-rendered pages → static assets (${total} asset files total)`);
if (total >= LIMIT) {
  console.error(`\n✗ asset files (${total}) >= Cloudflare limit (${LIMIT}). Prune redundant .cache files in .open-next/assets/cdn-cgi/_next_cache before deploying, or the upload will fail.`);
  process.exit(1);
}
if (total > LIMIT * 0.95) console.warn(`⚠ asset files (${total}) near the ${LIMIT} limit — plan to prune _next_cache soon.`);

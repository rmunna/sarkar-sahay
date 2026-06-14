#!/usr/bin/env node
/**
 * Submit recently-published, still-live update pages to Google's Indexing API
 * (+ existing google-index-submit.js handles quota). Runs at the END of the
 * Deploy workflow — AFTER the pages are live — so Google never fetches a 404.
 *
 * Why "recently published" instead of a git-diff handoff: monitor commits push
 * via GITHUB_TOKEN (which can't trigger the deploy), so we can't rely on the
 * push event or HEAD~1. Scanning publishedDate is idempotent and robust — re-
 * submitting a URL is harmless (Google dedupes), and the 200/day quota easily
 * covers the handful of time-sensitive updates published per day.
 *
 *   GOOGLE_INDEXING_KEY=... node scripts/index-recent-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content/updates");
const SITE = "https://www.citizennest.com";
const DAYS = 3; // index updates published within the last N days

if (!fs.existsSync(DIR)) { console.log("no updates dir"); process.exit(0); }

const today = new Date().toISOString().slice(0, 10);
const cutoff = Date.now() - DAYS * 864e5;
const fieldOf = (fm, k) => (fm.match(new RegExp(`${k}:\\s*"?([\\w-]+)"?`)) || [])[1];

const urls = [];
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const txt = fs.readFileSync(path.join(DIR, f), "utf8");
  const end = txt.indexOf("\n---", 3);
  const fm = end > 0 ? txt.slice(0, end) : txt.slice(0, 1500);
  const pub = fieldOf(fm, "publishedDate");
  const status = fieldOf(fm, "status") || "active";
  const exp = fieldOf(fm, "expiryDate");
  if (!pub || status !== "active") continue;
  if (new Date(pub).getTime() < cutoff) continue; // too old
  if (exp && exp < today) continue;               // already expired
  urls.push(`${SITE}/update/${path.basename(f, ".md")}`);
}

console.log(`index-recent-content: ${urls.length} recent active update(s) to submit`);
let ok = 0;
for (const u of urls) {
  try {
    // only submit if the page is actually live (avoid feeding Google a 404)
    const code = execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", u], { encoding: "utf8" }).trim();
    if (code !== "200") { console.log(`  ⏭  ${code} (not live yet) — ${u}`); continue; }
    execFileSync("node", ["scripts/google-index-submit.js", u], { cwd: ROOT, stdio: "inherit" });
    ok++;
  } catch (e) { console.error(`  ✗ ${u}: ${String(e.message).slice(0, 100)}`); }
}
console.log(`index-recent-content: submitted ${ok}/${urls.length}`);

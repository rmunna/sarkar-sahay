#!/usr/bin/env node
/**
 * Headless-browser detail fetcher for myScheme. Renders the PUBLIC scheme page
 * (myscheme.gov.in/schemes/<slug>) like a normal visitor — the page's own
 * frontend makes its authenticated detail API call, and we capture the JSON
 * response it receives. No credential is extracted or replayed; each page is a
 * real render. Polite + resumable: caches to data/schemes/_detail/, throttled.
 *
 *   node scripts/scrape-myscheme-detail.mjs gsfe            # one slug (test)
 *   node scripts/scrape-myscheme-detail.mjs --all           # all schemes (resumable)
 *   node scripts/scrape-myscheme-detail.mjs --all --limit 50
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "data", "schemes", "_detail");
const MS = "https://www.myscheme.gov.in";
const DELAY_MS = 2500; // polite throttle between pages

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const limitI = args.indexOf("--limit");
const LIMIT = limitI !== -1 ? parseInt(args[limitI + 1], 10) : Infinity;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function slugList() {
  const single = args.find(a => !a.startsWith("--") && a !== String(LIMIT));
  if (single) return [single];
  const ms = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "schemes", "myscheme.json"), "utf8"));
  return ms.map(s => s.slug ?? s.id).filter(Boolean);
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const slugs = slugList();
  const pending = slugs.filter(s => !fs.existsSync(path.join(CACHE, `${s}.json`))).slice(0, LIMIT);
  console.log(`slugs: ${slugs.length} | cached: ${slugs.length - pending.filter(s => !fs.existsSync(path.join(CACHE, `${s}.json`))).length} | this run: ${pending.length}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    locale: "en-IN",
  });
  // establish a session on the homepage first
  const warm = await ctx.newPage();
  await warm.goto(MS, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
  await warm.close();

  let ok = 0, fail = 0, i = 0;
  for (const slug of pending) {
    i++;
    const page = await ctx.newPage();
    let captured = null;
    page.on("response", async (res) => {
      const u = res.url();
      if (/\/schemes\/v\d+\/schemes\/[^/?]+/.test(u) && res.request().method() === "GET") {
        try {
          const j = await res.json();
          const d = j?.data ?? j;
          if (d && (d.en || d.schemeName || d.basicDetails)) captured = d;
        } catch { /* not json */ }
      }
    });
    try {
      await page.goto(`${MS}/schemes/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
      // give late XHR a moment
      for (let t = 0; t < 6 && !captured; t++) await page.waitForTimeout(800);
      if (captured) {
        fs.writeFileSync(path.join(CACHE, `${slug}.json`), JSON.stringify(captured, null, 2));
        ok++;
        if (i <= 3 || i % 50 === 0) console.log(`  ✓ ${slug} (${ok})`);
      } else {
        fail++;
        console.log(`  ✗ ${slug}: no detail captured`);
      }
    } catch (e) {
      fail++;
      console.log(`  ✗ ${slug}: ${e.message?.slice(0, 60)}`);
    } finally {
      await page.close();
    }
    await sleep(DELAY_MS);
  }
  await browser.close();
  console.log(`DONE: captured=${ok} failed=${fail}`);
}

main();

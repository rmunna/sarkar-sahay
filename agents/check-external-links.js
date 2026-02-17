#!/usr/bin/env node
/**
 * Check external links (officialLinks) across all guides.
 * Does HTTP HEAD requests, flags 404s, redirects, timeouts.
 * Updates freshness-tracker.json with results.
 *
 * Usage: node agents/check-external-links.js [--batch N] [--oldest-first]
 *   --batch N       Only check N guides per run (default: all)
 *   --oldest-first  Prioritize guides not checked recently
 *
 * Exit code 1 if broken links found.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const guidesDir = path.join(__dirname, "..", "content", "guides");
const trackerPath = path.join(__dirname, "freshness-tracker.json");

function getAllGuides() {
  return fs
    .readdirSync(guidesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(guidesDir, f), "utf8");
      const { data } = matter(raw);
      return { slug, officialLinks: data.officialLinks || [] };
    });
}

function loadTracker() {
  if (!fs.existsSync(trackerPath)) return {};
  return JSON.parse(fs.readFileSync(trackerPath, "utf8"));
}

function saveTracker(tracker) {
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
}

async function checkUrl(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CitizenNest-LinkChecker/1.0; +https://citizennest.com)",
      },
    });
    clearTimeout(timer);
    return { url, status: res.status, ok: res.status < 400, redirected: res.redirected };
  } catch (err) {
    clearTimeout(timer);
    // Some servers reject HEAD, try GET
    try {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), timeoutMs);
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller2.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; CitizenNest-LinkChecker/1.0; +https://citizennest.com)",
        },
      });
      clearTimeout(timer2);
      return { url, status: res.status, ok: res.status < 400, redirected: res.redirected };
    } catch (err2) {
      return { url, status: 0, ok: false, error: err2.message || "timeout" };
    }
  }
}

async function run() {
  const args = process.argv.slice(2);
  const batchIdx = args.indexOf("--batch");
  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1]) : Infinity;
  const oldestFirst = args.includes("--oldest-first");

  const tracker = loadTracker();
  let guides = getAllGuides().filter((g) => g.officialLinks.length > 0);

  if (oldestFirst) {
    guides.sort((a, b) => {
      const aDate = tracker[a.slug]?.lastChecked || "2000-01-01";
      const bDate = tracker[b.slug]?.lastChecked || "2000-01-01";
      return aDate.localeCompare(bDate);
    });
  }

  guides = guides.slice(0, batchSize);

  const today = new Date().toISOString().split("T")[0];
  let totalBroken = 0;
  const results = [];

  console.log(`Checking external links for ${guides.length} guides...\n`);

  for (const guide of guides) {
    const brokenLinks = [];
    const linkResults = [];

    for (const url of guide.officialLinks) {
      const result = await checkUrl(url);
      linkResults.push(result);
      if (!result.ok) {
        brokenLinks.push(url + (result.error ? ` (${result.error})` : ` (HTTP ${result.status})`));
      }
    }

    const status = brokenLinks.length > 0 ? "broken-links" : "ok";
    const icon = status === "ok" ? "✅" : "❌";
    console.log(`${icon} ${guide.slug} — ${guide.officialLinks.length} link(s)${brokenLinks.length ? " — BROKEN: " + brokenLinks.join(", ") : ""}`);

    tracker[guide.slug] = {
      ...tracker[guide.slug],
      lastChecked: today,
      linkStatus: status,
      brokenLinks,
      totalLinks: guide.officialLinks.length,
    };

    totalBroken += brokenLinks.length;

    // Be polite — small delay between guides
    await new Promise((r) => setTimeout(r, 500));
  }

  saveTracker(tracker);
  console.log(`\n${totalBroken === 0 ? "✅" : "❌"} Done. ${totalBroken} broken link(s) across ${guides.length} guides.`);
  console.log(`Tracker updated: ${trackerPath}`);

  process.exit(totalBroken > 0 ? 1 : 0);
}

run();

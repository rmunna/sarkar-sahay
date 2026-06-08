#!/usr/bin/env node
/**
 * Google Search Console Opportunity Miner
 *
 * Finds growth opportunities from real GSC performance data:
 * - striking-distance queries/pages ranking around positions 8-30
 * - low-CTR queries with meaningful impressions
 * - pages/queries declining versus the previous comparable period
 * - query cannibalization across multiple pages
 *
 * Usage:
 *   node scripts/gsc-opportunity-miner.mjs
 *   node scripts/gsc-opportunity-miner.mjs --days 28 --top 100
 *   node scripts/gsc-opportunity-miner.mjs --json
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const KEY_PATH = path.join(ROOT, "keys", "gsc-service-account.json");
const OUT_DIR = path.join(ROOT, "agents");
const DEFAULT_OUT_PREFIX = path.join(OUT_DIR, "gsc-opportunities");
const SITE_CANDIDATES = ["https://www.citizennest.com/", "sc-domain:citizennest.com"];
const SITE_ORIGIN = "https://www.citizennest.com";

const args = process.argv.slice(2);
const days = intArg("--days", 28);
const compareDays = intArg("--compare-days", days);
const topN = intArg("--top", 120);
const rowLimit = intArg("--row-limit", 25000);
const minImpressions = intArg("--min-impressions", 20);
const outPrefix = valueArg("--out") || DEFAULT_OUT_PREFIX;
const jsonOut = args.includes("--json");
const noWrite = args.includes("--no-write");

function valueArg(name) {
  const exact = args.find(arg => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function intArg(name, fallback) {
  const value = valueArg(name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateStr(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function pct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function pathFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/$/, "") || "/";
  } catch {
    return String(url || "").replace(SITE_ORIGIN, "").replace(/\/$/, "") || "/";
  }
}

function searchIntent(query) {
  const value = query.toLowerCase();
  if (/\b(download|certificate|card|pdf)\b/.test(value)) return "download";
  if (/\b(status|check|track|list)\b/.test(value)) return "status";
  if (/\b(apply|registration|login|portal|create)\b/.test(value)) return "apply/register";
  if (/\b(not working|error|failed|problem|fix|otp|rejected)\b/.test(value)) return "troubleshooting";
  if (/\b(vs|difference|compare)\b/.test(value)) return "comparison";
  if (/\b(amount|eligibility|last date|subsidy|benefit)\b/.test(value)) return "scheme detail";
  return "informational";
}

function clusterFor(text) {
  const value = text.toLowerCase();
  const clusters = [
    ["APAAR", /\bapaar\b|academic bank|abc id/],
    ["PM Surya Ghar", /pm.?surya|surya ghar|solar rooftop|rooftop solar/],
    ["ABHA", /\babha\b|health id|digital health/],
    ["MY Bharat", /my bharat|mera yuva|nyps/],
    ["Farmer ID", /farmer id|farm id|agri.?stack|farmer registry|digital agriculture/],
    ["Government AI", /indiaai|aikosha|bhashini|saarthi|samadhan didi|kar saathi|government ai|ai for citizens/],
    ["Jobs & Exams", /admit card|result|answer key|recruitment|exam|vacancy|ssc|rrb|nta|upsc|ibps/],
    ["Tax", /income tax|itr|ais|form 26as|tds|refund/],
    ["Aadhaar", /aadhaar|uidai|aadhar/],
  ];
  const match = clusters.find(([, regex]) => regex.test(value));
  return match ? match[0] : "General";
}

function actionFor(type) {
  if (type === "striking_distance") return "Refresh page section around this query, add FAQ, and strengthen internal links.";
  if (type === "ctr_repair") return "Rewrite title/meta/H1 intro to match query intent and add a direct answer above the fold.";
  if (type === "decay") return "Audit freshness, official links, changed facts, and stale competing sections.";
  if (type === "cannibalization") return "Choose canonical page, add internal links, merge/redirect duplicates if intent overlaps.";
  if (type === "zero_click") return "Add sharper answer block and improve snippet/FAQ targeting.";
  return "Review query intent and update the best matching page.";
}

function expectedCtr(position) {
  const pos = Number(position || 99);
  if (pos <= 1.5) return 0.22;
  if (pos <= 3) return 0.12;
  if (pos <= 5) return 0.07;
  if (pos <= 8) return 0.04;
  if (pos <= 12) return 0.025;
  if (pos <= 20) return 0.015;
  return 0.008;
}

async function getAuth() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Service account key not found: ${KEY_PATH}`);
  }
  return new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

async function findSiteUrl(api) {
  for (const siteUrl of SITE_CANDIDATES) {
    try {
      await api.sites.get({ siteUrl });
      return siteUrl;
    } catch {
      // Try next property shape.
    }
  }
  throw new Error(`Could not access any GSC property. Tried: ${SITE_CANDIDATES.join(", ")}`);
}

async function queryGsc(api, siteUrl, requestBody) {
  const response = await api.searchanalytics.query({ siteUrl, requestBody });
  return response.data.rows || [];
}

function loadGuideInventory() {
  const dirs = [
    ["en", path.join(ROOT, "content", "guides"), "/guide"],
    ["hi", path.join(ROOT, "content", "guides-hi"), "/hi/guide"],
    ["ta", path.join(ROOT, "content", "guides-ta"), "/ta/guide"],
    ["ml", path.join(ROOT, "content", "guides-ml"), "/ml/guide"],
    ["te", path.join(ROOT, "content", "guides-te"), "/te/guide"],
    ["kn", path.join(ROOT, "content", "guides-kn"), "/kn/guide"],
  ];
  const pages = new Map();
  for (const [lang, dir, prefix] of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || slug;
      const lastUpdated = content.match(/^lastUpdated:\s*["']?(.+?)["']?\s*$/m)?.[1] || "";
      pages.set(`${prefix}/${slug}`, { lang, slug, title, lastUpdated, file: path.relative(ROOT, path.join(dir, file)) });
    }
  }
  return pages;
}

function metricKey(page, query) {
  return `${page}\n${query}`;
}

function rowObject(row) {
  const [pageUrl, query] = row.keys;
  const page = pathFromUrl(pageUrl);
  return {
    page,
    pageUrl,
    query,
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  };
}

function scoreOpportunity(type, row, previous) {
  const impressions = row.impressions || 0;
  const clicks = row.clicks || 0;
  const pos = row.position || 99;
  const ctr = row.ctr || 0;
  let score = 0;

  if (type === "striking_distance") {
    score = impressions * Math.max(0, 31 - pos) / 20;
    if (pos <= 15) score += 25;
    if (clicks > 0) score += 8;
  } else if (type === "ctr_repair") {
    score = impressions * Math.max(0, expectedCtr(pos) - ctr) * 8;
    if (pos <= 10) score += 25;
  } else if (type === "decay") {
    const clickDrop = Math.max(0, (previous?.clicks || 0) - clicks);
    const impressionDrop = Math.max(0, (previous?.impressions || 0) - impressions);
    score = clickDrop * 12 + impressionDrop / 12;
    if ((previous?.clicks || 0) >= 5) score += 20;
  } else if (type === "zero_click") {
    score = impressions / Math.max(1, pos / 8);
    if (pos <= 20) score += 12;
  } else if (type === "cannibalization") {
    score = impressions / 8 + Math.max(0, 25 - pos);
  }

  return Math.round(score);
}

function opportunity(type, row, previous = null, extra = {}) {
  const score = scoreOpportunity(type, row, previous);
  return {
    type,
    score,
    priority: score >= 80 ? "P0" : score >= 50 ? "P1" : score >= 25 ? "P2" : "P3",
    cluster: clusterFor(`${row.query} ${row.page}`),
    intent: searchIntent(row.query),
    query: row.query,
    page: row.page,
    clicks: round(row.clicks, 0),
    impressions: round(row.impressions, 0),
    ctr: pct(row.ctr),
    position: round(row.position, 1),
    previous: previous ? {
      clicks: round(previous.clicks, 0),
      impressions: round(previous.impressions, 0),
      ctr: pct(previous.ctr),
      position: round(previous.position, 1),
    } : null,
    action: actionFor(type),
    ...extra,
  };
}

function dedupeAndSort(items) {
  const seen = new Set();
  return items
    .sort((a, b) => b.score - a.score || b.impressions - a.impressions)
    .filter(item => {
      const key = `${item.type}:${item.page}:${item.query}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mineOpportunities(recentRows, previousRows) {
  const previousByKey = new Map(previousRows.map(row => [metricKey(row.page, row.query), row]));
  const byQuery = new Map();
  const opportunities = [];

  for (const row of recentRows) {
    if (!row.query || row.impressions < minImpressions) continue;
    const previous = previousByKey.get(metricKey(row.page, row.query));
    if (!byQuery.has(row.query)) byQuery.set(row.query, []);
    byQuery.get(row.query).push(row);

    if (row.position >= 8 && row.position <= 30) {
      opportunities.push(opportunity("striking_distance", row, previous));
    }
    if (row.position <= 12 && row.impressions >= minImpressions * 2 && row.ctr < expectedCtr(row.position) * 0.55) {
      opportunities.push(opportunity("ctr_repair", row, previous));
    }
    if (row.clicks === 0 && row.impressions >= minImpressions * 3 && row.position <= 30) {
      opportunities.push(opportunity("zero_click", row, previous));
    }
    if (previous && previous.clicks >= 3 && row.clicks <= previous.clicks * 0.55) {
      opportunities.push(opportunity("decay", row, previous));
    }
  }

  for (const [query, rows] of byQuery.entries()) {
    const competing = rows
      .filter(row => row.impressions >= Math.max(8, minImpressions / 2))
      .sort((a, b) => b.impressions - a.impressions);
    const uniquePages = new Set(competing.map(row => row.page));
    if (uniquePages.size < 2) continue;
    const top = competing.slice(0, 4);
    const totalImpressions = top.reduce((sum, row) => sum + row.impressions, 0);
    if (totalImpressions < minImpressions * 2) continue;

    opportunities.push(opportunity("cannibalization", top[0], null, {
      query,
      competingPages: top.map(row => ({
        page: row.page,
        clicks: round(row.clicks, 0),
        impressions: round(row.impressions, 0),
        position: round(row.position, 1),
      })),
      action: "Pick the best canonical page, then merge, redirect, or add clarifying internal links for competing pages.",
    }));
  }

  return dedupeAndSort(opportunities);
}

function buildPageQueue(opportunities, guides) {
  const grouped = new Map();
  for (const item of opportunities) {
    if (!grouped.has(item.page)) {
      const guide = guides.get(item.page) || null;
      grouped.set(item.page, {
        page: item.page,
        title: guide?.title || "",
        file: guide?.file || "",
        lastUpdated: guide?.lastUpdated || "",
        score: 0,
        priority: "P3",
        clusters: new Set(),
        reasons: [],
        topQueries: [],
      });
    }
    const entry = grouped.get(item.page);
    entry.score += item.score;
    entry.clusters.add(item.cluster);
    entry.reasons.push(item.type);
    entry.topQueries.push({
      query: item.query,
      type: item.type,
      impressions: item.impressions,
      clicks: item.clicks,
      ctr: item.ctr,
      position: item.position,
    });
  }

  return [...grouped.values()]
    .map(entry => ({
      ...entry,
      score: Math.round(entry.score),
      priority: entry.score >= 160 ? "P0" : entry.score >= 90 ? "P1" : entry.score >= 45 ? "P2" : "P3",
      clusters: [...entry.clusters],
      reasons: [...new Set(entry.reasons)],
      topQueries: entry.topQueries
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 8),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function markdownReport(report) {
  const lines = [
    "# GSC Opportunity Miner",
    "",
    `Generated: ${report.generatedAt}`,
    `Site: ${report.siteUrl}`,
    `Recent period: ${report.period.recent.startDate} to ${report.period.recent.endDate}`,
    `Previous period: ${report.period.previous.startDate} to ${report.period.previous.endDate}`,
    "",
    "## Summary",
    "",
    `- Opportunities: ${report.opportunities.length}`,
    `- Page queue items: ${report.pageQueue.length}`,
    `- Minimum impressions: ${report.config.minImpressions}`,
    "",
    "## Top Page Queue",
    "",
    "| Priority | Score | Page | Reasons | Top query | Action |",
    "|---|---:|---|---|---|---|",
  ];

  for (const page of report.pageQueue.slice(0, 30)) {
    const topQuery = page.topQueries[0]?.query || "";
    lines.push(`| ${page.priority} | ${page.score} | \`${page.page}\` | ${page.reasons.join(", ")} | ${escapeMd(topQuery)} | ${escapeMd(actionSummary(page.reasons))} |`);
  }

  lines.push("", "## Top Opportunities", "", "| Priority | Score | Type | Query | Page | Impr | CTR | Pos | Action |", "|---|---:|---|---|---|---:|---:|---:|---|");
  for (const item of report.opportunities.slice(0, 50)) {
    lines.push(`| ${item.priority} | ${item.score} | ${item.type} | ${escapeMd(item.query)} | \`${item.page}\` | ${item.impressions} | ${item.ctr} | ${item.position} | ${escapeMd(item.action)} |`);
  }

  lines.push("", "## Cannibalization", "");
  const cannibal = report.opportunities.filter(item => item.type === "cannibalization").slice(0, 15);
  if (cannibal.length === 0) {
    lines.push("No cannibalization candidates found above thresholds.");
  } else {
    for (const item of cannibal) {
      lines.push(`### ${item.query}`, "");
      for (const page of item.competingPages || []) {
        lines.push(`- \`${page.page}\` - ${page.impressions} impressions, position ${page.position}`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function actionSummary(reasons) {
  if (reasons.includes("cannibalization")) return "Resolve canonical overlap.";
  if (reasons.includes("decay")) return "Refresh stale sections and official facts.";
  if (reasons.includes("ctr_repair")) return "Improve title/meta/direct answer.";
  if (reasons.includes("striking_distance")) return "Expand matching section and internal links.";
  return "Review query intent.";
}

function escapeMd(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

async function main() {
  const auth = await getAuth();
  const client = await auth.getClient();
  const api = google.searchconsole({ version: "v1", auth: client });
  const siteUrl = await findSiteUrl(api);
  const recent = {
    startDate: dateStr(days + 3),
    endDate: dateStr(3),
  };
  const previous = {
    startDate: dateStr(days + compareDays + 3),
    endDate: dateStr(days + 4),
  };

  const baseRequest = {
    dimensions: ["page", "query"],
    rowLimit,
    dataState: "all",
    orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
  };

  const recentRows = (await queryGsc(api, siteUrl, { ...baseRequest, ...recent })).map(rowObject);
  const previousRows = (await queryGsc(api, siteUrl, { ...baseRequest, ...previous })).map(rowObject);
  const guides = loadGuideInventory();
  const opportunities = mineOpportunities(recentRows, previousRows).slice(0, topN);
  const pageQueue = buildPageQueue(opportunities, guides);
  const clusterSummary = {};
  for (const item of opportunities) {
    if (!clusterSummary[item.cluster]) clusterSummary[item.cluster] = { count: 0, score: 0, impressions: 0 };
    clusterSummary[item.cluster].count++;
    clusterSummary[item.cluster].score += item.score;
    clusterSummary[item.cluster].impressions += item.impressions;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    period: { recent, previous },
    config: { days, compareDays, rowLimit, minImpressions, topN },
    rows: { recent: recentRows.length, previous: previousRows.length },
    clusterSummary: Object.fromEntries(Object.entries(clusterSummary).sort((a, b) => b[1].score - a[1].score)),
    pageQueue,
    opportunities,
  };

  if (!noWrite) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(`${outPrefix}.json`, JSON.stringify(report, null, 2));
    fs.writeFileSync(`${outPrefix}.md`, markdownReport(report));
  }

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("GSC opportunity miner complete");
  console.log(`Site: ${siteUrl}`);
  console.log(`Recent: ${recent.startDate} to ${recent.endDate}`);
  console.log(`Previous: ${previous.startDate} to ${previous.endDate}`);
  console.log(`Rows: ${recentRows.length} recent, ${previousRows.length} previous`);
  console.log(`Opportunities: ${opportunities.length}`);
  console.log(`Top page queue items: ${pageQueue.length}`);
  if (!noWrite) {
    console.log(`Wrote: ${outPrefix}.json`);
    console.log(`Wrote: ${outPrefix}.md`);
  }
  for (const item of pageQueue.slice(0, 10)) {
    console.log(`${item.priority} ${String(item.score).padStart(4)} ${item.page} - ${item.reasons.join(", ")}`);
  }
}

main().catch(error => {
  console.error("GSC opportunity miner failed:", error.message || error);
  process.exit(1);
});

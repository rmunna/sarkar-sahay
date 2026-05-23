#!/usr/bin/env node
/**
 * Google Search Console — Performance stats for CitizenNest
 *
 * Usage:
 *   node scripts/gsc-stats.js              # 7-day + 28-day summary, top 20 pages & queries
 *   node scripts/gsc-stats.js --days 14    # custom range
 *   node scripts/gsc-stats.js --top 10     # top N
 *   node scripts/gsc-stats.js --json       # JSON output
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.resolve(__dirname, '../keys/gsc-service-account.json');
const CACHE_PATH = path.resolve(__dirname, '.gsc-cache.json');

// Try URL-prefix first, fall back to domain property
const SITE_CANDIDATES = [
  'https://www.citizennest.com/',
  'sc-domain:citizennest.com',
];

// --- CLI args ---
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);

const customDays = flag('days') ? parseInt(flag('days'), 10) : null;
const topN = flag('top') ? parseInt(flag('top'), 10) : 20;
const jsonOut = hasFlag('json');

// --- Auth ---
async function getAuth() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Service account key not found: ${KEY_PATH}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return auth;
}

// --- Helpers ---
function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function query(webmasters, siteUrl, startDate, endDate, opts = {}) {
  const body = {
    startDate,
    endDate,
    ...opts,
  };
  const res = await webmasters.searchanalytics.query({ siteUrl, requestBody: body });
  return res.data;
}

async function findSiteUrl(webmasters) {
  // Try each candidate; return the first that works
  for (const site of SITE_CANDIDATES) {
    try {
      await webmasters.sites.get({ siteUrl: site });
      return site;
    } catch {
      // try next
    }
  }
  throw new Error(
    `Could not access any GSC property. Tried: ${SITE_CANDIDATES.join(', ')}\n` +
    'Ensure the service account email is added as a user in GSC.'
  );
}

function fmtNum(n, dec = 0) {
  return typeof n === 'number' ? n.toLocaleString('en-IN', { maximumFractionDigits: dec }) : '-';
}

function fmtPct(n) {
  return typeof n === 'number' ? (n * 100).toFixed(2) + '%' : '-';
}

function fmtPos(n) {
  return typeof n === 'number' ? n.toFixed(1) : '-';
}

function printSummary(label, data) {
  const r = data.rows?.[0] || {};
  console.log(`\n📊 ${label}`);
  console.log(`   Clicks:      ${fmtNum(r.clicks)}`);
  console.log(`   Impressions: ${fmtNum(r.impressions)}`);
  console.log(`   CTR:         ${fmtPct(r.ctr)}`);
  console.log(`   Avg Position:${fmtPos(r.position)}`);
}

function printTable(label, rows, keyLabel) {
  console.log(`\n${label}`);
  console.log(`${'#'.padStart(3)}  ${keyLabel.padEnd(60)} ${'Clicks'.padStart(8)} ${'Impr'.padStart(8)} ${'CTR'.padStart(8)} ${'Pos'.padStart(6)}`);
  console.log('-'.repeat(98));
  rows.forEach((r, i) => {
    const key = (r.keys?.[0] || '').slice(0, 60);
    console.log(
      `${String(i + 1).padStart(3)}  ${key.padEnd(60)} ${fmtNum(r.clicks).padStart(8)} ${fmtNum(r.impressions).padStart(8)} ${fmtPct(r.ctr).padStart(8)} ${fmtPos(r.position).padStart(6)}`
    );
  });
}

// --- Main ---
async function main() {
  const auth = await getAuth();
  const webmasters = google.webmasters({ version: 'v3', auth });

  const siteUrl = await findSiteUrl(webmasters);
  if (!jsonOut) console.log(`✅ Using GSC property: ${siteUrl}\n`);

  const ranges = customDays
    ? [{ label: `Last ${customDays} days`, days: customDays }]
    : [
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 28 days', days: 28 },
      ];

  const result = { timestamp: new Date().toISOString(), siteUrl, ranges: [], topPages: [], topQueries: [] };

  // Summaries
  for (const range of ranges) {
    const startDate = dateStr(range.days + 2); // GSC data has ~2-day lag
    const endDate = dateStr(2);
    const data = await query(webmasters, siteUrl, startDate, endDate);
    const row = data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    result.ranges.push({ ...range, startDate, endDate, ...row });
    if (!jsonOut) printSummary(`${range.label} (${startDate} → ${endDate})`, data);
  }

  // Top pages by clicks (use 28-day or custom range)
  const pageDays = customDays || 28;
  const pageStart = dateStr(pageDays + 2);
  const pageEnd = dateStr(2);

  const pagesData = await query(webmasters, siteUrl, pageStart, pageEnd, {
    dimensions: ['page'],
    rowLimit: topN,
    orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
  });
  result.topPages = pagesData.rows || [];
  if (!jsonOut) printTable(`🔗 Top ${topN} Pages by Clicks (${pageDays}d)`, result.topPages, 'Page');

  // Top queries by impressions
  const queriesData = await query(webmasters, siteUrl, pageStart, pageEnd, {
    dimensions: ['query'],
    rowLimit: topN,
    orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
  });
  result.topQueries = queriesData.rows || [];
  if (!jsonOut) printTable(`🔍 Top ${topN} Queries by Impressions (${pageDays}d)`, result.topQueries, 'Query');

  // Cache
  fs.writeFileSync(CACHE_PATH, JSON.stringify(result, null, 2));
  if (!jsonOut) console.log(`\n💾 Cached to ${CACHE_PATH}`);

  if (jsonOut) console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * check-gsc-indexing.js
 *
 * Pulls real indexing + traffic data from Google Search Console API.
 * Uses the existing service account (keys/gsc-service-account.json).
 *
 * Reports:
 *  - Total URLs with impressions (proxy for indexed count)
 *  - Total clicks, impressions, avg CTR, avg position
 *  - Top 20 pages by clicks
 *  - Pages with impressions but 0 clicks (ranking but not compelling)
 *  - Language breakdown (how /hi/, /kn/, /ta/ etc. are performing)
 *
 * Usage:
 *   node scripts/check-gsc-indexing.js
 *   node scripts/check-gsc-indexing.js --days 7
 *   node scripts/check-gsc-indexing.js --days 28 --json   # machine-readable output
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KEY_PATH = path.join(ROOT, 'keys/gsc-service-account.json');
const SITE_URL = 'sc-domain:citizennest.com';

const args = process.argv.slice(2);
const DAYS = parseInt(args[args.indexOf('--days') + 1] || '28');
const JSON_OUT = args.includes('--json');

// ── JWT for Google OAuth ─────────────────────────────────────────────────────

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken() {
  const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })));

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = base64url(sign.sign(key.private_key));
  const jwt = `${header}.${payload}.${signature}`;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const parsed = JSON.parse(d);
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error(`Token error: ${d}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── GSC Search Analytics query ────────────────────────────────────────────────

function gscQuery(token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: 'searchconsole.googleapis.com',
      path: `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`Parse error: ${d.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error('❌ keys/gsc-service-account.json not found');
    process.exit(1);
  }

  console.log(`\n📊 CitizenNest — Google Search Console Report`);
  console.log(`   Site: ${SITE_URL}`);
  console.log(`   Period: Last ${DAYS} days (${dateStr(DAYS)} → ${dateStr(3)})\n`);

  const token = await getAccessToken();
  const startDate = dateStr(DAYS);
  const endDate = dateStr(3); // GSC has ~3 day lag

  // ── 1. Overall site metrics ──────────────────────────────────────────────
  const overall = await gscQuery(token, {
    startDate, endDate,
    dimensions: [],
    rowLimit: 1,
  });

  const totals = overall.rows?.[0] || {};
  const totalClicks = Math.round(totals.clicks || 0);
  const totalImpressions = Math.round(totals.impressions || 0);
  const avgCTR = ((totals.ctr || 0) * 100).toFixed(2);
  const avgPos = (totals.position || 0).toFixed(1);

  // ── 2. URLs with any impressions (indexed proxy) ─────────────────────────
  const byPage = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['page'],
    rowLimit: 25000,
  });

  const pageRows = byPage.rows || [];
  const totalPagesWithImpressions = pageRows.length;
  const pagesWithClicks = pageRows.filter(r => r.clicks > 0).length;
  const pagesZeroClicks = pageRows.filter(r => r.clicks === 0 && r.impressions > 0).length;

  // ── 3. Language breakdown ────────────────────────────────────────────────
  const langMap = {};
  for (const row of pageRows) {
    const url = row.keys[0];
    let lang = 'en';
    const m = url.match(/citizennest\.com\/(hi|kn|ta|ml|te|bn|mr|gu|or)\//);
    if (m) lang = m[1];
    else if (url.includes('/update/')) lang = 'updates';
    if (!langMap[lang]) langMap[lang] = { pages: 0, clicks: 0, impressions: 0 };
    langMap[lang].pages++;
    langMap[lang].clicks += row.clicks;
    langMap[lang].impressions += row.impressions;
  }

  // ── 4. Top pages by clicks ───────────────────────────────────────────────
  const topPages = [...pageRows]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  // ── 5. Top queries ───────────────────────────────────────────────────────
  const byQuery = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['query'],
    rowLimit: 20,
  });
  const topQueries = byQuery.rows || [];

  // ── Output ───────────────────────────────────────────────────────────────

  if (JSON_OUT) {
    console.log(JSON.stringify({
      period: { startDate, endDate, days: DAYS },
      totals: { clicks: totalClicks, impressions: totalImpressions, ctr: avgCTR, position: avgPos },
      pages: { withImpressions: totalPagesWithImpressions, withClicks: pagesWithClicks, zeroClicks: pagesZeroClicks },
      byLanguage: langMap,
      topPages: topPages.map(r => ({ url: r.keys[0], clicks: Math.round(r.clicks), impressions: Math.round(r.impressions), ctr: (r.ctr * 100).toFixed(1), position: r.position.toFixed(1) })),
      topQueries: topQueries.map(r => ({ query: r.keys[0], clicks: Math.round(r.clicks), impressions: Math.round(r.impressions), position: r.position.toFixed(1) })),
    }, null, 2));
    return;
  }

  // Human-readable output
  console.log('═══════════════════════════════════════════════════');
  console.log('  OVERALL PERFORMANCE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Clicks:       ${totalClicks.toLocaleString()}`);
  console.log(`  Impressions:  ${totalImpressions.toLocaleString()}`);
  console.log(`  Avg CTR:      ${avgCTR}%`);
  console.log(`  Avg Position: ${avgPos}`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  INDEXING STATUS (proxy via impressions)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Pages with impressions (indexed):  ${totalPagesWithImpressions.toLocaleString()}`);
  console.log(`  Pages with clicks:                 ${pagesWithClicks.toLocaleString()}`);
  console.log(`  Pages ranking but 0 clicks:        ${pagesZeroClicks.toLocaleString()} ← improve titles/meta`);

  // Count content dirs
  const contentCount = {
    'English guides': fs.readdirSync(path.join(ROOT, 'content/guides')).filter(f => f.endsWith('.md')).length,
    'Hindi guides': fs.existsSync(path.join(ROOT, 'content/guides-hi')) ? fs.readdirSync(path.join(ROOT, 'content/guides-hi')).filter(f => f.endsWith('.md')).length : 0,
    'Exam updates': fs.readdirSync(path.join(ROOT, 'content/updates')).filter(f => f.endsWith('.md')).length,
  };
  const totalContent = Object.values(contentCount).reduce((a, b) => a + b, 0);

  console.log(`\n  Content in repo:   ${totalContent.toLocaleString()} pages`);
  console.log(`  Indexed (est.):    ${totalPagesWithImpressions.toLocaleString()} pages`);
  console.log(`  Indexing rate:     ${((totalPagesWithImpressions / totalContent) * 100).toFixed(1)}%`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  BY LANGUAGE / SECTION');
  console.log('═══════════════════════════════════════════════════');
  const langOrder = ['en', 'hi', 'kn', 'ta', 'ml', 'te', 'bn', 'mr', 'gu', 'or', 'updates'];
  const langNames = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', ml: 'Malayalam', te: 'Telugu', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', or: 'Odia', updates: 'Exam Updates' };
  for (const lang of langOrder) {
    const l = langMap[lang];
    if (!l) continue;
    const name = langNames[lang] || lang;
    console.log(`  ${name.padEnd(14)} ${String(l.pages).padStart(5)} pages  ${String(Math.round(l.clicks)).padStart(7)} clicks  ${String(Math.round(l.impressions)).padStart(10)} impr`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TOP 20 PAGES BY CLICKS');
  console.log('═══════════════════════════════════════════════════');
  for (const row of topPages) {
    const url = row.keys[0].replace('https://www.citizennest.com', '');
    const clicks = Math.round(row.clicks);
    const impr = Math.round(row.impressions);
    const pos = row.position.toFixed(0);
    console.log(`  [pos ${String(pos).padStart(3)}] ${String(clicks).padStart(5)} clicks  ${String(impr).padStart(7)} impr  ${url}`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TOP 20 SEARCH QUERIES');
  console.log('═══════════════════════════════════════════════════');
  for (const row of topQueries) {
    const q = row.keys[0];
    const clicks = Math.round(row.clicks);
    const impr = Math.round(row.impressions);
    const pos = row.position.toFixed(1);
    console.log(`  [pos ${String(pos).padStart(5)}] ${String(clicks).padStart(5)} clicks  ${q}`);
  }

  console.log('\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

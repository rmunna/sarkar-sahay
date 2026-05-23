#!/usr/bin/env node
/**
 * Google Search Console Report for CitizenNest
 * Pulls search performance data and outputs a summary.
 * 
 * Usage: node agents/gsc-report.js [--days 28] [--top 30]
 * Output: JSON summary + human-readable report
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.resolve(__dirname, '../keys/gsc-service-account.json');
const SITE_URL = 'sc-domain:citizennest.com';

// Parse args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const topIdx = args.indexOf('--top');
const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1]) : 28;
const topN = topIdx !== -1 ? parseInt(args[topIdx + 1]) : 30;

async function main() {
  // Auth
  const keyFile = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const fmt = (d) => d.toISOString().split('T')[0];

  // 1. Overall totals
  const totals = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: [],
    },
  });

  // 2. Top queries
  const queries = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['query'],
      rowLimit: topN,
      dataState: 'all',
    },
  });

  // 3. Top pages
  const pages = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['page'],
      rowLimit: topN,
      dataState: 'all',
    },
  });

  // 4. Daily trend (last N days)
  const daily = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['date'],
      dataState: 'all',
    },
  });

  // 5. Top countries
  const countries = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['country'],
      rowLimit: 10,
      dataState: 'all',
    },
  });

  // 6. Device breakdown
  const devices = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['device'],
      dataState: 'all',
    },
  });

  // Build report
  const report = {
    period: { start: fmt(startDate), end: fmt(endDate), days },
    totals: totals.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topQueries: (queries.data.rows || []).map(r => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: (r.ctr * 100).toFixed(1) + '%',
      position: r.position.toFixed(1),
    })),
    topPages: (pages.data.rows || []).map(r => ({
      page: r.keys[0].replace('https://www.citizennest.com', ''),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: (r.ctr * 100).toFixed(1) + '%',
      position: r.position.toFixed(1),
    })),
    dailyTrend: (daily.data.rows || []).map(r => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    })),
    countries: (countries.data.rows || []).map(r => ({
      country: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    })),
    devices: (devices.data.rows || []).map(r => ({
      device: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    })),
  };

  // Save JSON
  const outPath = path.resolve(__dirname, '../agents/gsc-latest.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  // Print human-readable
  console.log(`\n📊 CitizenNest Search Console Report`);
  console.log(`📅 Period: ${report.period.start} to ${report.period.end} (${days} days)\n`);
  
  const t = report.totals;
  console.log(`🔢 TOTALS: ${t.clicks} clicks | ${t.impressions} impressions | ${(t.ctr * 100).toFixed(1)}% CTR | Avg position: ${t.position?.toFixed(1)}\n`);

  console.log(`📱 DEVICES:`);
  report.devices.forEach(d => console.log(`  ${d.device}: ${d.clicks} clicks, ${d.impressions} impressions`));

  console.log(`\n🌍 TOP COUNTRIES:`);
  report.countries.forEach(c => console.log(`  ${c.country}: ${c.clicks} clicks, ${c.impressions} impressions`));

  console.log(`\n🔍 TOP QUERIES:`);
  report.topQueries.slice(0, 15).forEach((q, i) => 
    console.log(`  ${i+1}. "${q.query}" — ${q.clicks} clicks, ${q.impressions} imp, pos ${q.position}`)
  );

  console.log(`\n📄 TOP PAGES:`);
  report.topPages.slice(0, 15).forEach((p, i) => 
    console.log(`  ${i+1}. ${p.page} — ${p.clicks} clicks, ${p.impressions} imp, pos ${p.position}`)
  );

  console.log(`\n📈 DAILY TREND (last 7 days):`);
  report.dailyTrend.slice(-7).forEach(d => 
    console.log(`  ${d.date}: ${d.clicks} clicks, ${d.impressions} impressions`)
  );

  console.log(`\n✅ Full report saved to agents/gsc-latest.json`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  if (err.message.includes('403')) {
    console.error('→ Make sure the service account email has been added to Search Console as a user.');
  }
  process.exit(1);
});

#!/usr/bin/env node
// Pull top queries for specific pages from GSC
// Usage: node scripts/gsc-page-queries.js [slug1 slug2 ...]

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.resolve(__dirname, "../keys/gsc-service-account.json");

const SITE_CANDIDATES = [
  "https://www.citizennest.com/",
  "sc-domain:citizennest.com",
];

const END_DATE = "2026-05-22";
const START_DATE = "2026-04-24";

const DEFAULT_SLUGS = [
  "kpsc-fda-sda-exam-guide",
  "irctc-app-not-working-fix",
  "scholarship-payment-not-received-fix",
  "ration-card-apl-vs-bpl-difference",
  "hdfc-account-blocked-fix",
  "sbi-account-frozen-fix",
  "irctc-waiting-list-confirmation-chances",
];

async function findSiteUrl(api) {
  for (const site of SITE_CANDIDATES) {
    try {
      await api.sites.get({ siteUrl: site });
      return site;
    } catch {
      // try next
    }
  }
  throw new Error("Could not access any GSC property.");
}

async function run() {
  const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_SLUGS;

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const api = google.searchconsole({ version: "v1", auth: client });

  const siteUrl = await findSiteUrl(api);
  console.log(`Using site: ${siteUrl}\nDate range: ${START_DATE} → ${END_DATE}\n`);

  for (const slug of slugs) {
    const pageUrl = `https://www.citizennest.com/guide/${slug}`;
    try {
      const res = await api.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: START_DATE,
          endDate: END_DATE,
          dimensions: ["query"],
          dimensionFilterGroups: [
            { filters: [{ dimension: "page", expression: pageUrl }] },
          ],
          rowLimit: 12,
          orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
        },
      });

      const rows = res.data.rows || [];
      console.log(`${"=".repeat(72)}`);
      console.log(`PAGE: ${slug}`);
      console.log(
        `${"Query".padEnd(54)} ${"Impr".padStart(7)}  ${"Clicks".padStart(6)}  ${"CTR".padStart(6)}  ${"Pos".padStart(5)}`
      );
      console.log("-".repeat(72));
      rows.forEach((r) => {
        const q = r.keys[0].slice(0, 53).padEnd(54);
        const impr = String(r.impressions).padStart(7);
        const clicks = String(r.clicks).padStart(6);
        const ctr = ((r.ctr || 0) * 100).toFixed(1).padStart(5) + "%";
        const pos = (r.position || 0).toFixed(1).padStart(5);
        console.log(`${q} ${impr}  ${clicks}  ${ctr}  ${pos}`);
      });
      console.log("");
    } catch (err) {
      console.error(`Error fetching ${slug}: ${err.message}`);
    }
  }
}

run();

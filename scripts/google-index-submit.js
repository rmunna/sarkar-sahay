#!/usr/bin/env node
/**
 * Google Indexing API — Submit URLs for immediate indexing
 * Uses the Web Search Indexing API enabled in Google Cloud Console.
 * 
 * Usage:
 *   node scripts/google-index-submit.js <url1> [url2] [url3] ...
 *   node scripts/google-index-submit.js --new    # auto-detect new content from git
 * 
 * Requires: Service account with Indexing API access + owner in GSC
 * Quota: 200 requests/day
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.resolve(__dirname, '../keys/gsc-service-account.json');
const SITE = 'https://www.citizennest.com';
const QUOTA_FILE = path.resolve(__dirname, '../agents/.indexing-quota.json');

function loadQuota() {
  try {
    const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    if (data.date === today) return data;
    return { date: today, used: 0 };
  } catch {
    return { date: new Date().toISOString().split('T')[0], used: 0 };
  }
}

function saveQuota(quota) {
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(quota, null, 2));
}

function getNewUrls() {
  try {
    // Get new/modified files not yet committed or recently committed
    const uncommitted = execSync('git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null', { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' });
    const lastCommit = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null', { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' });
    
    const files = [...new Set([...uncommitted.split('\n'), ...lastCommit.split('\n')])].filter(Boolean);
    
    return files
      .filter(f => f.match(/^content\/(guides|updates)\/.*\.md$/))
      .map(f => {
        const slug = path.basename(f, '.md');
        if (f.startsWith('content/updates/')) return `${SITE}/update/${slug}`;
        if (f.startsWith('content/guides/')) return `${SITE}/guide/${slug}`;
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  let urls;
  if (args.includes('--new')) {
    urls = getNewUrls();
    if (urls.length === 0) {
      console.log('No new content files detected.');
      process.exit(0);
    }
  } else if (args.length > 0) {
    urls = args.filter(a => a.startsWith('http'));
  } else {
    console.log('Usage: node scripts/google-index-submit.js <url> [url2] ...');
    console.log('       node scripts/google-index-submit.js --new');
    process.exit(1);
  }

  // Check quota
  const quota = loadQuota();
  const remaining = 200 - quota.used;
  
  if (remaining <= 0) {
    console.log(`❌ Daily quota exhausted (200/200 used today). Try again tomorrow.`);
    process.exit(1);
  }
  
  const batch = urls.slice(0, remaining);
  if (batch.length < urls.length) {
    console.log(`⚠️  Only submitting ${batch.length}/${urls.length} URLs (quota: ${remaining} remaining)`);
  }

  // Auth
  const keyFile = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const indexing = google.indexing({ version: 'v3', auth });

  console.log(`🚀 Submitting ${batch.length} URLs to Google Indexing API...\n`);

  let success = 0;
  let failed = 0;

  for (const url of batch) {
    try {
      await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: 'URL_UPDATED',
        },
      });
      console.log(`  ✅ ${url}`);
      success++;
      quota.used++;
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message;
      console.log(`  ❌ ${url} — ${msg}`);
      failed++;
    }
    
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 200));
  }

  saveQuota(quota);
  
  console.log(`\n📊 Results: ${success} submitted, ${failed} failed`);
  console.log(`📊 Quota: ${quota.used}/200 used today`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

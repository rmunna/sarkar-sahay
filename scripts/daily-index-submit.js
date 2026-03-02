#!/usr/bin/env node
/**
 * Daily Google Indexing API submission script.
 * Submits up to 200 unsubmitted URLs per day, prioritizing fix guides.
 * Tracks submitted URLs in agents/.indexing-submitted.json
 * 
 * Usage: node scripts/daily-index-submit.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TRACKER_PATH = path.join(ROOT, 'agents/.indexing-submitted.json');
const QUOTA_PATH = path.join(ROOT, 'agents/.indexing-quota.json');
const SUBMIT_SCRIPT = path.join(ROOT, 'scripts/google-index-submit.js');
const SITE_URL = 'https://www.citizennest.com';
const MAX_PER_DAY = 200;

const dryRun = process.argv.includes('--dry-run');

// Load tracker
let submitted = new Set();
if (fs.existsSync(TRACKER_PATH)) {
  const data = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));
  submitted = new Set(data.urls || []);
}

// Check today's quota
const today = new Date().toISOString().split('T')[0];
if (fs.existsSync(QUOTA_PATH)) {
  const quota = JSON.parse(fs.readFileSync(QUOTA_PATH, 'utf-8'));
  if (quota.date === today && quota.used >= MAX_PER_DAY) {
    console.log(`Quota exhausted for ${today} (${quota.used}/${MAX_PER_DAY}). Skipping.`);
    process.exit(0);
  }
}

// Get all content URLs
const guideSlugs = fs.readdirSync(path.join(ROOT, 'content/guides'))
  .filter(f => f.endsWith('.md'))
  .map(f => `${SITE_URL}/guide/${f.replace('.md', '')}`);

const updateSlugs = fs.readdirSync(path.join(ROOT, 'content/updates'))
  .filter(f => f.endsWith('.md'))
  .map(f => `${SITE_URL}/update/${f.replace('.md', '')}`);

const allUrls = [...guideSlugs, ...updateSlugs];

// Filter out already submitted
const pending = allUrls.filter(u => !submitted.has(u));

// Prioritize: fix guides first, then updates, then others
const fixUrls = pending.filter(u => u.includes('-fix'));
const updateUrls = pending.filter(u => u.includes('/update/'));
const otherUrls = pending.filter(u => !u.includes('-fix') && !u.includes('/update/'));
const prioritized = [...fixUrls, ...updateUrls, ...otherUrls];

const batch = prioritized.slice(0, MAX_PER_DAY);

console.log(`Total URLs: ${allUrls.length}`);
console.log(`Already submitted: ${submitted.size}`);
console.log(`Pending: ${pending.length}`);
console.log(`This batch: ${batch.length} (fix: ${fixUrls.slice(0, MAX_PER_DAY).length})`);

if (batch.length === 0) {
  console.log('All URLs have been submitted! Nothing to do.');
  process.exit(0);
}

if (dryRun) {
  console.log('\n[DRY RUN] Would submit:');
  batch.slice(0, 10).forEach(u => console.log('  ' + u));
  if (batch.length > 10) console.log(`  ... and ${batch.length - 10} more`);
  process.exit(0);
}

// Submit via google-index-submit.js
try {
  const result = execSync(`node ${SUBMIT_SCRIPT} ${batch.join(' ')}`, {
    encoding: 'utf-8',
    timeout: 300000, // 5 min
    cwd: ROOT,
  });
  console.log(result);
  
  // Update tracker
  batch.forEach(u => submitted.add(u));
  fs.writeFileSync(TRACKER_PATH, JSON.stringify({
    lastRun: new Date().toISOString(),
    urls: [...submitted],
  }, null, 2));
  
  console.log(`\nTracker updated. Total submitted: ${submitted.size}/${allUrls.length}`);
} catch (e) {
  console.error('Submission failed:', e.message?.slice(0, 200));
  // Still save any that were submitted before failure
  fs.writeFileSync(TRACKER_PATH, JSON.stringify({
    lastRun: new Date().toISOString(),
    urls: [...submitted],
  }, null, 2));
  process.exit(1);
}

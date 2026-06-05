#!/usr/bin/env node
/**
 * notify-facebook.js
 *
 * Posts new exam/scheme pages to a Facebook Page via Graph API (free).
 *
 * Required env:
 *   FB_PAGE_ID           — numeric Facebook Page ID
 *   FB_PAGE_ACCESS_TOKEN — long-lived Page access token (never expires if generated correctly)
 *
 * Usage:
 *   node scripts/notify-facebook.js agents/.newly-generated-slugs          # exam updates
 *   node scripts/notify-facebook.js agents/.newly-generated-scheme-slugs   # scheme guides
 *   node scripts/notify-facebook.js --text "Custom message" --url "https://..."
 *
 * Getting the token (one-time):
 *   1. Create a Facebook App at developers.facebook.com (free)
 *   2. Add your Page to the app → get short-lived token
 *   3. Exchange for long-lived token via Graph API Explorer
 *   4. Store as FB_PAGE_ACCESS_TOKEN secret in GitHub
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UPDATES_DIR = path.join(ROOT, 'content/updates');
const GUIDES_DIR = path.join(ROOT, 'content/guides');
const SITE_URL = 'https://www.citizennest.com';

const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

if (!PAGE_ID || !TOKEN) {
  console.error('❌ FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN must be set');
  process.exit(0); // soft exit — don't fail the workflow
}

const STAGE_EMOJI = {
  result: '🔴',
  'admit-card': '🟣',
  'answer-key': '🟢',
  notification: '🔵',
  registration: '🔵',
  cutoff: '🟠',
  'exam-schedule': '🟡',
};

const STAGE_LABEL = {
  result: 'Result Out',
  'admit-card': 'Admit Card Released',
  'answer-key': 'Answer Key Released',
  notification: 'New Notification',
  registration: 'Registration Open',
  cutoff: 'Cut-off Released',
  'exam-schedule': 'Exam Schedule',
};

function buildExamMessage(slug) {
  const filePath = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const stage = data.stage || data.type || 'notification';
  const emoji = STAGE_EMOJI[stage] || '📢';
  const label = STAGE_LABEL[stage] || stage;
  const title = data.title || slug;
  const org = data.organization || data.examName || '';
  const url = `${SITE_URL}/update/${slug}`;

  let msg = `${emoji} ${label}: ${title}\n\n`;
  if (org) msg += `🏛️ ${org}\n`;

  const dates = data.importantDates || {};
  if (dates.resultDate && dates.resultDate !== 'TBA') msg += `📅 Result: ${dates.resultDate}\n`;
  if (dates.admitCardDate && dates.admitCardDate !== 'TBA') msg += `📅 Admit Card: ${dates.admitCardDate}\n`;
  if (dates.lastDate && dates.lastDate !== 'TBA') msg += `⏰ Last Date: ${dates.lastDate}\n`;

  if (data.vacancy) msg += `💼 Vacancies: ${data.vacancy}\n`;

  msg += `\n👉 Full details & direct link → ${url}\n\n`;
  msg += `🌐 CitizenNest — Government services, always free & accurate.\n`;
  msg += `#GovernmentJobs #ExamAlert #${(org || 'Sarkari').replace(/\s+/g, '')} #SarkariResult`;

  return { message: msg, link: url };
}

function buildSchemeMessage(entry) {
  // entry is either "slug" or "langCode:slug"
  const langCode = entry.includes(':') ? entry.split(':')[0] : 'en';
  const slug = entry.includes(':') ? entry.split(':')[1] : entry;

  const urlPath = { ta: '/ta/guide', ml: '/ml/guide', te: '/te/guide', kn: '/kn/guide' }[langCode] || '/guide';
  const url = `${SITE_URL}${urlPath}/${slug}`;

  // Try to read the guide for title/description
  const dirs = [
    path.join(ROOT, `content/guides-${langCode}`),
    path.join(ROOT, 'content/guides'),
  ];
  let data = {};
  for (const dir of dirs) {
    const fp = path.join(dir, `${slug}.md`);
    if (fs.existsSync(fp)) { data = matter(fs.readFileSync(fp, 'utf8')).data; break; }
  }

  const title = data.title || slug.replace(/-/g, ' ');
  const desc = data.description || '';

  let msg = `🏛️ New Guide: ${title}\n\n`;
  if (desc) msg += `${desc.slice(0, 200)}${desc.length > 200 ? '...' : ''}\n\n`;
  msg += `👉 Read full guide → ${url}\n\n`;
  msg += `✅ CitizenNest — Government services explained simply. Always free.\n`;
  msg += `#GovernmentScheme #SarkariYojana #CitizenNest`;

  return { message: msg, link: url };
}

function postToFacebook(message, link) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ message, link, access_token: TOKEN });
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${PAGE_ID}/feed`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.id) {
          console.log(`  ✅ Posted to Facebook: ${parsed.id}`);
          resolve(parsed);
        } else {
          console.error(`  ❌ Facebook error:`, JSON.stringify(parsed));
          resolve(null); // don't reject — soft failure
        }
      });
    });

    req.on('error', (e) => { console.error('  ❌ Facebook request failed:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);

  // Direct text mode: --text "..." --url "..."
  if (args.includes('--text')) {
    const textIdx = args.indexOf('--text');
    const urlIdx = args.indexOf('--url');
    const message = args[textIdx + 1];
    const link = urlIdx !== -1 ? args[urlIdx + 1] : SITE_URL;
    await postToFacebook(message, link);
    return;
  }

  // File mode: read slugs from file
  const slugFile = args[0];
  if (!slugFile || !fs.existsSync(slugFile)) {
    console.log('No slug file provided or file not found — skipping');
    return;
  }

  const entries = fs.readFileSync(slugFile, 'utf8').trim().split('\n').filter(Boolean);
  const isScheme = slugFile.includes('scheme');

  for (const entry of entries) {
    const payload = isScheme ? buildSchemeMessage(entry) : buildExamMessage(entry.trim());
    if (!payload) { console.log(`  ⚠️ Could not build message for: ${entry}`); continue; }

    console.log(`Posting to Facebook: ${entry}`);
    await postToFacebook(payload.message, payload.link);
    // Respect rate limits — 1 post per 2 seconds
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error);

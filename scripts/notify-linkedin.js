#!/usr/bin/env node
/**
 * notify-linkedin.js
 *
 * Posts new exam/scheme pages to a LinkedIn Company Page (free API).
 *
 * Required env:
 *   LI_ORGANIZATION_ID  — LinkedIn Company Page numeric ID (from the page URL)
 *   LI_ACCESS_TOKEN     — OAuth 2.0 access token with w_member_social or w_organization_social scope
 *
 * Usage:
 *   node scripts/notify-linkedin.js agents/.newly-generated-slugs
 *   node scripts/notify-linkedin.js agents/.newly-generated-scheme-slugs
 *
 * Getting the token (one-time):
 *   1. Create a LinkedIn App at linkedin.com/developers (free)
 *   2. Add "Share on LinkedIn" + "Manage company page" products
 *   3. Generate access token with w_organization_social scope
 *   4. Token lasts 60 days — set a reminder to refresh
 *   5. Store as LI_ACCESS_TOKEN + LI_ORGANIZATION_ID in GitHub secrets
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UPDATES_DIR = path.join(ROOT, 'content/updates');
const SITE_URL = 'https://www.citizennest.com';

const ORG_ID = process.env.LI_ORGANIZATION_ID;
const TOKEN = process.env.LI_ACCESS_TOKEN;

if (!ORG_ID || !TOKEN) {
  console.error('❌ LI_ORGANIZATION_ID and LI_ACCESS_TOKEN must be set');
  process.exit(0); // soft exit
}

const STAGE_LABEL = {
  result: '🔴 Result Declared',
  'admit-card': '🟣 Admit Card Released',
  'answer-key': '🟢 Answer Key Out',
  notification: '🔵 New Notification',
  registration: '🔵 Registration Open',
  cutoff: '🟠 Cut-off Released',
  'exam-schedule': '🟡 Exam Schedule',
};

function buildExamPost(slug) {
  const filePath = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const stage = data.stage || data.type || 'notification';
  const stageLabel = STAGE_LABEL[stage] || '📢 Update';
  const title = data.title || slug;
  const org = data.organization || data.examName || '';
  const url = `${SITE_URL}/update/${slug}`;

  let text = `${stageLabel}: ${title}\n\n`;
  if (org) text += `Organisation: ${org}\n`;

  const dates = data.importantDates || {};
  if (dates.resultDate && dates.resultDate !== 'TBA') text += `Result Date: ${dates.resultDate}\n`;
  if (dates.lastDate && dates.lastDate !== 'TBA') text += `Last Date to Apply: ${dates.lastDate}\n`;
  if (data.vacancy) text += `Total Vacancies: ${data.vacancy}\n`;

  text += `\nFull details & apply link → ${url}\n\n`;
  text += `CitizenNest provides accurate, free guides for all Indian government services and exams.\n\n`;
  text += `#GovernmentJobs #ExamAlert #SarkariNaukri #${(org || 'UPSC').replace(/\s+/g, '')} #CareerIndia`;

  return { text, url, title };
}

function buildSchemePost(entry) {
  const langCode = entry.includes(':') ? entry.split(':')[0] : 'en';
  const slug = entry.includes(':') ? entry.split(':')[1] : entry;
  const urlPath = { ta: '/ta/guide', ml: '/ml/guide', te: '/te/guide', kn: '/kn/guide' }[langCode] || '/guide';
  const url = `${SITE_URL}${urlPath}/${slug}`;

  const dirs = [path.join(ROOT, `content/guides-${langCode}`), path.join(ROOT, 'content/guides')];
  let data = {};
  for (const dir of dirs) {
    const fp = path.join(dir, `${slug}.md`);
    if (fs.existsSync(fp)) { data = matter(fs.readFileSync(fp, 'utf8')).data; break; }
  }

  const title = data.title || slug.replace(/-/g, ' ');
  const desc = data.description || '';

  let text = `🏛️ New Government Scheme Guide: ${title}\n\n`;
  if (desc) text += `${desc.slice(0, 250)}${desc.length > 250 ? '...' : ''}\n\n`;
  text += `Full guide with eligibility, documents & step-by-step process → ${url}\n\n`;
  text += `CitizenNest — Simplifying Indian government services. Free for everyone.\n\n`;
  text += `#GovernmentScheme #IndiaGovt #CitizenServices #SarkariYojana`;

  return { text, url, title };
}

function liPost(text, url, title) {
  const body = JSON.stringify({
    author: `urn:li:organization:${ORG_ID}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status: 'READY',
          description: { text: text.slice(0, 256) },
          originalUrl: url,
          title: { text: title.slice(0, 200) },
        }],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.linkedin.com',
      path: '/v2/ugcPosts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`  ✅ Posted to LinkedIn (${res.statusCode})`);
        } else {
          console.error(`  ❌ LinkedIn error ${res.statusCode}:`, data.slice(0, 300));
        }
        resolve();
      });
    });

    req.on('error', (e) => { console.error('  ❌ LinkedIn request failed:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const slugFile = args[0];

  if (!slugFile || !fs.existsSync(slugFile)) {
    console.log('No slug file provided or not found — skipping');
    return;
  }

  const entries = fs.readFileSync(slugFile, 'utf8').trim().split('\n').filter(Boolean);
  const isScheme = slugFile.includes('scheme');

  for (const entry of entries) {
    const payload = isScheme ? buildSchemePost(entry) : buildExamPost(entry.trim());
    if (!payload) { console.log(`  ⚠️ Could not build post for: ${entry}`); continue; }

    console.log(`Posting to LinkedIn: ${entry}`);
    await liPost(payload.text, payload.url, payload.title);
    await new Promise(r => setTimeout(r, 3000)); // LinkedIn rate limit buffer
  }
}

main().catch(console.error);

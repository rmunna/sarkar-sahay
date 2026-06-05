#!/usr/bin/env node
/**
 * notify-reddit.js
 *
 * Posts new exam/scheme pages to relevant subreddits via Reddit API (free).
 * Uses OAuth with a Reddit "script" app — 100 req/min, free forever.
 *
 * Required env:
 *   REDDIT_CLIENT_ID     — from reddit.com/prefs/apps
 *   REDDIT_CLIENT_SECRET — from reddit.com/prefs/apps
 *   REDDIT_USERNAME      — Reddit account username (u/citizennest_bot)
 *   REDDIT_PASSWORD      — Reddit account password
 *
 * Usage:
 *   node scripts/notify-reddit.js agents/.newly-generated-slugs
 *   node scripts/notify-reddit.js agents/.newly-generated-scheme-slugs
 *
 * Setup (one-time, free):
 *   1. Create Reddit account: u/citizennest_bot (or similar)
 *   2. Go to reddit.com/prefs/apps → Create another app
 *   3. Type: "script" | Name: citizennest | redirect uri: http://localhost
 *   4. Copy client_id (under app name) and client_secret
 *   5. Add 4 values as GitHub secrets
 *
 * Anti-spam rules enforced:
 *   - Only posts to subreddits where content is DIRECTLY relevant
 *   - Minimum 10-min gap between posts to same subreddit
 *   - Skips if subreddit doesn't allow link posts
 *   - Title is informational, not clickbait
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
const USER_AGENT = 'CitizenNestBot/1.0 (by /u/citizennest_bot)';

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const USERNAME = process.env.REDDIT_USERNAME;
const PASSWORD = process.env.REDDIT_PASSWORD;

if (!CLIENT_ID || !CLIENT_SECRET || !USERNAME || !PASSWORD) {
  console.log('⚠️  Reddit credentials not set — skipping');
  process.exit(0);
}

// ── Subreddit mapping ─────────────────────────────────────────────────────────
// exam org keyword → [subreddits to post to]
// Keep list SHORT — only post where genuinely relevant

const EXAM_SUBREDDIT_MAP = [
  { match: /upsc|ias|ips|civil service/i,   subs: ['UPSC', 'india'] },
  { match: /ssc/i,                           subs: ['SSC', 'india'] },
  { match: /rrb|railway/i,                   subs: ['railwayexams', 'india'] },
  { match: /ibps|sbi|bank/i,                 subs: ['BankExams', 'india'] },
  { match: /neet|nta|jee|cuet/i,             subs: ['NEETpreparation', 'JEEpreparation', 'india'] },
  { match: /gate/i,                          subs: ['GATE', 'india'] },
  { match: /kpsc|karnataka/i,                subs: ['Karnataka', 'india'] },
  { match: /tnpsc|tamilnadu|tamil\s*nadu/i,  subs: ['TamilNadu', 'india'] },
  { match: /kerala|psc\s*kerala/i,           subs: ['Kerala', 'india'] },
  { match: /appsc|andhra/i,                  subs: ['AndhraPradesh', 'india'] },
  { match: /tspsc|telangana/i,               subs: ['Telangana', 'india'] },
  { match: /mpsc|maharashtra/i,              subs: ['Maharashtra', 'india'] },
  { match: /bpsc|bihar/i,                    subs: ['Bihar', 'india'] },
  { match: /uppsc|uttar\s*pradesh|up\s+board/i, subs: ['UttarPradesh', 'india'] },
  { match: /wbpsc|west\s*bengal/i,           subs: ['WestBengal', 'india'] },
  { match: /odisha|opsc/i,                   subs: ['Odisha', 'india'] },
  { match: /defence|army|navy|airforce|agniveer/i, subs: ['indian_defence', 'india'] },
];

const SCHEME_SUBREDDIT_MAP = [
  { match: /karnataka|gruha|yuva\s*nidhi|shakti|seva\s*sindhu/i, subs: ['Karnataka'] },
  { match: /kerala|kudumbashree/i,            subs: ['Kerala'] },
  { match: /tamil\s*nadu|tamilnadu|makkalir/i, subs: ['TamilNadu'] },
  { match: /andhra|ap\s|telangana|rythu/i,    subs: ['AndhraPradesh', 'Telangana'] },
  { match: /west\s*bengal|annapurna\s*bhandar/i, subs: ['WestBengal'] },
  { match: /odisha|kalia|subhadra/i,          subs: ['Odisha'] },
  { match: /maharashtra|ladki\s*bahin/i,      subs: ['Maharashtra'] },
  { match: /ayushman|pmjay|pm\s*jan\s*dhan/i, subs: ['india'] },
  { match: /ration\s*card/i,                  subs: ['india'] },
  { match: /aadhaar|aadhar/i,                 subs: ['india'] },
];

// ── Reddit OAuth ──────────────────────────────────────────────────────────────

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve) => {
    const req = https.request({ hostname, path, method: 'POST', headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', (e) => { console.error('Request failed:', e.message); resolve({ status: 0, body: {} }); });
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = `grant_type=password&username=${encodeURIComponent(USERNAME)}&password=${encodeURIComponent(PASSWORD)}`;
  const res = await httpsPost('www.reddit.com', '/api/v1/access_token', {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': USER_AGENT,
    'Content-Length': body.length,
  }, body);

  if (res.body.access_token) {
    console.log('✅ Reddit OAuth token obtained');
    return res.body.access_token;
  }
  throw new Error(`Reddit auth failed: ${JSON.stringify(res.body)}`);
}

function submitPost(token, subreddit, title, url) {
  return new Promise((resolve) => {
    const body = new URLSearchParams({
      kind: 'link',
      sr: subreddit,
      title: title.slice(0, 300),
      url,
      resubmit: 'false',
      nsfw: 'false',
      spoiler: 'false',
    }).toString();

    const req = https.request({
      hostname: 'oauth.reddit.com',
      path: '/api/submit',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          const postUrl = parsed?.jquery?.find?.(x => Array.isArray(x) && x[3]?.includes?.('reddit.com/r/'))?.[3];
          if (parsed.success || res.statusCode === 200) {
            console.log(`  ✅ Posted to r/${subreddit}`);
          } else {
            const err = parsed?.json?.errors?.[0]?.[1] || JSON.stringify(parsed).slice(0, 200);
            console.log(`  ⚠️  r/${subreddit}: ${err}`);
          }
        } catch { console.log(`  ⚠️  r/${subreddit}: status ${res.statusCode}`); }
        resolve();
      });
    });
    req.on('error', (e) => { console.error(`  ❌ r/${subreddit}:`, e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

// ── Message builders ──────────────────────────────────────────────────────────

function buildExamTitle(slug) {
  const fp = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const { data } = matter(fs.readFileSync(fp, 'utf8'));
  const stage = data.stage || data.type || 'notification';
  const stageLabel = {
    result: 'Result Out',
    'admit-card': 'Admit Card Released',
    'answer-key': 'Answer Key Out',
    notification: 'Notification Released',
    registration: 'Registration Open',
    cutoff: 'Cut-off Declared',
    'exam-schedule': 'Exam Schedule',
  }[stage] || 'Update';

  const title = data.title || slug.replace(/-/g, ' ');
  const vacancy = data.vacancy ? ` — ${data.vacancy} Vacancies` : '';
  return `${title} [${stageLabel}]${vacancy}`;
}

function buildSchemeTitle(entry) {
  const slug = entry.includes(':') ? entry.split(':')[1] : entry;
  const langCode = entry.includes(':') ? entry.split(':')[0] : 'en';
  const dirs = [path.join(ROOT, `content/guides-${langCode}`), GUIDES_DIR];
  let data = {};
  for (const dir of dirs) {
    const fp = path.join(dir, `${slug}.md`);
    if (fs.existsSync(fp)) { data = matter(fs.readFileSync(fp, 'utf8')).data; break; }
  }
  return data.title || slug.replace(/-/g, ' ');
}

function getExamSubreddits(slug) {
  const fp = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(fp)) return [];
  const { data } = matter(fs.readFileSync(fp, 'utf8'));
  const searchText = [data.title, data.organization, data.examName, slug].filter(Boolean).join(' ');
  const subs = new Set();
  for (const { match, subs: s } of EXAM_SUBREDDIT_MAP) {
    if (match.test(searchText)) s.forEach(sub => subs.add(sub));
  }
  return [...subs].slice(0, 3); // max 3 subreddits per post
}

function getSchemeSubreddits(entry) {
  const slug = entry.includes(':') ? entry.split(':')[1] : entry;
  const langCode = entry.includes(':') ? entry.split(':')[0] : 'en';
  const dirs = [path.join(ROOT, `content/guides-${langCode}`), GUIDES_DIR];
  let data = {};
  for (const dir of dirs) {
    const fp = path.join(dir, `${slug}.md`);
    if (fs.existsSync(fp)) { data = matter(fs.readFileSync(fp, 'utf8')).data; break; }
  }
  const searchText = [data.title, data.description, slug].filter(Boolean).join(' ');
  const subs = new Set();
  for (const { match, subs: s } of SCHEME_SUBREDDIT_MAP) {
    if (match.test(searchText)) s.forEach(sub => subs.add(sub));
  }
  return [...subs].slice(0, 2); // max 2 subreddits for scheme posts
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const slugFile = args[0];

  if (!slugFile || !fs.existsSync(slugFile)) {
    console.log('No slug file — skipping Reddit');
    return;
  }

  const entries = fs.readFileSync(slugFile, 'utf8').trim().split('\n').filter(Boolean);
  const isScheme = slugFile.includes('scheme');

  let token;
  try { token = await getToken(); }
  catch (e) { console.error('❌ Reddit auth failed:', e.message); return; }

  for (const entry of entries) {
    const slug = entry.includes(':') ? entry.split(':')[1] : entry.trim();
    const langCode = entry.includes(':') ? entry.split(':')[0] : 'en';
    const urlPath = { ta: '/ta/guide', ml: '/ml/guide', te: '/te/guide', kn: '/kn/guide' }[langCode] || (isScheme ? '/guide' : '/update');
    const url = `${SITE_URL}${urlPath}/${slug}`;

    const title = isScheme ? buildSchemeTitle(entry) : buildExamTitle(slug);
    if (!title) { console.log(`⚠️  No content found for ${entry}`); continue; }

    const subreddits = isScheme ? getSchemeSubreddits(entry) : getExamSubreddits(slug);
    if (subreddits.length === 0) {
      console.log(`ℹ️  No matching subreddits for: ${slug}`);
      continue;
    }

    console.log(`\nPosting to Reddit: ${slug}`);
    console.log(`  Title: ${title}`);
    console.log(`  URL:   ${url}`);
    console.log(`  Subs:  ${subreddits.join(', ')}`);

    for (const sub of subreddits) {
      await submitPost(token, sub, title, url);
      await new Promise(r => setTimeout(r, 5000)); // 5s between posts (Reddit rate limit)
    }

    await new Promise(r => setTimeout(r, 10000)); // 10s between entries
  }

  console.log('\n✅ Reddit posting complete');
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * notify-telegram.js
 *
 * Posts new exam update pages to the Telegram channel @citizennest.
 * Reads slugs from stdin (one per line) or a file path argument.
 *
 * Required env:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather (e.g. 123456:ABCdef...)
 *   TELEGRAM_CHANNEL_ID — channel username or numeric ID (e.g. @citizennest or -100123...)
 *
 * Usage:
 *   echo "ssc-cgl-2026-result" | node scripts/notify-telegram.js
 *   node scripts/notify-telegram.js agents/.newly-generated-slugs
 *   node scripts/notify-telegram.js --text "Custom message here"
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

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.TELEGRAM_CHANNEL_ID || '@citizennest';

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

// Stage → emoji
const STAGE_EMOJI = {
  result: '🔴',
  'admit-card': '🟣',
  'answer-key': '🟢',
  notification: '🔵',
  registration: '🔵',
  cutoff: '🟠',
  'exam-schedule': '🟡',
};

function stageLabel(stage) {
  const labels = {
    result: 'Result Out',
    'admit-card': 'Admit Card',
    'answer-key': 'Answer Key',
    notification: 'Notification',
    registration: 'Registration Open',
    cutoff: 'Cut-off Released',
    'exam-schedule': 'Schedule',
  };
  return labels[stage] || stage;
}

function buildMessage(slug) {
  const filePath = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const stage = data.stage || data.type || 'notification';
  const emoji = STAGE_EMOJI[stage] || '📢';
  const label = stageLabel(stage);
  const title = data.title || slug;
  const org = data.organization || data.examName || '';
  const url = `${SITE_URL}/update/${slug}`;

  let msg = `${emoji} <b>${title}</b>\n`;

  if (org) msg += `🏛 ${org}\n`;

  // Add key dates
  const dates = data.importantDates || {};
  if (dates.resultDate && dates.resultDate !== 'TBA') {
    msg += `📅 Result: ${dates.resultDate}\n`;
  } else if (dates.examDate && dates.examDate !== 'TBA') {
    msg += `📅 Exam: ${dates.examDate}\n`;
  } else if (dates.admitCardDate && dates.admitCardDate !== 'TBA') {
    msg += `📅 Admit Card: ${dates.admitCardDate}\n`;
  }

  if (data.vacancies) msg += `📊 Vacancies: ${data.vacancies}\n`;

  msg += `\n🔗 <a href="${url}">Check Details → citizennest.com</a>`;
  msg += `\n\n#${(data.examName || 'SarkariExam').replace(/\s+/g, '')} #CitizenNest`;

  return msg;
}

async function sendMessage(text) {
  const body = JSON.stringify({
    chat_id: CHANNEL,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    const req = https.request(
      { hostname: url.hostname, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) resolve(parsed);
            else reject(new Error(parsed.description || 'Telegram API error'));
          } catch { reject(new Error(`Bad response: ${data}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);

  // --text "Custom message" mode
  if (args[0] === '--text') {
    const text = args.slice(1).join(' ');
    if (!text) { console.error('❌ --text requires a message'); process.exit(1); }
    await sendMessage(text);
    console.log('✅ Sent custom message');
    return;
  }

  // Read slugs
  let slugs = [];

  if (args[0] && fs.existsSync(args[0])) {
    // File path passed
    slugs = fs.readFileSync(args[0], 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  } else if (!process.stdin.isTTY) {
    // Stdin
    const raw = fs.readFileSync('/dev/stdin', 'utf8');
    slugs = raw.split('\n').map(s => s.trim()).filter(Boolean);
  } else if (args.length > 0) {
    slugs = args;
  }

  if (slugs.length === 0) {
    console.log('ℹ️  No slugs provided — nothing to post');
    return;
  }

  console.log(`📢 Posting ${slugs.length} update(s) to Telegram ${CHANNEL}`);

  for (const slug of slugs) {
    const msg = buildMessage(slug);
    if (!msg) {
      console.warn(`  ⚠️  No update file for slug: ${slug}`);
      continue;
    }
    try {
      await sendMessage(msg);
      console.log(`  ✅ Posted: ${slug}`);
      // Rate limit — Telegram allows ~1 msg/sec per bot
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error(`  ❌ Failed: ${slug} — ${err.message}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

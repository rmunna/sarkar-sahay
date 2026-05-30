#!/usr/bin/env node
/**
 * notify-whatsapp.js
 *
 * Posts new exam update pages to a WhatsApp Channel via
 * Meta WhatsApp Business Cloud API.
 *
 * Required env:
 *   WA_PHONE_NUMBER_ID  — WhatsApp Business phone number ID (from Meta Developer Console)
 *   WA_ACCESS_TOKEN     — Permanent system user token (from Meta Business Manager)
 *   WA_CHANNEL_ID       — WhatsApp Channel ID to broadcast to
 *
 * Usage:
 *   echo "ssc-cgl-2026-result" | node scripts/notify-whatsapp.js
 *   node scripts/notify-whatsapp.js agents/.newly-generated-slugs
 *   node scripts/notify-whatsapp.js --text "Custom message here"
 *
 * Setup:
 *   1. Go to developers.facebook.com → Create App → Business → WhatsApp
 *   2. Add a phone number and get Phone Number ID
 *   3. Create a permanent system user token in Meta Business Manager
 *   4. Create a WhatsApp Channel in WhatsApp → Channel management
 *   5. Get the Channel ID from the URL (long numeric string)
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

const PHONE_ID = process.env.WA_PHONE_NUMBER_ID;
const TOKEN = process.env.WA_ACCESS_TOKEN;
const CHANNEL_ID = process.env.WA_CHANNEL_ID;

if (!PHONE_ID || !TOKEN || !CHANNEL_ID) {
  console.error('❌ Required env vars missing: WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN, WA_CHANNEL_ID');
  process.exit(1);
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

function buildMessage(slug) {
  const filePath = path.join(UPDATES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const stage = data.stage || data.type || 'notification';
  const emoji = STAGE_EMOJI[stage] || '📢';
  const title = data.title || slug;
  const org = data.organization || '';
  const url = `${SITE_URL}/update/${slug}`;

  let msg = `${emoji} *${title}*\n`;
  if (org) msg += `🏛 ${org}\n`;

  const dates = data.importantDates || {};
  if (dates.resultDate && dates.resultDate !== 'TBA') {
    msg += `📅 Result: ${dates.resultDate}\n`;
  } else if (dates.examDate && dates.examDate !== 'TBA') {
    msg += `📅 Exam: ${dates.examDate}\n`;
  }

  if (data.vacancies) msg += `📊 Vacancies: ${data.vacancies}\n`;

  msg += `\n🔗 ${url}`;

  return msg;
}

async function sendWhatsApp(text) {
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: CHANNEL_ID,
    type: 'text',
    text: { body: text },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/v20.0/${PHONE_ID}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${data}`));
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

  if (args[0] === '--text') {
    const text = args.slice(1).join(' ');
    if (!text) { console.error('❌ --text requires a message'); process.exit(1); }
    await sendWhatsApp(text);
    console.log('✅ Sent custom WhatsApp message');
    return;
  }

  let slugs = [];
  if (args[0] && fs.existsSync(args[0])) {
    slugs = fs.readFileSync(args[0], 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  } else if (!process.stdin.isTTY) {
    const raw = fs.readFileSync('/dev/stdin', 'utf8');
    slugs = raw.split('\n').map(s => s.trim()).filter(Boolean);
  } else if (args.length > 0) {
    slugs = args;
  }

  if (slugs.length === 0) {
    console.log('ℹ️  No slugs provided — nothing to post');
    return;
  }

  console.log(`📢 Posting ${slugs.length} update(s) to WhatsApp Channel`);

  for (const slug of slugs) {
    const msg = buildMessage(slug);
    if (!msg) {
      console.warn(`  ⚠️  No update file for slug: ${slug}`);
      continue;
    }
    try {
      await sendWhatsApp(msg);
      console.log(`  ✅ Posted: ${slug}`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ Failed: ${slug} — ${err.message}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

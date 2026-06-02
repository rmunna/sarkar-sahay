#!/usr/bin/env node
/**
 * generate-scheme-guides.js
 *
 * Runtime detection (automatic):
 *   - Local / Claude Code  → uses `claude --print` CLI (no API key needed)
 *   - GitHub Actions (CI)  → uses Gemini API via GEMINI_API_KEY secret
 *
 * Usage:
 *   node scripts/generate-scheme-guides.js                    # English, batch 5
 *   node scripts/generate-scheme-guides.js --lang hi          # Hindi guides
 *   node scripts/generate-scheme-guides.js --lang both        # English + Hindi
 *   node scripts/generate-scheme-guides.js --priority 1       # Priority 1 only
 *   node scripts/generate-scheme-guides.js --state UP         # UP schemes only
 *   node scripts/generate-scheme-guides.js --batch 20         # Process 20 per run
 *   node scripts/generate-scheme-guides.js --slug pm-kisan-samman-nidhi-status-check
 *   node scripts/generate-scheme-guides.js --dry-run
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GUIDES_EN_DIR = path.join(ROOT, 'content/guides');
const GUIDES_HI_DIR = path.join(ROOT, 'content/guides-hi');
const SCHEME_LIST   = path.join(ROOT, 'agents/scheme-pipeline-list.json');
const SLUGS_EN_FILE = path.join(ROOT, 'agents/.newly-generated-slugs');
const SLUGS_HI_FILE = path.join(ROOT, 'agents/.newly-generated-slugs-hi');

// ── Environment detection ───────────────────────────────────────────────────
const IS_CI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';

// ── CLI flags ───────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');

const langArg = process.argv.indexOf('--lang');
const LANG = langArg !== -1 ? process.argv[langArg + 1] : 'en'; // 'en' | 'hi' | 'both'

const priorityArg = process.argv.indexOf('--priority');
const PRIORITY_FILTER = priorityArg !== -1 ? parseInt(process.argv[priorityArg + 1]) : null;

const stateArg = process.argv.indexOf('--state');
const STATE_FILTER = stateArg !== -1 ? process.argv[stateArg + 1] : null;

const slugArg = process.argv.indexOf('--slug');
const SLUG_FILTER = slugArg !== -1 ? process.argv[slugArg + 1] : null;

const batchArg = process.argv.indexOf('--batch');
const BATCH_SIZE = batchArg !== -1 ? parseInt(process.argv[batchArg + 1]) : 5;

const delayArg = process.argv.indexOf('--delay');
const CALL_DELAY_MS = delayArg !== -1 ? parseInt(process.argv[delayArg + 1]) : (IS_CI ? 4000 : 1000);

// ── Gemini client (CI only) ─────────────────────────────────────────────────
let geminiModel = null;
if (IS_CI) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required in CI.');
    process.exit(1);
  }
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function guideExists(slug, lang) {
  const dir = lang === 'hi' ? GUIDES_HI_DIR : GUIDES_EN_DIR;
  return fs.existsSync(path.join(dir, `${slug}.md`));
}

// ── AI backend ──────────────────────────────────────────────────────────────
function callClaudeCLI(prompt) {
  const tmpFile = `/tmp/scheme-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  try {
    return execSync(`claude --print < "${tmpFile}"`, {
      timeout: 300000, maxBuffer: 1024 * 1024 * 10, encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } finally { try { fs.unlinkSync(tmpFile); } catch {} }
}

async function callGemini(prompt) {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

async function callAI(prompt) {
  return IS_CI ? callGemini(prompt) : callClaudeCLI(prompt);
}

// ── JSON parser ─────────────────────────────────────────────────────────────
function parseJson(text) {
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch {}
  throw new Error(`JSON parse failed. Preview: ${text.slice(0, 300)}`);
}

// ── Validation ──────────────────────────────────────────────────────────────
const REQUIRED_SECTIONS_EN = ['## What is', '## Key Benefits', '## Who is Eligible', '## Documents Required', '## How to Apply', '## Frequently Asked Questions', '## Official Links'];
// Hindi sections: use partial keywords so "## Gruha Lakshmi Yojana क्या है?" still matches "क्या है"
const REQUIRED_SECTIONS_HI = ['क्या है', 'मुख्य लाभ', 'पात्रता', 'ज़रूरी दस्तावेज़', 'आवेदन कैसे करें', 'अक्सर पूछे जाने वाले सवाल', 'आधिकारिक लिंक'];

function validateSEO(meta) {
  const errs = [];
  if (!meta.title || meta.title.length < 20) errs.push(`title too short (${meta.title?.length})`);
  if (meta.title?.length > 110) errs.push(`title too long (${meta.title.length})`);
  if (!meta.description || meta.description.length < 80) errs.push(`description too short (${meta.description?.length})`);
  if (meta.description?.length > 180) errs.push(`description too long (${meta.description.length})`);
  if (!Array.isArray(meta.keywords) || meta.keywords.length < 5) errs.push(`too few keywords (${meta.keywords?.length})`);
  return errs;
}

function validateContent(md, lang) {
  const errs = [];
  const words = md.split(/\s+/).filter(Boolean).length;
  if (words < 600) errs.push(`too short (${words} words)`);
  const required = lang === 'hi' ? REQUIRED_SECTIONS_HI : REQUIRED_SECTIONS_EN;
  for (const s of required) { if (!md.includes(s)) errs.push(`missing: "${s}"`); }
  if (/\[insert|TODO|PLACEHOLDER/i.test(md)) errs.push('placeholder text found');
  return errs;
}

// ── English generation ──────────────────────────────────────────────────────
async function generateEN(scheme) {
  const today = new Date().toISOString().split('T')[0];
  const ctx = `Scheme: "${scheme.name}" | State: ${scheme.state} | Category: ${scheme.category} | Official: ${scheme.officialUrl} | Notes: ${scheme.notes}`;

  // Pass 1: SEO metadata
  const metaPrompt = `Return ONLY valid JSON (no markdown fences) for a citizennest.com guide:
${ctx}

{"title":"50-85 chars: scheme name + key benefit + year","description":"120-165 chars: benefit amount + who is eligible + official site","category":"Government Schemes","keywords":["8-12 search queries Indians use — mix of English and transliterated Hindi"]}`;

  let meta;
  for (let i = 1; i <= 3; i++) {
    const t = await callAI(metaPrompt);
    try {
      meta = parseJson(t);
      const e = validateSEO(meta);
      if (!e.length) break;
      log(`   ⚠️  SEO (attempt ${i}): ${e.join(', ')}`);
      if (i === 3) throw new Error(`SEO failed: ${e.join(', ')}`);
      await sleep(2000);
    } catch(err) { if (i === 3) throw err; await sleep(2000); }
  }

  await sleep(CALL_DELAY_MS);

  // Pass 2: Markdown content
  const contentPrompt = `Write a comprehensive guide for citizennest.com about this Indian government scheme:
${ctx}
Today: ${today}

Rules:
- Factual only. Unsure of exact amount/date → say "as per latest notification — check official website"
- Simple language for first-generation smartphone users in India
- Use ₹ symbol and Indian number format (lakh/crore). Target 1,200–1,800 words.
- Start directly with first ## heading. Do NOT add H1 or preamble.

Required sections:
## What is ${scheme.name}?
## Key Benefits
## Who is Eligible?
## Documents Required
## How to Apply — Step by Step
## How to Check Application / Payment Status
## Frequently Asked Questions (6-8 Q&As)
## Official Links`;

  let contentMarkdown;
  for (let i = 1; i <= 3; i++) {
    const t = await callAI(contentPrompt);
    contentMarkdown = t.replace(/^#\s[^\n]+\n/m,'').replace(/^```[a-z]*\n?/im,'').replace(/```\s*$/m,'').trim();
    const e = validateContent(contentMarkdown, 'en');
    if (!e.length) break;
    log(`   ⚠️  Content (attempt ${i}): ${e.join(', ')}`);
    if (i === 3) throw new Error(`Content failed: ${e.join(', ')}`);
    await sleep(3000);
  }

  return { ...meta, contentMarkdown };
}

// ── Hindi generation ────────────────────────────────────────────────────────
async function generateHI(scheme) {
  const today = new Date().toISOString().split('T')[0];
  const ctx = `Scheme: "${scheme.name}" | State: ${scheme.state} | Category: ${scheme.category} | Official: ${scheme.officialUrl} | Notes: ${scheme.notes}`;

  // Pass 1: SEO metadata in Hindi
  const metaPrompt = `Return ONLY valid JSON (no markdown fences) for a Hindi guide on citizennest.com about this Indian government scheme:
${ctx}

{"title":"Hindi title 40-80 chars: scheme name in Hindi + key benefit","description":"Hindi description 100-160 chars: benefit + who can apply + official site name","category":"Government Schemes","keywords":["8-12 keywords — mix Hindi (Devanagari) and English transliteration, e.g. 'पीएम किसान रजिस्ट्रेशन', 'PM Kisan status check', 'pm kisan samman nidhi'"]}`;

  let meta;
  for (let i = 1; i <= 3; i++) {
    const t = await callAI(metaPrompt);
    try {
      meta = parseJson(t);
      const e = validateSEO(meta);
      if (!e.length) break;
      log(`   ⚠️  Hindi SEO (attempt ${i}): ${e.join(', ')}`);
      if (i === 3) throw new Error(`Hindi SEO failed: ${e.join(', ')}`);
      await sleep(2000);
    } catch(err) { if (i === 3) throw err; await sleep(2000); }
  }

  await sleep(CALL_DELAY_MS);

  // Pass 2: Hindi markdown content
  const contentPrompt = `citizennest.com के लिए इस भारतीय सरकारी योजना पर एक विस्तृत हिंदी गाइड लिखें:
${ctx}
आज की तारीख: ${today}

नियम:
- केवल तथ्यात्मक जानकारी। अगर राशि/तारीख निश्चित न हो तो लिखें "नवीनतम अधिसूचना के अनुसार — आधिकारिक वेबसाइट देखें"
- सरल हिंदी — पहली बार स्मार्टफोन इस्तेमाल करने वाले लोगों के लिए
- ₹ और लाख/करोड़ का प्रयोग करें। लक्ष्य: 1,200–1,800 शब्द
- पहले ## heading से सीधे शुरू करें। H1 या प्रस्तावना न जोड़ें।
- Important: scheme name, portal names, and official URLs keep in English/original form

आवश्यक sections:
## ${scheme.name} क्या है?
## मुख्य लाभ
## पात्रता (कौन आवेदन कर सकता है?)
## ज़रूरी दस्तावेज़
## आवेदन कैसे करें — स्टेप-बाय-स्टेप
## आवेदन / भुगतान स्टेटस कैसे चेक करें
## अक्सर पूछे जाने वाले सवाल (6-8 Q&As)
## आधिकारिक लिंक`;

  let contentMarkdown;
  for (let i = 1; i <= 3; i++) {
    const t = await callAI(contentPrompt);
    contentMarkdown = t.replace(/^#\s[^\n]+\n/m,'').replace(/^```[a-z]*\n?/im,'').replace(/```\s*$/m,'').trim();
    const e = validateContent(contentMarkdown, 'hi');
    if (!e.length) break;
    log(`   ⚠️  Hindi Content (attempt ${i}): ${e.join(', ')}`);
    if (i === 3) throw new Error(`Hindi content failed: ${e.join(', ')}`);
    await sleep(3000);
  }

  return { ...meta, contentMarkdown };
}

// ── Build markdown file ─────────────────────────────────────────────────────
function buildMarkdownFile(data, scheme, lang) {
  const today = new Date().toISOString().split('T')[0];
  const keywords = (data.keywords || []).map(k => `  - "${k.replace(/"/g, '\\"')}"`).join('\n');
  const words = (data.contentMarkdown || '').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(5, Math.round(words / 200));
  const readingTime = lang === 'hi' ? `${mins} मिनट` : `${mins} min`;

  return `---
title: "${data.title.replace(/"/g, '\\"')}"
description: "${data.description.replace(/"/g, '\\"')}"
category: "${data.category || 'Government Schemes'}"
keywords:
${keywords}
officialLinks:
  - "${scheme.officialUrl}"
  - "${scheme.myschemeUrl}"
readingTime: "${readingTime}"
lastUpdated: "${today}"
---

${(data.contentMarkdown || '').trim()}
`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const backend = IS_CI ? 'Gemini 2.5 Flash (CI)' : 'Claude Code CLI (local)';
  const { schemes } = JSON.parse(fs.readFileSync(SCHEME_LIST, 'utf8'));

  // Apply filters
  let targets = schemes;
  if (SLUG_FILTER) targets = targets.filter(s => s.slug === SLUG_FILTER);
  if (PRIORITY_FILTER !== null) targets = targets.filter(s => s.priority <= PRIORITY_FILTER);
  if (STATE_FILTER) targets = targets.filter(s =>
    s.state.toLowerCase().includes(STATE_FILTER.toLowerCase()));

  // Language filter — only process schemes that have requested lang in their `langs` array
  const langs = LANG === 'both' ? ['en', 'hi'] : [LANG];

  log(`🤖 Backend: ${backend} | lang: ${LANG} | delay: ${CALL_DELAY_MS/1000}s`);

  for (const lang of langs) {
    const langLabel = lang === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English';
    // Filter schemes that support this language
    const langTargets = targets.filter(s => {
      if (!s.langs) return lang === 'en'; // default: English only
      return s.langs.includes(lang);
    });

    const pending = langTargets.filter(s => !guideExists(s.slug, lang));
    const skipped = langTargets.length - pending.length;
    const batch = pending.slice(0, BATCH_SIZE);

    log(`\n${langLabel}: ${langTargets.length} targeted | ${pending.length} pending | ${skipped} exist | processing ${batch.length}`);

    if (batch.length === 0) { log(`✅ All ${langLabel} guides exist.`); continue; }

    const dir = lang === 'hi' ? GUIDES_HI_DIR : GUIDES_EN_DIR;
    const slugsFile = lang === 'hi' ? SLUGS_HI_FILE : SLUGS_EN_FILE;
    const newSlugs = [];
    let errors = 0;

    for (const scheme of batch) {
      log(`\n  🏛  [P${scheme.priority}] ${scheme.name} (${scheme.state}) [${lang}]`);

      if (DRY_RUN) { log(`  📝 DRY RUN — ${scheme.slug}.md`); continue; }

      try {
        log(`  🤖 Generating...`);
        const data = lang === 'hi' ? await generateHI(scheme) : await generateEN(scheme);

        if (!data.title || !data.contentMarkdown || data.contentMarkdown.length < 400)
          throw new Error(`Thin content: ${data.contentMarkdown?.length ?? 0} chars`);

        const markdown = buildMarkdownFile(data, scheme, lang);
        const filePath = path.join(dir, `${scheme.slug}.md`);
        fs.writeFileSync(filePath, markdown, 'utf8');
        newSlugs.push(scheme.slug);

        const wc = data.contentMarkdown.split(/\s+/).filter(Boolean).length;
        log(`  ✅ ${scheme.slug}.md (${wc} words)`);
      } catch(err) {
        log(`  ❌ ${err.message}`);
        errors++;
      }

      await sleep(CALL_DELAY_MS);
    }

    const remaining = pending.length - batch.length;
    log(`\n${'─'.repeat(50)}`);
    log(`${langLabel} — Generated: ${newSlugs.length} | Errors: ${errors}${remaining > 0 ? ` | ${remaining} more pending` : ''}`);

    if (newSlugs.length > 0) {
      fs.appendFileSync(slugsFile, newSlugs.join('\n') + '\n');
      log(`💾 Slugs → ${path.basename(slugsFile)}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

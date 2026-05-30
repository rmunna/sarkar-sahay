#!/usr/bin/env node
/**
 * generate-scheme-guides.js
 *
 * Reads agents/scheme-pipeline-list.json and generates comprehensive
 * guide pages for each scheme not already covered in content/guides/.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guides.js
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guides.js --priority 1
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guides.js --state Karnataka
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guides.js --dry-run
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guides.js --slug pm-kisan-samman-nidhi-status-check
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GUIDES_DIR = path.join(ROOT, 'content/guides');
const SCHEME_LIST = path.join(ROOT, 'agents/scheme-pipeline-list.json');
const SLUGS_FILE = path.join(ROOT, 'agents/.newly-generated-slugs');

const DRY_RUN = process.argv.includes('--dry-run');

// Filters
const priorityArg = process.argv.indexOf('--priority');
const PRIORITY_FILTER = priorityArg !== -1 ? parseInt(process.argv[priorityArg + 1]) : null;

const stateArg = process.argv.indexOf('--state');
const STATE_FILTER = stateArg !== -1 ? process.argv[stateArg + 1] : null;

const slugArg = process.argv.indexOf('--slug');
const SLUG_FILTER = slugArg !== -1 ? process.argv[slugArg + 1] : null;

// Batch limit — max schemes to process per run (avoids rate limit exhaustion)
const batchArg = process.argv.indexOf('--batch');
const BATCH_SIZE = batchArg !== -1 ? parseInt(process.argv[batchArg + 1]) : 5;

// Delay between API calls in ms (2 calls per scheme, free tier = 15 RPM)
// 15 RPM = 1 call per 4s minimum. We use 5s to be safe.
const delayArg = process.argv.indexOf('--delay');
const CALL_DELAY_MS = delayArg !== -1 ? parseInt(process.argv[delayArg + 1]) : 5000;

// Rate limiter — tracks calls in the last 60 seconds
const callTimestamps = [];
async function rateLimitedCall(fn) {
  const now = Date.now();
  // Remove timestamps older than 60s
  while (callTimestamps.length && callTimestamps[0] < now - 60000) callTimestamps.shift();
  // Free tier: 15 RPM. Stay under 12 to be safe.
  if (callTimestamps.length >= 12) {
    const waitMs = 60000 - (now - callTimestamps[0]) + 1000;
    log(`  ⏳ Rate limit: waiting ${Math.ceil(waitMs / 1000)}s...`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  callTimestamps.push(Date.now());
  return fn();
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function guideExists(slug) {
  return fs.existsSync(path.join(GUIDES_DIR, `${slug}.md`));
}

function parseJson(text) {
  // Strip markdown code fences
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch { /* continue */ }
  // Extract outermost {...}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch { /* continue */ }
  throw new Error(`JSON parse failed. Preview: ${text.slice(0, 200)}`);
}

async function generateSchemeGuide(scheme) {
  const today = new Date().toISOString().split('T')[0];
  const context = `Scheme: "${scheme.name}" | State: ${scheme.state} | Category: ${scheme.category} | Official: ${scheme.officialUrl} | Notes: ${scheme.notes}`;

  // Pass 1: metadata only (small, reliable JSON)
  const metaPrompt = `Return ONLY valid JSON, no code fences, for a citizennest.com guide about this Indian government scheme:
${context}

JSON format:
{"title":"60-80 chars, scheme name + key benefit + year","description":"130-160 chars, benefit amount + eligibility + apply at official site","category":"Government Schemes","keywords":["8-12 exact search queries people use including vernacular like 'gruha lakshmi yojana apply online', 'gruha lakshmi status check'"]}`;

  const metaResult = await rateLimitedCall(() => model.generateContent(metaPrompt));
  const meta = parseJson(metaResult.response.text().trim());

  await new Promise(r => setTimeout(r, CALL_DELAY_MS));

  // Pass 2: markdown content as plain text (no JSON encoding issues)
  const contentPrompt = `Write a comprehensive guide for citizennest.com about this Indian government scheme:
${context}
Today: ${today}

Rules:
- Factual only. If unsure of exact date/amount, say "as per latest notification — check official website"
- Simple language for first-generation smartphone users
- Focus on HOW TO: apply, check status, check payment, what documents needed
- 1200-1800 words

Write the guide in Markdown. Start directly with the first ## section (no H1, no preamble):

## What is ${scheme.name}?
## Key Benefits
## Who is Eligible?
## Documents Required
## How to Apply — Step by Step
## How to Check Application / Payment Status
## Frequently Asked Questions (6-8 Q&As)
## Official Links`;

  const contentResult = await rateLimitedCall(() => model.generateContent(contentPrompt));
  const contentMarkdown = contentResult.response.text().trim()
    .replace(/^#\s.+\n/m, '') // remove any H1 if Gemini adds one
    .trim();

  return { ...meta, contentMarkdown };
}

function buildMarkdownFile(data, scheme) {
  const today = new Date().toISOString().split('T')[0];
  const keywords = (data.keywords || []).map(k => `  - "${k.replace(/"/g, '\\"')}"`).join('\n');

  return `---
title: "${data.title.replace(/"/g, '\\"')}"
description: "${data.description.replace(/"/g, '\\"')}"
category: "${data.category || 'Government Schemes'}"
keywords:
${keywords}
officialLinks:
  - "${scheme.officialUrl}"
  - "${scheme.myschemeUrl}"
readingTime: "8 min"
lastUpdated: "${today}"
---

${(data.contentMarkdown || '').trim()}
`;
}

async function main() {
  const { schemes } = JSON.parse(fs.readFileSync(SCHEME_LIST, 'utf8'));

  // Apply filters
  let targets = schemes;
  if (SLUG_FILTER) targets = targets.filter(s => s.slug === SLUG_FILTER);
  if (PRIORITY_FILTER) targets = targets.filter(s => s.priority <= PRIORITY_FILTER);
  if (STATE_FILTER) targets = targets.filter(s => s.state.toLowerCase() === STATE_FILTER.toLowerCase());

  // Skip already-generated
  const pending = targets.filter(s => !guideExists(s.slug));
  const skipped = targets.length - pending.length;
  // Apply batch limit
  const batch = pending.slice(0, BATCH_SIZE);

  log(`📋 ${targets.length} schemes targeted | ${pending.length} pending | ${skipped} already exist | processing ${batch.length} this run (batch=${BATCH_SIZE})`);
  log(`⏱  Rate limit: ${CALL_DELAY_MS / 1000}s between calls, max 12 calls/min`);

  if (batch.length === 0) {
    log('✅ All targeted schemes already have guides.');
    return;
  }

  const results = { generated: 0, skipped: skipped, errors: [] };
  const newSlugs = [];

  for (const scheme of batch) {
    log(`\n🏛 [Priority ${scheme.priority}] ${scheme.name} (${scheme.state})`);
    log(`   slug: ${scheme.slug}`);

    if (DRY_RUN) {
      log(`   📝 DRY RUN — would generate: ${scheme.slug}.md`);
      results.generated++;
      continue;
    }

    try {
      log(`   🤖 Generating with Gemini...`);
      const data = await generateSchemeGuide(scheme);

      if (!data.title || !data.contentMarkdown || data.contentMarkdown.length < 500) {
        throw new Error(`Thin content: title="${data.title}", body=${data.contentMarkdown?.length || 0} chars`);
      }

      const markdown = buildMarkdownFile(data, scheme);
      const filePath = path.join(GUIDES_DIR, `${scheme.slug}.md`);
      fs.writeFileSync(filePath, markdown, 'utf8');
      newSlugs.push(scheme.slug);
      results.generated++;
      log(`   ✅ Written: ${scheme.slug}.md (${data.contentMarkdown.length} chars)`);

      // Extra delay between schemes (on top of per-call rate limiting)
      await new Promise(r => setTimeout(r, CALL_DELAY_MS));
    } catch (err) {
      log(`   ❌ Error: ${err.message}`);
      results.errors.push({ scheme: scheme.name, error: err.message });
    }
  }

  log(`\n${'─'.repeat(50)}`);
  log(`✅ Generated:  ${results.generated}`);
  log(`⏭  Skipped:   ${results.skipped} (already exist)`);
  log(`❌ Errors:     ${results.errors.length}`);
  const remaining = pending.length - batch.length;
  if (remaining > 0) log(`🔄 ${remaining} more schemes pending — run again to continue`);

  if (newSlugs.length > 0) {
    fs.appendFileSync(SLUGS_FILE, newSlugs.join('\n') + '\n');
    log(`💾 New slugs written to .newly-generated-slugs`);
    log(`\nNext steps:`);
    log(`  git add content/guides/ && git commit -m "content: add ${newSlugs.length} scheme guides"`);
    log(`  node scripts/google-index-submit.js <url> for each slug`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

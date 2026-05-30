#!/usr/bin/env node
/**
 * generate-scheme-guides.js
 *
 * Generates comprehensive guide pages for Indian government schemes.
 *
 * Runtime detection (automatic):
 *   - Local / Claude Code  → uses `claude --print` CLI (no API key needed)
 *   - GitHub Actions (CI)  → uses Gemini API via GEMINI_API_KEY secret
 *
 * Usage:
 *   node scripts/generate-scheme-guides.js
 *   node scripts/generate-scheme-guides.js --priority 1
 *   node scripts/generate-scheme-guides.js --state Karnataka
 *   node scripts/generate-scheme-guides.js --dry-run
 *   node scripts/generate-scheme-guides.js --batch 10
 *   node scripts/generate-scheme-guides.js --slug pm-kisan-samman-nidhi-status-check
 *   GITHUB_ACTIONS=true GEMINI_API_KEY=xxx node scripts/generate-scheme-guides.js   # force Gemini
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GUIDES_DIR = path.join(ROOT, 'content/guides');
const SCHEME_LIST = path.join(ROOT, 'agents/scheme-pipeline-list.json');
const SLUGS_FILE = path.join(ROOT, 'agents/.newly-generated-slugs');

// ── Environment detection ───────────────────────────────────────────────────
const IS_CI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';

// ── CLI flags ───────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');

const priorityArg = process.argv.indexOf('--priority');
const PRIORITY_FILTER = priorityArg !== -1 ? parseInt(process.argv[priorityArg + 1]) : null;

const stateArg = process.argv.indexOf('--state');
const STATE_FILTER = stateArg !== -1 ? process.argv[stateArg + 1] : null;

const slugArg = process.argv.indexOf('--slug');
const SLUG_FILTER = slugArg !== -1 ? process.argv[slugArg + 1] : null;

const batchArg = process.argv.indexOf('--batch');
const BATCH_SIZE = batchArg !== -1 ? parseInt(process.argv[batchArg + 1]) : 5;

const delayArg = process.argv.indexOf('--delay');
// Default: 1s locally (no rate limit on Claude), 4s on CI (Gemini free tier ~15 RPM)
const CALL_DELAY_MS = delayArg !== -1 ? parseInt(process.argv[delayArg + 1]) : (IS_CI ? 4000 : 1000);

// ── Gemini client (CI only) ─────────────────────────────────────────────────
let geminiModel = null;
if (IS_CI) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required in CI. Set it as a GitHub Actions secret.');
    process.exit(1);
  }
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function guideExists(slug) {
  return fs.existsSync(path.join(GUIDES_DIR, `${slug}.md`));
}

// ── AI backend routing ──────────────────────────────────────────────────────

function callClaudeCLI(prompt) {
  const tmpFile = `/tmp/scheme-prompt-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  try {
    const output = execSync(`claude --print < "${tmpFile}"`, {
      timeout: 180000,      // 3 min — scheme content prompts are large
      maxBuffer: 1024 * 1024 * 10,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

async function callGemini(prompt) {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

async function callAI(prompt) {
  if (IS_CI) return callGemini(prompt);
  return callClaudeCLI(prompt);
}

// ── JSON parser (handles markdown fences from both models) ──────────────────
function parseJson(text) {
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch { /* continue */ }
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch { /* continue */ }
  throw new Error(`JSON parse failed. Preview: ${text.slice(0, 300)}`);
}

// ── SEO validation ──────────────────────────────────────────────────────────
function validateSEO(meta, contentMarkdown) {
  const errors = [];

  // Title: 50–90 chars (Google truncates at ~60 but longer is still useful for ranking)
  if (!meta.title) errors.push('title is missing');
  else if (meta.title.length < 30) errors.push(`title too short (${meta.title.length} chars, min 30)`);
  else if (meta.title.length > 100) errors.push(`title too long (${meta.title.length} chars, max 100)`);

  // Description: 120–165 chars
  if (!meta.description) errors.push('description is missing');
  else if (meta.description.length < 100) errors.push(`description too short (${meta.description.length} chars, min 100)`);
  else if (meta.description.length > 175) errors.push(`description too long (${meta.description.length} chars, max 175)`);

  // Keywords: at least 6
  if (!Array.isArray(meta.keywords) || meta.keywords.length < 6) {
    errors.push(`too few keywords (${meta.keywords?.length ?? 0}, min 6)`);
  }

  return errors;
}

// ── Content validation ──────────────────────────────────────────────────────
const REQUIRED_SECTIONS = [
  '## What is',
  '## Key Benefits',
  '## Who is Eligible',
  '## Documents Required',
  '## How to Apply',
  '## Frequently Asked Questions',
  '## Official Links',
];

function validateContent(contentMarkdown) {
  const errors = [];

  // Minimum length
  const wordCount = contentMarkdown.split(/\s+/).filter(Boolean).length;
  if (wordCount < 700) errors.push(`content too short (${wordCount} words, min 700)`);

  // Required sections
  for (const section of REQUIRED_SECTIONS) {
    if (!contentMarkdown.includes(section)) {
      errors.push(`missing section: "${section}"`);
    }
  }

  // No placeholder text leaked through
  if (/\[insert|TODO|PLACEHOLDER|your text here/i.test(contentMarkdown)) {
    errors.push('content contains placeholder text');
  }

  return errors;
}

// ── Two-pass generation with retry ─────────────────────────────────────────
async function generateSchemeGuide(scheme) {
  const today = new Date().toISOString().split('T')[0];
  const context = `Scheme: "${scheme.name}" | State: ${scheme.state} | Category: ${scheme.category} | Official URL: ${scheme.officialUrl} | Notes: ${scheme.notes}`;

  // ── Pass 1: SEO metadata (small JSON, reliable) ─────────────────────────
  const metaPrompt = `Return ONLY valid JSON (no markdown code fences) for a citizennest.com guide about this Indian government scheme:
${context}

Required JSON format — fill all fields accurately:
{
  "title": "50-80 chars: scheme name + key benefit + year (e.g. 'PM MUDRA Yojana 2024 — Business Loan up to ₹10 Lakh, Apply Online')",
  "description": "130-160 chars: key benefit + who is eligible + where to apply (include rupee amounts, official site name)",
  "category": "Government Schemes",
  "keywords": ["8-12 exact search queries Indians type — include scheme name variations, apply online, eligibility, documents, status check, state language transliterations"]
}`;

  let meta;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const metaText = await callAI(metaPrompt);
    try {
      meta = parseJson(metaText);
      const seoErrors = validateSEO(meta, '');
      if (seoErrors.length === 0) break;
      log(`   ⚠️  SEO validation (attempt ${attempt}): ${seoErrors.join(', ')}`);
      if (attempt === 3) throw new Error(`SEO validation failed after 3 attempts: ${seoErrors.join(', ')}`);
      await sleep(2000);
    } catch (err) {
      if (attempt === 3) throw err;
      log(`   ⚠️  Meta parse error (attempt ${attempt}): ${err.message}`);
      await sleep(2000);
    }
  }

  await sleep(CALL_DELAY_MS);

  // ── Pass 2: Markdown content ────────────────────────────────────────────
  const contentPrompt = `Write a comprehensive, accurate guide for citizennest.com about this Indian government scheme:
${context}
Today's date: ${today}

Writing rules:
- Factual only. If you are unsure of an exact amount or date, say "as per latest notification — check official website"
- Simple language suitable for first-generation smartphone users in India
- Focus on practical HOW TO information: how to apply, check status, check payment, documents needed
- Target length: 1,200–1,800 words
- Use Indian number formatting: ₹ symbol, lakh/crore (not million/billion)

Write the complete guide in Markdown. Start directly with the first ## heading (do NOT add H1, preamble, or introductory sentences before the first section):

## What is ${scheme.name}?
[2-3 paragraphs explaining the scheme clearly]

## Key Benefits
[Bullet list or table of all benefits with exact amounts]

## Who is Eligible?
[Eligibility criteria — age, income, state, occupation, etc.]

## Documents Required
[Numbered list of all documents needed]

## How to Apply — Step by Step
[Numbered steps for online + offline application]

## How to Check Application / Payment Status
[Step-by-step status check instructions]

## Frequently Asked Questions
[6-8 Q&As covering the most common questions]

## Official Links
[List of official websites and helpline numbers]`;

  let contentMarkdown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const contentText = await callAI(contentPrompt);
    contentMarkdown = contentText
      .replace(/^#\s[^\n]+\n/m, '')    // remove stray H1
      .replace(/^```[a-z]*\n?/im, '')  // remove opening code fence
      .replace(/```\s*$/m, '')          // remove closing code fence
      .trim();

    const contentErrors = validateContent(contentMarkdown);
    if (contentErrors.length === 0) break;
    log(`   ⚠️  Content validation (attempt ${attempt}): ${contentErrors.join(', ')}`);
    if (attempt === 3) throw new Error(`Content validation failed after 3 attempts: ${contentErrors.join(', ')}`);
    await sleep(3000);
  }

  return { ...meta, contentMarkdown };
}

// ── Build final markdown file ───────────────────────────────────────────────
function buildMarkdownFile(data, scheme) {
  const today = new Date().toISOString().split('T')[0];
  const keywords = (data.keywords || []).map(k => `  - "${k.replace(/"/g, '\\"')}"`).join('\n');

  // Estimate reading time (avg 200 wpm)
  const wordCount = (data.contentMarkdown || '').split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(5, Math.round(wordCount / 200));

  return `---
title: "${data.title.replace(/"/g, '\\"')}"
description: "${data.description.replace(/"/g, '\\"')}"
category: "${data.category || 'Government Schemes'}"
keywords:
${keywords}
officialLinks:
  - "${scheme.officialUrl}"
  - "${scheme.myschemeUrl}"
readingTime: "${readingMinutes} min"
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
  if (STATE_FILTER) targets = targets.filter(s => s.state.toLowerCase() === STATE_FILTER.toLowerCase());

  const pending = targets.filter(s => !guideExists(s.slug));
  const skipped = targets.length - pending.length;
  const batch = pending.slice(0, BATCH_SIZE);

  log(`📋 ${targets.length} schemes targeted | ${pending.length} pending | ${skipped} already exist | processing ${batch.length} this run (batch=${BATCH_SIZE})`);
  log(`🤖 Backend: ${backend} | delay: ${CALL_DELAY_MS / 1000}s between API calls`);

  if (batch.length === 0) {
    log('✅ All targeted schemes already have guides.');
    return;
  }

  const results = { generated: 0, skipped, errors: [] };
  const newSlugs = [];

  for (const scheme of batch) {
    log(`\n🏛  [Priority ${scheme.priority}] ${scheme.name} (${scheme.state})`);
    log(`    slug: ${scheme.slug}`);

    if (DRY_RUN) {
      log(`    📝 DRY RUN — would generate: ${scheme.slug}.md`);
      results.generated++;
      continue;
    }

    try {
      log(`    🤖 Generating with ${backend}...`);
      const data = await generateSchemeGuide(scheme);

      // Final hard validation
      if (!data.title) throw new Error('title missing after generation');
      if (!data.contentMarkdown || data.contentMarkdown.length < 400) {
        throw new Error(`Thin content: ${data.contentMarkdown?.length ?? 0} chars`);
      }

      const seoErrors = validateSEO(data, data.contentMarkdown);
      if (seoErrors.length > 0) log(`    ⚠️  SEO warnings: ${seoErrors.join(', ')}`);

      const contentErrors = validateContent(data.contentMarkdown);
      if (contentErrors.length > 0) log(`    ⚠️  Content warnings: ${contentErrors.join(', ')}`);

      const markdown = buildMarkdownFile(data, scheme);
      const filePath = path.join(GUIDES_DIR, `${scheme.slug}.md`);
      fs.writeFileSync(filePath, markdown, 'utf8');
      newSlugs.push(scheme.slug);
      results.generated++;

      const wordCount = data.contentMarkdown.split(/\s+/).filter(Boolean).length;
      log(`    ✅ Written: ${scheme.slug}.md (${wordCount} words)`);
    } catch (err) {
      log(`    ❌ Error: ${err.message}`);
      results.errors.push({ scheme: scheme.name, error: err.message });
    }

    // Delay between schemes (avoid rate limits on CI / be polite locally)
    await sleep(CALL_DELAY_MS);
  }

  log(`\n${'─'.repeat(55)}`);
  log(`✅ Generated:  ${results.generated}`);
  log(`⏭  Skipped:   ${results.skipped} (already exist)`);
  log(`❌ Errors:     ${results.errors.length}`);
  if (results.errors.length > 0) {
    results.errors.forEach(e => log(`   • ${e.scheme}: ${e.error}`));
  }

  const remaining = pending.length - batch.length;
  if (remaining > 0) log(`🔄 ${remaining} more schemes pending — run again to continue`);

  if (newSlugs.length > 0) {
    fs.appendFileSync(SLUGS_FILE, newSlugs.join('\n') + '\n');
    log(`\n💾 New slugs → agents/.newly-generated-slugs`);
    log(`\nNext steps:`);
    log(`  git add content/guides/ && git commit -m "content: add ${newSlugs.length} scheme guides"`);
    log(`  node scripts/google-index-submit.js for each new slug`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

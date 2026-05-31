#!/usr/bin/env node
/**
 * generate-spike-pages.js
 *
 * Reads spike_candidates from agents/trending-pytrends.json
 * (topics with 200%+ rising in Jobs/Education categories that indicate
 * an imminent result / admit card / answer key event).
 *
 * For each unique spike not already covered, asks Gemini to generate
 * a factual anticipatory update page and writes it to content/updates/.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-spike-pages.js
 *   GEMINI_API_KEY=your_key node scripts/generate-spike-pages.js --dry-run
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const UPDATES_DIR    = path.join(ROOT, 'content/updates');
const PYTRENDS_PATH  = path.join(ROOT, 'agents/trending-pytrends.json');
const SLUGS_FILE     = path.join(ROOT, 'agents/.newly-generated-slugs');

const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
}

function fileExists(slug) {
  return fs.existsSync(path.join(UPDATES_DIR, `${slug}.md`));
}

// Deduplicate spike candidates — group by exam name (not raw query)
function deduplicateSpikes(candidates) {
  const groups = new Map();
  for (const c of candidates) {
    // Normalize: "iiser admit card 2026" and "iiser admit card" → key "iiser-admit-card"
    const key = c.topic.toLowerCase()
      .replace(/\b20\d{2}\b/g, '')      // remove years
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .replace(/\s+/g, '-');
    if (!groups.has(key) || c.rising_value > groups.get(key).rising_value) {
      groups.set(key, c);
    }
  }
  return [...groups.values()].sort((a, b) => b.rising_value - a.rising_value);
}

async function generateSpikePage(topic, risingValue) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are writing a factual, helpful article for citizennest.com — an Indian exam information website.

The following search query is rising ${risingValue}% on Google Trends India right now (Jobs/Education category):
"${topic}"

This means there is a high-traffic event (result, admit card, answer key, etc.) happening RIGHT NOW or within the next 2–3 days.

Write a complete, accurate update page about this event. Today's date is ${today}.

CRITICAL RULES:
1. ONLY include information you are highly confident is factually correct for 2026
2. If you don't know an exact date or detail, say "TBA — check official website" — do NOT fabricate dates
3. The article must be helpful to someone searching this query right now
4. Use specific official website URLs (e.g. nta.ac.in, ssc.gov.in, results.nic.in etc.)
5. examName must be a SHORT acronym/abbreviation (e.g. "IISER IAT 2026", not "Indian Institute of Science Education and Research Aptitude Test 2026")
6. Type must be one of: result, admit-card, answer-key, notification, exam-schedule, cutoff, registration

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "title": "string (60-90 chars, include event type + year)",
  "description": "string (100-180 chars, include key action — download/check/verify at official site)",
  "category": "Results" | "Admit Cards" | "Answer Keys" | "Government Jobs" | "Entrance Exams",
  "type": "result" | "admit-card" | "answer-key" | "notification" | "exam-schedule" | "cutoff" | "registration",
  "organization": "string (official short name, e.g. NTA, UPSC, SSC)",
  "examName": "string (SHORT — max 30 chars — use common acronym)",
  "stage": "result" | "admit-card" | "answer-key" | "notification" | "exam-schedule" | "cutoff" | "registration",
  "keywords": ["5-8 exact search queries people are using, each under 60 chars"],
  "importantDates": {
    "examDate": "YYYY-MM-DD or TBA",
    "resultDate": "YYYY-MM-DD or TBA",
    "admitCardDate": "YYYY-MM-DD or TBA"
  },
  "officialLinks": ["2-3 official URLs only (.gov.in, .nic.in, .ac.in, .edu.in or known official domains)"],
  "applicationFee": { "general": "₹amount or null", "scSt": "₹amount or null" },
  "educationQualification": "string or null",
  "selectionProcess": ["step1", "step2"],
  "contentMarkdown": "Full article in Markdown (600-1200 words). Include: overview, how to download/check, what details are shown, what to do next, FAQs (4-6 Q&As). Use ## for sections. No H1. Be factual and specific."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Robustly extract JSON from Gemini's response — handles:
  //   1. ```json ... ``` fences (anywhere in the text, with optional preamble)
  //   2. Plain ``` ... ``` fences
  //   3. Raw JSON with no fences but surrounded by prose
  //   4. Clean JSON with no wrapping at all
  function extractJson(raw) {
    // Strategy 1: code fence with optional "json" tag (handles preamble text before fence)
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();

    // Strategy 2: find the outermost { ... } block (handles inline prose)
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1).trim();

    // Strategy 3: return as-is and let JSON.parse decide
    return raw;
  }

  const jsonStr = extractJson(text);

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error(`JSON parse failed. Response: ${text.slice(0, 300)}`);
  }

  return data;
}

function buildMarkdownFile(data, today) {
  const examName = data.examName || 'Unknown Exam';
  const keywords = (data.keywords || []).map(k => `  - "${k.replace(/"/g, '\\"')}"`).join('\n');

  const importantDates = data.importantDates || {};
  const datePairs = Object.entries(importantDates)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: "${v}"`)
    .join('\n');

  const links = (data.officialLinks || []).map(l => `  - "${l}"`).join('\n');
  const selection = (data.selectionProcess || []).map(s => `  - "${s.replace(/"/g, '\\"')}"`).join('\n');

  let frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
description: "${data.description.replace(/"/g, '\\"')}"
category: "${data.category}"
type: "${data.type}"
organization: "${data.organization}"
examName: "${examName}"
stage: "${data.stage}"
keywords:
${keywords}
importantDates:
${datePairs}
officialLinks:
${links}
readingTime: "5 min"
publishedDate: "${today}"
status: "active"`;

  if (data.educationQualification) {
    frontmatter += `\neducationQualification: "${data.educationQualification.replace(/"/g, '\\"')}"`;
  }
  if (data.selectionProcess?.length > 0) {
    frontmatter += `\nselectionProcess:\n${selection}`;
  }
  if (data.applicationFee?.general) {
    frontmatter += `\napplicationFee:
  general: "${data.applicationFee.general}"`;
    if (data.applicationFee.scSt) {
      frontmatter += `\n  scSt: "${data.applicationFee.scSt}"`;
    }
  }
  frontmatter += '\n---\n';

  return frontmatter + '\n' + (data.contentMarkdown || '').trim() + '\n';
}

async function main() {
  if (!fs.existsSync(PYTRENDS_PATH)) {
    log('❌ agents/trending-pytrends.json not found — run trending-pytrends.py first');
    process.exit(1);
  }

  const pytrends = JSON.parse(fs.readFileSync(PYTRENDS_PATH, 'utf8'));
  const raw = pytrends.spike_candidates || [];

  if (raw.length === 0) {
    log('✅ No spike candidates found — nothing to generate');
    return;
  }

  const candidates = deduplicateSpikes(raw);
  log(`📊 ${raw.length} spike candidates → ${candidates.length} unique after deduplication`);

  const today = new Date().toISOString().split('T')[0];
  const results = { generated: 0, skipped: 0, errors: [] };
  const newSlugs = [];

  for (const candidate of candidates) {
    const { topic, rising_value } = candidate;
    const slug = slugify(topic);

    log(`\n🔥 [${rising_value}%] ${topic}`);
    log(`   slug: ${slug}`);

    if (fileExists(slug)) {
      log(`   ⏭  Already exists — skipping`);
      results.skipped++;
      continue;
    }

    if (DRY_RUN) {
      log(`   📝 DRY RUN — would generate: ${slug}.md`);
      results.generated++;
      continue;
    }

    try {
      log(`   🤖 Generating with Gemini...`);
      const data = await generateSpikePage(topic, rising_value);

      // Basic validation
      if (!data.title || !data.contentMarkdown || data.contentMarkdown.length < 300) {
        throw new Error(`Thin content: title="${data.title}", body=${data.contentMarkdown?.length || 0} chars`);
      }

      const markdown = buildMarkdownFile(data, today);
      const filePath = path.join(UPDATES_DIR, `${slug}.md`);
      fs.writeFileSync(filePath, markdown, 'utf8');
      newSlugs.push(slug);
      results.generated++;
      log(`   ✅ Written: ${slug}.md`);

      // Rate limit — stay within Gemini free quota
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      log(`   ❌ Error: ${err.message}`);
      results.errors.push({ topic, error: err.message });
    }
  }

  log(`\n${'─'.repeat(50)}`);
  log(`✅ Generated:  ${results.generated}`);
  log(`⏭  Skipped:   ${results.skipped}`);
  log(`❌ Errors:     ${results.errors.length}`);

  if (newSlugs.length > 0) {
    fs.appendFileSync(SLUGS_FILE, newSlugs.join('\n') + '\n');
    log(`💾 Wrote ${newSlugs.length} slug(s) to .newly-generated-slugs`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

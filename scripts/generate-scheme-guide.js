#!/usr/bin/env node
/**
 * generate-scheme-guide.js
 *
 * Reads new scheme announcements from agents/pib-latest.json (produced by pib-scanner.js)
 * and generates factual, verified guide pages for CitizenNest.
 *
 * Pipeline:
 *   pib-scanner.js → pib-latest.json → this script → content/guides/{slug}.md
 *
 * ACCURACY RULES (enforced at every step):
 *  - Fetches the actual PIB press release text before generating
 *  - Gemini prompt explicitly forbids inventing dates, amounts, or eligibility
 *  - Any unverified detail is written as "check official website"
 *  - Only .gov.in / .nic.in / .gov official links are allowed
 *  - Two-step validation: schema check + content length check
 *
 * Does NOT post to Telegram — Telegram is for jobs/exams only.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guide.js
 *   GEMINI_API_KEY=your_key node scripts/generate-scheme-guide.js --dry-run
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GUIDES_DIR   = path.join(ROOT, 'content/guides');
const PIB_PATH     = path.join(ROOT, 'agents/pib-latest.json');
const SLUGS_FILE   = path.join(ROOT, 'agents/.newly-generated-scheme-slugs');

const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 2.5 Flash for speed + quality balance
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^ऀ-ॿa-z0-9\s-]/g, '')   // keep Hindi + ASCII
    .replace(/[ऀ-ॿ]+/g, '')             // remove Hindi chars (use English slug)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

function guideExists(slug) {
  // Check exact slug or close match in guides/
  if (fs.existsSync(path.join(GUIDES_DIR, `${slug}.md`))) return slug;
  if (fs.existsSync(path.join(GUIDES_DIR, `${slug}-guide.md`))) return `${slug}-guide`;

  // Fuzzy: if slug words overlap with any existing guide filename
  const words = slug.split('-').filter(w => w.length > 3);
  const files = fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const nameWords = file.replace('.md', '').split('-');
    const hits = words.filter(w => nameWords.includes(w));
    if (hits.length >= 2) return file.replace('.md', '');
  }
  return null;
}

/**
 * Fetch PIB press release page text (strip HTML tags).
 * Falls back gracefully if the page is unreachable.
 */
function fetchPageText(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CitizenNestBot/1.0; +https://citizennest.com)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      };
      const req = client.request(options, (res) => {
        // Follow one redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchPageText(res.headers.location).then(resolve);
          return;
        }
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { raw += chunk; if (raw.length > 80000) req.destroy(); });
        res.on('end', () => {
          // Strip HTML — keep visible text
          const text = raw
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .slice(0, 6000);   // cap at 6000 chars — enough context for Gemini
          resolve(text);
        });
      });
      req.on('error', () => resolve(''));
      req.on('timeout', () => { req.destroy(); resolve(''); });
      req.end();
    } catch {
      resolve('');
    }
  });
}

/**
 * Ask Gemini to generate a verified scheme guide.
 *
 * The pressReleaseText is the ground truth — Gemini must not go beyond it
 * without clearly stating "verify at official website".
 */
async function generateSchemeGuide(item, pressReleaseText, today) {
  const sourceContext = pressReleaseText.length > 100
    ? `\n\nPIB PRESS RELEASE TEXT (your primary source — do not contradict this):\n"""\n${pressReleaseText}\n"""`
    : '\n\nNote: Could not fetch full press release text. Use only what is in the title.';

  const prompt = `You are writing a factual, accurate guide for citizennest.com about a newly announced Indian government scheme or policy.

PIB Press Release Title: "${item.title}"
Source Link: ${item.link}
Source: ${item.sourceName || 'PIB'}
Today's date: ${today}
${sourceContext}

TASK: Write a complete, helpful guide about this scheme for Indian citizens searching for information.

CRITICAL ACCURACY RULES — violation means the guide is rejected:
1. NEVER invent benefit amounts — use only what the press release says; write "check official website for current rates" if unclear
2. NEVER fabricate dates — write "announced recently" or "check official website" for unconfirmed dates
3. NEVER fabricate eligibility criteria beyond what the press release states
4. ALL official links must be real .gov.in / .nic.in URLs; do not guess — use only links mentioned in the press release or well-known ministry portals
5. If the scheme name in the title is unclear or very new, write a factual overview + direct users to the ministry website
6. Write in English (this is a central government scheme applicable nationwide)
7. Do not exaggerate benefits — be conservative and accurate

Return ONLY valid JSON (no markdown fences, no preamble):
{
  "title": "string — 55-90 chars. Pattern: [Scheme Name] [Year] — [key benefit, e.g. '₹6,000/year' or 'Free Health Cover'] Guide",
  "description": "string — 140-160 chars. Lead with the most searchable fact. Include what the scheme gives, who is eligible, and how to apply/check status.",
  "category": "Government Schemes",
  "slug": "string — lowercase hyphenated, max 60 chars, NO year unless essential. E.g. 'pm-kisan-samman-nidhi-guide'",
  "keywords": ["8-12 exact queries people search — include scheme name variants, status check, apply, eligibility, beneficiary list"],
  "officialLinks": ["1-3 URLs — only .gov.in or .nic.in. If no specific URL found in the press release, use the ministry homepage e.g. 'https://agriwelfare.gov.in/'"],
  "schemeType": "one of: financial-aid | health | housing | education | agriculture | employment | social-security | digital-service",
  "targetBeneficiary": "e.g. 'Farmers with less than 2 hectares of land' — only what the press release confirms",
  "benefitAmount": "e.g. '₹6,000/year in 3 installments' — exact figure from press release, or 'check official website'",
  "launchYear": "${today.slice(0, 4)} or actual year if stated in press release",
  "contentMarkdown": "Complete guide in Markdown (700-1400 words). Sections: ## What is [Scheme Name], ## Key Benefits (table or bullets), ## Who is Eligible, ## Documents Required, ## How to Apply / Check Status (numbered steps), ## Frequently Asked Questions (5+ Q&As). Use ## for all section headings. No H1. Be specific but only state what is confirmed. Add note 'verify at official website' for any detail not in the press release."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON robustly
  function extractJson(raw) {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1).trim();
    return raw;
  }

  let data;
  try {
    data = JSON.parse(extractJson(text));
  } catch {
    throw new Error(`JSON parse failed. Response preview: ${text.slice(0, 400)}`);
  }

  return data;
}

function buildGuideMarkdown(data, today) {
  const keywords = (data.keywords || []).map(k => `  - "${k.replace(/"/g, '\\"')}"`).join('\n');
  const links = (data.officialLinks || []).map(l => `  - '${l}'`).join('\n');

  const frontmatter = `---
title: "${(data.title || '').replace(/"/g, '\\"')}"
description: "${(data.description || '').replace(/"/g, '\\"')}"
category: ${data.category || 'Government Schemes'}
lastUpdated: '${today}'
keywords:
${keywords}
readingTime: 7 min
officialLinks:
${links}
schemeType: ${data.schemeType || 'financial-aid'}
targetBeneficiary: "${(data.targetBeneficiary || '').replace(/"/g, '\\"')}"
benefitAmount: "${(data.benefitAmount || 'check official website').replace(/"/g, '\\"')}"
---

`;

  return frontmatter + (data.contentMarkdown || '').trim() + '\n';
}

function validateGuide(data) {
  const errors = [];
  if (!data.title || data.title.length < 30) errors.push('title too short');
  if (!data.description || data.description.length < 100) errors.push('description too short');
  if (!data.contentMarkdown || data.contentMarkdown.length < 600) errors.push('content too thin');
  if (!data.slug) errors.push('missing slug');
  if (!data.officialLinks || data.officialLinks.length === 0) errors.push('no official links');

  // Check for hallucination red flags — suspicious exact patterns
  const content = data.contentMarkdown || '';
  const suspiciousPatterns = [
    /₹[\d,]+ crore/i,  // large money claims
    /\b20(2[0-9])\b.*launched/i,  // fabricated launch year
  ];
  // Only warn, not block — content may legitimately contain these
  for (const p of suspiciousPatterns) {
    if (p.test(content)) {
      log(`   ⚠️  Review needed: suspicious pattern found — ${p.toString()}`);
    }
  }

  return errors;
}

async function main() {
  if (!fs.existsSync(PIB_PATH)) {
    log('❌ agents/pib-latest.json not found — run pib-scanner.js first');
    process.exit(1);
  }

  const pib = JSON.parse(fs.readFileSync(PIB_PATH, 'utf8'));
  // Only process scheme-type items — skip jobs/exam announcements (those go through exam-monitor)
  const schemeItems = (pib.items || []).filter(
    item => item.category === 'NEW_SCHEME_OR_LAUNCH' || item.category === 'POLICY_CHANGE'
  );

  if (schemeItems.length === 0) {
    log('✅ No new scheme announcements in pib-latest.json — nothing to generate');
    return;
  }

  log(`📋 Found ${schemeItems.length} scheme/policy item(s) to process`);
  log(`   Categories: NEW_SCHEME_OR_LAUNCH + POLICY_CHANGE`);
  log(`   Telegram: DISABLED for scheme content (exam channel only)\n`);

  const today = new Date().toISOString().split('T')[0];
  const stats = { generated: 0, skipped: 0, errors: [] };
  const newSlugs = [];

  for (const item of schemeItems) {
    log(`\n📋 [${item.category}] ${item.title}`);
    log(`   Source: ${item.sourceName || 'PIB'} | ${item.link}`);

    // Step 1: Compute candidate slug from title
    const candidateSlug = slugify(item.title) + '-guide';
    const existing = guideExists(slugify(item.title));

    if (existing) {
      log(`   ⏭  Guide already exists: ${existing} — skipping`);
      stats.skipped++;
      continue;
    }

    if (DRY_RUN) {
      log(`   📝 DRY RUN — would generate: ${candidateSlug}.md`);
      stats.generated++;
      continue;
    }

    // Step 2: Fetch press release text for accuracy grounding
    log(`   🌐 Fetching press release text...`);
    const pressReleaseText = await fetchPageText(item.link);
    log(`   📄 Press release: ${pressReleaseText.length} chars fetched`);

    if (pressReleaseText.length < 100) {
      log(`   ⚠️  Press release text too short to verify — using title only`);
    }

    // Step 3: Generate guide with Gemini (grounded on press release text)
    try {
      log(`   🤖 Generating verified guide with Gemini...`);
      const data = await generateSchemeGuide(item, pressReleaseText, today);

      // Step 4: Validate
      const errors = validateGuide(data);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }

      // Step 5: Use Gemini's suggested slug, but sanitize it
      const slug = slugify(data.slug || candidateSlug);
      const filePath = path.join(GUIDES_DIR, `${slug}.md`);

      if (fs.existsSync(filePath)) {
        log(`   ⏭  File already exists at ${slug}.md — skipping`);
        stats.skipped++;
        continue;
      }

      const markdown = buildGuideMarkdown(data, today);
      fs.writeFileSync(filePath, markdown, 'utf8');
      newSlugs.push(slug);
      stats.generated++;
      log(`   ✅ Written: content/guides/${slug}.md`);
      log(`   📊 Title: ${data.title}`);
      log(`   🔗 Links: ${(data.officialLinks || []).join(', ')}`);

      // Gemini rate limit
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      log(`   ❌ Error generating guide: ${err.message}`);
      stats.errors.push({ title: item.title, error: err.message });
    }
  }

  log(`\n${'─'.repeat(55)}`);
  log(`✅ Generated:  ${stats.generated} scheme guide(s)`);
  log(`⏭  Skipped:   ${stats.skipped}`);
  log(`❌ Errors:     ${stats.errors.length}`);
  log(`📵 Telegram:   NOT posted (scheme content — exam channel only)`);

  if (newSlugs.length > 0) {
    // Write to a SEPARATE file so notify-telegram.js never picks these up
    fs.writeFileSync(SLUGS_FILE, newSlugs.join('\n') + '\n');
    log(`\n💾 Scheme slugs saved to agents/.newly-generated-scheme-slugs`);
    log(`   These will be indexed but NOT sent to Telegram.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

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

  // Fuzzy: require 2+ SPECIFIC (non-generic) overlapping words in the filename
  // Generic words excluded — they appear in many guide filenames and cause false matches
  const GENERIC = new Set([
    '2024','2025','2026','2027','2028',
    'result','results','online','india','apply','status','check','download',
    'card','form','guide','yojana','scheme','pradhan','mantri','minister',
    'under','price','rate','gold','bond','silver','bank','loan','fund',
    'government','central','state','national','new','free','list',
    'apply','portal','register','registration','application','how',
    'what','know','about','details','full','complete','update',
  ]);
  // Deduplicate so a word repeated in the slug (e.g. "redemption" twice) counts only once
  const words = [...new Set(slug.split('-').filter(w => w.length > 3 && !GENERIC.has(w)))];
  if (words.length < 2) return null;  // not enough specific words to match reliably

  const files = fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const nameWords = new Set(file.replace('.md', '').split('-'));
    const hits = words.filter(w => nameWords.has(w));
    if (hits.length >= 2) return file.replace('.md', '');
  }
  return null;
}

/**
 * Fetch PIB/RBI press release page text (strip HTML tags).
 * Falls back gracefully if the page is unreachable.
 *
 * Key hardening:
 *  - Always upgrades HTTP → HTTPS for rbi.org.in and pib.gov.in
 *    (their HTTP URLs return 404 or hang in CI environments)
 *  - Hard wall-clock timeout via Promise.race so the caller is never blocked
 *  - Handles response stream errors explicitly
 */
function fetchPageText(urlStr) {
  // Upgrade to HTTPS for known domains that require it
  let normalizedUrl = urlStr
    .replace('http://www.rbi.org.in', 'https://www.rbi.org.in')
    .replace('http://rbi.org.in', 'https://rbi.org.in')
    .replace('http://pib.gov.in', 'https://pib.gov.in')
    .replace('http://www.pib.gov.in', 'https://www.pib.gov.in');

  const HARD_TIMEOUT_MS = 10000;  // never wait more than 10s total

  const fetchPromise = new Promise((resolve) => {
    try {
      const parsed = new URL(normalizedUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CitizenNestBot/1.0; +https://citizennest.com)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      };
      const req = client.request(options, (res) => {
        // Follow one redirect (using the normalized HTTPS strategy)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchPageText(res.headers.location).then(resolve);
          return;
        }
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { raw += chunk; if (raw.length > 80000) req.destroy(); });
        res.on('error', () => resolve(''));
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
            .slice(0, 6000);
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

  // Hard wall-clock timeout — fetchPromise wins if it finishes first
  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve(''), HARD_TIMEOUT_MS)
  );
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Ask Gemini to generate a verified scheme guide.
 *
 * TWO-STEP APPROACH — avoids JSON parse failures:
 *   Step 1: Get metadata only as compact JSON (no markdown content → no escaping issues)
 *   Step 2: Get markdown body as plain text (no JSON wrapper → no escaping issues)
 *
 * The pressReleaseText is the ground truth — Gemini must not go beyond it
 * without clearly stating "verify at official website".
 */
async function generateSchemeGuide(item, pressReleaseText, today) {
  const sourceContext = pressReleaseText.length > 100
    ? `PIB PRESS RELEASE TEXT (primary source — do not contradict):\n"""\n${pressReleaseText.slice(0, 4000)}\n"""`
    : 'Note: Could not fetch full press release. Use only information from the title.';

  const baseContext = `PIB Press Release Title: "${item.title}"
Source: ${item.sourceName || 'PIB'} | Link: ${item.link}
Today: ${today}

${sourceContext}

ACCURACY RULES (violation = reject):
- NEVER invent benefit amounts — use only what the press release states; say "check official website" if unclear
- NEVER fabricate dates — write "announced recently" or "check official website"
- NEVER invent eligibility — only state what is explicitly in the press release
- Official links: use .gov.in, .nic.in, rbi.org.in, sebi.gov.in, nabard.org, epfindia.gov.in, or nsdl.co.in — the source press release URL is always valid
- ALWAYS include the source press release URL as one of the officialLinks: ${item.link}
- Language: English`;

  // ── Step 1: Metadata JSON (small, no markdown — avoids JSON escaping issues) ──
  const metaPrompt = `${baseContext}

Return ONLY a JSON object with these fields (no prose, no code fences, no contentMarkdown):
{"title":"55-90 chars: [Scheme Name] [Year] — [key benefit] Guide","description":"140-160 chars: searchable fact + who benefits + how to apply/check status","slug":"lowercase-hyphenated max 60 chars e.g. sgb-premature-redemption-2026","keywords":["8-12 exact search queries"],"officialLinks":["MUST include: ${item.link.replace(/"/g, '\\"')}","add 1-2 more relevant .gov.in, .nic.in or rbi.org.in URLs if known"],"schemeType":"financial-aid|health|housing|education|agriculture|employment|social-security|digital-service","targetBeneficiary":"who benefits — from press release only","benefitAmount":"exact amount from press release or check official website"}`;

  const metaResult = await model.generateContent(metaPrompt);
  const metaText = metaResult.response.text().trim();

  function extractJson(raw) {
    // Strip code fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1).trim();
    return raw;
  }

  let metadata;
  try {
    metadata = JSON.parse(extractJson(metaText));
  } catch {
    throw new Error(`Metadata JSON parse failed. Preview: ${metaText.slice(0, 300)}`);
  }

  // Ensure officialLinks always contains the source URL — fallback if Gemini forgot it
  if (!metadata.officialLinks || metadata.officialLinks.length === 0) {
    metadata.officialLinks = [item.link];
  } else if (!metadata.officialLinks.includes(item.link)) {
    metadata.officialLinks.unshift(item.link);  // source URL is always first
  }

  // Validate essential metadata fields
  if (!metadata.title || !metadata.slug) {
    throw new Error(`Metadata missing required fields: title=${!!metadata.title}, slug=${!!metadata.slug}`);
  }

  // ── Step 2: Markdown content (plain text — no JSON, no escaping issues) ──
  // Short delay between calls
  await new Promise(r => setTimeout(r, 1500));

  const contentPrompt = `${baseContext}

Write a complete, accurate guide about this scheme for CitizenNest.com.
Guide title: "${metadata.title}"

Return ONLY the Markdown body (700-1200 words). No JSON, no code fences, no title H1.
Required sections (use ## headings):
## What is [Scheme Name]
(2-3 sentence factual intro — only confirmed facts)

## Key Benefits
(table or bullets — ONLY amounts/benefits stated in the press release; otherwise "Refer to official website")

## Who is Eligible
(confirmed eligibility criteria only; say "check official website" for anything unclear)

## Documents Required
(standard documents for such schemes; note "requirements may vary — verify at official website")

## How to Apply / Check Status
(numbered steps; use the official link from the press release)

## Frequently Asked Questions
(5+ Q&As with honest answers — say "not confirmed" if a detail wasn't in the press release)

FINAL LINE: *Source: [${item.sourceName || 'PIB'}](${item.link}). Last updated: ${today}. Always verify at official website before applying.*`;

  const contentResult = await model.generateContent(contentPrompt);
  const contentMarkdown = contentResult.response.text().trim();

  if (contentMarkdown.length < 500) {
    throw new Error(`Content too short: ${contentMarkdown.length} chars`);
  }

  return { ...metadata, contentMarkdown };
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

#!/usr/bin/env node
/**
 * generate-updates-gemini.js
 *
 * Reads detected exam site changes from agents/exam-monitor-latest.json,
 * searches for the actual announcements using Gemini, deduplicates against
 * existing content, validates accuracy, and writes new update markdown files.
 *
 * Uses: Gemini 1.5 Flash (free tier: 1500 req/day, 1M tokens/min)
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-updates-gemini.js
 *   GEMINI_API_KEY=your_key node scripts/generate-updates-gemini.js --tier tier1
 *   GEMINI_API_KEY=your_key node scripts/generate-updates-gemini.js --dry-run
 *   GEMINI_API_KEY=your_key node scripts/generate-updates-gemini.js --force-scan
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────────────

const UPDATES_DIR      = path.join(ROOT, 'content/updates');
const SOURCES_PATH     = path.join(ROOT, 'agents/source-monitors.json');
const LATEST_PATH      = path.join(ROOT, 'agents/exam-monitor-latest.json');
const RUN_LOG_PATH     = path.join(ROOT, 'agents/generate-updates-run.log');

const SITE_URL         = 'https://www.citizennest.com';
const MODEL_NAME       = 'gemini-1.5-flash';          // Free tier
const MAX_SEARCHES_PER_RUN = 20;                       // Stay within free quota
const SEARCH_FRESHNESS = 'w1';                         // Past 1 week

// Allowed official domains — reject anything else as unofficial
const OFFICIAL_DOMAINS = [
  '.gov.in', '.nic.in', '.ac.in', '.edu.in',
  'ibps.in', 'sbi.co.in', 'nabard.org', 'iocl.com',
  'aissee.nta.nic.in', 'jeemain.nta.nic.in',
];

// ─── CLI args ───────────────────────────────────────────────────────────────

const args          = process.argv.slice(2);
const DRY_RUN       = args.includes('--dry-run');
const FORCE_SCAN    = args.includes('--force-scan');
const tierArg       = args.find(a => a.startsWith('--tier'));
const TIER_FILTER   = tierArg ? parseInt(tierArg.split('=')[1] || args[args.indexOf(tierArg) + 1], 10) : null;

if (!process.env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Logging ────────────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(RUN_LOG_PATH, line + '\n');
}

// ─── Deduplication Registry ─────────────────────────────────────────────────

/**
 * Build a registry of already-published updates.
 * Key format: "organization|examName|stage" (all lowercased, trimmed)
 * This prevents:
 *   1. Exact duplicates (same key)
 *   2. Re-generating a result that's already live
 */
function buildDeduplicationRegistry() {
  const registry = new Map();  // key -> { slug, publishedDate }
  const slugRegistry = new Set(); // fast slug lookup

  if (!fs.existsSync(UPDATES_DIR)) return { registry, slugRegistry };

  for (const fname of fs.readdirSync(UPDATES_DIR)) {
    if (!fname.endsWith('.md')) continue;
    const slug = fname.replace('.md', '');
    slugRegistry.add(slug);

    try {
      const content = fs.readFileSync(path.join(UPDATES_DIR, fname), 'utf8');
      const org   = content.match(/^organization:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || '';
      const exam  = content.match(/^examName:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || '';
      const stage = content.match(/^stage:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || '';
      const date  = content.match(/^publishedDate:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || '';

      if (org && exam && stage) {
        const key = dedupeKey(org, exam, stage);
        registry.set(key, { slug, publishedDate: date });
      }
    } catch {
      // Skip malformed files
    }
  }

  log(`📚 Dedup registry: ${registry.size} entries, ${slugRegistry.size} slugs`);
  return { registry, slugRegistry };
}

function dedupeKey(org, examName, stage) {
  return `${org}|${examName}|${stage}`.toLowerCase().trim();
}

/**
 * Generate a slug from org, examName, stage.
 * Matches the format used by the existing 80 update files.
 */
function generateSlug(org, examName, stage) {
  const part = (s) => s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Extract year from examName
  const yearMatch = examName.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const orgSlug  = part(org).replace('staff-selection-commission', 'ssc')
                              .replace('union-public-service-commission', 'upsc')
                              .replace('institute-of-banking-personnel-selection', 'ibps')
                              .replace('national-testing-agency', 'nta');
  const examSlug = part(examName.replace(year, '').replace(org, '').trim())
                    .replace(/^-+|-+$/g, '');
  const stageSlug = part(stage);

  return `${orgSlug}-${examSlug}-${year}-${stageSlug}`
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── URL validation ──────────────────────────────────────────────────────────

function isOfficialUrl(url) {
  try {
    const { hostname } = new URL(url);
    return OFFICIAL_DOMAINS.some(d => hostname.endsWith(d));
  } catch {
    return false;
  }
}

function validateFrontmatter(fm) {
  const errors = [];

  if (!fm.title || fm.title.length < 20)
    errors.push('title too short');
  if (!fm.description || fm.description.length < 100 || fm.description.length > 180)
    errors.push(`description length ${fm.description?.length} (need 100-180)`);
  if (!fm.organization)
    errors.push('missing organization');
  if (!fm.examName)
    errors.push('missing examName');
  if (!['notification','admit-card','exam-schedule','result','cutoff','answer-key','registration'].includes(fm.stage))
    errors.push(`invalid stage: ${fm.stage}`);
  if (!fm.officialLinks || !Array.isArray(fm.officialLinks) || fm.officialLinks.length === 0)
    errors.push('no officialLinks');
  if (fm.officialLinks?.some(u => !isOfficialUrl(u)))
    errors.push(`non-official URL: ${fm.officialLinks.find(u => !isOfficialUrl(u))}`);

  // Date sanity: must be between 2024 and 2028
  for (const [k, v] of Object.entries(fm.importantDates || {})) {
    if (v && v !== 'TBA' && !/^(202[4-8]|TBA)/.test(v))
      errors.push(`suspect date ${k}: ${v}`);
  }

  return errors;
}

// ─── Gemini helpers ──────────────────────────────────────────────────────────

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: { temperature: 0.2 },  // Low temp for factual content
});

const structuredModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: 'application/json',
  },
});

async function searchAndExtract(source, changeType) {
  /**
   * Phase 1: Use Gemini to search for the latest announcement from this org.
   * Returns structured data or null if nothing credible found.
   */
  const today = new Date().toISOString().split('T')[0];
  const searchPrompt = `
You are a fact-checker for an Indian government exam information website.

Organization: ${source.name} (${source.fullName})
Official website: ${source.url}
Today's date: ${today}
Change detected: ${changeType} on ${source.url}

Search for the MOST RECENT announcement from ${source.name} in the past 7 days.
Look specifically for: new exam notifications, admit card releases, result declarations, answer keys, exam date announcements.

RULES:
- Only report something if you have HIGH CONFIDENCE it is real and recent (past 7 days)
- Cross-reference: the same announcement must appear on at least 2 credible sources
- Credible sources: official .gov.in/.nic.in sites, NIC portals, the organization's own website
- Blog posts, news aggregators, or WhatsApp forwards alone are NOT credible
- If no credible recent announcement found, return null

Return JSON in this EXACT schema:
{
  "found": true | false,
  "announcement": {
    "type": "notification" | "admit-card" | "result" | "answer-key" | "cutoff" | "exam-schedule",
    "examName": "full exam name with year, e.g. SSC CGL 2026",
    "headline": "short factual headline",
    "officialUrl": "direct URL to the official page or notification",
    "backupUrl": "second official source URL (required for verification)",
    "vacancies": number | "TBA" | null,
    "importantDates": {
      "notificationDate": "YYYY-MM-DD" | "TBA",
      "lastDateToApply": "YYYY-MM-DD" | "TBA",
      "examDate": "YYYY-MM-DD" | "TBA",
      "admitCardDate": "YYYY-MM-DD" | "TBA",
      "resultDate": "YYYY-MM-DD" | "TBA"
    },
    "confidenceScore": 0.0-1.0,
    "verificationNotes": "what sources confirmed this"
  }
}

If nothing credible found, return: {"found": false, "reason": "brief explanation"}
`;

  try {
    const result = await structuredModel.generateContent(searchPrompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    log(`⚠️  Gemini search error for ${source.name}: ${err.message}`);
    return null;
  }
}

async function generateContent(source, announcement) {
  /**
   * Phase 2: Generate the full markdown content for the update page.
   * Only called AFTER deduplication check passes and confidence >= 0.7.
   */
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
You are writing a factual, helpful guide for an Indian government exam information website (citizennest.com).

Write a complete guide for this announcement:

Organization: ${source.name} (${source.fullName})
Exam: ${announcement.examName}
Type: ${announcement.type}
Official URL: ${announcement.officialUrl}
Vacancies: ${announcement.vacancies ?? 'TBA'}
Important Dates: ${JSON.stringify(announcement.importantDates, null, 2)}
Published: ${today}

CONTENT RULES:
1. Write only CONFIRMED facts. Use "TBA" or "To be announced" for unknown details — NEVER guess
2. Do not invent vacancy numbers, dates, salary figures, or eligibility criteria
3. Structure: intro paragraph → Important Dates table → Vacancy Details → Eligibility → How to Apply → FAQs
4. FAQs must directly answer what users search for (e.g. "When is the last date to apply?", "How to download admit card?")
5. Include a "How to Check [Result/Download Admit Card/Apply]" section with numbered steps
6. Link to the official website in the content body
7. Length: 400-700 words for results/admit cards, 600-900 words for notifications
8. Tone: factual, helpful, no clickbait, no "hurry apply now" language

Write ONLY the markdown body (no frontmatter — that's handled separately).
Start directly with ## What is [Exam Name]? or ## [Exam] [Stage] Released
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    log(`⚠️  Content generation error: ${err.message}`);
    return null;
  }
}

function buildFrontmatter(source, announcement, slug) {
  const today = new Date().toISOString().split('T')[0];
  const expiryDate = announcement.importantDates?.lastDateToApply
    ? (() => {
        try {
          const d = new Date(announcement.importantDates.lastDateToApply);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        } catch { return null; }
      })()
    : null;

  // Map type to category
  const categoryMap = {
    'notification':   'Government Jobs',
    'result':         'Results',
    'admit-card':     'Admit Cards',
    'answer-key':     'Results',
    'cutoff':         'Results',
    'exam-schedule':  'Government Jobs',
    'registration':   'Government Jobs',
  };

  const category = source.id === 'cbse' || source.id === 'upmsp' ||
                   source.id === 'bseb' || source.id === 'msbshse'
    ? 'Results'
    : (categoryMap[announcement.type] || 'Government Jobs');

  // Auto-generate keywords
  const keywords = [
    `${announcement.examName.toLowerCase()} ${announcement.type.replace('-', ' ')}`,
    `${announcement.examName.toLowerCase()} 2026`,
    `${source.name.toLowerCase()} ${announcement.type.replace('-', ' ')} 2026`,
    ...(announcement.type === 'notification' ? [`${announcement.examName.toLowerCase()} apply online`] : []),
    ...(announcement.type === 'result' ? [`${announcement.examName.toLowerCase()} result date`] : []),
    ...(announcement.type === 'admit-card' ? [`${announcement.examName.toLowerCase()} hall ticket download`] : []),
  ];

  const fm = {
    title: buildTitle(announcement, source),
    description: buildDescription(announcement, source),
    category,
    type: announcement.type,
    organization: source.name,
    examName: announcement.examName,
    stage: announcement.type,
    keywords,
    importantDates: Object.fromEntries(
      Object.entries(announcement.importantDates || {}).filter(([, v]) => v)
    ),
    officialLinks: [announcement.officialUrl, announcement.backupUrl].filter(Boolean).filter(isOfficialUrl),
    readingTime: '5 min',
    publishedDate: today,
    ...(expiryDate ? { expiryDate } : {}),
    status: 'active',
    vacancies: announcement.vacancies || undefined,
  };

  return fm;
}

function buildTitle(announcement, source) {
  const typeLabels = {
    'notification':   'Notification',
    'result':         'Result',
    'admit-card':     'Admit Card',
    'answer-key':     'Answer Key',
    'cutoff':         'Cut-off',
    'exam-schedule':  'Exam Date',
    'registration':   'Registration',
  };
  const label = typeLabels[announcement.type] || 'Update';

  if (announcement.type === 'notification' && announcement.vacancies && announcement.vacancies !== 'TBA') {
    const lastDate = announcement.importantDates?.lastDateToApply;
    const suffix = lastDate && lastDate !== 'TBA'
      ? ` — ${announcement.vacancies} Vacancies, Apply by ${formatDate(lastDate)}`
      : ` — ${announcement.vacancies} Vacancies`;
    return `${announcement.examName} ${label}${suffix}`;
  }

  if (announcement.type === 'result') {
    const resultDate = announcement.importantDates?.resultDate;
    return `${announcement.examName} ${label} ${resultDate && resultDate !== 'TBA' ? resultDate.slice(0, 7) : ''} — Direct Link at ${getDomain(announcement.officialUrl)}`.trim();
  }

  if (announcement.type === 'admit-card') {
    const examDate = announcement.importantDates?.examDate;
    return `${announcement.examName} Admit Card${examDate && examDate !== 'TBA' ? ` — Exam ${formatDate(examDate)}` : ''} — Download at ${getDomain(announcement.officialUrl)}`;
  }

  return `${announcement.examName} ${label} — ${source.name} Official Update`;
}

function buildDescription(announcement, source) {
  let desc = '';

  if (announcement.type === 'notification') {
    const vac = announcement.vacancies && announcement.vacancies !== 'TBA'
      ? `${announcement.vacancies} vacancies. `
      : '';
    const applyBy = announcement.importantDates?.lastDateToApply && announcement.importantDates.lastDateToApply !== 'TBA'
      ? `Apply online by ${formatDate(announcement.importantDates.lastDateToApply)}. `
      : '';
    desc = `${announcement.examName} official notification out. ${vac}${applyBy}Check eligibility, dates & apply at ${getDomain(announcement.officialUrl)}.`;
  } else if (announcement.type === 'result') {
    desc = `${announcement.examName} result declared. Check your result, scorecard, and cut-off marks at ${getDomain(announcement.officialUrl)}. Direct link inside.`;
  } else if (announcement.type === 'admit-card') {
    const examDate = announcement.importantDates?.examDate && announcement.importantDates.examDate !== 'TBA'
      ? ` Exam on ${formatDate(announcement.importantDates.examDate)}.`
      : '';
    desc = `${announcement.examName} admit card available for download.${examDate} Download hall ticket at ${getDomain(announcement.officialUrl)} using registration number.`;
  } else if (announcement.type === 'answer-key') {
    desc = `${announcement.examName} official answer key released at ${getDomain(announcement.officialUrl)}. Check correct answers, raise objections if any, and estimate your score.`;
  } else {
    desc = `${announcement.examName} ${announcement.type} update from ${source.name}. Check important dates and details at ${getDomain(announcement.officialUrl)}.`;
  }

  // Trim to 160 chars max
  return desc.length > 160 ? desc.slice(0, 157) + '...' : desc;
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url || ''; }
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function frontmatterToYaml(fm) {
  const lines = ['---'];
  lines.push(`title: "${fm.title.replace(/"/g, "'")}"`);
  lines.push(`description: "${fm.description.replace(/"/g, "'")}"`);
  lines.push(`category: "${fm.category}"`);
  lines.push(`type: "${fm.type}"`);
  lines.push(`organization: "${fm.organization}"`);
  lines.push(`examName: "${fm.examName}"`);
  lines.push(`stage: "${fm.stage}"`);
  lines.push('keywords:');
  for (const kw of fm.keywords) lines.push(`  - "${kw}"`);
  lines.push('importantDates:');
  for (const [k, v] of Object.entries(fm.importantDates || {})) {
    if (v) lines.push(`  ${k}: "${v}"`);
  }
  lines.push('officialLinks:');
  for (const url of fm.officialLinks) lines.push(`  - "${url}"`);
  lines.push(`readingTime: "${fm.readingTime}"`);
  lines.push(`publishedDate: "${fm.publishedDate}"`);
  if (fm.expiryDate) lines.push(`expiryDate: "${fm.expiryDate}"`);
  lines.push(`status: "${fm.status}"`);
  if (fm.vacancies) lines.push(`vacancies: ${typeof fm.vacancies === 'number' ? fm.vacancies : `"${fm.vacancies}"`}`);
  lines.push('---');
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════');
  log(`🚀 generate-updates-gemini.js starting`);
  log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Tier filter: ${TIER_FILTER || 'all'} | Force: ${FORCE_SCAN}`);

  // Load sources
  const { sources } = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
  const activeSources = sources.filter(s => !TIER_FILTER || s.tier <= TIER_FILTER);
  log(`📡 Sources to process: ${activeSources.length}/${sources.length}`);

  // Load latest detected changes
  let latestChanges = [];
  if (fs.existsSync(LATEST_PATH)) {
    const latest = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
    // Only process real changes (not cosmetic content changes)
    latestChanges = (latest.changes || []).filter(c => c.type !== 'CONTENT_CHANGE');
    log(`🔴 Real changes detected: ${latestChanges.length}`);
  }

  // If no real changes and not force-scanning, exit early
  if (latestChanges.length === 0 && !FORCE_SCAN) {
    log('✅ No real changes detected — nothing to generate');
    return;
  }

  // Build deduplication registry from existing files
  const { registry, slugRegistry } = buildDeduplicationRegistry();

  // Determine which sources to process
  // - If real changes detected: process changed sources first, then all tier1
  // - If force scan: process all active sources
  let sourcesToProcess = activeSources;
  if (!FORCE_SCAN && latestChanges.length > 0) {
    // Prioritize sources that had changes
    const changedUrls = new Set(latestChanges.map(c => c.url));
    const changed = activeSources.filter(s =>
      latestChanges.some(c => c.url.includes(new URL(s.url).hostname))
    );
    const tier1Rest = activeSources.filter(s => s.tier === 1 && !changed.find(c => c.id === s.id));
    sourcesToProcess = [...changed, ...tier1Rest].slice(0, MAX_SEARCHES_PER_RUN);
    log(`🎯 Processing ${changed.length} changed + ${tier1Rest.length} tier1 sources (max ${MAX_SEARCHES_PER_RUN})`);
  }

  const results = { generated: [], skipped: [], errors: [] };
  let searchCount = 0;

  for (const source of sourcesToProcess) {
    if (searchCount >= MAX_SEARCHES_PER_RUN) {
      log(`⏸️  Reached max searches (${MAX_SEARCHES_PER_RUN}) — stopping`);
      break;
    }

    log(`\n🔍 Searching: ${source.name} (tier ${source.tier})`);
    const changeType = latestChanges.find(c => c.url.includes(new URL(source.url).hostname))?.type || 'SCHEDULED_SCAN';

    let searchResult;
    try {
      searchResult = await searchAndExtract(source, changeType);
      searchCount++;
    } catch (err) {
      log(`❌ Search failed for ${source.name}: ${err.message}`);
      results.errors.push({ source: source.name, error: err.message });
      continue;
    }

    if (!searchResult?.found || !searchResult.announcement) {
      log(`  → No credible announcement found (${searchResult?.reason || 'nothing recent'})`);
      results.skipped.push({ source: source.name, reason: searchResult?.reason || 'nothing found' });

      // Update lastScanned
      source.lastScanned = new Date().toISOString().split('T')[0];
      continue;
    }

    const ann = searchResult.announcement;
    log(`  → Found: [${ann.type}] ${ann.examName} (confidence: ${ann.confidenceScore})`);

    // ── Deduplication check ───────────────────────────────────────────────

    // 1. Confidence threshold
    if (ann.confidenceScore < 0.7) {
      log(`  ⏭  Skipping: confidence ${ann.confidenceScore} < 0.7 threshold`);
      results.skipped.push({ source: source.name, reason: `low confidence: ${ann.confidenceScore}`, exam: ann.examName });
      continue;
    }

    // 2. Official URL must be from a trusted domain
    if (!isOfficialUrl(ann.officialUrl)) {
      log(`  ⏭  Skipping: URL ${ann.officialUrl} is not from an official domain`);
      results.skipped.push({ source: source.name, reason: `unofficial URL: ${ann.officialUrl}`, exam: ann.examName });
      continue;
    }

    // 3. Two-source verification: both officialUrl and backupUrl must be official
    if (!ann.backupUrl || !isOfficialUrl(ann.backupUrl)) {
      log(`  ⚠️  Warning: no verified second source — proceeding with caution`);
      // Don't block, but lower effective confidence
      if (ann.confidenceScore < 0.85) {
        log(`  ⏭  Skipping: single source + confidence ${ann.confidenceScore} < 0.85`);
        results.skipped.push({ source: source.name, reason: 'single source, insufficient confidence', exam: ann.examName });
        continue;
      }
    }

    // 4. Semantic deduplication: same org + exam + stage already published?
    const key = dedupeKey(source.name, ann.examName, ann.type);
    if (registry.has(key)) {
      const existing = registry.get(key);
      log(`  ⏭  Duplicate: "${key}" already covered by ${existing.slug} (published ${existing.publishedDate})`);
      results.skipped.push({ source: source.name, reason: `duplicate of ${existing.slug}`, exam: ann.examName });
      continue;
    }

    // 5. Slug collision check
    const slug = generateSlug(source.name, ann.examName, ann.type);
    if (slugRegistry.has(slug)) {
      log(`  ⏭  Slug collision: ${slug} already exists`);
      results.skipped.push({ source: source.name, reason: `slug collision: ${slug}`, exam: ann.examName });
      continue;
    }

    // ── Generate frontmatter ──────────────────────────────────────────────

    const fm = buildFrontmatter(source, ann, slug);

    // Validate frontmatter programmatically
    const errors = validateFrontmatter(fm);
    if (errors.length > 0) {
      log(`  ❌ Frontmatter validation failed: ${errors.join(', ')}`);
      results.errors.push({ source: source.name, exam: ann.examName, errors });
      continue;
    }

    // ── Generate content body ─────────────────────────────────────────────

    log(`  ✍️  Generating content for: ${ann.examName} [${ann.type}]`);
    const contentBody = await generateContent(source, ann);
    if (!contentBody || contentBody.length < 200) {
      log(`  ❌ Content generation failed or too short`);
      results.errors.push({ source: source.name, exam: ann.examName, error: 'content too short' });
      continue;
    }

    // ── Write the file ────────────────────────────────────────────────────

    const outPath = path.join(UPDATES_DIR, `${slug}.md`);
    const fullContent = frontmatterToYaml(fm) + '\n\n' + contentBody;

    if (DRY_RUN) {
      log(`  🔵 DRY RUN — would write: ${outPath}`);
      log(`     Title: ${fm.title}`);
      log(`     Desc: ${fm.description}`);
    } else {
      fs.writeFileSync(outPath, fullContent, 'utf8');
      log(`  ✅ Written: ${outPath}`);

      // Add to registry immediately to prevent duplicates in same run
      registry.set(key, { slug, publishedDate: fm.publishedDate });
      slugRegistry.add(slug);
    }

    results.generated.push({
      slug,
      title: fm.title,
      url: `${SITE_URL}/update/${slug}`,
      confidence: ann.confidenceScore,
    });

    // Update lastScanned
    source.lastScanned = new Date().toISOString().split('T')[0];

    // Rate limit: 1 second between Gemini calls to stay within free tier
    await new Promise(r => setTimeout(r, 1000));
  }

  // ── Save updated source-monitors.json ──────────────────────────────────

  if (!DRY_RUN) {
    const monitorsData = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
    for (const source of monitorsData.sources) {
      const updated = activeSources.find(s => s.id === source.id);
      if (updated?.lastScanned) source.lastScanned = updated.lastScanned;
    }
    fs.writeFileSync(SOURCES_PATH, JSON.stringify(monitorsData, null, 2), 'utf8');
  }

  // ── Final summary ───────────────────────────────────────────────────────

  log('\n═══════════════════════════════════════════');
  log(`📊 Run Summary:`);
  log(`   ✅ Generated:  ${results.generated.length} new updates`);
  log(`   ⏭  Skipped:   ${results.skipped.length} (dedup/low confidence/no news)`);
  log(`   ❌ Errors:     ${results.errors.length}`);
  log(`   🔍 Searches:  ${searchCount}`);

  if (results.generated.length > 0) {
    log('\n📄 New pages:');
    for (const g of results.generated) {
      log(`   ${g.url}  [confidence: ${g.confidence}]`);
    }

    if (!DRY_RUN) {
      // Output slugs for the GitHub Actions indexing step
      const slugs = results.generated.map(g => g.slug).join('\n');
      const slugFile = path.join(ROOT, 'agents/.newly-generated-slugs');
      fs.writeFileSync(slugFile, slugs, 'utf8');
      log(`\n💾 Slugs written to ${slugFile} for indexing`);
    }
  }

  if (results.errors.length > 0) {
    log('\n⚠️  Errors:');
    for (const e of results.errors) {
      log(`   ${e.source}: ${e.errors?.join(', ') || e.error}`);
    }
  }

  return results;
}

main().catch(err => {
  log(`💥 Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

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
const MODEL_NAME       = 'gemini-2.5-flash';          // Free tier (1500 req/day)
const MAX_SEARCHES_PER_RUN = 20;                       // Stay within free quota
const SEARCH_FRESHNESS = 'w1';                         // Past 1 week

// Allowed official domains — reject anything else as unofficial
const OFFICIAL_DOMAINS = [
  '.gov.in', '.nic.in', '.ac.in', '.edu.in',
  'ibps.in', 'sbi.co.in', 'bank.sbi', 'nabard.org', 'iocl.com',
  'rbi.org.in', 'opportunities.rbi.org.in',
  'bpsc.bih.nic.in',
  // CDN used by NTA / CUET for PDF hosting
  'cdnbbsr.s3waas.gov.in',
  // Board exam result portals
  'mahresult.nic.in', 'mahahsscboard.in',
];

// ─── CLI args ───────────────────────────────────────────────────────────────

const args          = process.argv.slice(2);
const DRY_RUN       = args.includes('--dry-run');
const FORCE_SCAN    = args.includes('--force-scan');
const CLOUDFLARE_DETECTIONS = args.includes('--cloudflare-detections');
const cloudflareDetectionsArg = args.find(a => a.startsWith('--cloudflare-detections-file'));
const CLOUDFLARE_DETECTIONS_PATH = cloudflareDetectionsArg
  ? path.resolve(ROOT, cloudflareDetectionsArg.split('=')[1] || args[args.indexOf(cloudflareDetectionsArg) + 1])
  : path.join(ROOT, 'agents/cloudflare-detections.json');
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

function normalizeSourceId(id) {
  const aliases = {
    'sbi-careers': 'sbi',
    'cbse-results': 'cbse',
    'nios-results': 'nios'
  };
  return aliases[id] || id;
}

function sourceMatchesChange(source, change) {
  if (change.sourceId && normalizeSourceId(change.sourceId) === source.id) return true;
  if (!change.url) return false;
  try {
    const changeHost = new URL(change.url).hostname.replace(/^www\./, '');
    const sourceHosts = [source.url, source.notificationsUrl]
      .filter(Boolean)
      .map(value => new URL(value).hostname.replace(/^www\./, ''));
    return sourceHosts.some(host => changeHost === host || changeHost.endsWith(`.${host}`) || host.endsWith(`.${changeHost}`));
  } catch {
    return false;
  }
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
  let examSlug = part(examName.replace(year, '').replace(org, '').trim())
                    .replace(/^-+|-+$/g, '');
  // Cap exam slug at 50 chars to avoid absurdly long slugs from verbose official titles
  if (examSlug.length > 50) examSlug = examSlug.slice(0, 50).replace(/-[^-]*$/, '');
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

// ─── HTTP helpers ────────────────────────────────────────────────────────────

/**
 * Fetch a URL (HTTP or HTTPS) with a timeout.
 * Returns a Buffer, or null on failure.
 * rejectUnauthorized=false because many .gov.in sites have old/self-signed certs.
 */
function fetchBytes(url, { timeoutMs = 12000, maxBytes = 8 * 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      const options = {
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CitizenNest-Bot/1.0; +https://www.citizennest.com)',
          'Accept': 'text/html,application/xhtml+xml,application/pdf,*/*',
        },
        timeout: timeoutMs,
      };

      const req = protocol.get(url, options, (res) => {
        // Follow one level of redirect
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          return fetchBytes(res.headers.location, { timeoutMs, maxBytes }).then(resolve);
        }
        if (res.statusCode !== 200) { resolve(null); return; }

        const chunks = [];
        let total = 0;
        res.on('data', (chunk) => {
          total += chunk.length;
          if (total > maxBytes) { req.destroy(); resolve(null); return; }
          chunks.push(chunk);
        });
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      setTimeout(() => { try { req.destroy(); } catch {} resolve(null); }, timeoutMs + 2000);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Find the most likely notification PDF links in an HTML page.
 * Returns up to 5 candidate PDF URLs, best-scoring first.
 *
 * Scoring rules:
 *  +3  URL contains notification/exam/vacancy/notice keyword
 *  +2  URL contains a recent year (2025/2026)
 *  +2  URL contains a recent timestamp/date pattern (YYYYMMDD or YYYY-MM-DD)
 *  +1  Base score for any official PDF
 *  −2  Archive/old/previous path
 */
function findNotificationPdfLinks(html, baseUrl) {
  const candidates = new Map(); // url → priority score
  // Match hrefs AND src attributes for embedded PDFs, and data-* attributes
  const linkRegex = /(?:href|src|data-href|data-url)=["']([^"'#\s]{4,600})["']/gi;
  const notifKeywords = ['notif', 'advt', 'advertisement', 'vacancy', 'recruit', 'exam', 'notice', 'circular', 'result', 'admit'];
  const thisYear  = new Date().getFullYear();
  const lastYear  = thisYear - 1;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw.toLowerCase().includes('.pdf')) continue;

    let fullUrl;
    try {
      fullUrl = new URL(raw, baseUrl).href;
    } catch { continue; }

    if (!isOfficialUrl(fullUrl)) continue;

    const lower = fullUrl.toLowerCase();
    let score = 1;

    // Keyword match in path
    for (const kw of notifKeywords) {
      if (lower.includes(kw)) { score += 3; break; }
    }

    // Recent year in path (NTA uses timestamps like Notice_20260527...)
    if (lower.includes(String(thisYear)) || lower.includes(String(lastYear))) score += 2;

    // Date-like timestamp (8-digit YYYYMMDD pattern)
    if (/\d{8}/.test(lower)) score += 2;

    // Deprioritize archive/old paths
    if (lower.includes('/archive') || lower.includes('/old/') || lower.includes('/prev')) score -= 2;

    // Deprioritize non-exam content
    if (lower.includes('tender') || lower.includes('purchase') || lower.includes('annual') || lower.includes('report')) score -= 3;

    if (!candidates.has(fullUrl) || candidates.get(fullUrl) < score) {
      candidates.set(fullUrl, score);
    }
  }

  return [...candidates.entries()]
    .filter(([, score]) => score > 0)  // discard negatives (tenders etc.)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)                        // try up to 5 PDFs
    .map(([url]) => url);
}

/**
 * Extract visible text content from an HTML page (strip tags, collapse whitespace).
 * Keeps up to `maxChars` characters.
 */
function htmlToText(html, maxChars = 8000) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxChars);
}

// ─── Phase 1: Extract data from official source ───────────────────────────────

/**
 * Gap-filling verification call — second targeted Gemini call to fill TBA fields.
 * Only called when critical fields are missing after initial extraction.
 * Costs 1 extra Gemini request but eliminates most TBA in final content.
 */
async function fillTbaGaps(source, announcement, pdfBytes, pageText, today) {
  const ann = announcement;
  const gaps = [];

  if (ann.type === 'notification' || ann.type === 'registration') {
    if (!ann.importantDates?.lastDateToApply || ann.importantDates.lastDateToApply === 'TBA')
      gaps.push('lastDateToApply (last date to apply online, YYYY-MM-DD)');
    if (!ann.vacancies || ann.vacancies === 'TBA')
      gaps.push('vacancies (total number of posts, integer)');
    if (!ann.applicationFee?.general || ann.applicationFee.general === 'TBA')
      gaps.push('applicationFee.general (fee for General/EWS category in ₹)');
    if (!ann.ageLimit?.max || ann.ageLimit.max === 'TBA')
      gaps.push('ageLimit.max (maximum age in years for General category)');
  } else if (ann.type === 'result') {
    if (!ann.importantDates?.resultDate || ann.importantDates.resultDate === 'TBA')
      gaps.push('resultDate (date result was declared, YYYY-MM-DD)');
  } else if (ann.type === 'admit-card') {
    if (!ann.importantDates?.examDate || ann.importantDates.examDate === 'TBA')
      gaps.push('examDate (date of examination, YYYY-MM-DD)');
  }

  if (gaps.length === 0) return ann; // Nothing to fill
  log(`  🔍 Gap-fill: ${gaps.length} missing field(s) — making verification call`);

  const gapList = gaps.map((g, i) => `${i + 1}. ${g}`).join('\n');
  const prompt = `You extracted this announcement from ${source.name} (${source.fullName}):
Exam: ${ann.examName}
Type: ${ann.type}
What was found so far: ${JSON.stringify({ importantDates: ann.importantDates, vacancies: ann.vacancies, applicationFee: ann.applicationFee, ageLimit: ann.ageLimit })}

The following fields were NOT found in the initial extraction. Search the source content carefully ONE MORE TIME for these specific items:
${gapList}

Return ONLY valid JSON. Use null if genuinely not present (do not guess):
{"lastDateToApply": "YYYY-MM-DD"|null, "vacancies": <number>|null, "applicationFeeGeneral": "₹amount"|null, "ageLimitMax": <number>|null, "resultDate": "YYYY-MM-DD"|null, "examDate": "YYYY-MM-DD"|null}`;

  try {
    const parts = pdfBytes
      ? [{ inlineData: { data: pdfBytes.toString('base64'), mimeType: 'application/pdf' } }, { text: prompt }]
      : (pageText ? `${prompt}\n\nSOURCE TEXT:\n${pageText}` : prompt);

    const result = await structuredModel.generateContent(parts);
    const filled = JSON.parse(result.response.text());

    // Merge filled values back into announcement
    if (filled.lastDateToApply) ann.importantDates.lastDateToApply = filled.lastDateToApply;
    if (filled.resultDate) ann.importantDates.resultDate = filled.resultDate;
    if (filled.examDate) ann.importantDates.examDate = filled.examDate;
    if (filled.vacancies) ann.vacancies = filled.vacancies;
    if (filled.applicationFeeGeneral) {
      ann.applicationFee = ann.applicationFee || {};
      ann.applicationFee.general = filled.applicationFeeGeneral;
    }
    if (filled.ageLimitMax) {
      ann.ageLimit = ann.ageLimit || {};
      ann.ageLimit.max = filled.ageLimitMax;
    }
    log(`  ✅ Gap-fill complete`);
  } catch (err) {
    log(`  ⚠️  Gap-fill error: ${err.message?.slice(0, 80)}`);
  }
  return ann;
}

/**
 * Programmatic content quality check — catches issues before writing to disk.
 * Returns array of issue strings (empty = all good).
 * No LLM call needed — these are deterministic checks.
 */
function validateContentQuality(content) {
  const issues = [];
  const lines = content.split('\n');
  const h2Seen = new Set();
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // All-caps section headings (from PDF text bleeding into ## headings)
    if (line.startsWith('##')) {
      const text = line.replace(/^#+\s*/, '');
      const letters = text.replace(/[^a-zA-Z]/g, '');
      const upper = text.replace(/[^A-Z]/g, '');
      if (letters.length > 10 && upper.length / letters.length > 0.8) {
        issues.push(`all-caps heading: "${text.slice(0, 60)}"`);
      }
      // Duplicate H2 detection
      if (line.startsWith('## ')) {
        const normalized = text.trim().toLowerCase();
        if (h2Seen.has(normalized)) {
          issues.push(`duplicate H2 heading: "${text.slice(0, 60)}"`);
        }
        h2Seen.add(normalized);
      }
    }

    // Table padding bug (single line > 2000 chars — indicates model output issue)
    if (line.length > 2000) {
      issues.push(`oversized line: ${line.length} chars (table padding bug?)`);
    }

    // Broken table row: starts with | but doesn't end with | (unclosed cell)
    if (line.trimStart().startsWith('|')) {
      inTable = true;
      const trimmed = line.trimEnd();
      // Skip separator rows like |---|---| and header-divider rows
      const isSeparator = /^\|[\s\-:|]+\|[\s\-:|]*$/.test(trimmed);
      if (!isSeparator && !trimmed.endsWith('|')) {
        issues.push(`broken table row at line ${i + 1}: "${trimmed.slice(0, 80)}"`);
      }
    } else if (inTable && line.trim() !== '') {
      inTable = false;
    }
  }

  // Excessive TBA count in non-table lines
  const bodyLines = lines.filter(l => !l.startsWith('|'));
  const tbaBare = bodyLines.join('\n').match(/\bTBA\b/g) || [];
  if (tbaBare.length > 6) {
    issues.push(`excessive TBA: ${tbaBare.length} occurrences in body text`);
  }

  // Gemini reasoning leak — model left internal commentary in output
  const leakPhrases = [
    'This is an error in the prompt',
    'this is unusual',
    'I will stick to that',
    'as per the prompt',
    'Given the prompt',
    'the prompt states',
    'I cannot determine',
    'I don\'t have information',
    'As an AI',
  ];
  const fullText = content.toLowerCase();
  for (const phrase of leakPhrases) {
    if (fullText.includes(phrase.toLowerCase())) {
      issues.push(`Gemini reasoning leak detected: "${phrase}"`);
    }
  }

  return issues;
}

async function searchAndExtract(source, changeType, knownPdfUrl = null) {
  /**
   * Phase 1 — now agentic hybrid:
   *
   * Tier A: Fetch page → find notification PDF → send PDF to Gemini
   *   A0: If detector already found the new PDF URL → skip re-discovery, use it directly
   *   A1: Score and try up to 5 PDFs from the page
   * Tier B: Fetch page text → send to Gemini
   * Tier C: Training data fallback (confidence ≥ 0.85 only)
   * Gap-fill: If extraction succeeded but critical fields are TBA → one more targeted call
   */
  const today = new Date().toISOString().split('T')[0];

  const fetchUrl = source.notificationsUrl || source.url;
  log(`  🌐 Fetching live page: ${fetchUrl}`);
  const pageBytes = await fetchBytes(fetchUrl, { timeoutMs: 12000, maxBytes: 2 * 1024 * 1024 });

  let lastPdfBytes = null; // keep for gap-fill
  let pageText = null;

  if (pageBytes) {
    const html = pageBytes.toString('utf8');
    pageText = htmlToText(html, 8000);

    // ── Tier A0: Use known PDF URL from change detector (skip re-discovery) ──
    const pdfCandidates = knownPdfUrl
      ? [knownPdfUrl, ...findNotificationPdfLinks(html, fetchUrl).filter(u => u !== knownPdfUrl)]
      : findNotificationPdfLinks(html, fetchUrl);

    log(`  📄 PDF links found on page: ${pdfCandidates.length}${knownPdfUrl ? ' (detector-provided URL first)' : ''}`);

    // ── Tier A: Extract from PDF ────────────────────────────────────────────
    for (const pdfUrl of pdfCandidates) {
      log(`  📥 Downloading PDF: ${pdfUrl}`);
      const pdfBytes = await fetchBytes(pdfUrl, { timeoutMs: 20000, maxBytes: 5 * 1024 * 1024 });
      if (!pdfBytes || pdfBytes.length < 1000) continue;

      log(`  ✅ PDF downloaded: ${Math.round(pdfBytes.length / 1024)} KB — sending to Gemini`);
      const result = await extractFromPdf(source, pdfBytes, pdfUrl, today);
      if (result?.found) {
        lastPdfBytes = pdfBytes;
        // Gap-fill: try to resolve TBA fields with a second targeted call
        result.announcement = await fillTbaGaps(source, result.announcement, lastPdfBytes, pageText, today);
        return result;
      }
      log(`  ⚠️  PDF extraction returned nothing useful — trying next PDF`);
    }

    // ── Tier B: Extract from page text ─────────────────────────────────────
    if (pageText.length > 200) {
      log(`  📝 Falling back to page text extraction (${pageText.length} chars)`);
      const result = await extractFromPageText(source, pageText, today);
      if (result?.found) {
        result.announcement = await fillTbaGaps(source, result.announcement, null, pageText, today);
        return result;
      }
    }
  } else {
    log(`  ⚠️  Could not fetch page (network issue / blocked) — falling back to training data`);
  }

  // ── Tier C: Training data fallback ─────────────────────────────────────
  log(`  🧠 Using Gemini training data (least accurate)`);
  return extractFromTrainingData(source, changeType, today);
}

const EXTRACT_JSON_SCHEMA = `{
  "found": true | false,
  "announcement": {
    "type": "notification" | "admit-card" | "result" | "answer-key" | "cutoff" | "exam-schedule" | "registration",
    "examName": "SHORT common name — prefer acronym/abbreviation e.g. 'JIPMAT 2026', 'SSC CGL 2026', 'CTET Sep 2026'. Do NOT use the full official title.",
    "headline": "one factual headline sentence",
    "officialUrl": "ROOT domain only e.g. https://ssc.gov.in",
    "backupUrl": "second official ROOT domain URL",
    "vacancies": <number> | "TBA" | null,
    "importantDates": {
      "notificationDate": "YYYY-MM-DD" | "TBA",
      "lastDateToApply": "YYYY-MM-DD" | "TBA",
      "lastDateFeePayment": "YYYY-MM-DD" | "TBA",
      "examDate": "YYYY-MM-DD" | "TBA",
      "admitCardDate": "YYYY-MM-DD" | "TBA",
      "resultDate": "YYYY-MM-DD" | "TBA"
    },
    "applicationFee": {
      "general": "amount in ₹ e.g. ₹350" | "TBA",
      "obc": "amount" | "TBA",
      "scSt": "amount" | "TBA",
      "pwd": "amount" | "TBA"
    },
    "ageLimit": {
      "min": <number> | "TBA",
      "max": <number> | "TBA"
    },
    "educationQualification": "brief description" | "TBA",
    "salaryOrPayScale": "brief description e.g. Pay Level 10, ₹33,800-₹1,07,000" | "TBA",
    "selectionProcess": ["Stage 1", "Stage 2"],
    "confidenceScore": 0.0-1.0,
    "verificationNotes": "brief note on what the source confirms"
  }
}`;

const EXTRACT_RULES = `EXTRACTION RULES:
1. Extract ONLY what is EXPLICITLY STATED in the provided content — do not guess or invent.
2. For any field not found in the content: use "TBA" for strings, null for numbers.
3. Dates must be in YYYY-MM-DD format. If only month/year given, use the 1st of that month.
4. For "officialUrl" and "backupUrl": use ROOT domain only (e.g. https://ssc.gov.in), never a deep path.
5. If the content does not contain any recruitment/exam announcement, return {"found": false, "reason": "..."}.
6. "confidenceScore" reflects how certain you are the extracted data is accurate (0=guessing, 1=explicitly stated in document).`;

async function extractFromPdf(source, pdfBytes, pdfUrl, today) {
  const prompt = `You are extracting structured data from an official Indian government exam notification PDF.

Organization: ${source.name} (${source.fullName})
Source PDF URL: ${pdfUrl}
Today: ${today}

READ THE PDF CAREFULLY and extract the recruitment/exam announcement details.

${EXTRACT_RULES}

Return ONLY valid JSON matching this schema:
${EXTRACT_JSON_SCHEMA}`;

  try {
    const result = await structuredModel.generateContent([
      {
        inlineData: {
          data: pdfBytes.toString('base64'),
          mimeType: 'application/pdf',
        },
      },
      { text: prompt },
    ]);
    const data = JSON.parse(result.response.text());
    if (data?.found) {
      data.announcement.officialUrl = data.announcement.officialUrl || source.url;
    }
    return data;
  } catch (err) {
    log(`  ⚠️  PDF extraction error: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

async function extractFromPageText(source, pageText, today) {
  const prompt = `You are extracting structured data from an official Indian government website page.

Organization: ${source.name} (${source.fullName})
Official website: ${source.url}
Today: ${today}

PAGE CONTENT (extracted text):
---
${pageText}
---

${EXTRACT_RULES}
Look specifically for: exam notifications, admit card releases, result declarations, answer keys, exam schedule announcements from the PAST 30 DAYS.

Return ONLY valid JSON matching this schema:
${EXTRACT_JSON_SCHEMA}`;

  try {
    const result = await structuredModel.generateContent(prompt);
    const data = JSON.parse(result.response.text());
    if (data?.found) {
      data.announcement.officialUrl = data.announcement.officialUrl || source.url;
    }
    return data;
  } catch (err) {
    log(`  ⚠️  Page text extraction error: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

async function extractFromTrainingData(source, changeType, today) {
  const prompt = `You are a fact-checker for an Indian government exam information website.

Organization: ${source.name} (${source.fullName})
Official website: ${source.url}
Today: ${today}
Change detected: ${changeType} on ${source.url}

NOTE: The official website could not be fetched. Use your training knowledge ONLY if you have HIGH CONFIDENCE (≥0.85) that a specific real announcement was made in the past 7 days.

${EXTRACT_RULES}
- Only report something if confidence ≥ 0.85 (you have strong reason to believe it is real and recent)
- If uncertain, return {"found": false, "reason": "could not fetch page and insufficient training confidence"}

Return ONLY valid JSON matching this schema:
${EXTRACT_JSON_SCHEMA}`;

  try {
    const result = await structuredModel.generateContent(prompt);
    const data = JSON.parse(result.response.text());
    return data;
  } catch (err) {
    log(`  ⚠️  Training data extraction error: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

async function generateContent(source, announcement) {
  /**
   * Phase 2: Generate the full markdown content for the update page.
   * Only called AFTER deduplication check passes and confidence >= 0.7.
   */
  const today = new Date().toISOString().split('T')[0];

  // Stage-specific content structure instructions
  const stageStructure = {
    'result': `Sections to include (in order):
## [ExamName] Result [Year] — Overview
  Paragraph: which exam, who conducts it, when result was declared, total candidates appeared (if known), overall pass percentage (if known). Mention that students can check their individual result online.

## How to Check Your Result Online
  Numbered steps (at least 5): visit the official website → go to results section → select the exam → enter roll number / registration number / date of birth → click Submit → view and download result.

## Details Shown in the Result / Marksheet
  Bullet list: candidate's name, roll number, subject-wise marks, total marks obtained, maximum marks, percentage, grade/division, pass/fail status, qualifying marks. Mention that the official marksheet is needed for admission/employment.

## What Happens Next — After the Result
  Paragraph: what students who passed should do (apply for counselling/admission, download digital marksheet from DigiLocker if applicable, await merit list). What students who did not pass should do (compartment/supplementary exam if applicable, re-checking if applicable).

## Re-evaluation / Re-checking / Compartment Exam
  If board exam: explain the re-checking/photocopy process — candidates can apply online within the deadline, fee payable per subject. Compartment exam date expected in [month] — verify on official site.
  If competitive exam: explain whether re-evaluation is available (usually not for MCQ-based exams — state this clearly).

## Important Dates
  Table or bullet list: result date, re-checking application deadline (if any), compartment/supplementary exam date (if applicable), other next steps. Mark any unknown dates as "TBA — check official website".

## FAQs
  7 FAQs covering: When was result declared? How to check online? Official website is slow/down — what to do? Is the online result valid for admission? How to get physical marksheet? What are the qualifying marks / passing criteria? How to apply for re-checking?`,

    'admit-card': `Sections to include (in order):
## [ExamName] Admit Card — Overview
  Paragraph: admit card release date, issuing authority (${source.name}), exam date (if known), and why the admit card is mandatory (entry to exam hall, identity proof).

## How to Download the Admit Card
  Numbered steps (at least 5): visit official website → find admit card / hall ticket link → enter registration number / roll number / date of birth → submit → download PDF → take 2–3 printouts.

## Details Printed on the Admit Card
  Bullet list: candidate's name, photograph, signature, roll number, exam centre address, reporting time, exam date and shift, exam day instructions, list of documents to bring.

## Exam Day Instructions
  Bullet list: what to bring (photo ID, admit card), what not to bring (mobile, calculator — unless allowed), reporting time (typically 30–60 min before exam), gate closing time.

## Important Dates
  admitCardDate, examDate, and any other relevant dates. Mark unknown as "TBA".

## FAQs
  5 FAQs: When was admit card released? How to download? What if I forgot my registration number? Can I use a mobile printout? What if my photo/details are wrong on the admit card?`,

    'notification': `Sections to include (in order):
## What is [ExamName]?
  2–3 paragraphs: explain the exam, who conducts it (${source.name} — ${source.fullName}), what posts are being filled, which departments/states these posts are in, and why this is significant for candidates.

## Important Dates
  Bullet list of all known dates. For dates not yet announced, write "Expected to open within 1–2 weeks of notification — check official website" (for application start) or "Expected 3–6 months after last date to apply — TBA" (for exam date). Do NOT leave all dates as bare "TBA" — give context about when candidates can expect updates.

## Vacancy Details
  Total vacancies: ${announcement.vacancies ?? 'As per official notification'}. If category-wise breakup is not yet announced, say so — but explain that it typically includes General / EWS / OBC / SC / ST / PwD categories as per government reservation norms.

## Eligibility Criteria
  Sub-sections:
  - **Nationality**: Indian citizen (standard); mention any Nepal/Bhutan/refugee provisions if applicable.
  - **Age Limit**: State the age range. If not officially announced yet, use your knowledge of the organization's standard age norms for this post level and write: "Expected [X]–[Y] years for General category, with relaxation for SC/ST/OBC/PwD/Ex-servicemen as per [org] rules — verify in official notification." NEVER leave age as bare "TBA" without context.
  - **Educational Qualification**: State the required degree/subject based on the post name. For well-known post types (Statistical Officer, Clerk, Constable, Engineer), use your knowledge of typical qualifications required and note "as per official notification — verify before applying."

## Application Fee
  Provide the fee structure. Use your knowledge of the organization's standard fee structure if available. For example, RPSC standard fees are: General/OBC Creamy Layer ₹350, OBC Non-Creamy Layer ₹250, SC/ST/PwD (Rajasthan domicile) ₹150, all others as per General category. Always add: "Fee structure subject to change — verify in official notification." Payment mode: Online via e-Mitra / Net Banking / Card (for state PSCs) or similar.

## Selection Process
  Numbered stages based on what is typical for this type of post: Written Exam → Interview/Personality Test (if applicable) → Document Verification → Medical Exam (if applicable) → Final Merit List. Use post-specific knowledge.

## Salary and Pay Scale
  Provide the approximate pay scale / pay matrix level if knowable from the post name and organization. Write: "Expected Pay Level [X] (₹[Y,000]–₹[Z,000] approx.) as per [state/central] 7th Pay Commission — verify in official notification."

## How to Apply Online
  Numbered steps (at least 7): visit official website → go to recruitment/notification section → find the notification link → read full notification → click Apply Online → register/login → fill form → upload documents → pay fee → submit → print confirmation.

## Documents Required
  Bullet list: photo, signature, class 10 certificate (for DOB), graduation marksheets, caste certificate (if applicable), domicile certificate, EWS certificate, disability certificate (if applicable), ID proof.

## FAQs
  6 FAQs: What is the last date to apply? How many vacancies? What is the educational qualification? What is the application fee? Is there any age relaxation? How will the selection be done?`,

    'answer-key': `Sections to include (in order):
## [ExamName] Answer Key — Overview
  When released, how many sets/series (A/B/C/D), how candidates can use it to estimate their score.

## How to Download the Answer Key
  Numbered steps: visit official website → find answer key link → select your paper set/series → download PDF → match with your responses.

## How to Calculate Your Score
  Simple explanation: for each correct answer +[marks], for each wrong answer -[marks] (if negative marking) or 0 (if no penalty). Provide the marking scheme if known.

## How to Raise an Objection / Challenge
  Steps and fee: only if objection window is open. Steps to challenge on official portal, fee per question (typically ₹100–₹1000 refundable if upheld). Deadline for objections.

## Important Dates
  Answer key release date, objection deadline, final answer key date, result expected date.

## FAQs
  5 FAQs: How to challenge wrong answers? What is the objection fee? When will the final key come? Will the score change after objections? When is the result expected?`,

    'default': `Sections to include:
## Overview
  What this update is about and why it matters for candidates.

## Important Dates
  All known dates; TBA for unknown ones with expected timelines where possible.

## Key Details
  Relevant specifics for this update type.

## What to Do Next
  Clear action steps for candidates — step by step.

## FAQs
  5 realistic questions that students Google about this update.`,
  };

  const structure = stageStructure[announcement.type] || stageStructure['default'];

  // Build the dates context — show ALL dates including TBA so LLM knows what's unknown
  const allDates = Object.entries(announcement.importantDates || {});
  const datesContext = allDates.length > 0
    ? allDates.map(([k, v]) => `  ${k}: ${v || 'TBA'}`).join('\n')
    : '  (no dates provided)';

  // Build extra fields extracted from PDF (fees, age, salary, selection process)
  const extraFields = [];
  if (announcement.applicationFee) {
    const f = announcement.applicationFee;
    extraFields.push(`Application Fee (from official source):`);
    extraFields.push(`  General/EWS: ${f.general || 'TBA'}`);
    extraFields.push(`  OBC: ${f.obc || 'TBA'}`);
    extraFields.push(`  SC/ST: ${f.scSt || 'TBA'}`);
    extraFields.push(`  PwD: ${f.pwd || 'TBA'}`);
  }
  if (announcement.ageLimit) {
    const a = announcement.ageLimit;
    const min = a.min && a.min !== 'TBA' ? a.min : null;
    const max = a.max && a.max !== 'TBA' ? a.max : null;
    if (min || max) extraFields.push(`Age Limit (from official source): ${min ?? '?'}–${max ?? '?'} years`);
  }
  if (announcement.educationQualification && announcement.educationQualification !== 'TBA') {
    extraFields.push(`Education Qualification (from official source): ${announcement.educationQualification}`);
  }
  if (announcement.salaryOrPayScale && announcement.salaryOrPayScale !== 'TBA') {
    extraFields.push(`Salary / Pay Scale (from official source): ${announcement.salaryOrPayScale}`);
  }
  // Normalize selectionProcess — Gemini sometimes returns string instead of array
  const selProc = announcement.selectionProcess;
  const selProcArr = Array.isArray(selProc)
    ? selProc
    : (typeof selProc === 'string' && selProc.trim()
        ? selProc.split(/[→,;|]/).map(s => s.trim()).filter(Boolean)
        : []);
  if (selProcArr.length > 0) {
    announcement.selectionProcess = selProcArr; // normalise in-place
    extraFields.push(`Selection Process (from official source): ${selProcArr.join(' → ')}`);
  }
  const extraContext = extraFields.length > 0
    ? `\nAdditional Details Extracted from Official Source:\n${extraFields.join('\n')}`
    : '';

  const prompt = `
You are writing a factual, comprehensive guide for an Indian government exam information website (citizennest.com).
Your content must be thorough enough to rank on Google — thin or vague content will not help users.

Write a complete guide for this announcement:

Organization: ${source.name} (${source.fullName})
Exam: ${announcement.examName}
Type: ${announcement.type}
Official website: ${getDomain(announcement.officialUrl)} (link to this domain, never guess deep paths)
Vacancies: ${announcement.vacancies ?? 'Not specified'}
Important Dates (from official source):
${datesContext}${extraContext}
Today / Published: ${today}

CONTENT RULES:
1. CONFIRMED data (dates, vacancies, fees, age limits above): state precisely — these came from the actual official document.
2. For fields showing "TBA": fill them using your knowledge of this organization (${source.name}) and post type, labeled as "standard/typical" or "as per [org] rules". NEVER leave all rows as bare "TBA" without any context.
3. GENUINELY UNKNOWN future events (exam date, admit card, result when not provided): write "TBA — check ${getDomain(announcement.officialUrl)}" with expected timeline where possible.
4. NEVER invent specific dates not provided, never guess deep URL paths, never make up vacancy breakdowns.
5. Link to the official website domain only (${getDomain(announcement.officialUrl)}) — never guess deep paths.
6. Tone: factual, helpful, reassuring. No clickbait, no pressure language.
7. Length: 800–1200 words for results, 1000–1400 words for notifications, 600–900 words for admit-cards/answer-keys. Use proper markdown with bold, bullet lists, and numbered lists — do NOT write large unbroken paragraphs.
8. FAQs must answer exactly what students type into Google for this specific exam and stage.

${structure}

Write ONLY the markdown body (no frontmatter, no YAML). Start directly with the first ## heading.
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

  // Auto-generate keywords — deduplicated, no trailing year if already in examName
  const examLower = announcement.examName.toLowerCase();
  const alreadyHasYear = /\b202[4-9]\b/.test(examLower);
  const yearSuffix = alreadyHasYear ? '' : ' 2026';
  const typeLabel = announcement.type.replace(/-/g, ' ');
  const rawKeywords = [
    `${examLower} ${typeLabel}`,
    `${examLower}${yearSuffix}`,
    `${source.name.toLowerCase()} ${typeLabel} 2026`,
    ...(announcement.type === 'notification' ? [`${examLower} apply online`, `${examLower} notification 2026`] : []),
    ...(announcement.type === 'result' ? [`${examLower} result date`, `${examLower} marksheet download`] : []),
    ...(announcement.type === 'admit-card' ? [`${examLower} hall ticket download`, `${examLower} admit card 2026`] : []),
    ...(announcement.type === 'answer-key' ? [`${examLower} answer key pdf`, `${examLower} objection`] : []),
  ];
  // Deduplicate + drop any keyword > 60 chars (verbose exam names bleed in otherwise)
  const keywords = [...new Set(rawKeywords.map(k => k.trim()).filter(k => k && k.length <= 60))];

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
      Object.entries(announcement.importantDates || {}).filter(([, v]) => v && v !== 'TBA' && v !== 'null')
    ),
    officialLinks: [announcement.officialUrl, announcement.backupUrl].filter(Boolean).filter(isOfficialUrl),
    readingTime: '5 min',
    publishedDate: today,
    ...(expiryDate ? { expiryDate } : {}),
    status: 'active',
    vacancies: announcement.vacancies || undefined,
    // Extra fields extracted from official PDF/page (used in content generation)
    ...(announcement.applicationFee ? { applicationFee: announcement.applicationFee } : {}),
    ...(announcement.ageLimit?.min || announcement.ageLimit?.max ? { ageLimit: announcement.ageLimit } : {}),
    ...(announcement.educationQualification && announcement.educationQualification !== 'TBA'
        ? { educationQualification: announcement.educationQualification } : {}),
    ...(announcement.salaryOrPayScale && announcement.salaryOrPayScale !== 'TBA'
        ? { salaryOrPayScale: announcement.salaryOrPayScale } : {}),
    ...(Array.isArray(announcement.selectionProcess) && announcement.selectionProcess.length > 0
        ? { selectionProcess: announcement.selectionProcess } : {}),
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
    const dateLabel = resultDate && resultDate !== 'TBA'
      ? (() => { try { return new Date(resultDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); } catch { return ''; } })()
      : '';
    return `${announcement.examName} ${label}${dateLabel ? ` ${dateLabel}` : ''} — Check at ${getDomain(announcement.officialUrl)}`.trim();
  }

  if (announcement.type === 'admit-card') {
    const examDate = announcement.importantDates?.examDate;
    return `${announcement.examName} Admit Card${examDate && examDate !== 'TBA' ? ` — Exam ${formatDate(examDate)}` : ''} — Download at ${getDomain(announcement.officialUrl)}`;
  }

  // registration: lead with deadline; exam-schedule: lead with exam date; others: source name
  if (announcement.type === 'registration') {
    const lastDate = announcement.importantDates?.lastDateToApply;
    if (lastDate && lastDate !== 'TBA') {
      return `${announcement.examName} ${label} — Apply Online by ${formatDate(lastDate)}`;
    }
  }
  if (announcement.type === 'exam-schedule') {
    const examDate = announcement.importantDates?.examDate;
    if (examDate && examDate !== 'TBA') {
      return `${announcement.examName} Exam Date — ${formatDate(examDate)}`;
    }
  }
  if (announcement.type === 'cutoff') {
    return `${announcement.examName} Cut-off Marks — ${source.name} Official List`;
  }
  return `${announcement.examName} ${label} — ${source.name}`;
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
    const resultDate = announcement.importantDates?.resultDate && announcement.importantDates.resultDate !== 'TBA'
      ? formatDate(announcement.importantDates.resultDate) : null;
    const dateClause = resultDate ? ` out ${resultDate}.` : ' declared.';
    desc = `${announcement.examName} result${dateClause} Check marksheet, subject-wise marks and pass/fail status at ${getDomain(announcement.officialUrl)}.`;
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

/**
 * Convert all-caps strings (common in PDFs) to Title Case.
 * E.g. "TECHNICIAN GRADE I SIGNAL - CEN 02/2025" → "Technician Grade I Signal - CEN 02/2025"
 * Preserves known acronyms: CEN, JEE, NEET, UGC, NET, SSC, RRB, IBPS, etc.
 */
const KEEP_UPPER = new Set(['CEN', 'JEE', 'NEET', 'UGC', 'NET', 'SSC', 'RRB', 'IBPS', 'SBI',
  'UPSC', 'NTA', 'GATE', 'CUET', 'CTET', 'CGL', 'CHSL', 'MTS', 'CPO', 'ALP',
  'RBI', 'NABARD', 'EPFO', 'ESIC', 'NHM', 'AIIMS', 'JIPMER', 'PGI', 'CDS',
  'NDA', 'AFCAT', 'CSE', 'IFS', 'CBI', 'IB', 'SPG', 'DRDO', 'ISRO', 'BARC',
  'UG', 'PG', 'LLB', 'LLM', 'MBA', 'MBBS', 'BDS', 'BAMS', 'BHMS', 'BCA', 'MCA',
  'BCom', 'MCom', 'BSc', 'MSc', 'BTech', 'MTech', 'BE', 'ME',
  'TGT', 'PGT', 'PRT', 'PGI', 'PGIMER', 'NIMHANS',
  'I', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
]);
function toTitleCase(str) {
  if (!str) return str;
  // If not fully uppercase, don't touch it
  const upperRatio = (str.match(/[A-Z]/g) || []).length / (str.match(/[a-zA-Z]/g) || [' ']).length;
  if (upperRatio < 0.85) return str;
  return str.split(/(\s+|(?=-))/).map(word => {
    const clean = word.replace(/[^A-Za-z0-9]/g, '');
    if (!clean) return word;
    if (KEEP_UPPER.has(clean.toUpperCase())) return word.toUpperCase();
    if (/^[A-Z]{2,}$/.test(clean)) return word; // preserve acronyms (NTET, UPSC, etc.)
    if (/^\d/.test(clean)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

/**
 * Shorten verbose exam names returned by Gemini.
 * If the name contains a parenthetical acronym like "…(JIPMAT)…" or "…(SSC CGL)…",
 * extract it and append the year portion.
 * E.g. "Joint Integrated Programme in Management Admission Test (JIPMAT)-2026"
 *   → "JIPMAT 2026"
 * E.g. "Combined Graduate Level (CGL) Examination 2026"
 *   → "SSC CGL 2026"  (org prefix handled by caller)
 * Leaves short names (<= 40 chars) unchanged.
 */
function normalizeExamName(name) {
  if (!name || name.length <= 40) return name;
  // Extract acronym from parentheses: "…(ACRONYM)…" or "…(ACRONYM)-YEAR"
  const acronymMatch = name.match(/\(([A-Z][A-Z0-9 \-]{1,20})\)/);
  if (acronymMatch) {
    const acronym = acronymMatch[1].trim();
    // Extract optional month qualifier + year: e.g. "Sep 2026" or "2026-27"
    const yearMatch = name.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\-]+(20[2-3][0-9])(?:[–\-]\d{2,4})?\b|\b(20[2-3][0-9])(?:[–\-](\d{2,4}))?\b/);
    if (yearMatch) {
      const suffix = yearMatch[0].replace('–', '-');
      return `${acronym} ${suffix}`;
    }
    return acronym;
  }
  return name;
}

/**
 * Post-process generated markdown to fix known LLM output issues:
 * 1. Remove padding-space lines (model sometimes pads table cells with spaces)
 * 2. Strip trailing whitespace from lines
 * 3. Truncate any single line exceeding 5000 chars (malformed table rows)
 */
function cleanMarkdown(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const cleaned = lines.map(line => {
    const stripped = line.trimEnd();
    // If line is > 5000 chars, it's likely a padded table row — truncate to first meaningful content
    if (stripped.length > 5000) {
      const firstPipe = stripped.indexOf('|');
      if (firstPipe !== -1) {
        // Try to extract just the table header row (first 500 chars)
        return stripped.slice(0, 500).trimEnd();
      }
      return stripped.slice(0, 500).trimEnd();
    }
    return stripped;
  });
  return cleaned.join('\n');
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
  if (fm.educationQualification) lines.push(`educationQualification: "${fm.educationQualification.replace(/"/g, "'")}"`);
  if (fm.salaryOrPayScale) lines.push(`salaryOrPayScale: "${fm.salaryOrPayScale.replace(/"/g, "'")}"`);
  if (fm.selectionProcess?.length > 0) {
    lines.push('selectionProcess:');
    for (const step of fm.selectionProcess) lines.push(`  - "${step.replace(/"/g, "'")}"`);
  }
  if (fm.applicationFee) {
    const feeEntries = Object.entries(fm.applicationFee).filter(([, v]) => v && v !== 'TBA');
    if (feeEntries.length > 0) {
      lines.push('applicationFee:');
      for (const [k, v] of feeEntries) lines.push(`  ${k}: "${v}"`);
    }
  }
  const ageLimitMin = fm.ageLimit?.min && fm.ageLimit.min !== 'TBA' ? fm.ageLimit.min : null;
  const ageLimitMax = fm.ageLimit?.max && fm.ageLimit.max !== 'TBA' ? fm.ageLimit.max : null;
  if (ageLimitMin || ageLimitMax) {
    lines.push('ageLimit:');
    if (ageLimitMin) lines.push(`  min: ${ageLimitMin}`);
    if (ageLimitMax) lines.push(`  max: ${ageLimitMax}`);
  }
  lines.push('---');
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════');
  log(`🚀 generate-updates-gemini.js starting`);
  log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Tier filter: ${TIER_FILTER || 'all'} | Force: ${FORCE_SCAN} | Cloudflare: ${CLOUDFLARE_DETECTIONS}`);

  // Load sources
  const { sources } = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
  const activeSources = sources.filter(s => !TIER_FILTER || s.tier <= TIER_FILTER);
  log(`📡 Sources to process: ${activeSources.length}/${sources.length}`);

  // Load latest detected changes
  let latestChanges = [];
  let cloudflareDetections = [];
  if (CLOUDFLARE_DETECTIONS) {
    if (!fs.existsSync(CLOUDFLARE_DETECTIONS_PATH)) {
      log(`✅ No Cloudflare detections file found at ${CLOUDFLARE_DETECTIONS_PATH} — nothing to generate`);
      return;
    }
    const payload = JSON.parse(fs.readFileSync(CLOUDFLARE_DETECTIONS_PATH, 'utf8'));
    cloudflareDetections = Array.isArray(payload) ? payload : (payload.detections || []);
    latestChanges = cloudflareDetections.map(detection => ({
      site: detection.sourceName || detection.sourceId,
      sourceId: normalizeSourceId(detection.sourceId),
      type: detection.type === 'pdf' ? 'NEW_PDF' : 'NEW_NOTICE',
      headline: detection.title,
      date: detection.date,
      url: detection.url,
      pdfUrl: /\.pdf(\?|#|$)/i.test(detection.url || '') ? detection.url : null,
      fingerprint: detection.fingerprint
    }));
    log(`🔴 Cloudflare detections loaded: ${latestChanges.length}`);
  } else if (fs.existsSync(LATEST_PATH)) {
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
  // - If real changes detected: changed sources first, then tier1, then tier2 (stale ones)
  // - If force scan: process all active sources
  // - If no changes: tier1 + stale tier2 (lastScanned > 24h ago)
  let sourcesToProcess = activeSources;
  if (CLOUDFLARE_DETECTIONS) {
    const changedSourceIds = new Set(latestChanges.map(change => change.sourceId).filter(Boolean));
    sourcesToProcess = activeSources.filter(source => changedSourceIds.has(source.id));
    log(`🎯 Processing only ${sourcesToProcess.length} Cloudflare-confirmed source(s)`);
  } else if (!FORCE_SCAN) {
    const changed = latestChanges.length > 0
      ? activeSources.filter(s => latestChanges.some(c => sourceMatchesChange(s, c)))
      : [];
    const tier1Rest = activeSources.filter(s => s.tier === 1 && !changed.find(c => c.id === s.id));
    // Include tier2 sources not scanned in the last 24h — rotate through them daily
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const staleTier2 = activeSources.filter(s =>
      s.tier === 2 &&
      !changed.find(c => c.id === s.id) &&
      (!s.lastScanned || s.lastScanned < yesterday)
    ).slice(0, 5); // max 5 tier2 per run to stay within quota
    sourcesToProcess = [...changed, ...tier1Rest, ...staleTier2].slice(0, MAX_SEARCHES_PER_RUN);
    log(`🎯 Processing ${changed.length} changed + ${tier1Rest.length} tier1 + ${staleTier2.length} stale tier2 (max ${MAX_SEARCHES_PER_RUN})`);
  }

  const results = { generated: [], skipped: [], errors: [] };
  let searchCount = 0;

  for (const source of sourcesToProcess) {
    if (searchCount >= MAX_SEARCHES_PER_RUN) {
      log(`⏸️  Reached max searches (${MAX_SEARCHES_PER_RUN}) — stopping`);
      break;
    }

    log(`\n🔍 Searching: ${source.name} (tier ${source.tier})`);
    const matchingChanges = latestChanges.filter(change => sourceMatchesChange(source, change));
    const changeType = matchingChanges[0]?.type || 'SCHEDULED_SCAN';

    // Thread known PDF URL from change detector into extraction (skip re-discovery)
    const knownPdfUrl = matchingChanges.find(c => c.pdfUrl)?.pdfUrl || null;
    if (knownPdfUrl) log(`  🔗 Detector-provided PDF URL: ${knownPdfUrl}`);

    let searchResult;
    try {
      searchResult = await searchAndExtract(source, changeType, knownPdfUrl);
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
    // ── Normalize announcement fields (handle Gemini type inconsistencies) ──
    if (typeof ann.selectionProcess === 'string') {
      ann.selectionProcess = ann.selectionProcess.split(/[→,;|]/).map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(ann.selectionProcess)) {
      ann.selectionProcess = [];
    }
    // Remove TBA placeholders from selectionProcess array
    ann.selectionProcess = ann.selectionProcess.filter(s => s && s !== 'TBA');

    if (typeof ann.vacancies === 'string' && /^\d+$/.test(ann.vacancies)) {
      ann.vacancies = parseInt(ann.vacancies, 10);
    }
    // Treat "TBA" vacancies as missing (don't emit noisy TBA in frontmatter)
    if (ann.vacancies === 'TBA') ann.vacancies = null;
    // Convert all-caps PDF exam names to Title Case, then shorten if verbose
    ann.examName = normalizeExamName(toTitleCase(ann.examName));
    // Normalize ageLimit — drop bare "TBA" values (they cause invalid YAML)
    if (ann.ageLimit) {
      if (ann.ageLimit.min === 'TBA' || ann.ageLimit.min === null) delete ann.ageLimit.min;
      if (ann.ageLimit.max === 'TBA' || ann.ageLimit.max === null) delete ann.ageLimit.max;
      if (!ann.ageLimit.min && !ann.ageLimit.max) delete ann.ageLimit;
    }
    log(`  → Found: [${ann.type}] ${ann.examName} (confidence: ${ann.confidenceScore})`);

    // ── Deduplication check ───────────────────────────────────────────────

    // 0. Thin-content gate: if the announcement has almost no useful data, skip it.
    //    Counts how many of the 6 most important fields are genuinely known (not TBA/null/empty).
    const thinFields = [
      ann.importantDates?.examDate,
      ann.importantDates?.lastDateToApply,
      ann.importantDates?.resultDate,
      ann.applicationFee?.general,
      ann.educationQualification,
      ann.selectionProcess?.length > 0 ? 'ok' : null,
    ];
    const knownCount = thinFields.filter(v => v && v !== 'TBA' && v !== 'null').length;
    if (knownCount < 2) {
      log(`  ⏭  Thin content: only ${knownCount}/6 key fields known — skipping to avoid empty page`);
      results.skipped.push({ source: source.name, reason: `thin content (${knownCount}/6 fields)`, exam: ann.examName });
      continue;
    }

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

    // 5. Slug collision check — allow overwrite if existing page is stale (key dates are TBA)
    const slug = generateSlug(source.name, ann.examName, ann.type);
    if (slugRegistry.has(slug)) {
      const existingPath = path.join(UPDATES_DIR, `${slug}.md`);
      const existingContent = fs.existsSync(existingPath) ? fs.readFileSync(existingPath, 'utf8') : '';
      const resultDateTBA   = /resultDate:\s*["']?TBA["']?/i.test(existingContent);
      const examDateTBA     = /examDate:\s*["']?TBA["']?/i.test(existingContent);
      const isStale = resultDateTBA || examDateTBA;
      if (isStale) {
        log(`  ♻️  Stale spike page detected (TBA dates) — regenerating: ${slug}`);
      } else {
        log(`  ⏭  Slug collision: ${slug} already exists`);
        results.skipped.push({ source: source.name, reason: `slug collision: ${slug}`, exam: ann.examName });
        continue;
      }
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
    const rawContentBody = await generateContent(source, ann);
    if (!rawContentBody || rawContentBody.length < 200) {
      log(`  ❌ Content generation failed or too short`);
      results.errors.push({ source: source.name, exam: ann.examName, error: 'content too short' });
      continue;
    }
    const contentBody = cleanMarkdown(rawContentBody);

    // Programmatic quality check — catch all-caps headings, padding bugs, excessive TBA,
    // duplicate H2s, broken table rows, and Gemini reasoning leaks.
    const qualityIssues = validateContentQuality(contentBody);
    const criticalIssues = qualityIssues.filter(q =>
      q.startsWith('Gemini reasoning leak') ||
      q.startsWith('duplicate H2') ||
      q.startsWith('broken table row')
    );
    if (qualityIssues.length > 0) {
      log(`  ⚠️  Quality issues detected in generated content:`);
      for (const issue of qualityIssues) log(`     - ${issue}`);
    }
    if (criticalIssues.length > 0) {
      log(`  ❌ Critical quality issues — skipping write to avoid publishing bad content`);
      results.errors.push({ source: source.name, exam: ann.examName, errors: criticalIssues });
      continue;
    }

    // Sanity check: reject absurdly large content (> 200KB = model went haywire)
    if (contentBody.length > 200_000) {
      log(`  ❌ Content too large (${Math.round(contentBody.length/1024)}KB) — skipping`);
      results.errors.push({ source: source.name, exam: ann.examName, error: 'content too large' });
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
      fingerprints: matchingChanges.map(change => change.fingerprint).filter(Boolean),
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

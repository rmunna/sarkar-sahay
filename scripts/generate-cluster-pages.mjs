#!/usr/bin/env node
/**
 * Cluster Pages Auto-Generator
 *
 * Reads all cluster plans in agents/cluster-plans/*.json, finds WINNABLE/MEDIUM
 * sub-intents that don't yet have a page in content/updates/, and generates them
 * via Gemini using training-data knowledge (no Brave API, no live fetching).
 *
 * Runs in GitHub Actions on a schedule. GEMINI_API_KEY must be set.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/generate-cluster-pages.mjs
 *   GEMINI_API_KEY=... node scripts/generate-cluster-pages.mjs --limit=5
 *   GEMINI_API_KEY=... node scripts/generate-cluster-pages.mjs --exam "BPSC 70th 2026"
 *   GEMINI_API_KEY=... node scripts/generate-cluster-pages.mjs --dry-run
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLUSTER_PLANS_DIR = path.join(ROOT, 'agents/cluster-plans');
const UPDATES_DIR = path.join(ROOT, 'content/updates');
const SLUGS_PATH = path.join(ROOT, 'agents/.newly-generated-slugs');
const SITE_URL = process.env.SITE_URL || 'https://www.citizennest.com';
const TODAY = new Date().toISOString().split('T')[0];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 8;
const EXAM_ARG_I = args.indexOf('--exam');
const EXAM_FILTER = EXAM_ARG_I !== -1 ? args[EXAM_ARG_I + 1]?.toLowerCase() : null;

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.25 },
});
const structuredModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
});

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gemini(mdl, prompt) {
  const delays = [3000, 8000, 20000, 40000];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await mdl.generateContent(prompt);
      return res.response.text();
    } catch (err) {
      const msg = String(err?.message || '');
      const retryable = /503|502|500|429|high demand|overloaded|RESOURCE_EXHAUSTED/i.test(msg);
      if (!retryable || attempt >= delays.length) throw err;
      const wait = delays[attempt] + Math.floor(Math.random() * 2000);
      log(`  ⏳ Gemini retry ${attempt + 1}/${delays.length} in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
}

// ── Content structure prompts per sub-intent type ────────────────────────────

const SECTION_PROMPTS = {
  syllabus: `Sections to include:
## [Exam] Syllabus — Overview (intro para: number of stages, total marks, selecting body)
## Exam Pattern (table: Stage | Papers | Questions | Marks | Duration | Negative Marking)
## [Prelims/Stage-1] Syllabus (topic-by-topic with 4-6 sub-topics each)
## [Mains/Stage-2] Syllabus (paper-wise detailed topics; skip if only one stage)
## High-Weightage Topics (bullet list: 6-8 areas from previous years)
## Books and Resources (3-4 standard books or official study material)
## FAQs (5 Q&As: Is syllabus changed? What topics have highest weightage? Is there interview? Is there negative marking? Where to find official syllabus?)`,

  eligibility: `Sections to include:
## Eligibility Criteria — Quick Summary (table: Criteria | Details)
## Age Limit (table: Category | Minimum Age | Maximum Age | Relaxation; include all categories)
## Educational Qualification (minimum degree required, recognized universities, distance learning rules)
## Number of Attempts (limit or unlimited; age-based or attempt-based)
## Domicile / Nationality (state domicile needed? for which categories or posts?)
## Physical Standards (if applicable for any post in the exam)
## Disqualification Criteria (criminal record, dismissal from govt service, etc.)
## FAQs (5 Q&As: Can final-year students apply? Is work experience needed? Can OBC NCL apply in General? Is there an attempt limit? Are NRIs eligible?)`,

  salary: `Sections to include:
## Salary — Quick Summary (table: Post | Pay Level | Basic Pay | Approx. In-Hand)
## Pay Scale and Grade Pay (7th CPC Pay Matrix — Level, Basic Pay, increment rate)
## In-Hand Salary Breakdown (table showing Basic + DA + HRA + TA − deductions = net; use realistic city-tier assumptions)
## Post-wise Salary (if the exam is for multiple posts, show each post's pay)
## Allowances and Benefits (HRA percentages by city tier, DA rate, transport, medical)
## Perks and Non-Monetary Benefits (pension/NPS, housing, leaves, official quarters)
## Career Progression (promotion timeline, how pay increases over 5-10-20 years)
## FAQs (5 Q&As: What is the starting in-hand? How does DA affect salary? Is pension available? What is the retirement age? Can posting location affect salary?)`,

  cutoff: `Sections to include:
## [Exam] Cut Off — Overview (which stage this covers, what cutoff means, how it is calculated)
## Previous Year Cutoffs (table: Year | Stage | General | OBC | SC | ST | EWS; at least 2-3 years if available)
## Current Year Expected Cutoff (estimated range with reasoning — vacancy vs candidates, difficulty)
## Category-wise Analysis (how reservation affects cutoff for different categories)
## Mains Cutoff / Interview Cutoff (if applicable, separate table)
## Safe Score Strategy (what score to target to be safe, buffer above cutoff)
## FAQs (5 Q&As: Why does cutoff change every year? What is the minimum qualifying mark? Is there a subject-wise cutoff? Where is cutoff declared officially? Can I predict my selection from cutoff?)`,

  notification: `Sections to include:
## Key Highlights (table: Total Vacancies | Application Start | Last Date | Exam Date | Official Site)
## Post-wise Vacancy (table: Post Name | Vacancies | Pay Level | Eligibility)
## Eligibility Criteria (age limit, educational qualification — brief summary)
## Important Dates (table: Event | Date — all dates from notification)
## Application Fee (table: Category | Fee; payment modes)
## Selection Process (numbered stages with brief description of each)
## How to Apply Online (numbered steps — registration, form fill, documents, fee, submit)
## FAQs (5 Q&As)`,

  'last-date': `Sections to include:
## Application Deadline — Key Dates (table: Event | Date | Notes)
## Step-by-Step: How to Apply Before the Deadline (numbered steps: registration → fill form → upload documents → pay fee → submit → take printout)
## Documents to Keep Ready (bullet list: photo specs, signature specs, ID proof, caste/EWS certificate, etc.)
## Application Fee (table: Category | Fee | Payment Mode)
## Common Mistakes That Cause Rejection (bullet list: wrong photo, name mismatch, wrong category, fee not paid)
## What If You Miss the Deadline (is extension likely? historical precedent)
## FAQs (5 Q&As: Can I edit the form after submission? What if payment fails? Is late fee accepted? Which browser works best? Can I apply offline?)`,

  'exam-date': `Sections to include:
## Exam Schedule — Overview (table: Stage | Exam Date | Mode — Online/Offline | Duration)
## Admit Card / Hall Ticket Date (when released, how to download)
## Exam Centers and City Allocation (how cities are allotted, can you change center?)
## Exam Day Timeline (table: Activity | Time — reporting, gate closing, exam start/end, break if any)
## Exam Pattern on the Day (brief: number of sections, question type, negative marking reminder)
## What to Carry (bullet: valid admit card, original photo ID, passport photo, pen if offline)
## FAQs (5 Q&As: What if exam date clashes with another exam? How early to report? Can I carry water? Is calculator allowed? What if I lose my admit card?)`,

  'admit-card': `Sections to include:
## Admit Card — Quick Facts (table: Release Date | Mode | Issuing Authority | Valid For)
## How to Download Admit Card (numbered steps: go to official site → login page → enter credentials → download and print)
## Login Details Required (registration number / roll number + DOB / password — whichever applies)
## Information Printed on Admit Card (bullet: candidate name, roll number, exam center, date, time, photo, signature, instructions)
## What to Carry on Exam Day (admit card + original ID proof: Aadhaar / voter ID / passport / driving licence)
## What NOT to Carry (mobile, smart watch, calculator, notes, food)
## Admit Card Problems and Solutions (wrong name/photo: contact helpdesk before exam; lost admit card: re-download)
## FAQs (5 Q&As: Is digital printout accepted? What ID is valid? Can I change exam center from admit card? What if details are wrong? Is admit card needed for all stages?)`,

  'answer-key': `Sections to include:
## Answer Key — Quick Facts (table: Provisional Key Date | Objection Deadline | Final Key Date | Result Date)
## How to Download Answer Key (numbered steps: official site → answer key section → select paper set → download PDF)
## Paper Sets and Series (how many sets: A/B/C/D or shift-wise; how to identify your set from admit card)
## How to Calculate Expected Score (formula: correct × marks − wrong × penalty; example calculation)
## How to Raise Objections (numbered steps: login → challenge button → select question → upload evidence → pay fee → submit)
## Objection Fee and Refund Policy (fee per question, refunded if objection accepted?)
## Provisional vs Final Answer Key (what typically changes, when final key is released)
## FAQs (5 Q&As: Can I challenge all questions? How long for objections to be reviewed? What evidence is needed? Is objection fee refunded? Where is official key published?)`,

  result: `Sections to include:
## Result — Quick Facts (table: Declaration Date | Mode | Website | Next Step After Result)
## How to Check Result Online (numbered steps: go to official site → result section → select exam → enter roll number / registration number / DOB → submit → view / download)
## Information on Result / Scorecard (bullet: roll number, name, marks per subject, total, percentage, rank, pass/fail status, qualifying mark)
## Merit List and Selection (how merit list is prepared, tie-breaking rules)
## What to Do If You Qualified (document verification / next stage — admit card dates, preparation tips)
## What to Do If You Did Not Qualify (re-checking / RTI / next cycle information)
## Score Card and DigiLocker (when separate score card is available, DigiLocker availability)
## FAQs (7 Q&As: When is result declared? Is result available on DigiLocker? How to apply for re-checking? Are marks released? What is the pass mark? What happens after merit list? How many candidates qualify?)`,

  'apply-online': `Sections to include:
## Before You Start — Documents Needed (bullet: scanned photo specs, signature specs, documents like degree, ID, caste certificate)
## Step 1 — New Registration (go to official portal → click Register / New Candidate → fill name, email, phone, DOB → get registration number)
## Step 2 — Fill the Application Form (login with registration → personal info → educational qualification → category → post preference → exam center preference)
## Step 3 — Upload Photo and Signature (file size, dimension, format requirements; tips for resizing)
## Step 4 — Pay Application Fee (table: Category | Fee; payment via debit card/credit card/net banking/UPI)
## Step 5 — Submit and Save Confirmation (click final submit → download/print confirmation → note your registration number)
## Common Errors and Fixes (wrong photo format, payment failure, browser issues, server down tips)
## FAQs (5 Q&As: Can I edit after final submission? What if I pay double fee? Is mobile application accepted? Which browsers work? How do I get fee refund if rejected?)`,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePageSlug(planFilename, subintentSlug) {
  // planFilename: "bpsc-70th-2026" → strip trailing year → "bpsc-70th"
  const base = planFilename.replace(/-\d{4}$/, '');
  return `${base}-${subintentSlug}`;
}

function extractOfficialUrl(plan) {
  const officalPatterns = [/\.gov\.in$/, /\.nic\.in$/, /\.ac\.in$/, /\.edu\.in$/, /\.org\.in$/];
  for (const item of plan.plan) {
    for (const domain of (item.top3 || [])) {
      if (officalPatterns.some(p => p.test(domain))) {
        return `https://${domain}`;
      }
    }
  }
  return null;
}

function extractOrg(examName) {
  return examName.split(' ')[0];
}

function readingTime(content) {
  const words = content.split(/\s+/).length;
  return `${Math.max(3, Math.round(words / 200))} min`;
}

function existingPageSlugs() {
  if (!fs.existsSync(UPDATES_DIR)) return new Set();
  return new Set(
    fs.readdirSync(UPDATES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, ''))
  );
}

function loadClusterPlans() {
  if (!fs.existsSync(CLUSTER_PLANS_DIR)) return [];
  return fs.readdirSync(CLUSTER_PLANS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(CLUSTER_PLANS_DIR, f), 'utf8'));
      return { filename: f.replace(/\.json$/, ''), ...data };
    });
}

// ── Core generation ──────────────────────────────────────────────────────────

async function generateMetadata(exam, org, subintent, officialUrl) {
  const prompt = `Generate SEO metadata for a citizennest.com page.

Exam: ${exam}
Organization: ${org}
Page topic: ${subintent}
Official website: ${officialUrl || `${org.toLowerCase()}.gov.in`}

Return JSON exactly matching this schema (no extra fields):
{
  "title": "50-65 chars: include exam name, year, key phrase. E.g. 'BPSC 70th Syllabus 2026 — Prelims & Mains Subject-wise Topics'",
  "description": "130-160 chars: specific facts, not vague. Mention key numbers/dates if known.",
  "keywords": ["6 to 8 keyword phrases users search for this topic", "include exam name + year variants"]
}`;

  try {
    const raw = await gemini(structuredModel, prompt);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generateBody(exam, org, subintent, officialUrl) {
  const sectionGuide = SECTION_PROMPTS[subintent] || `Write a comprehensive ${subintent} guide with relevant sections, tables, and FAQs.`;
  const domain = officialUrl ? new URL(officialUrl).hostname : `${org.toLowerCase()}.gov.in`;

  const prompt = `You are a senior content writer for citizennest.com, an Indian government exam portal trusted by millions of aspirants.

Write a factual, detailed ${subintent} guide for:
Exam: ${exam}
Organization: ${org}
Official website: ${officialUrl || `https://${domain}`}
Today's date: ${TODAY}

CONTENT RULES:
1. Use ONLY information you have HIGH confidence about from your training knowledge.
2. For specific future dates not yet announced, write "not yet announced — check ${domain}".
3. For specific numbers you're unsure about, give a realistic range or typical value with "(approximate)" note.
4. Start with a 2-3 sentence introduction paragraph (no heading).
5. Use proper markdown: ## for main sections, ### for sub-sections, **bold** for important terms, tables for structured data.
6. Target 900-1200 words of useful content.
7. India-specific context: 7th CPC pay scales, DOPT rules, OBC/SC/ST/EWS reservation norms.
8. Do NOT write disclaimers like "I'm an AI", "please verify", or "information may change".
9. End every page with an ## Official Links section mentioning ${domain}.

${sectionGuide}`;

  return gemini(model, prompt);
}

function writePage(slug, fm, body) {
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(fm.title)}`,
    `description: ${JSON.stringify(fm.description)}`,
    `category: "Government Jobs"`,
    `type: ${JSON.stringify(fm.subintent)}`,
    `organization: ${JSON.stringify(fm.org)}`,
    `examName: ${JSON.stringify(fm.exam)}`,
    `stage: ${JSON.stringify(fm.subintent)}`,
    `keywords:`,
    ...(fm.keywords || []).map(k => `  - ${JSON.stringify(k)}`),
    `officialLinks:`,
    `  - ${JSON.stringify(fm.officialUrl || `https://www.google.com/search?q=${encodeURIComponent(fm.exam)}`)}`,
    `readingTime: ${JSON.stringify(fm.readingTime)}`,
    `publishedDate: ${JSON.stringify(TODAY)}`,
    `status: "active"`,
    '---',
  ].join('\n');

  const content = `${frontmatter}\n\n${body.trim()}\n`;
  const outPath = path.join(UPDATES_DIR, `${slug}.md`);

  if (!DRY_RUN) {
    fs.mkdirSync(UPDATES_DIR, { recursive: true });
    fs.writeFileSync(outPath, content, 'utf8');
  }
  return outPath;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════');
  log(`🚀 generate-cluster-pages.mjs starting`);
  log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Limit: ${LIMIT} | Exam filter: ${EXAM_FILTER || 'all'}`);

  const plans = loadClusterPlans();
  const existing = existingPageSlugs();
  log(`📋 Cluster plans: ${plans.length} | Existing pages: ${existing.size}`);

  // Collect all missing work items
  const todo = [];
  for (const plan of plans) {
    if (EXAM_FILTER && !plan.exam.toLowerCase().includes(EXAM_FILTER)) continue;
    const officialUrl = extractOfficialUrl(plan);
    const org = extractOrg(plan.exam);

    for (const item of plan.plan) {
      if (!['WINNABLE', 'MEDIUM'].includes(item.verdict)) continue;
      const slug = makePageSlug(plan.filename, item.slug);
      if (existing.has(slug)) continue;
      if (!SECTION_PROMPTS[item.slug]) {
        log(`  ⚠️  No prompt template for sub-intent "${item.slug}" — skipping`);
        continue;
      }
      todo.push({ plan, item, slug, org, officialUrl });
    }
  }

  log(`📝 Missing pages to generate: ${todo.length} (will process up to ${LIMIT})`);

  const generated = [];
  const errors = [];
  const newSlugs = [];

  for (const { plan, item, slug, org, officialUrl } of todo.slice(0, LIMIT)) {
    log(`\n✍️  Generating: ${slug}`);
    log(`   Exam: ${plan.exam} | Sub-intent: ${item.slug} | Verdict: ${item.verdict}`);

    try {
      // Step 1: Generate metadata (title, description, keywords)
      log(`   📋 Fetching metadata...`);
      const meta = await generateMetadata(plan.exam, org, item.slug, officialUrl);
      await sleep(1500);

      if (!meta?.title || !meta?.description) {
        log(`   ❌ Metadata generation failed — skipping`);
        errors.push({ slug, reason: 'metadata generation failed' });
        continue;
      }

      // Step 2: Generate body content
      log(`   📝 Generating body content...`);
      const body = await generateBody(plan.exam, org, item.slug, officialUrl);
      await sleep(1500);

      const trimmedLen = body ? body.trim().length : 0;
      if (trimmedLen < 800) {
        log(`   ❌ Body too short (${trimmedLen} trimmed chars, ${body?.length || 0} raw) — skipping`);
        errors.push({ slug, reason: 'body too short' });
        continue;
      }
      if (trimmedLen > 80_000) {
        log(`   ❌ Body too large (${Math.round(trimmedLen/1000)}K trimmed chars) — Gemini repeated itself, skipping`);
        errors.push({ slug, reason: `body too large: ${Math.round(trimmedLen/1000)}K trimmed chars` });
        continue;
      }

      // Step 3: Write file
      const fm = {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords || [],
        subintent: item.slug,
        org,
        exam: plan.exam,
        officialUrl,
        readingTime: readingTime(body),
      };

      const outPath = writePage(slug, fm, body);
      log(`   ✅ ${DRY_RUN ? 'Would write' : 'Written'}: ${path.relative(ROOT, outPath)} (${body.trim().length} chars)`);

      generated.push({ slug, title: meta.title, url: `${SITE_URL}/update/${slug}` });
      newSlugs.push(slug);

      // Rate limit — stay within Gemini free tier (15 RPM)
      await sleep(2000);

    } catch (err) {
      log(`   ❌ Error: ${err.message?.slice(0, 200)}`);
      errors.push({ slug, reason: err.message?.slice(0, 200) });
    }
  }

  // Write slug list for indexing
  if (newSlugs.length > 0 && !DRY_RUN) {
    const existing = fs.existsSync(SLUGS_PATH) ? fs.readFileSync(SLUGS_PATH, 'utf8') : '';
    fs.writeFileSync(SLUGS_PATH, existing + newSlugs.join('\n') + '\n', 'utf8');
  }

  log(`\n═══════════════════════════════════════════`);
  log(`📊 Run Summary:`);
  log(`   ✅ Generated: ${generated.length} pages`);
  log(`   ❌ Errors:    ${errors.length}`);
  log(`   ⏭  Remaining: ${Math.max(0, todo.length - LIMIT)} pages (run again to continue)`);

  if (generated.length > 0) {
    log(`\n📄 New pages:`);
    for (const p of generated) log(`   ${p.url}`);
  }
  if (errors.length > 0) {
    log(`\n❌ Errors:`);
    for (const e of errors) log(`   ${e.slug}: ${e.reason}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

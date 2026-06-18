/**
 * fill-missing-scheme-detail.mjs
 *
 * Generates _detail/*.json files for schemes that have no detail at all.
 * Uses Gemini 2.5 Flash to write brief but accurate content from the scheme's
 * myScheme record (name, category, benefitSummary, eligibility).
 *
 * Usage (GitHub Actions only — never run locally with GEMINI_API_KEY):
 *   GEMINI_API_KEY=... node scripts/fill-missing-scheme-detail.mjs [--batch=N]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MYSCHEME_FILE = path.join(ROOT, 'data/schemes/myscheme.json');
const DETAIL_DIR    = path.join(ROOT, 'data/schemes/_detail');
const RW_DIR        = path.join(ROOT, 'data/schemes/_detail_rw');

const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] ?? '40', 10);

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set — this script is for GitHub Actions only');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function genWithRetry(prompt) {
  const delays = [2000, 5000, 12000, 25000];
  for (let i = 0; ; i++) {
    try {
      const res = await model.generateContent(prompt);
      return res.response.text();
    } catch (err) {
      const msg = String(err?.message || '');
      if (!/\[(503|502|429)\b|demand|overloaded|RESOURCE_EXHAUSTED/i.test(msg) || i >= delays.length) throw err;
      const wait = delays[i] + Math.floor(Math.random() * 1000);
      console.error(`  ⏳ Gemini retry ${i+1} in ${Math.round(wait/1000)}s: ${msg.slice(0,60)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

function existingDetailSlugs() {
  const detail = existsSync(DETAIL_DIR) ? new Set(readdirSync(DETAIL_DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0,-5))) : new Set();
  const rw = existsSync(RW_DIR) ? new Set(readdirSync(RW_DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0,-5))) : new Set();
  return { detail, rw };
}

function formatEligibility(elig) {
  if (!elig) return '';
  const parts = [];
  if (elig.gender && elig.gender !== 'any') parts.push(`Gender: ${elig.gender}`);
  if (elig.minAge) parts.push(`Minimum age: ${elig.minAge}`);
  if (elig.maxAge) parts.push(`Maximum age: ${elig.maxAge}`);
  if (elig.maxAnnualIncomeINR) parts.push(`Max annual income: ₹${elig.maxAnnualIncomeINR.toLocaleString('en-IN')}`);
  if (elig.casteCategories?.length && !elig.casteCategories.includes('any')) parts.push(`Categories: ${elig.casteCategories.join(', ')}`);
  if (elig.bplOrPriorityCardRequired) parts.push('BPL/Priority ration card required');
  if (elig.disabilityRequired) parts.push('Person with disability');
  if (elig.widowOnly) parts.push('Widows only');
  if (elig.otherRequirements?.length) parts.push(...elig.otherRequirements.slice(0,3));
  return parts.join('\n');
}

async function enrichScheme(scheme) {
  const stateStr = scheme.state ? `(State: ${scheme.state.replace(/-/g,' ')})` : '(Central scheme)';
  const eligText = formatEligibility(scheme.eligibility);
  const prompt = `You are writing structured JSON content for a government scheme information page.
Scheme: "${scheme.name}" ${stateStr}
Category: ${scheme.schemeCategory || 'general'}
Benefit summary: ${scheme.benefitSummary || 'Government welfare scheme'}
${eligText ? `Eligibility info:\n${eligText}` : ''}

Write a JSON object (NO markdown fences, raw JSON only) with these exact keys:
{
  "slug": "${scheme.msSlug}",
  "name": "${scheme.name}",
  "shortTitle": <2-5 word abbreviation or null>,
  "level": "${scheme.level}",
  "state": ${scheme.state ? `"${scheme.state}"` : 'null'},
  "nodalDept": <department name or null>,
  "schemeFor": "Individual" or "Household" etc,
  "targetBeneficiaries": [<list of who this targets>],
  "benefitType": "${scheme.benefitType || 'service'}",
  "briefDescription": <1-2 sentence plain English description, max 180 chars>,
  "descriptionMd": <2-4 sentence markdown description of what the scheme does and why>,
  "benefitsMd": <markdown bullet list of 2-5 specific benefits with amounts/details where known>,
  "eligibilityMd": <markdown bullet list of 3-6 eligibility criteria — ONLY use facts from the input above, do NOT invent criteria>,
  "exclusionsMd": <1-3 line markdown of who is NOT eligible, or empty string if unknown>,
  "applicationMode": "Online" or "Offline" or "Both" or null,
  "applicationMd": <Step 1: ... Step 2: ... style markdown, 2-4 steps. If unknown, write "Contact the nodal department or visit the official scheme portal to apply.">,
  "references": [],
  "fetchedAt": "${new Date().toISOString().slice(0,10)}"
}

CRITICAL RULES:
- Do NOT invent specific rupee amounts, dates, or percentages not in the input
- If you don't know a fact, write "Contact the official scheme portal for details" rather than guessing
- Keep eligibilityMd at least 80 characters
- Output raw JSON only — no markdown code fences, no explanation`;

  const text = await genWithRetry(prompt);

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in response: ${text.slice(0,200)}`);
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  mkdirSync(DETAIL_DIR, { recursive: true });

  const schemes = JSON.parse(readFileSync(MYSCHEME_FILE, 'utf-8'));
  const { detail, rw } = existingDetailSlugs();

  const missing = schemes.filter(s => {
    const ms = s.msSlug;
    return ms && !detail.has(ms) && !rw.has(ms);
  });

  console.log(`Total missing _detail files: ${missing.length}`);
  const batch = missing.slice(0, BATCH_SIZE);
  console.log(`Processing batch of ${batch.length} schemes...`);

  let done = 0, failed = 0;
  for (const scheme of batch) {
    const outPath = path.join(DETAIL_DIR, `${scheme.msSlug}.json`);
    try {
      process.stdout.write(`  ${scheme.msSlug} (${scheme.name.slice(0,50)})... `);
      const enriched = await enrichScheme(scheme);
      writeFileSync(outPath, JSON.stringify(enriched, null, 2));
      console.log('✅');
      done++;
    } catch (err) {
      console.log(`❌ ${err.message?.slice(0,80)}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 500)); // gentle rate limit
  }

  console.log(`\nDone: ${done} enriched, ${failed} failed`);
  console.log(`Remaining after this run: ${missing.length - done}`);
  process.exit(failed > done ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Exam Cluster Generator — turns a mined cluster plan into live, interlinked
 * pages. Part of the exam-vertical growth engine (see exam-cluster-miner.mjs).
 *
 * For each winnable sub-intent it: (1) pulls real Brave SERP context (titles +
 * descriptions of what ranks) as GROUNDING, (2) asks Gemini to write a focused,
 * factual page using only that grounding — strict no-fabrication rules, unknown
 * dates/fees → "check the official website", (3) writes content/updates/<slug>.md
 * with cluster interlinks. Evergreen slugs (no year) so they stay indexed.
 *
 * Usage:
 *   node scripts/generate-exam-cluster.mjs "KPSC FDA SDA 2026" --only admit-card,answer-key,syllabus
 *   node scripts/generate-exam-cluster.mjs "KPSC FDA SDA 2026" --dry-run
 *
 * Frugal Brave use (1 query per page). Reads keys from .env.local.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = (k) => (process.env[k] || (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`${k}=(.*)`)) || [])[1] || "").trim();
const GEMINI_KEY = env("GEMINI_API_KEY"), BRAVE_KEY = env("BRAVE_SEARCH_API_KEY");
const UPDATES = path.join(ROOT, "content/updates");
const SITE = "https://www.citizennest.com";
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const onlyI = args.indexOf("--only");
const ONLY = onlyI !== -1 ? args[onlyI + 1].split(",") : null;
// exam = positional args, excluding flags and the value after --only
const skip = new Set();
if (onlyI !== -1) { skip.add(onlyI); skip.add(onlyI + 1); }
const exam = args.filter((a, i) => !a.startsWith("--") && !skip.has(i)).join(" ").trim();
if (!GEMINI_KEY || !BRAVE_KEY) { console.error("Need GEMINI_API_KEY + BRAVE_SEARCH_API_KEY in .env.local"); process.exit(1); }
if (!exam) { console.error('Usage: node scripts/generate-exam-cluster.mjs "<exam>" [--only a,b] [--dry-run]'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const SUB_LABEL = { notification: "Notification", "apply-online": "How to Apply Online", "last-date": "Last Date to Apply", "exam-date": "Exam Date", "admit-card": "Admit Card Download", result: "Result", "answer-key": "Answer Key", syllabus: "Syllabus & Exam Pattern", eligibility: "Eligibility Criteria", salary: "Salary & Pay Scale", cutoff: "Cut-Off Marks" };
const SUB_CATEGORY = { notification: "Government Jobs", "apply-online": "Government Jobs", "last-date": "Government Jobs", "exam-date": "Entrance Exams", "admit-card": "Admit Cards", result: "Results", "answer-key": "Answer Keys", syllabus: "Entrance Exams", eligibility: "Government Jobs", salary: "Government Jobs", cutoff: "Results" };

async function genWithRetry(model, input) {
  const delays = [2000, 5000, 12000, 25000, 45000];
  for (let i = 0; ; i++) {
    try { return await model.generateContent(input); }
    catch (e) { const m = String(e?.message || ""); if (!/\[(503|502|500|429)\b|high demand|overloaded|unavailable|temporar|rate.?limit|RESOURCE_EXHAUSTED|error fetching|fetch failed|network|ECONN|ETIMEDOUT|socket|terminated|EAI_AGAIN/i.test(m) || i >= delays.length) throw e; console.log(`  ⏳ Gemini retry ${i + 1}`); await sleep(delays[i] + Math.random() * 1500); }
  }
}

async function braveContext(q) {
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=8&country=IN`, { headers: { "X-Subscription-Token": BRAVE_KEY, Accept: "application/json" } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.web?.results || []).map((x) => ({ title: x.title, desc: x.description, url: x.url }));
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 75); }
function frontmatter(o) {
  const esc = (s) => String(s).replace(/"/g, '\\"');
  return `---
title: "${esc(o.title)}"
description: "${esc(o.description)}"
category: "${o.category}"
type: "${o.type}"
organization: "${esc(o.organization)}"
examName: "${esc(o.examName)}"
stage: "${o.type}"
keywords:
${(o.keywords || []).map((k) => `  - "${esc(k)}"`).join("\n")}
officialLinks:
${(o.officialLinks || []).map((l) => `  - "${l}"`).join("\n")}
readingTime: "5 min"
publishedDate: "${new Date().toISOString().slice(0, 10)}"
status: "active"
---`;
}

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: {
  type: "object", properties: { title: { type: "string" }, description: { type: "string" }, keywords: { type: "array", items: { type: "string" } }, officialLinks: { type: "array", items: { type: "string" } }, contentMarkdown: { type: "string" } }, required: ["title", "description", "keywords", "contentMarkdown"],
} } });

async function main() {
  const planFile = path.join(ROOT, "agents/cluster-plans", `${slugify(exam)}.json`);
  if (!fs.existsSync(planFile)) { console.error(`No cluster plan — run: node scripts/exam-cluster-miner.mjs "${exam}"`); process.exit(1); }
  const { plan } = JSON.parse(fs.readFileSync(planFile, "utf8"));
  let targets = plan.filter((p) => p.verdict !== "HARD");
  if (ONLY) targets = targets.filter((p) => ONLY.includes(p.slug));
  console.log(`Generating ${targets.length} cluster page(s) for "${exam}"`);
  const examSlug = slugify(exam.replace(/\b20\d{2}\b/g, "").trim()); // evergreen base, no year
  const siblings = targets.map((t) => ({ slug: `${examSlug}-${t.slug}`, label: SUB_LABEL[t.slug] || t.slug }));
  fs.mkdirSync(UPDATES, { recursive: true });

  let made = 0;
  for (const t of targets) {
    const intent = SUB_LABEL[t.slug] || t.slug;
    const ctx = await braveContext(`${exam} ${t.slug.replace("-", " ")}`);
    await sleep(1200);
    const grounding = ctx.slice(0, 6).map((c) => `- ${c.title}: ${c.desc} (${c.url})`).join("\n");
    const relLinks = siblings.filter((s) => s.slug !== `${examSlug}-${t.slug}`).map((s) => `- [${exam} ${s.label}](${SITE}/update/${s.slug})`).join("\n");
    const prompt = `You are writing a factual page for citizennest.com about the Indian exam "${exam}", focused ONLY on: ${intent}.

GROUNDING (real search results — use ONLY facts supported here; do NOT invent dates, fees, vacancy numbers or URLs):
${grounding || "(no results — keep the page generic and process-focused)"}

RULES:
- Cover ONLY the "${intent}" sub-topic in depth (not the whole exam).
- Any specific date/fee/number you are not sure of → write "check the official website".
- Use official URLs only (.gov.in/.nic.in/.ac.in) — pick from the grounding; if none, omit.
- Markdown body: ## sections, a direct answer in the first paragraph, a short FAQ (3-4 Q&As). No H1.
- End the body with this exact "Related pages" section:

## Related ${exam.replace(/\b20\d{2}\b/g, "").trim()} Pages
${relLinks}

Return JSON: title (55-65 chars, include "${intent}" + exam), description (120-160 chars, action-oriented), keywords (5-7 real search phrases), officialLinks (1-2 official URLs from grounding, may be empty), contentMarkdown (500-900 words).`;

    try {
      const res = await genWithRetry(model, prompt);
      const data = JSON.parse(res.response.text());
      const fm = frontmatter({ title: data.title, description: data.description, category: SUB_CATEGORY[t.slug] || "Government Jobs", type: t.slug, organization: exam.split(" ")[0], examName: exam, keywords: data.keywords, officialLinks: data.officialLinks });
      const body = `${fm}\n\n${data.contentMarkdown.trim()}\n`;
      const out = path.join(UPDATES, `${examSlug}-${t.slug}.md`);
      if (DRY) { console.log(`  🔵 [dry] ${path.basename(out)} — ${data.title}`); }
      else { fs.writeFileSync(out, body); console.log(`  ✅ ${path.basename(out)} — ${data.title}`); made++; }
    } catch (e) { console.error(`  ✗ ${t.slug}: ${String(e.message).slice(0, 120)}`); }
    await sleep(800);
  }
  console.log(`\nDONE: ${DRY ? "dry-run" : made + " cluster page(s) written"}. Build/deploy to publish + auto-index.`);
}
main();

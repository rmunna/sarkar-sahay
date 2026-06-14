#!/usr/bin/env node
/**
 * Exam Cluster Miner — the discovery layer of the exam-vertical growth engine.
 *
 * Given a seed exam (e.g. "KPSC FDA SDA 2026"), it expands the standard exam
 * sub-intent query spread, asks Brave Search what ranks for each, and scores
 * how WINNABLE each sub-query is (weak/forum competitors = winnable; wall of
 * .gov + big aggregators = hard). It also flags whether citizennest already
 * ranks. Output = a prioritised cluster build-plan: which pages to create.
 *
 * Frugal by design (~11 Brave queries per exam) — Brave free tier has a small
 * monthly cap. Polite 1.2s spacing between calls.
 *
 *   node scripts/exam-cluster-miner.mjs "KPSC FDA SDA 2026"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEY = (process.env.BRAVE_SEARCH_API_KEY ||
  (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(/BRAVE_SEARCH_API_KEY=(.*)/) || [])[1] || "").trim();
const exam = process.argv.slice(2).join(" ").trim();
if (!KEY) { console.error("No BRAVE_SEARCH_API_KEY"); process.exit(1); }
if (!exam) { console.error('Usage: node scripts/exam-cluster-miner.mjs "<exam name>"'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the standard sub-intents every exam audience searches — one cluster page each
const SUBINTENTS = [
  ["notification", "notification"],
  ["apply-online", "apply online application form"],
  ["last-date", "application last date"],
  ["exam-date", "exam date"],
  ["admit-card", "admit card download"],
  ["result", "result"],
  ["answer-key", "answer key"],
  ["syllabus", "syllabus exam pattern"],
  ["eligibility", "eligibility age limit"],
  ["salary", "salary in hand pay scale"],
  ["cutoff", "cut off marks"],
];

// domains that are hard to displace (official + big national aggregators)
const STRONG = /\.gov\.in|\.nic\.in|\.gov$|sarkariresult|jagranjosh|careerpower|adda247|testbook|byjus|embibe|shiksha|collegedunia|careers360|freejobalert|wikipedia/i;

async function brave(q) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10&country=IN`;
  const r = await fetch(url, { headers: { "X-Subscription-Token": KEY, Accept: "application/json" } });
  if (!r.ok) return { error: r.status };
  const j = await r.json();
  return { results: (j.web?.results || []).map((x) => ({ host: (() => { try { return new URL(x.url).hostname.replace(/^www\./, ""); } catch { return ""; } })(), title: x.title })) };
}

function score(results) {
  const top5 = results.slice(0, 5);
  const strongTop5 = top5.filter((r) => STRONG.test(r.host)).length;
  const ourPos = results.findIndex((r) => /citizennest\.com/.test(r.host));
  // winnable if the top 5 is NOT a wall of strong sites
  const verdict = strongTop5 <= 2 ? "WINNABLE" : strongTop5 === 3 ? "MEDIUM" : "HARD";
  return { verdict, strongTop5, ourPos: ourPos === -1 ? null : ourPos + 1, top3: top5.slice(0, 3).map((r) => r.host) };
}

const plan = [];
for (const [slug, suffix] of SUBINTENTS) {
  const q = `${exam} ${suffix}`;
  const res = await brave(q);
  if (res.error) { console.log(`  ! ${slug}: Brave HTTP ${res.error}`); await sleep(1200); continue; }
  const s = score(res.results);
  plan.push({ slug, query: q, ...s });
  const ours = s.ourPos ? `we rank #${s.ourPos}` : "we DON'T rank";
  console.log(`${s.verdict.padEnd(9)} | ${ours.padEnd(16)} | strong-in-top5:${s.strongTop5} | ${slug.padEnd(12)} | top: ${s.top3.join(", ")}`);
  await sleep(1200);
}

// build recommendation: winnable + not-already-ranking-well = highest priority
const priority = plan
  .filter((p) => p.verdict !== "HARD")
  .sort((a, b) => (a.verdict === "WINNABLE" ? -1 : 1) - (b.verdict === "WINNABLE" ? -1 : 1));
console.log(`\n=== CLUSTER BUILD PLAN for "${exam}" ===`);
console.log(`Recommended pages (winnable/medium, prioritised):`);
priority.forEach((p) => console.log(`  • ${exam} ${p.slug}  [${p.verdict}${p.ourPos ? `, currently #${p.ourPos}` : ", new"}]`));
fs.mkdirSync(path.join(ROOT, "agents", "cluster-plans"), { recursive: true });
const out = path.join(ROOT, "agents", "cluster-plans", `${exam.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.json`);
fs.writeFileSync(out, JSON.stringify({ exam, generatedAt: new Date().toISOString(), plan }, null, 2));
console.log(`\nplan saved → ${path.relative(ROOT, out)}`);

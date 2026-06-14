#!/usr/bin/env node
/**
 * Exam Cluster Research Tool — pulls Brave SERP context for each winnable
 * sub-intent in a mined cluster plan and prints a grounding brief.
 *
 * Claude writes the actual page content in sessions (like scheme rewrites).
 * This script handles only: Brave research → brief output.
 *
 * Usage:
 *   node scripts/generate-exam-cluster.mjs "KPSC FDA SDA 2026" [--only admit-card,syllabus]
 *
 * Frugal: 1 Brave query per sub-intent. Reads BRAVE_SEARCH_API_KEY from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEY = (process.env.BRAVE_SEARCH_API_KEY ||
  (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(/BRAVE_SEARCH_API_KEY=(.*)/) || [])[1] || "").trim();
if (!KEY) { console.error("No BRAVE_SEARCH_API_KEY in .env.local"); process.exit(1); }

const args = process.argv.slice(2);
const onlyI = args.indexOf("--only");
const ONLY = onlyI !== -1 ? args[onlyI + 1].split(",") : null;
const skip = new Set(); if (onlyI !== -1) { skip.add(onlyI); skip.add(onlyI + 1); }
const exam = args.filter((a, i) => !a.startsWith("--") && !skip.has(i)).join(" ").trim();
if (!exam) { console.error('Usage: node scripts/generate-exam-cluster.mjs "<exam>" [--only a,b]'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 75); }

async function brave(q) {
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=8&country=IN`,
    { headers: { "X-Subscription-Token": KEY, Accept: "application/json" } });
  if (!r.ok) return [];
  return ((await r.json()).web?.results || []).map((x) => ({ title: x.title, desc: x.description, url: x.url }));
}

const planFile = path.join(ROOT, "agents/cluster-plans", `${slugify(exam)}.json`);
if (!fs.existsSync(planFile)) { console.error(`No cluster plan — run: node scripts/exam-cluster-miner.mjs "${exam}"`); process.exit(1); }
const { plan } = JSON.parse(fs.readFileSync(planFile, "utf8"));
let targets = plan.filter((p) => p.verdict !== "HARD");
if (ONLY) targets = targets.filter((p) => ONLY.includes(p.slug));

console.log(`\n=== CLUSTER RESEARCH BRIEF: "${exam}" (${targets.length} sub-intents) ===\n`);
for (const t of targets) {
  const ctx = await brave(t.query);
  console.log(`--- ${t.slug.toUpperCase()} [${t.verdict}${t.ourPos ? `, we rank #${t.ourPos}` : ", new"}] ---`);
  ctx.slice(0, 5).forEach((c) => console.log(`  • ${c.title}\n    ${c.desc?.slice(0, 120) || ""}\n    ${c.url}`));
  console.log();
  await sleep(1200);
}
console.log("Brief complete. Write content/updates/<examSlug>-<subintent>.md for each sub-intent.");

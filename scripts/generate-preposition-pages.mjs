#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UPDATES_DIR = path.join(ROOT, "content", "updates");
const DEFAULT_PAYLOAD = path.join(ROOT, "agents", "cloudflare-detections.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
if (process.env.ALLOW_PREPOSITION_PAGES !== "true") {
  console.log(JSON.stringify({
    ok: true,
    dryRun,
    received: 0,
    written: 0,
    skipped: "preposition pages disabled; official confirmation required before publishing"
  }, null, 2));
  process.exit(0);
}
const fileArg = args.find(arg => arg.startsWith("--file"));
const payloadPath = fileArg
  ? path.resolve(ROOT, fileArg.split("=")[1] || args[args.indexOf(fileArg) + 1])
  : DEFAULT_PAYLOAD;

const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const detections = (Array.isArray(payload) ? payload : payload.detections || [])
  .filter(detection => detection.strategy === "trend_preposition" || detection.safeContentMode === "preposition_only");

fs.mkdirSync(UPDATES_DIR, { recursive: true });

const generatedSlugs = [];
for (const detection of detections) {
  const page = buildPrepositionPage(detection);
  const filePath = path.join(UPDATES_DIR, `${page.slug}.md`);
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (previous === page.content) continue;
  generatedSlugs.push(page.slug);
  if (!dryRun) fs.writeFileSync(filePath, page.content, "utf8");
}

if (!dryRun) {
  fs.mkdirSync(path.join(ROOT, "agents"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "agents", ".newly-generated-slugs"), generatedSlugs.join("\n") + (generatedSlugs.length ? "\n" : ""), "utf8");
}

console.log(JSON.stringify({ ok: true, dryRun, received: detections.length, written: generatedSlugs.length, slugs: generatedSlugs }, null, 2));

function buildPrepositionPage(detection) {
  const topic = humanTopic(detection);
  const org = organizationName(detection);
  const stage = safeStage(detection.stage);
  const year = topic.match(/\b20\d{2}\b/)?.[0] || detection.trendTopicKey?.match(/\b20\d{2}\b/)?.[0] || new Date().getFullYear();
  const slug = slugify(`${org} ${topic} status ${year}`.replace(/\b(current|status status)\b/gi, ""));
  const officialUrl = detection.officialSourceUrl || detection.url;
  const today = new Date().toISOString().slice(0, 10);
  const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const keywords = unique([
    `${topic} status`,
    `${topic} official update`,
    `${topic} result status`,
    `${topic} admit card status`,
    `${org} official update`
  ]).slice(0, 8);

  const title = `${topic} Official Status ${year}`;
  const description = `${topic} official status for ${year}. Check official ${org} links, current release status, safe steps, and scam warnings.`;

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description.slice(0, 178))}`,
    `type: ${JSON.stringify(stage)}`,
    `category: ${JSON.stringify(categoryForStage(stage))}`,
    "keywords:",
    ...keywords.map(keyword => `  - ${JSON.stringify(keyword)}`),
    `organization: ${JSON.stringify(org)}`,
    `examName: ${JSON.stringify(topic)}`,
    `stage: ${JSON.stringify(stage)}`,
    `publishedDate: ${JSON.stringify(today)}`,
    `expiryDate: ${JSON.stringify(expiry)}`,
    "importantDates:",
    "  officialReleaseDate: TBA",
    "officialLinks:",
    `  - ${JSON.stringify(officialUrl)}`,
    `readingTime: ${JSON.stringify("3 min")}`,
    `status: ${JSON.stringify("active")}`,
    `prepositionOnly: true`,
    `officialConfirmationRequired: true`,
    `trendTopicKey: ${JSON.stringify(detection.trendTopicKey || "")}`,
    "---",
    ""
  ].join("\n");

  const body = [
    `## ${topic} Status ${year}`,
    "",
    `This page is limited to officially confirmed information for ${topic}. If the official source has not released a notice, result, admit card, answer key, or schedule, this page must not be published.`,
    "",
    "| Detail | Current Status |",
    "|---|---|",
    `| Organization | ${org} |`,
    `| Topic | ${topic} |`,
    `| Release status | Not officially confirmed yet |`,
    `| Official source being monitored | [${officialHost(officialUrl)}](${officialUrl}) |`,
    `| Last checked | ${today} |`,
    "",
    "## Current Official Status",
    "",
    `As of ${today}, the monitor has not found a matching official release notice for this topic. This page will be updated when an official notice, result link, admit card link, answer key, or schedule is detected from the official source.`,
    "",
    "Do not trust screenshots, copied PDFs, or social media posts unless the same update is available on the official portal linked above.",
    "",
    "## How to Check Safely",
    "",
    `1. Open the official ${org} portal linked above.`,
    "2. Look for notices, latest updates, results, admit cards, answer keys, or recruitment announcements.",
    "3. Match the notice title and year before acting.",
    "4. Use only official links for login, application, result, or download.",
    "",
    "## What This Page Will Not Do",
    "",
    "- It will not say the result, admit card, answer key, or notification is released unless the official source confirms it.",
    "- It will not publish unofficial last dates, vacancies, marks, cutoffs, or download links.",
    "- It will not link to private coaching, mirror, or file-sharing sites as official proof.",
    "",
    "## Frequently Asked Questions",
    "",
    `### Is ${topic} released?`,
    "",
    "Not confirmed from the official source at the time this tracker was generated.",
    "",
    `### Where should I check ${topic}?`,
    "",
    `Check only the official ${org} portal: [${officialUrl}](${officialUrl}).`,
    "",
    "### Why did CitizenNest create this page before release?",
    "",
    "Only after an official source confirms a notice, result, admit card, answer key, or schedule.",
    "",
    "---",
    "",
    `CitizenNest is not affiliated with ${org}. Always verify final information on the official portal before applying, downloading, or sharing personal details.`
  ].join("\n");

  return { slug, content: `${frontmatter}${body}\n` };
}

function safeStage(stage) {
  const allowed = new Set(["notification", "admit-card", "exam-schedule", "result", "cutoff", "answer-key", "registration"]);
  return allowed.has(stage) ? stage : "notification";
}

function categoryForStage(stage) {
  if (stage === "result") return "Results";
  if (stage === "admit-card") return "Admit Cards";
  if (stage === "answer-key") return "Answer Keys";
  if (stage === "exam-schedule") return "Exam Schedule";
  return "Government Jobs";
}

function humanTopic(detection) {
  const source = detection.trendTopicKey || detection.trendTitle || detection.title || "Official Update";
  return titleCase(String(source)
    .split(":")
    .filter(Boolean)
    .slice(0, 3)
    .join(" ")
    .replace(/-/g, " "));
}

function organizationName(detection) {
  return detection.officialSourceName || detection.sourceName || titleCase((detection.sourceId || "official").replace(/-/g, " "));
}

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, value => value.toUpperCase())
    .replace(/\bUg\b/g, "UG")
    .replace(/\bGds\b/g, "GDS")
    .replace(/\bRrb\b/g, "RRB")
    .replace(/\bSsc\b/g, "SSC")
    .replace(/\bNta\b/g, "NTA")
    .replace(/\bCuet\b/g, "CUET");
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

function officialHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

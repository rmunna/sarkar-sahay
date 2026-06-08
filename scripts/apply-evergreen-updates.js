#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GUIDES_DIR = path.join(ROOT, "content", "guides");
const OUT_DIR = path.join(ROOT, "agents");
const DEFAULT_INPUT = path.join(OUT_DIR, "evergreen-opportunities.json");
const START = "<!-- CITIZENNEST:OFFICIAL_UPDATE_START -->";
const END = "<!-- CITIZENNEST:OFFICIAL_UPDATE_END -->";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = valueForArg("--opportunities-file") || DEFAULT_INPUT;
const inputPath = path.resolve(ROOT, fileArg);
const today = formatIndiaDate(new Date());

function valueForArg(name) {
  const exact = args.find(arg => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function formatIndiaDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const data = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${data.year}-${data.month}-${data.day}`;
}

function readPayload() {
  if (!fs.existsSync(inputPath)) {
    return [];
  }
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const raw = Array.isArray(payload) ? payload : (payload.detections || payload.opportunities || []);
  return raw.filter(item => item?.decision === "update_existing" && item?.existingPageMatch?.slug);
}

function itemKey(item) {
  return item.id || item.key || "";
}

function guidePathFromSlug(route) {
  const value = String(route || "").trim();
  const match = value.match(/^\/guide\/([a-z0-9-]+)$/) || value.match(/^([a-z0-9-]+)$/);
  if (!match) return null;
  return path.join(GUIDES_DIR, `${match[1]}.md`);
}

function escapeCell(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function markdownLink(title, url) {
  return `[${escapeCell(title || url)}](${String(url || "").trim()})`;
}

function isOfficialUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.endsWith(".gov.in")
      || host.endsWith(".nic.in")
      || host.endsWith(".ac.in")
      || host.endsWith(".edu.in")
      || host.endsWith("pib.gov.in")
      || host.endsWith("rbi.org.in")
      || host.endsWith("agristack.gov.in")
      || host.endsWith("mybharat.gov.in")
      || host.endsWith("abdm.gov.in")
      || host.endsWith("pmsuryaghar.gov.in");
  } catch {
    return false;
  }
}

function splitFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return { frontmatter: "", body: content };
  }
  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: "", body: content };
  }
  return {
    frontmatter: content.slice(0, end + 4),
    body: content.slice(end + 4).replace(/^\n+/, "")
  };
}

function updateFrontmatter(frontmatter, urls) {
  let next = frontmatter;
  if (/^lastUpdated:/m.test(next)) {
    next = next.replace(/^lastUpdated:\s*["']?[^"'\n]+["']?\s*$/m, `lastUpdated: "${today}"`);
  } else {
    next = next.replace(/\n---$/, `\nlastUpdated: "${today}"\n---`);
  }

  for (const url of urls) {
    if (!url || next.includes(url)) continue;
    if (/^officialLinks:\s*$/m.test(next)) {
      next = next.replace(/^officialLinks:\s*$/m, `officialLinks:\n  - "${url}"`);
    } else {
      next = next.replace(/\n---$/, `\nofficialLinks:\n  - "${url}"\n---`);
    }
  }
  return next;
}

function existingRows(body) {
  const rows = new Map();
  const block = extractManagedBlock(body);
  if (!block) return rows;
  const rowRegex = /^\|\s*([^|]+)\s*\|\s*(\[[^\]]+\]\(([^)]+)\))\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|$/gm;
  let match;
  while ((match = rowRegex.exec(block)) !== null) {
    rows.set(match[3], match[0]);
  }
  return rows;
}

function extractManagedBlock(body) {
  const start = body.indexOf(START);
  const end = body.indexOf(END);
  if (start === -1 || end === -1 || end < start) return null;
  return body.slice(start, end + END.length);
}

function buildManagedBlock(rows) {
  return [
    START,
    "## Latest Official Update",
    "",
    "This page is refreshed when CitizenNest detects a relevant official update. Always verify final eligibility, dates and application steps on the official link before acting.",
    "",
    "| Date | Official update | Source | Queue status |",
    "|---|---|---|---|",
    ...rows,
    END
  ].join("\n");
}

function insertOrReplaceBlock(body, block) {
  const start = body.indexOf(START);
  const end = body.indexOf(END);
  if (start !== -1 && end !== -1 && end > start) {
    return `${body.slice(0, start).trimEnd()}\n\n${block}\n\n${body.slice(end + END.length).trimStart()}`;
  }

  const lines = body.split("\n");
  const h1Index = lines.findIndex(line => /^#\s+/.test(line));
  if (h1Index === -1) {
    return `${block}\n\n${body}`;
  }
  lines.splice(h1Index + 1, 0, "", block, "");
  return lines.join("\n");
}

function updateGuide(filePath, updates) {
  const original = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(original);
  const existing = existingRows(body);
  let added = 0;

  for (const update of updates) {
    if (!isOfficialUrl(update.url) || existing.has(update.url)) continue;
    const row = `| ${escapeCell(update.date || today)} | ${markdownLink(update.title, update.url)} | ${escapeCell(update.sourceName || update.sourceId || "Official source")} | ${escapeCell(update.status || "update_ready")} |`;
    existing.set(update.url, row);
    added++;
  }

  if (added === 0) return { changed: false, added: 0 };

  const rows = [...existing.values()].slice(-8).reverse();
  const officialUrls = updates.map(update => update.url).filter(isOfficialUrl);
  const nextFrontmatter = frontmatter ? updateFrontmatter(frontmatter, officialUrls) : frontmatter;
  const nextBody = insertOrReplaceBlock(body, buildManagedBlock(rows));
  const next = `${nextFrontmatter}\n${nextBody.trim()}\n`;

  if (!dryRun) {
    fs.writeFileSync(filePath, next, "utf8");
  }
  return { changed: next !== original, added };
}

function main() {
  const detections = readPayload();
  const grouped = new Map();
  const results = { updated: [], skipped: [], errors: [] };

  for (const detection of detections) {
    const filePath = guidePathFromSlug(detection.existingPageMatch.slug);
    if (!filePath || !fs.existsSync(filePath)) {
      results.errors.push({ key: detection.id, reason: "matched guide not found", slug: detection.existingPageMatch.slug });
      continue;
    }
    if (!grouped.has(filePath)) grouped.set(filePath, []);
    grouped.get(filePath).push(detection);
  }

  for (const [filePath, updates] of grouped) {
    try {
      const result = updateGuide(filePath, updates);
      const slug = path.basename(filePath, ".md");
      if (result.changed) {
        results.updated.push({ slug, path: path.relative(ROOT, filePath), added: result.added, keys: updates.map(itemKey).filter(Boolean) });
      } else {
        results.skipped.push({ slug, reason: "no new official update rows", keys: updates.map(itemKey).filter(Boolean) });
      }
    } catch (error) {
      results.errors.push({ path: path.relative(ROOT, filePath), reason: error.message });
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "evergreen-update-results.json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, ".evergreen-updated-slugs"), results.updated.map(item => item.slug).join("\n"));
  fs.writeFileSync(path.join(OUT_DIR, ".evergreen-opportunity-keys"), results.updated.flatMap(item => item.keys).join("\n"));

  console.log(JSON.stringify({
    dryRun,
    updated: results.updated.length,
    skipped: results.skipped.length,
    errors: results.errors.length,
    results
  }, null, 2));

  if (results.errors.length > 0) {
    process.exitCode = 1;
  }
}

main();

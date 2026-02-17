#!/usr/bin/env node
/**
 * QA validation for update content (job notifications, results, etc.)
 * Stricter than guide QA — validates dates, required fields, link domains.
 *
 * Usage:
 *   node agents/qa-validate-update.js --all
 *   node agents/qa-validate-update.js --file content/updates/ssc-cgl-2026-notification.md
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const updatesDir = path.join(__dirname, "..", "content", "updates");

const VALID_CATEGORIES = ["Government Jobs", "Entrance Exams", "Results", "Admit Cards"];
const VALID_TYPES = ["notification", "admit-card", "exam-schedule", "result", "cutoff", "answer-key"];
const VALID_STATUSES = ["active", "expired", "superseded"];
const REQUIRED_FIELDS = ["title", "description", "category", "type", "organization", "examName", "stage", "keywords", "officialLinks", "publishedDate", "status"];
const ALLOWED_LINK_DOMAINS = [".gov.in", ".nic.in", ".ac.in", "sbi.co.in", "ibps.in", "onlinesbi.sbi", "rbi.org.in", "nta.ac.in"];

function validateUpdate(filePath) {
  const errors = [];
  const warnings = [];
  const filename = path.basename(filePath);

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    return { filename, errors: [`Cannot read file: ${e.message}`], warnings: [] };
  }

  let data, content;
  try {
    const parsed = matter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (e) {
    return { filename, errors: [`Invalid YAML frontmatter: ${e.message}`], warnings: [] };
  }

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Category validation
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category "${data.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Type validation
  if (data.type && !VALID_TYPES.includes(data.type)) {
    errors.push(`Invalid type "${data.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  // Status validation
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Invalid status "${data.status}". Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  // Description length
  if (data.description) {
    if (data.description.length < 100) {
      warnings.push(`Description too short (${data.description.length} chars, target 140-160)`);
    }
    if (data.description.length > 170) {
      warnings.push(`Description too long (${data.description.length} chars, target 140-160)`);
    }
  }

  // Keywords
  if (data.keywords && !Array.isArray(data.keywords)) {
    errors.push("keywords must be an array");
  } else if (data.keywords && data.keywords.length < 3) {
    warnings.push(`Only ${data.keywords.length} keywords (recommend 5+)`);
  }

  // Official links must be plain strings
  if (data.officialLinks) {
    if (!Array.isArray(data.officialLinks)) {
      errors.push("officialLinks must be an array");
    } else {
      for (const link of data.officialLinks) {
        if (typeof link !== "string") {
          errors.push(`officialLinks must be plain URL strings, got: ${typeof link}`);
          break;
        }
        // Domain validation — must be government/official domain
        try {
          const hostname = new URL(link).hostname;
          const isAllowed = ALLOWED_LINK_DOMAINS.some((d) => hostname.endsWith(d));
          if (!isAllowed) {
            warnings.push(`Non-official domain in officialLinks: ${hostname} — verify this is a legitimate source`);
          }
        } catch {
          errors.push(`Invalid URL in officialLinks: ${link}`);
        }
      }
    }
  }

  // Date validations
  if (data.importantDates && typeof data.importantDates === "object") {
    for (const [key, val] of Object.entries(data.importantDates)) {
      if (val && val !== "TBA" && typeof val === "string") {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(val)) {
          errors.push(`importantDates.${key} must be YYYY-MM-DD format, got: ${val}`);
        } else {
          const d = new Date(val);
          if (isNaN(d.getTime())) {
            errors.push(`importantDates.${key} is not a valid date: ${val}`);
          }
        }
      }
    }

    // For new notifications, last date to apply shouldn't be in the past
    if (data.status === "active" && data.type === "notification") {
      const lastDate = data.importantDates.lastDateToApply;
      if (lastDate && lastDate !== "TBA" && new Date(lastDate) < new Date()) {
        warnings.push(`Last date to apply (${lastDate}) is in the past but status is "active"`);
      }
    }
  }

  // Published date format
  if (data.publishedDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.publishedDate)) {
      errors.push(`publishedDate must be YYYY-MM-DD format`);
    }
  }

  // readingTime format
  if (data.readingTime && !/^\d+ min$/.test(data.readingTime)) {
    errors.push(`readingTime must be "X min" format, got: "${data.readingTime}"`);
  }

  // Frontmatter key casing
  const snakeCaseKeys = Object.keys(data).filter((k) => k.includes("_"));
  if (snakeCaseKeys.length > 0) {
    errors.push(`Snake_case keys found (must be camelCase): ${snakeCaseKeys.join(", ")}`);
  }

  // Content checks
  if (content.length < 500) {
    warnings.push(`Content seems too short (${content.length} chars)`);
  }

  // Must have FAQ section
  if (!content.includes("FAQ") && !content.includes("Frequently Asked")) {
    warnings.push("No FAQ section found");
  }

  return { filename, errors, warnings };
}

function run() {
  const args = process.argv.slice(2);
  let files = [];

  if (args.includes("--all")) {
    if (!fs.existsSync(updatesDir)) {
      console.log("No updates directory found.");
      process.exit(0);
    }
    files = fs
      .readdirSync(updatesDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(updatesDir, f));
  } else if (args.includes("--file")) {
    const idx = args.indexOf("--file");
    const file = args[idx + 1];
    if (!file) {
      console.error("--file requires a path");
      process.exit(1);
    }
    files = [path.resolve(file)];
  } else {
    // Accept bare file paths (no flags) for convenience
    const mdFiles = args.filter((a) => a.endsWith(".md"));
    if (mdFiles.length > 0) {
      files = mdFiles.map((f) => path.resolve(f));
    } else {
      console.log("Usage: node qa-validate-update.js --all | --file <path> | <path1.md> [path2.md ...]");
      process.exit(1);
    }
  }

  if (files.length === 0) {
    console.log("No update files found.");
    process.exit(0);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const result = validateUpdate(file);
    const hasIssues = result.errors.length > 0 || result.warnings.length > 0;

    if (hasIssues) {
      console.log(`\n${result.errors.length > 0 ? "❌" : "⚠️"} ${result.filename}`);
      for (const err of result.errors) {
        console.log(`  ❌ ${err}`);
      }
      for (const warn of result.warnings) {
        console.log(`  ⚠️  ${warn}`);
      }
    }

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }

  console.log(`\n${totalErrors === 0 ? "✅" : "❌"} ${files.length} file(s) checked. ${totalErrors} error(s), ${totalWarnings} warning(s).`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

run();

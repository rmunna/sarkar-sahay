#!/usr/bin/env node
/**
 * CitizenNest QA Validation Agent
 * Validates a guide markdown file for correctness before commit.
 * 
 * Usage: node qa-validate.js <file-path> [--fix]
 *        node qa-validate.js --all [--fix]
 * 
 * Exit code 0 = pass, 1 = failures found
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const VALID_CATEGORIES = [
  "Identity Documents",
  "Government Schemes",
  "Tax & Finance",
  "Jobs & Exams",
  "Certificates",
  "Utilities",
  "Property & Legal",
  "Food & Ration",
  "State Schemes",
];

const REQUIRED_FRONTMATTER = ["title", "description", "category", "keywords", "officialLinks"];
const CAMELCASE_FIELDS = {
  meta_description: "description",
  reading_time: "readingTime",
  official_links: "officialLinks",
  last_updated: "lastUpdated",
};

const GUIDES_DIR = path.join(__dirname, "..", "content", "guides");

function validateGuide(filePath) {
  const errors = [];
  const warnings = [];
  const fixes = [];
  const fileName = path.basename(filePath);

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    return { file: fileName, errors: [`Cannot read file: ${e.message}`], warnings: [], fixes: [] };
  }

  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return { file: fileName, errors: [`YAML parse error: ${e.message}`], warnings: [], fixes: [] };
  }

  const { data, content } = parsed;

  // 1. Check for snake_case keys
  for (const [snake, camel] of Object.entries(CAMELCASE_FIELDS)) {
    if (data[snake] !== undefined) {
      errors.push(`snake_case key "${snake}" found — must be "${camel}"`);
      fixes.push({ type: "rename_key", from: snake, to: camel });
    }
  }

  // 2. Required frontmatter fields
  for (const field of REQUIRED_FRONTMATTER) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push(`Missing required frontmatter: "${field}"`);
    }
  }

  // 3. officialLinks must be plain strings
  if (Array.isArray(data.officialLinks)) {
    data.officialLinks.forEach((link, i) => {
      if (typeof link !== "string") {
        errors.push(`officialLinks[${i}] is ${typeof link} — must be a plain URL string`);
        fixes.push({ type: "fix_link", index: i, value: link });
      } else if (!link.startsWith("http")) {
        warnings.push(`officialLinks[${i}] doesn't start with http: "${link}"`);
      }
    });
  }

  // 4. Category must be valid
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    warnings.push(`Category "${data.category}" not in standard list: ${VALID_CATEGORIES.join(", ")}`);
  }

  // 5. Title length check
  if (data.title) {
    if (data.title.length > 80) {
      warnings.push(`Title is ${data.title.length} chars (ideal: 50-70 for SEO)`);
    }
    if (data.title.length < 20) {
      warnings.push(`Title seems too short: ${data.title.length} chars`);
    }
  }

  // 6. Description length check
  if (data.description) {
    if (data.description.length > 170) {
      warnings.push(`Description is ${data.description.length} chars (ideal: 140-160 for SEO)`);
    }
    if (data.description.length < 50) {
      warnings.push(`Description seems too short: ${data.description.length} chars`);
    }
  }

  // 7. Keywords check
  if (Array.isArray(data.keywords)) {
    if (data.keywords.length < 3) {
      warnings.push(`Only ${data.keywords.length} keywords (recommend 5+)`);
    }
  }

  // 8. Content quality checks
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 500) {
    warnings.push(`Content is only ${wordCount} words (target: 800-2000)`);
  }

  // 9. Required sections
  const hasSteps = /## .*step/i.test(content) || /### step \d/i.test(content);
  const hasFAQ = /## .*faq/i.test(content) || /## .*frequently asked/i.test(content);
  const hasFees = /## .*fee/i.test(content) || /fee/i.test(content);
  const hasDocuments = /## .*document/i.test(content) || /documents required/i.test(content);
  const hasEligibility = /## .*eligib/i.test(content) || /who is eligible/i.test(content) || /who can apply/i.test(content);

  if (!hasSteps) warnings.push("Missing step-by-step process section");
  if (!hasFAQ) warnings.push("Missing FAQ section");
  if (!hasDocuments && !content.includes("documents")) warnings.push("No documents section found");

  // 10. Check for placeholder text
  const placeholders = ["[INSERT", "[TODO", "PLACEHOLDER", "TBD", "XXXXX", "[YOUR"];
  for (const ph of placeholders) {
    if (content.includes(ph)) {
      errors.push(`Placeholder text found: "${ph}"`);
    }
  }

  // 11. readingTime format
  if (data.readingTime && !/^\d+\s*min$/.test(data.readingTime)) {
    warnings.push(`readingTime format should be "X min", got: "${data.readingTime}"`);
  }

  // 12. Year in title check
  if (data.title && /20[2-3]\d/.test(data.title)) {
    warnings.push(`Title contains a year — remove it for evergreen content`);
  }

  return { file: fileName, errors, warnings, fixes, wordCount };
}

function applyFixes(filePath, result) {
  if (result.fixes.length === 0) return false;
  
  let raw = fs.readFileSync(filePath, "utf8");
  let parsed = matter(raw);
  let changed = false;

  for (const fix of result.fixes) {
    if (fix.type === "rename_key") {
      if (parsed.data[fix.from] !== undefined) {
        parsed.data[fix.to] = parsed.data[fix.from];
        delete parsed.data[fix.from];
        changed = true;
      }
    }
    if (fix.type === "fix_link") {
      const link = parsed.data.officialLinks[fix.index];
      if (typeof link === "object" && link !== null) {
        const url = link.url || link.href || link.link || Object.values(link).find(v => typeof v === "string" && v.startsWith("http"));
        if (url) {
          parsed.data.officialLinks[fix.index] = url;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    const output = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, output);
  }
  return changed;
}

// --- Main ---
const args = process.argv.slice(2);
const doFix = args.includes("--fix");
const runAll = args.includes("--all");
const files = runAll
  ? fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith(".md")).map(f => path.join(GUIDES_DIR, f))
  : args.filter(a => !a.startsWith("--")).map(a => path.resolve(a));

if (files.length === 0) {
  console.error("Usage: node qa-validate.js <file.md> [--fix]");
  console.error("       node qa-validate.js --all [--fix]");
  process.exit(1);
}

let totalErrors = 0;
let totalWarnings = 0;
let totalFixed = 0;

for (const file of files) {
  const result = validateGuide(file);
  
  if (doFix && result.fixes.length > 0) {
    const fixed = applyFixes(file, result);
    if (fixed) {
      totalFixed++;
      console.log(`🔧 FIXED: ${result.file}`);
    }
  }

  if (result.errors.length > 0 || result.warnings.length > 0) {
    console.log(`\n📄 ${result.file}${result.wordCount ? ` (${result.wordCount} words)` : ""}`);
    for (const e of result.errors) console.log(`  ❌ ${e}`);
    for (const w of result.warnings) console.log(`  ⚠️  ${w}`);
  }

  totalErrors += result.errors.length;
  totalWarnings += result.warnings.length;
}

console.log(`\n${"=".repeat(50)}`);
console.log(`📊 QA Summary: ${files.length} files | ❌ ${totalErrors} errors | ⚠️  ${totalWarnings} warnings${doFix ? ` | 🔧 ${totalFixed} fixed` : ""}`);

if (totalErrors > 0) {
  console.log("🔴 QA FAILED — fix errors before committing");
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log("🟡 QA PASSED with warnings");
  process.exit(0);
} else {
  console.log("🟢 QA PASSED — all clear!");
  process.exit(0);
}

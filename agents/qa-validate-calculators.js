#!/usr/bin/env node
/**
 * QA Validator for Calculator Pages
 * Checks that all guideSlug references in calculator TSX files point to actual guides.
 * Run: node agents/qa-validate-calculators.js
 */

const fs = require("fs");
const path = require("path");

const GUIDES_DIR = path.join(__dirname, "../content/guides");
const CALC_DIR = path.join(__dirname, "../src/app/calculator");

// Get all guide slugs
const guideSlugs = new Set(
  fs.readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""))
);

console.log(`📁 Found ${guideSlugs.size} guides in content/guides/\n`);

let totalErrors = 0;
let totalLinks = 0;

// Scan all TSX files in calculator directory (recursive)
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.join(__dirname, ".."), filePath);

  // Pattern 1: guideSlug: "xxx"
  const slugPattern = /guideSlug:\s*["']([^"']+)["']/g;
  let match;
  const errors = [];

  while ((match = slugPattern.exec(content)) !== null) {
    totalLinks++;
    const slug = match[1];
    if (!guideSlugs.has(slug)) {
      errors.push({ slug, line: content.substring(0, match.index).split("\n").length });
    }
  }

  // Pattern 2: href={`/guide/xxx`} or href="/guide/xxx"
  const hrefPattern = /href=\{?["'`]\/guide\/([a-z0-9-]+)["'`]\}?/g;
  while ((match = hrefPattern.exec(content)) !== null) {
    totalLinks++;
    const slug = match[1];
    if (!guideSlugs.has(slug)) {
      // Check if it's a dynamic slug reference (variable)
      if (slug.includes("$")) continue;
      errors.push({ slug, line: content.substring(0, match.index).split("\n").length });
    }
  }

  if (errors.length > 0) {
    console.log(`❌ ${relPath}`);
    for (const err of errors) {
      console.log(`   Line ${err.line}: guideSlug "${err.slug}" → NOT FOUND`);
    }
    totalErrors += errors.length;
  } else {
    // Count links found
    const linkCount = (content.match(/guideSlug:\s*["'][^"']+["']/g) || []).length +
      (content.match(/href=\{?["'`]\/guide\/[a-z0-9-]+["'`]\}?/g) || []).length;
    if (linkCount > 0) {
      console.log(`✅ ${relPath} (${linkCount} links OK)`);
    }
  }
}

scanDir(CALC_DIR);

console.log(`\n${"─".repeat(50)}`);
console.log(`Total links checked: ${totalLinks}`);
if (totalErrors > 0) {
  console.log(`❌ ${totalErrors} broken link(s) found!`);
  process.exit(1);
} else {
  console.log(`✅ All calculator guide links are valid!`);
  process.exit(0);
}

#!/usr/bin/env node
/**
 * Check internal link integrity across all guides.
 * Scans markdown content for /guide/slug references and verifies slugs exist.
 * Also checks relatedGuides in frontmatter.
 *
 * Usage: node agents/check-internal-links.js [--fix]
 * Exit code 1 if broken links found.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const guidesDir = path.join(__dirname, "..", "content", "guides");
const trackerPath = path.join(__dirname, "freshness-tracker.json");

function getAllSlugs() {
  return fs
    .readdirSync(guidesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function run() {
  const slugs = new Set(getAllSlugs());
  const broken = [];

  for (const slug of slugs) {
    const filePath = path.join(guidesDir, `${slug}.md`);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    // Check internal links in content: /guide/some-slug or (/guide/some-slug)
    const linkRegex = /\/guide\/([a-z0-9-]+)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const target = match[1];
      if (!slugs.has(target)) {
        broken.push({ source: slug, target, type: "content-link" });
      }
    }

    // Check relatedGuides frontmatter
    if (data.relatedGuides && Array.isArray(data.relatedGuides)) {
      for (const rg of data.relatedGuides) {
        const rgSlug = rg.replace(/^\/guide\//, "").replace(/\/$/, "");
        if (!slugs.has(rgSlug)) {
          broken.push({ source: slug, target: rgSlug, type: "relatedGuides" });
        }
      }
    }
  }

  if (broken.length === 0) {
    console.log(`✅ All internal links valid across ${slugs.size} guides.`);
    process.exit(0);
  }

  console.log(`❌ Found ${broken.length} broken internal link(s):\n`);
  for (const b of broken) {
    console.log(`  ${b.source} → /guide/${b.target} (${b.type})`);
  }
  process.exit(1);
}

run();

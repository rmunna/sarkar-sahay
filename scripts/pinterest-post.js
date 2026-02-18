#!/usr/bin/env node
/**
 * Auto-pin CitizenNest guides to Pinterest
 * Usage: node scripts/pinterest-post.js [--count 5]
 * Requires PINTEREST_TOKEN env var or token in scripts/.pinterest-token
 * 
 * Boards (created 2026-02-18):
 *   Government Services India: 1132373968747867084
 *   Government Schemes India:  1132373968747867085
 *   Sarkari Naukri and Exams:  1132373968747867086
 *   Tax and Finance India:     1132373968747867087
 *   Indian Documents Guide:    1132373968747867088
 *   Financial Calculators:     1132373968747867089
 */
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.PINTEREST_TOKEN || (() => {
  try { return fs.readFileSync(path.join(__dirname, ".pinterest-token"), "utf8").trim(); }
  catch { return ""; }
})();

if (!TOKEN) { console.error("No Pinterest token found"); process.exit(1); }

const BASE = "https://www.citizennest.com";
const API = "https://api.pinterest.com/v5";

const BOARD_MAP = {
  "Identity Documents": "1132373968747867084",
  "Government Schemes": "1132373968747867085",
  "State Schemes": "1132373968747867085",
  "Jobs & Exams": "1132373968747867086",
  "Tax & Finance": "1132373968747867087",
  "Certificates": "1132373968747867088",
  "Utilities": "1132373968747867084",
  "Property & Legal": "1132373968747867088",
  "Food & Ration": "1132373968747867084",
};

const CALC_BOARD = "1132373968747867089";

// Load tracker
const trackerPath = path.join(__dirname, ".pinterest-tracker.json");
let posted = {};
try { posted = JSON.parse(fs.readFileSync(trackerPath, "utf8")); } catch {}

// Load guides
const guidesDir = path.join(__dirname, "../content/guides");
const matter = require("gray-matter");

function getUnpostedGuides(count) {
  const files = fs.readdirSync(guidesDir).filter(f => f.endsWith(".md"));
  const guides = files
    .filter(f => !posted[f.replace(".md", "")])
    .map(f => {
      const content = fs.readFileSync(path.join(guidesDir, f), "utf8");
      const { data } = matter(content);
      return {
        slug: f.replace(".md", ""),
        title: data.title || "",
        description: data.description || "",
        category: data.category || "General",
      };
    })
    .filter(g => g.title && g.description);
  
  // Shuffle and pick
  for (let i = guides.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [guides[i], guides[j]] = [guides[j], guides[i]];
  }
  return guides.slice(0, count);
}

async function createPin(guide) {
  const boardId = BOARD_MAP[guide.category] || "1132373968747867084";
  const body = {
    board_id: boardId,
    title: guide.title.slice(0, 100),
    description: `${guide.description} Read the full guide at CitizenNest. #${guide.category.replace(/[^a-zA-Z]/g, "")} #GovernmentServices #India`,
    link: `${BASE}/guide/${guide.slug}`,
    alt_text: guide.title,
  };

  const res = await fetch(`${API}/pins`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.id) {
    posted[guide.slug] = { pinId: data.id, at: new Date().toISOString() };
    console.log(`✅ ${guide.title} → Board ${guide.category}`);
    return true;
  } else {
    console.log(`❌ ${guide.title}: ${data.message || JSON.stringify(data)}`);
    return false;
  }
}

async function main() {
  const count = parseInt(process.argv.find((a, i) => process.argv[i-1] === "--count") || "5");
  const guides = getUnpostedGuides(count);
  console.log(`Pinning ${guides.length} guides...`);
  
  for (const guide of guides) {
    await createPin(guide);
    // Rate limit: 1 pin per 2 seconds
    await new Promise(r => setTimeout(r, 2000));
  }
  
  fs.writeFileSync(trackerPath, JSON.stringify(posted, null, 2));
  console.log(`\nTotal pinned (all time): ${Object.keys(posted).length}`);
}

main().catch(console.error);

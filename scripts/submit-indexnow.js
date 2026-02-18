#!/usr/bin/env node
/**
 * Submit all URLs to IndexNow (Bing, Yandex, Seznam, Naver)
 * Usage: node scripts/submit-indexnow.js [--batch-size 100]
 */
const fs = require("fs");
const path = require("path");

const KEY = "c4afa3fbd1f57a882b7e8453af3e4f7e";
const HOST = "www.citizennest.com";
const BASE = `https://${HOST}`;

// Collect all URLs
const guidesDir = path.join(__dirname, "../content/guides");
const updatesDir = path.join(__dirname, "../content/updates");
const guidesHiDir = path.join(__dirname, "../content/guides-hi");

const urls = [BASE + "/"];

// Static pages
["/categories", "/calculator", "/updates", "/states", "/about", "/hi", "/stories", "/feed.xml"].forEach(p => urls.push(BASE + p));

// Guides
if (fs.existsSync(guidesDir)) {
  fs.readdirSync(guidesDir).filter(f => f.endsWith(".md")).forEach(f => {
    urls.push(`${BASE}/guide/${f.replace(".md", "")}`);
  });
}

// Hindi guides
if (fs.existsSync(guidesHiDir)) {
  fs.readdirSync(guidesHiDir).filter(f => f.endsWith(".md")).forEach(f => {
    urls.push(`${BASE}/hi/guide/${f.replace(".md", "")}`);
  });
}

// Updates
if (fs.existsSync(updatesDir)) {
  fs.readdirSync(updatesDir).filter(f => f.endsWith(".md")).forEach(f => {
    urls.push(`${BASE}/update/${f.replace(".md", "")}`);
  });
}

// Calculators
const calcDir = path.join(__dirname, "../src/app/calculator");
if (fs.existsSync(calcDir)) {
  fs.readdirSync(calcDir).filter(d => {
    const p = path.join(calcDir, d, "page.tsx");
    return fs.existsSync(p);
  }).forEach(d => {
    urls.push(`${BASE}/calculator/${d}`);
  });
}

console.log(`Total URLs: ${urls.length}`);

const BATCH_SIZE = parseInt(process.argv.find((a, i) => process.argv[i-1] === "--batch-size") || "100");

async function submitBatch(batchUrls, engine) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList: batchUrls,
  });

  try {
    const res = await fetch(`https://${engine}/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    console.log(`  ${engine}: ${res.status} ${res.statusText}`);
    return res.status;
  } catch (e) {
    console.log(`  ${engine}: ERROR - ${e.message}`);
    return 0;
  }
}

async function main() {
  const engines = ["api.indexnow.org", "www.bing.com", "yandex.com"];
  
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.length} URLs`);
    
    for (const engine of engines) {
      await submitBatch(batch, engine);
    }
  }
  
  console.log(`\nDone! Submitted ${urls.length} URLs to ${engines.length} engines.`);
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * CitizenNest Trending Topic Scanner
 * Sources: Google Trends RSS (India) + PIB latest releases
 * Filters for government/scheme/service related trends
 * 
 * Usage: node agents/trending-scan.js
 */

import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = path.resolve(__dirname, '../content/guides');

// Government/citizen keywords to filter trends
const GOVT_KEYWORDS = [
  'scheme', 'yojana', 'government', 'sarkari', 'modi', 'pm ', 'pradhan mantri',
  'budget', 'tax', 'itr', 'gst', 'aadhaar', 'aadhar', 'pan card', 'passport',
  'ration', 'pension', 'scholarship', 'exam', 'ssc', 'upsc', 'neet', 'jee',
  'result', 'admit card', 'recruitment', 'vacancy', 'notification',
  'loan', 'subsidy', 'insurance', 'epf', 'pf withdrawal',
  'driving licen', 'voter id', 'birth certificate', 'death certificate',
  'ration card', 'ayushman', 'kisan', 'ladli', 'housing', 'awas',
  'election', 'bjp', 'congress', 'aap',
  'railway', 'irctc', 'fastag', 'electricity', 'water bill',
  'state', 'karnataka', 'maharashtra', 'bihar', 'up ', 'uttar pradesh',
  'tamil nadu', 'delhi', 'rajasthan', 'madhya pradesh', 'west bengal',
  'andhra', 'telangana', 'kerala', 'punjab', 'haryana', 'jharkhand',
  'odisha', 'chhattisgarh', 'assam', 'goa', 'gujarat',
  'board exam', 'cbse', 'icse', 'university',
  'nta', 'ugc', 'gate', 'cat ', 'clat', 'cuet',
  'police', 'army', 'navy', 'air force', 'agniveer', 'defence',
  'bank', 'sbi', 'rbi', 'ibps', 'nabard',
  'court', 'supreme court', 'high court', 'legal',
  'covid', 'health', 'hospital', 'doctor',
  'farmer', 'agriculture', 'crop', 'msp',
  'swachh', 'digital india', 'smart city',
  'income tax', 'section 80', 'tds', 'refund',
];

function isGovtRelated(title) {
  const lower = title.toLowerCase();
  return GOVT_KEYWORDS.some(kw => lower.includes(kw));
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function guideExists(slug) {
  // Check if any existing guide matches (fuzzy)
  const files = fs.readdirSync(GUIDES_DIR);
  const slugLower = slug.toLowerCase();
  return files.some(f => {
    const name = f.replace('.md', '').toLowerCase();
    // Check for significant overlap
    const slugWords = slugLower.split('-').filter(w => w.length > 3);
    const nameWords = name.split('-').filter(w => w.length > 3);
    const overlap = slugWords.filter(w => nameWords.includes(w));
    return overlap.length >= 2;
  });
}

async function fetchGoogleTrends() {
  const res = await fetch('https://trends.google.com/trending/rss?geo=IN');
  const xml = await res.text();
  const parsed = await parseStringPromise(xml);
  const items = parsed.rss.channel[0].item || [];
  
  return items.map(item => ({
    title: item.title[0],
    traffic: item['ht:approx_traffic']?.[0] || 'unknown',
    pubDate: item.pubDate?.[0] || '',
    newsTitle: item['ht:news_item']?.[0]?.['ht:news_item_title']?.[0] || '',
    source: 'google_trends',
  }));
}

async function main() {
  console.log('🔍 CitizenNest Trending Scanner\n');
  console.log('=== GOOGLE TRENDS (India) ===\n');

  let trends = [];
  try {
    trends = await fetchGoogleTrends();
  } catch (e) {
    console.log('⚠️  Google Trends fetch failed:', e.message);
  }

  const govtTrends = trends.filter(t => isGovtRelated(t.title) || isGovtRelated(t.newsTitle));
  const otherTrends = trends.filter(t => !isGovtRelated(t.title) && !isGovtRelated(t.newsTitle));

  if (govtTrends.length > 0) {
    console.log('🏛️  GOVERNMENT/CITIZEN RELATED:\n');
    for (const t of govtTrends) {
      const slug = slugify(t.title);
      const exists = guideExists(slug);
      console.log(`  📊 "${t.title}" (${t.traffic} searches)`);
      if (t.newsTitle) console.log(`     └─ ${t.newsTitle}`);
      console.log(`     └─ Guide exists: ${exists ? '✅ Yes' : '❌ No → OPPORTUNITY'}`);
      if (!exists) console.log(`     └─ Suggested slug: ${slug}`);
      console.log();
    }
  } else {
    console.log('  No government-related trends found in current trending.\n');
  }

  console.log(`📈 OTHER TRENDS (${otherTrends.length} total, showing top 10):\n`);
  for (const t of otherTrends.slice(0, 10)) {
    console.log(`  "${t.title}" (${t.traffic} searches)`);
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total trends: ${trends.length}`);
  console.log(`Government-related: ${govtTrends.length}`);
  console.log(`Content opportunities: ${govtTrends.filter(t => !guideExists(slugify(t.title))).length}`);

  // Save results
  const output = {
    scannedAt: new Date().toISOString(),
    govtTrends: govtTrends.map(t => ({
      ...t,
      suggestedSlug: slugify(t.title),
      guideExists: guideExists(slugify(t.title)),
    })),
    totalTrends: trends.length,
  };
  
  const outPath = path.resolve(__dirname, 'trending-latest.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to agents/trending-latest.json`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

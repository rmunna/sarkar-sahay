#!/usr/bin/env node
/**
 * Exam Site Change Detector
 * Monitors high-frequency govt exam/recruitment sites for new content.
 * Uses simple HTTP fetch + content hash comparison — zero API cost.
 * 
 * Usage: node agents/exam-site-monitor.js
 * Output: agents/exam-monitor-latest.json
 * 
 * When changes detected, outputs actionable items for content creation.
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Sites to monitor — focused on pages that change when new content is posted
const MONITOR_SITES = [
  {
    id: 'ssc',
    name: 'SSC (Staff Selection Commission)',
    urls: [
      { url: 'https://ssc.gov.in/', label: 'Homepage' },
      { url: 'https://ssc.gov.in/portal/LatestNotice', label: 'Latest Notices' },
    ],
    frequency: 'high', // posts multiple times/week
  },
  {
    id: 'upsc',
    name: 'UPSC',
    urls: [
      { url: 'https://upsc.gov.in/', label: 'Homepage' },
      { url: 'https://upsc.gov.in/whats-new', label: "What's New" },
    ],
    frequency: 'high',
  },
  {
    id: 'nta',
    name: 'NTA (National Testing Agency)',
    urls: [
      { url: 'https://nta.ac.in/', label: 'Homepage' },
      { url: 'https://nta.ac.in/notice', label: 'Notices' },
    ],
    frequency: 'high',
  },
  {
    id: 'ibps',
    name: 'IBPS',
    urls: [
      { url: 'https://www.ibps.in/', label: 'Homepage' },
    ],
    frequency: 'high',
  },
  {
    id: 'rbi',
    name: 'RBI',
    urls: [
      { url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx', label: 'Press Releases' },
      { url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx', label: 'Notifications' },
    ],
    frequency: 'medium',
  },
  {
    id: 'rrb',
    name: 'RRB (Railway Recruitment)',
    urls: [
      { url: 'https://www.rrbcdg.gov.in/', label: 'Homepage' },
    ],
    frequency: 'high',
  },
  {
    id: 'cbdt',
    name: 'CBDT / Income Tax',
    urls: [
      { url: 'https://incometaxindia.gov.in/Pages/press-releases.aspx', label: 'Press Releases' },
    ],
    frequency: 'medium',
  },
  {
    id: 'sbi',
    name: 'SBI Recruitment',
    urls: [
      { url: 'https://bank.sbi/web/careers/current-openings', label: 'Current Openings' },
    ],
    frequency: 'medium',
  },
  {
    id: 'bpsc',
    name: 'BPSC (Bihar PSC)',
    urls: [
      { url: 'https://www.bpsc.bih.nic.in/', label: 'Homepage' },
    ],
    frequency: 'high',
  },
  {
    id: 'uppsc',
    name: 'UPPSC (UP PSC)',
    urls: [
      { url: 'https://uppsc.up.nic.in/', label: 'Homepage' },
    ],
    frequency: 'high',
  },
];

function fetchPage(urlStr, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(parsed, {
      timeout: timeoutMs,
      rejectUnauthorized: false, // Many govt sites have broken SSL certs
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CitizenNest/1.0; +https://citizennest.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      },
    }, (res) => {
      // Handle redirects (up to 3)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
        fetchPage(redirectUrl, timeoutMs).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function contentHash(html) {
  // Strip dynamic elements (timestamps, session IDs, ads) to reduce false positives
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')  // Remove scripts
    .replace(/<style[\s\S]*?<\/style>/gi, '')     // Remove styles
    .replace(/<!--[\s\S]*?-->/g, '')               // Remove comments
    .replace(/\b\d{10,13}\b/g, '')                 // Remove timestamps
    .replace(/[a-f0-9]{32,}/gi, '')                // Remove hashes/session IDs
    .replace(/\s+/g, ' ')                          // Normalize whitespace
    .trim();
  return crypto.createHash('md5').update(cleaned).digest('hex');
}

function extractNewContent(oldHtml, newHtml) {
  // Extract text content for comparison
  const stripTags = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const oldText = stripTags(oldHtml || '');
  const newText = stripTags(newHtml);
  
  // Find new sentences/phrases not in old content
  const oldWords = new Set(oldText.split(/\s+/));
  const newWords = newText.split(/\s+/);
  const newUnique = newWords.filter(w => w.length > 5 && !oldWords.has(w));
  
  return newUnique.slice(0, 50).join(' '); // First 50 new significant words
}

async function main() {
  const trackerPath = path.join(__dirname, 'exam-monitor-tracker.json');
  let tracker = {};
  try {
    tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
  } catch (e) {
    tracker = { sites: {}, lastScan: null };
  }

  console.log(`🔍 Monitoring ${MONITOR_SITES.length} exam/govt sites...\n`);

  const changes = [];
  const errors = [];
  let checked = 0;

  for (const site of MONITOR_SITES) {
    for (const endpoint of site.urls) {
      const key = `${site.id}:${endpoint.label}`;
      checked++;
      
      try {
        const { status, body } = await fetchPage(endpoint.url);
        
        if (status !== 200) {
          console.log(`⚠️  ${site.name} [${endpoint.label}] — HTTP ${status}`);
          errors.push({ site: site.name, url: endpoint.url, error: `HTTP ${status}` });
          continue;
        }

        const hash = contentHash(body);
        const prev = tracker.sites[key];

        if (!prev) {
          // First scan — establish baseline
          console.log(`📝 ${site.name} [${endpoint.label}] — baseline recorded`);
          tracker.sites[key] = {
            hash,
            lastChecked: new Date().toISOString(),
            lastChanged: new Date().toISOString(),
            body: body.substring(0, 50000), // Store first 50KB for diff
          };
        } else if (hash !== prev.hash) {
          // CHANGE DETECTED
          const newContent = extractNewContent(prev.body, body);
          console.log(`🔴 CHANGE: ${site.name} [${endpoint.label}]`);
          console.log(`   New content snippet: ${newContent.substring(0, 200)}...`);
          
          changes.push({
            siteId: site.id,
            siteName: site.name,
            page: endpoint.label,
            url: endpoint.url,
            previousHash: prev.hash,
            newHash: hash,
            lastChanged: prev.lastChanged,
            detectedAt: new Date().toISOString(),
            newContentSnippet: newContent.substring(0, 500),
          });

          tracker.sites[key] = {
            hash,
            lastChecked: new Date().toISOString(),
            lastChanged: new Date().toISOString(),
            body: body.substring(0, 50000),
          };
        } else {
          console.log(`✅ ${site.name} [${endpoint.label}] — no change`);
          tracker.sites[key].lastChecked = new Date().toISOString();
        }
      } catch (e) {
        console.log(`❌ ${site.name} [${endpoint.label}] — ${e.message}`);
        errors.push({ site: site.name, url: endpoint.url, error: e.message });
      }
      
      // Small delay between requests to be polite
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Checked: ${checked} pages | Changes: ${changes.length} | Errors: ${errors.length}`);

  if (changes.length > 0) {
    console.log(`\n🔴 CHANGES DETECTED:\n`);
    for (const c of changes) {
      console.log(`  [${c.siteName}] ${c.page}`);
      console.log(`  URL: ${c.url}`);
      console.log(`  Last changed: ${c.lastChanged}`);
      console.log(`  Snippet: ${c.newContentSnippet.substring(0, 150)}...`);
      console.log('');
    }
  } else {
    console.log(`\n✅ No changes detected across all monitored sites.`);
  }

  // Save results
  tracker.lastScan = new Date().toISOString();
  
  const output = {
    scanTime: new Date().toISOString(),
    pagesChecked: checked,
    changesDetected: changes.length,
    errors: errors.length,
    changes,
    errorDetails: errors,
  };

  fs.writeFileSync(path.join(__dirname, 'exam-monitor-latest.json'), JSON.stringify(output, null, 2));
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  
  console.log(`\n💾 Results saved to agents/exam-monitor-latest.json`);
}

main().catch(console.error);

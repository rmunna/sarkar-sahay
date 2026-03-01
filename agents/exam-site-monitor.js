#!/usr/bin/env node
/**
 * Exam Site Change Detector v2
 * 
 * Strategy per site:
 * - SSC: Direct JSON API (structured data, zero guessing)
 * - UPSC: HTML hash comparison (Drupal site, no API)
 * - NTA: HTML hash comparison
 * - RBI: RSS feeds (handled by pib-scanner.js)
 * - Others: HTML hash comparison
 * 
 * Usage: node agents/exam-site-monitor.js
 * Output: agents/exam-monitor-latest.json
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, 'exam-monitor-tracker.json');

function fetchPage(urlStr, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(parsed, {
      timeout: timeoutMs,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CitizenNest/1.0; +https://citizennest.com)',
        'Accept': 'text/html,application/json,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      },
    }, (res) => {
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

function contentHash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function loadTracker() {
  try {
    return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8'));
  } catch (e) {
    return { sites: {}, lastScan: null };
  }
}

function saveTracker(tracker) {
  tracker.lastScan = new Date().toISOString();
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2));
}

// ============================================================
// SSC — JSON API (structured, reliable)
// ============================================================
async function checkSSC(tracker) {
  const changes = [];
  const key = 'ssc:notices';
  
  try {
    const { status, body } = await fetchPage(
      'https://ssc.gov.in/api/general-website/portal/notice-boards?page=1&limit=15&contentType=notice-boards&key=createdAt&order=DESC&isAttachment=true&language=english&attributes=id,headline,examId,contentType,redirectUrl,startDate,endDate,language,createdAt'
    );
    
    if (status !== 200) {
      console.log(`⚠️  SSC API — HTTP ${status}`);
      return { changes, errors: [{ site: 'SSC', error: `HTTP ${status}` }] };
    }

    const data = JSON.parse(body);
    const notices = data.data || [];
    
    // Get previously seen notice IDs
    const prevIds = new Set(tracker.sites[key]?.noticeIds || []);
    const currentIds = notices.map(n => n.id);
    
    // Find NEW notices (not seen before)
    const newNotices = notices.filter(n => !prevIds.has(n.id));
    
    if (newNotices.length > 0) {
      console.log(`🔴 SSC: ${newNotices.length} NEW notice(s)!`);
      for (const notice of newNotices) {
        const pdfUrl = notice.attachments?.[0] 
          ? `https://ssc.gov.in/api/attachment/${notice.attachments[0].path.replace(/\\/g, '/')}`
          : null;
        
        console.log(`   📄 ${notice.headline}`);
        console.log(`   📅 ${notice.createdAt}`);
        if (pdfUrl) console.log(`   📎 ${pdfUrl}`);
        console.log('');
        
        changes.push({
          site: 'SSC',
          type: 'NEW_NOTICE',
          headline: notice.headline,
          date: notice.createdAt,
          id: notice.id,
          examId: notice.examId,
          pdfUrl,
          url: 'https://ssc.gov.in/portal/LatestNotice',
        });
      }
    } else {
      console.log(`✅ SSC: No new notices (${notices.length} total)`);
    }

    // Update tracker
    tracker.sites[key] = {
      lastChecked: new Date().toISOString(),
      noticeIds: currentIds,
      latestHeadline: notices[0]?.headline,
      latestDate: notices[0]?.createdAt,
    };

  } catch (e) {
    console.log(`❌ SSC: ${e.message}`);
    return { changes, errors: [{ site: 'SSC', error: e.message }] };
  }

  return { changes, errors: [] };
}

// ============================================================
// SSC — Last Update timestamp (quick check)
// ============================================================
async function checkSSCLastUpdate(tracker) {
  try {
    const { status, body } = await fetchPage('https://ssc.gov.in/api/general-website/portal//lastUpdates');
    if (status === 200) {
      const data = JSON.parse(body);
      const lastUpdate = data.data?.createdAt;
      const prevUpdate = tracker.sites['ssc:lastUpdate']?.timestamp;
      
      if (prevUpdate && lastUpdate !== prevUpdate) {
        console.log(`🔔 SSC: Site updated at ${lastUpdate} (was ${prevUpdate})`);
      }
      
      tracker.sites['ssc:lastUpdate'] = {
        timestamp: lastUpdate,
        lastChecked: new Date().toISOString(),
      };
    }
  } catch (e) {
    // Non-critical, ignore
  }
}

// ============================================================
// Generic HTML hash comparison (for sites without APIs)
// ============================================================
async function checkHTMLSite(siteId, siteName, url, label, tracker) {
  const key = `${siteId}:${label}`;
  const changes = [];
  
  try {
    const { status, body } = await fetchPage(url);
    
    if (status !== 200) {
      console.log(`⚠️  ${siteName} [${label}] — HTTP ${status}`);
      return { changes, errors: [{ site: siteName, url, error: `HTTP ${status}` }] };
    }

    // Clean HTML for comparison (remove dynamic elements)
    const cleaned = body
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\b\d{10,13}\b/g, '')
      .replace(/[a-f0-9]{32,}/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const hash = contentHash(cleaned);
    const prev = tracker.sites[key];

    if (!prev) {
      console.log(`📝 ${siteName} [${label}] — baseline recorded`);
      tracker.sites[key] = { hash, lastChecked: new Date().toISOString(), lastChanged: new Date().toISOString() };
    } else if (hash !== prev.hash) {
      console.log(`🔴 CHANGE: ${siteName} [${label}]`);
      
      // Extract text diff
      const stripTags = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const newText = stripTags(body).substring(0, 1000);
      
      changes.push({
        site: siteName,
        type: 'PAGE_CHANGE',
        page: label,
        url,
        detectedAt: new Date().toISOString(),
        lastChanged: prev.lastChanged,
        contentSnippet: newText.substring(0, 500),
      });

      tracker.sites[key] = { hash, lastChecked: new Date().toISOString(), lastChanged: new Date().toISOString() };
    } else {
      console.log(`✅ ${siteName} [${label}] — no change`);
      tracker.sites[key].lastChecked = new Date().toISOString();
    }
  } catch (e) {
    console.log(`❌ ${siteName} [${label}] — ${e.message}`);
    return { changes, errors: [{ site: siteName, url, error: e.message }] };
  }

  return { changes, errors: [] };
}

// ============================================================
// Sites to monitor (non-API)
// ============================================================
const HTML_SITES = [
  { id: 'upsc', name: 'UPSC', url: 'https://upsc.gov.in/', label: 'Homepage' },
  { id: 'upsc', name: 'UPSC', url: 'https://upsc.gov.in/whats-new', label: "What's New" },
  { id: 'nta', name: 'NTA', url: 'https://nta.ac.in/', label: 'Homepage' },
  { id: 'ibps', name: 'IBPS', url: 'https://www.ibps.in/', label: 'Homepage' },
  { id: 'rrb', name: 'RRB', url: 'https://www.rrbcdg.gov.in/', label: 'Homepage' },
  { id: 'cbdt', name: 'CBDT / Income Tax', url: 'https://incometaxindia.gov.in/Pages/press-releases.aspx', label: 'Press Releases' },
  { id: 'sbi', name: 'SBI Recruitment', url: 'https://bank.sbi/web/careers/current-openings', label: 'Current Openings' },
  { id: 'bpsc', name: 'BPSC', url: 'https://www.bpsc.bih.nic.in/', label: 'Homepage' },
  { id: 'uppsc', name: 'UPPSC', url: 'https://uppsc.up.nic.in/', label: 'Homepage' },
];

// ============================================================
// Main
// ============================================================
async function main() {
  const tracker = loadTracker();
  const allChanges = [];
  const allErrors = [];

  console.log('🔍 Exam Site Monitor v2\n');

  // 1. SSC — JSON API (most reliable)
  console.log('--- SSC (JSON API) ---');
  const ssc = await checkSSC(tracker);
  allChanges.push(...ssc.changes);
  allErrors.push(...ssc.errors);
  await checkSSCLastUpdate(tracker);
  
  // Small delay
  await new Promise(r => setTimeout(r, 500));

  // 2. All HTML sites
  console.log('\n--- HTML Hash Comparison ---');
  for (const site of HTML_SITES) {
    const result = await checkHTMLSite(site.id, site.name, site.url, site.label, tracker);
    allChanges.push(...result.changes);
    allErrors.push(...result.errors);
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 SSC API: structured check | HTML sites: ${HTML_SITES.length} pages`);
  console.log(`🔴 Changes: ${allChanges.length} | ❌ Errors: ${allErrors.length}`);

  if (allChanges.length > 0) {
    console.log('\n🔴 ALL CHANGES:\n');
    for (const c of allChanges) {
      if (c.type === 'NEW_NOTICE') {
        console.log(`  [${c.site}] NEW: ${c.headline}`);
        console.log(`  📅 ${c.date}`);
        if (c.pdfUrl) console.log(`  📎 ${c.pdfUrl}`);
      } else {
        console.log(`  [${c.site}] Page changed: ${c.page}`);
        console.log(`  🔗 ${c.url}`);
      }
      console.log('');
    }
  }

  // Save
  saveTracker(tracker);
  
  const output = {
    scanTime: new Date().toISOString(),
    sscApiUsed: true,
    changesDetected: allChanges.length,
    errors: allErrors.length,
    changes: allChanges,
    errorDetails: allErrors,
  };
  
  fs.writeFileSync(path.join(__dirname, 'exam-monitor-latest.json'), JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved to agents/exam-monitor-latest.json`);
}

main().catch(console.error);

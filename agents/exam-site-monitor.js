#!/usr/bin/env node
/**
 * Exam Site Change Detector v3 — Aggressive Polling Edition
 * 
 * Designed for high-frequency polling (every 5 min during daytime).
 * Zero API cost — just HTTP requests + JSON/HTML comparison.
 * 
 * Detection methods per site:
 * - SSC: JSON API (exact notice IDs, headlines, PDFs)
 * - NTA: HTML scrape for notice PDF URLs (predictable pattern)
 * - UPSC: HTML hash comparison (Drupal, no API)
 * - IBPS: HTML hash comparison (WordPress)
 * - RRB: HTML hash comparison
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

function fetchPage(urlStr, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(parsed, {
      timeout: timeoutMs,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json,application/xhtml+xml,*/*',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
        fetchPage(redir, timeoutMs).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function md5(text) { return crypto.createHash('md5').update(text).digest('hex'); }

function loadTracker() {
  try { return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8')); }
  catch { return { sites: {}, lastScan: null }; }
}

function saveTracker(tracker) {
  tracker.lastScan = new Date().toISOString();
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2));
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================
// SSC — JSON API (structured, 100% reliable)
// ============================================================
async function checkSSC(tracker) {
  const changes = [];
  const key = 'ssc:notices';
  
  try {
    const { status, body } = await fetchPage(
      'https://ssc.gov.in/api/general-website/portal/notice-boards?page=1&limit=15&contentType=notice-boards&key=createdAt&order=DESC&isAttachment=true&language=english&attributes=id,headline,examId,contentType,redirectUrl,startDate,endDate,language,createdAt'
    );
    if (status !== 200) throw new Error(`HTTP ${status}`);

    const notices = JSON.parse(body).data || [];
    const prevIds = new Set(tracker.sites[key]?.noticeIds || []);
    const currentIds = notices.map(n => n.id);
    const newNotices = notices.filter(n => !prevIds.has(n.id));

    if (newNotices.length > 0 && prevIds.size > 0) { // Skip first run (baseline)
      console.log(`🔴 SSC: ${newNotices.length} NEW notice(s)!`);
      for (const n of newNotices) {
        const pdf = n.attachments?.[0]
          ? `https://ssc.gov.in/api/attachment/${n.attachments[0].path.replace(/\\/g, '/')}`
          : null;
        console.log(`   📄 ${n.headline}`);
        if (pdf) console.log(`   📎 ${pdf}`);
        changes.push({ site: 'SSC', type: 'NEW_NOTICE', headline: n.headline, date: n.createdAt, id: n.id, pdfUrl: pdf, url: 'https://ssc.gov.in' });
      }
    } else {
      console.log(`✅ SSC: ${notices.length} notices, no new (API)`);
    }

    tracker.sites[key] = { lastChecked: new Date().toISOString(), noticeIds: currentIds, latest: notices[0]?.headline };
  } catch (e) {
    console.log(`❌ SSC: ${e.message}`);
    return { changes, errors: [{ site: 'SSC', error: e.message }] };
  }
  return { changes, errors: [] };
}

// ============================================================
// NTA — HTML scrape for notice PDF URLs
// ============================================================
async function checkNTA(tracker) {
  const changes = [];
  const key = 'nta:notices';
  
  try {
    const { status, body } = await fetchPage('https://nta.ac.in/');
    if (status !== 200) throw new Error(`HTTP ${status}`);

    // Extract notice PDF URLs (pattern: Download/Notice/Notice_YYYYMMDDHHMMSS.pdf)
    const noticeRegex = /Download\/Notice\/Notice_(\d{14})\.[pP][dD][fF]/g;
    const notices = new Set();
    let match;
    while ((match = noticeRegex.exec(body)) !== null) {
      notices.add(match[1]); // Just the timestamp ID
    }
    const currentIds = [...notices].sort().reverse(); // Latest first
    
    // Also try to extract titles near notice links
    const titleRegex = /(?:<[^>]*>)*([^<]{10,150})(?:<[^>]*>)*\s*<a[^>]*href="[^"]*Notice_(\d{14})/g;
    const titleMap = {};
    while ((match = titleRegex.exec(body)) !== null) {
      titleMap[match[2]] = match[1].trim();
    }

    const prevIds = new Set(tracker.sites[key]?.noticeIds || []);
    const newIds = currentIds.filter(id => !prevIds.has(id));

    if (newIds.length > 0 && prevIds.size > 0) {
      console.log(`🔴 NTA: ${newIds.length} NEW notice(s)!`);
      for (const id of newIds) {
        const pdfUrl = `https://nta.ac.in/Download/Notice/Notice_${id}.pdf`;
        const title = titleMap[id] || `New NTA Notice (${id.substring(0,8)})`;
        console.log(`   📄 ${title}`);
        console.log(`   📎 ${pdfUrl}`);
        changes.push({ site: 'NTA', type: 'NEW_NOTICE', headline: title, date: `${id.substring(0,4)}-${id.substring(4,6)}-${id.substring(6,8)}`, pdfUrl, url: 'https://nta.ac.in' });
      }
    } else {
      console.log(`✅ NTA: ${currentIds.length} notices, no new`);
    }

    tracker.sites[key] = { lastChecked: new Date().toISOString(), noticeIds: currentIds };
  } catch (e) {
    console.log(`❌ NTA: ${e.message}`);
    return { changes, errors: [{ site: 'NTA', error: e.message }] };
  }
  return { changes, errors: [] };
}

// ============================================================
// UPSC — HTML with structured "What's New" section
// ============================================================
async function checkUPSC(tracker) {
  const changes = [];
  const key = 'upsc:whatsnew';
  
  try {
    const { status, body } = await fetchPage('https://upsc.gov.in/');
    if (status !== 200) throw new Error(`HTTP ${status}`);

    // Extract PDF links and text near them
    const pdfRegex = /href="([^"]*\.pdf[^"]*)"/gi;
    const pdfs = new Set();
    let match;
    while ((match = pdfRegex.exec(body)) !== null) {
      pdfs.add(match[1]);
    }
    const currentPdfs = [...pdfs].sort();
    const pdfHash = md5(currentPdfs.join('|'));
    
    const prev = tracker.sites[key];
    if (prev && prev.pdfHash !== pdfHash) {
      const prevPdfs = new Set(prev.pdfs || []);
      const newPdfs = currentPdfs.filter(p => !prevPdfs.has(p));
      if (newPdfs.length > 0) {
        console.log(`🔴 UPSC: ${newPdfs.length} new PDF(s)!`);
        for (const pdf of newPdfs.slice(0, 5)) {
          const fullUrl = pdf.startsWith('http') ? pdf : `https://upsc.gov.in${pdf}`;
          console.log(`   📎 ${fullUrl}`);
          changes.push({ site: 'UPSC', type: 'NEW_PDF', pdfUrl: fullUrl, url: 'https://upsc.gov.in' });
        }
      }
    } else if (!prev) {
      console.log(`📝 UPSC: baseline (${currentPdfs.length} PDFs)`);
    } else {
      console.log(`✅ UPSC: no new PDFs`);
    }

    tracker.sites[key] = { lastChecked: new Date().toISOString(), pdfHash, pdfs: currentPdfs };
  } catch (e) {
    console.log(`❌ UPSC: ${e.message}`);
    return { changes, errors: [{ site: 'UPSC', error: e.message }] };
  }
  return { changes, errors: [] };
}

// ============================================================
// Generic HTML hash (for WordPress/static sites)
// ============================================================
async function checkHTML(siteId, name, url, tracker) {
  const changes = [];
  const key = `${siteId}:hash`;
  
  try {
    const { status, body } = await fetchPage(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);

    // Extract just the meaningful content (strip scripts, styles, dynamic elements)
    const cleaned = body
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\b\d{10,13}\b/g, '')  // timestamps
      .replace(/[a-f0-9]{32,}/gi, '') // session hashes
      .replace(/\s+/g, ' ');
    
    // Extract PDF links as full URLs (not just href strings) so we can thread them downstream
    const pdfUrls = [...new Set(
      (body.match(/href=["']([^"']*\.pdf[^"']*)/gi) || [])
        .map(m => m.replace(/href=["']/i, '').trim())
        .map(raw => { try { return raw.startsWith('http') ? raw : new URL(raw, url).href; } catch { return null; } })
        .filter(Boolean)
    )].sort();
    const pdfHash = md5(pdfUrls.join('|'));
    const contentHash = md5(cleaned);

    const prev = tracker.sites[key];
    if (!prev) {
      console.log(`📝 ${name}: baseline (${pdfUrls.length} PDFs)`);
    } else if (prev.pdfHash !== pdfHash) {
      // Identify exactly which PDFs are new → thread the URL to the generator
      const prevSet = new Set(prev.pdfs || []);
      const newPdfs = pdfUrls.filter(p => !prevSet.has(p));
      console.log(`🔴 ${name}: ${newPdfs.length > 0 ? newPdfs.length + ' new' : 'changed'} PDF(s)!`);
      for (const pdfUrl of newPdfs.slice(0, 3)) {
        console.log(`   📎 ${pdfUrl}`);
        changes.push({ site: name, type: 'PDF_CHANGE', pdfUrl, url, detectedAt: new Date().toISOString() });
      }
      if (newPdfs.length === 0) {
        // PDFs changed/removed — still flag but without specific URL
        changes.push({ site: name, type: 'PDF_CHANGE', url, detectedAt: new Date().toISOString() });
      }
    } else if (prev.contentHash !== contentHash) {
      console.log(`🟡 ${name}: content changed (cosmetic — no new PDFs)`);
      changes.push({ site: name, type: 'CONTENT_CHANGE', url, detectedAt: new Date().toISOString() });
    } else {
      console.log(`✅ ${name}: no change`);
    }

    tracker.sites[key] = { lastChecked: new Date().toISOString(), contentHash, pdfHash, pdfs: pdfUrls };
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return { changes, errors: [{ site: name, url, error: e.message }] };
  }
  return { changes, errors: [] };
}

// ============================================================
// Sites
// ============================================================
const HTML_SITES = [
  // Banking & Finance
  { id: 'ibps', name: 'IBPS', url: 'https://www.ibps.in/' },
  { id: 'sbi', name: 'SBI Careers', url: 'https://bank.sbi/web/careers/current-openings' },
  { id: 'rbi', name: 'RBI Careers', url: 'https://opportunities.rbi.org.in/' },
  { id: 'nabard', name: 'NABARD', url: 'https://www.nabard.org/career-notices.aspx' },
  { id: 'icai', name: 'ICAI (CA)', url: 'https://www.icai.org/' },

  // Railways & Defence
  { id: 'rrb', name: 'RRB (Railway)', url: 'https://www.rrbcdg.gov.in/' },
  { id: 'indianarmy', name: 'Indian Army', url: 'https://joinindianarmy.nic.in/' },
  { id: 'indiannavy', name: 'Indian Navy', url: 'https://www.joinindiannavy.gov.in/' },
  { id: 'airforce', name: 'Air Force', url: 'https://afcat.cdac.in/AFCAT/' },

  // Central Paramilitary / Police
  { id: 'crpf', name: 'CRPF', url: 'https://crpf.gov.in/' },
  { id: 'cisf', name: 'CISF', url: 'https://cisf.gov.in/recruitment' },
  { id: 'bsf', name: 'BSF', url: 'https://rectt.bsf.gov.in/' },
  { id: 'itbp', name: 'ITBP', url: 'https://recruitment.itbpolice.nic.in/' },

  // Education Boards & Universities
  { id: 'cbse', name: 'CBSE', url: 'https://www.cbse.gov.in/' },
  { id: 'kvs', name: 'KVS', url: 'https://kvsangathan.nic.in/' },
  { id: 'nvs', name: 'NVS (Navodaya)', url: 'https://navodaya.gov.in/' },
  { id: 'ignou', name: 'IGNOU', url: 'https://ignou.ac.in/' },
  { id: 'ugc', name: 'UGC NET', url: 'https://ugcnet.nta.ac.in/' },
  { id: 'cuet', name: 'CUET', url: 'https://cuet.nta.nic.in/' },

  // State PSCs
  { id: 'bpsc', name: 'BPSC', url: 'https://www.bpsc.bih.nic.in/' },
  { id: 'uppsc', name: 'UPPSC', url: 'https://uppsc.up.nic.in/' },
  { id: 'mppsc', name: 'MPPSC', url: 'https://mppsc.mp.gov.in/' },
  { id: 'rpsc', name: 'RPSC', url: 'https://rpsc.rajasthan.gov.in/' },
  { id: 'tnpsc', name: 'TNPSC', url: 'https://www.tnpsc.gov.in/' },
  { id: 'kpsc', name: 'KPSC/KEA', url: 'https://cetonline.karnataka.gov.in/kea/' },  // kpsc.kar.nic.in has malformed TLS; use KEA portal
  { id: 'appsc', name: 'APPSC', url: 'https://psc.ap.gov.in/' },
  { id: 'tspsc', name: 'TSPSC', url: 'https://tspsc.gov.in/' },  // both websitenew. and www. fail from GH Actions (India-only DNS); bare domain resolves
  { id: 'wbpsc', name: 'WBPSC', url: 'https://wbpsc.gov.in/' },
  { id: 'gpsc', name: 'GPSC', url: 'https://gpsc.gujarat.gov.in/' },
  { id: 'hpsc', name: 'HPSC', url: 'https://www.hpsc.gov.in/' },
  { id: 'jpsc', name: 'JPSC', url: 'https://www.jpsc.gov.in/' },
  { id: 'cgpsc', name: 'CGPSC', url: 'https://psc.cg.gov.in/' },
  { id: 'ukpsc', name: 'UKPSC', url: 'https://ukpsc.net.in/' },

  // Teaching & Others
  { id: 'ctet', name: 'CTET', url: 'https://ctet.nic.in/' },
  { id: 'dsssb', name: 'DSSSB', url: 'https://dsssb.delhi.gov.in/' },
  { id: 'sainik', name: 'Sainik School', url: 'https://nta.ac.in/ExamDetail?ExamCode=AISSEE' },  // aissee.nta.nic.in DNS fails from GH Actions; use NTA exam detail page
  { id: 'cbdt', name: 'Income Tax', url: 'https://incometaxindia.gov.in/Pages/press-releases.aspx' },

  // State Boards (results)
  { id: 'rbse', name: 'RBSE Rajasthan', url: 'https://rajeduboard.rajasthan.gov.in/' },
  { id: 'msbte', name: 'MSBTE', url: 'https://www.msbte.org.in/' },
  { id: 'up-board', name: 'UP Board', url: 'https://upmsp.edu.in/' },
  { id: 'bihar-board', name: 'Bihar Board', url: 'https://biharboardonline.bihar.gov.in/' },
  { id: 'mp-board', name: 'MP Board', url: 'https://mpbse.nic.in/' },
];

// ============================================================
// Main
// ============================================================
async function main() {
  const start = Date.now();
  const tracker = loadTracker();
  const allChanges = [];
  const allErrors = [];

  console.log('🔍 Exam Site Monitor v3 (Aggressive)\n');

  // SSC — JSON API
  const ssc = await checkSSC(tracker);
  allChanges.push(...ssc.changes); allErrors.push(...ssc.errors);
  await delay(300);

  // NTA — HTML scrape for notice PDFs
  const nta = await checkNTA(tracker);
  allChanges.push(...nta.changes); allErrors.push(...nta.errors);
  await delay(300);

  // UPSC — PDF link tracking
  const upsc = await checkUPSC(tracker);
  allChanges.push(...upsc.changes); allErrors.push(...upsc.errors);
  await delay(300);

  // HTML sites — run in parallel batches of 8
  for (let i = 0; i < HTML_SITES.length; i += 8) {
    const batch = HTML_SITES.slice(i, i + 8);
    const results = await Promise.all(
      batch.map(site => checkHTML(site.id, site.name, site.url, tracker))
    );
    for (const result of results) {
      allChanges.push(...result.changes); allErrors.push(...result.errors);
    }
    if (i + 8 < HTML_SITES.length) await delay(200);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`⏱️  ${elapsed}s | 🔴 Changes: ${allChanges.length} | ❌ Errors: ${allErrors.length}`);

  if (allChanges.length > 0) {
    console.log('\n🔴 CHANGES:\n');
    for (const c of allChanges) {
      console.log(`  [${c.site}] ${c.type}: ${c.headline || c.url}`);
      if (c.pdfUrl) console.log(`  📎 ${c.pdfUrl}`);
    }
  }

  saveTracker(tracker);
  
  const output = {
    scanTime: new Date().toISOString(),
    elapsedSeconds: parseFloat(elapsed),
    changesDetected: allChanges.length,
    errors: allErrors.length,
    changes: allChanges,
    errorDetails: allErrors,
  };
  
  fs.writeFileSync(path.join(__dirname, 'exam-monitor-latest.json'), JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved to exam-monitor-latest.json`);
}

main().catch(console.error);

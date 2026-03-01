#!/usr/bin/env node
/**
 * PIB Press Release Scanner
 * Fetches latest PIB RSS feed (Hindi), filters for citizen-relevant announcements,
 * and outputs actionable items for content creation.
 * 
 * Usage: node agents/pib-scanner.js
 * Output: agents/pib-latest.json
 * 
 * Note: PIB RSS only serves Hindi. The scanner parses Hindi titles
 * and uses keyword matching for relevance filtering. The LLM agent
 * that reads pib-latest.json can translate and interpret.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// PIB RSS feed (returns Hindi)
const PIB_RSS_URL = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3';

// Hindi + English keywords for citizen-relevant content
const RELEVANT_KEYWORDS = [
  // Hindi keywords
  'योजना', 'पोर्टल', 'पंजीकरण', 'सब्सिडी', 'पेंशन', 'ऋण', 'बीमा',
  'आधार', 'पैन कार्ड', 'पासपोर्ट', 'राशन', 'एलपीजी', 'उज्ज्वला',
  'आवास', 'किसान', 'मुद्रा', 'छात्रवृत्ति', 'शिक्षा', 'स्वास्थ्य',
  'आयुष्मान', 'डिजिटल', 'ऑनलाइन', 'मोबाइल ऐप', 'शुभारंभ', 'उद्घाटन',
  'लाभ', 'पात्रता', 'आवेदन', 'कर', 'जीएसटी', 'आयकर', 'रिफंड',
  'भर्ती', 'रिक्ति', 'परीक्षा', 'परिणाम', 'प्रवेश पत्र',
  'ईपीएफ', 'ईएसआई', 'न्यूनतम वेतन', 'श्रम', 'बिजली', 'पानी',
  'गैस', 'सौर', 'ईवी', 'वाहन', 'फास्टैग', 'संपत्ति', 'भूमि',
  'बैंक', 'आरबीआई', 'यूपीआई', 'सीबीडीसी', 'डिजिटल रुपया',
  'प्रमाण पत्र', 'शुल्क', 'संशोधित', 'अधिसूचना', 'अंतिम तिथि',
  'विस्तार', 'नए नियम', 'लॉन्च', 'सेवा',
  // English keywords (sometimes mixed in Hindi releases)
  'scheme', 'portal', 'subsidy', 'pension', 'loan', 'aadhaar',
  'launched', 'inaugurated', 'digital', 'online', 'app', 'tax',
  'recruitment', 'vacancy', 'result', 'epf', 'upi', 'cbdc',
  'notification', 'deadline', 'extended', 'revised', 'amendment',
  'HPV', 'vaccination', 'vaccine', 'insurance', 'PM', 'प्रधानमंत्री',
  'करोड़', 'crore', 'lakh', 'लाख',
];

// Skip keywords
const SKIP_KEYWORDS = [
  'शोक', 'संवेदना', 'बधाई', 'मन की बात', 'विदेश दौरा',
  'द्विपक्षीय', 'शिखर सम्मेलन', 'condolence', 'greetings',
  'cricket', 'क्रिकेट', 'रणजी', 'sports',
];

function fetch(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(parsed, { timeout: 15000 }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
        fetch(redirectUrl).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const desc = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
    items.push({ 
      title: title.trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
      link: link.trim(),
      description: desc.trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
    });
  }
  return items;
}

function isRelevant(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (SKIP_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))) return false;
  return RELEVANT_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function categorize(item) {
  const text = `${item.title} ${item.description}`;
  
  if (/योजना|scheme|yojana|शुभारंभ|उद्घाटन|launched|inaugurated|लॉन्च/i.test(text))
    return 'NEW_SCHEME_OR_LAUNCH';
  if (/संशोधित|revised|amendment|नए नियम|new rules|शुल्क|fee|charges/i.test(text))
    return 'POLICY_CHANGE';
  if (/पोर्टल|portal|ऐप|app|डिजिटल|digital|ऑनलाइन|online/i.test(text))
    return 'DIGITAL_SERVICE';
  if (/भर्ती|recruitment|रिक्ति|vacancy|परीक्षा|exam|परिणाम|result/i.test(text))
    return 'JOBS_EXAMS';
  if (/अंतिम तिथि|deadline|विस्तार|extended|last date/i.test(text))
    return 'DEADLINE';
  if (/करोड़|crore|लाख|lakh|बजट|budget|आवंटन|allocation/i.test(text))
    return 'FUNDING';
  return 'OTHER';
}

async function main() {
  const trackerPath = path.join(__dirname, 'pib-tracker.json');
  let tracker = {};
  try {
    tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
  } catch (e) {
    tracker = { lastScan: null, seenLinks: [] };
  }

  console.log('🔍 Scanning PIB RSS feed...');
  
  let allItems = [];
  
  try {
    const xml = await fetch(PIB_RSS_URL);
    const items = parseRSS(xml);
    allItems = items;
    console.log(`📰 PIB feed: ${items.length} items`);
  } catch (e) {
    console.error(`❌ Feed error: ${e.message}`);
  }

  // Filter new items
  const seenSet = new Set(tracker.seenLinks || []);
  const newItems = allItems.filter(item => !seenSet.has(item.link));
  
  console.log(`📊 Total: ${allItems.length} items, ${newItems.length} new since last scan`);

  // Filter for citizen-relevant items
  const relevant = newItems.filter(isRelevant);
  const categorized = relevant.map(item => ({
    ...item,
    category: categorize(item),
  }));

  // Sort by priority
  const priority = { NEW_SCHEME_OR_LAUNCH: 0, POLICY_CHANGE: 1, DIGITAL_SERVICE: 2, FUNDING: 3, JOBS_EXAMS: 4, DEADLINE: 5, OTHER: 6 };
  categorized.sort((a, b) => (priority[a.category] || 6) - (priority[b.category] || 6));

  console.log(`🎯 Citizen-relevant items: ${categorized.length}`);
  
  if (categorized.length > 0) {
    console.log('\n--- ACTIONABLE ITEMS ---\n');
    for (const item of categorized) {
      console.log(`[${item.category}] ${item.title}`);
      console.log(`  🔗 ${item.link}`);
      console.log('');
    }
  } else {
    console.log('\n✅ No new citizen-relevant announcements.');
  }

  // Update tracker
  tracker.lastScan = new Date().toISOString();
  tracker.seenLinks = [...new Set([...(tracker.seenLinks || []), ...allItems.map(i => i.link)])].slice(-500);
  
  const output = {
    scanTime: new Date().toISOString(),
    totalItems: allItems.length,
    newItems: newItems.length,
    relevantItems: categorized.length,
    items: categorized,
  };
  
  fs.writeFileSync(path.join(__dirname, 'pib-latest.json'), JSON.stringify(output, null, 2));
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  
  console.log(`\n💾 Results saved to agents/pib-latest.json`);
}

main().catch(console.error);

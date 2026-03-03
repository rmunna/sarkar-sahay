const fs = require('fs');
const path = require('path');

const guidesDir = '/Users/rajakumar/.openclaw/workspace/sarkar-sahay/content/guides';

function getTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const m = content.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  return m ? m[1] : null;
}

function addRelatedGuides(filePath, links) {
  let content = fs.readFileSync(filePath, 'utf8');
  const slug = path.basename(filePath, '.md');
  
  // Filter out self-links
  const filtered = links.filter(l => l.slug !== slug).slice(0, 5);
  if (filtered.length === 0) return;
  
  const section = `\n## Related Guides\n\n${filtered.map(l => `- [${l.title}](/guide/${l.slug})`).join('\n')}\n`;
  
  // Remove existing Related Guides section
  content = content.replace(/\n## Related Guides\n[\s\S]*?(?=\n## |\n---\s*$|$)/, '');
  
  // Find where to insert: before FAQ section, or before last ---
  const faqMatch = content.match(/\n## (?:FAQ|Frequently Asked Questions)/);
  if (faqMatch) {
    const idx = content.indexOf(faqMatch[0]);
    content = content.slice(0, idx) + section + content.slice(idx);
  } else {
    // Append before trailing content or at end
    content = content.trimEnd() + '\n' + section;
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${slug}`);
}

// Build cluster data
function buildCluster(patterns) {
  const files = [];
  for (const p of patterns) {
    const dir = path.dirname(p);
    const glob = path.basename(p);
    const regex = new RegExp('^' + glob.replace(/\*/g, '.*') + '$');
    for (const f of fs.readdirSync(dir)) {
      if (regex.test(f)) {
        const fp = path.join(dir, f);
        const title = getTitle(fp);
        if (title) files.push({ slug: f.replace('.md', ''), title, path: fp });
      }
    }
  }
  // Deduplicate
  const seen = new Set();
  return files.filter(f => { if (seen.has(f.slug)) return false; seen.add(f.slug); return true; });
}

// IRCTC cluster - all cross-link
const irctc = buildCluster([`${guidesDir}/irctc-*.md`]);
for (const file of irctc) {
  addRelatedGuides(file.path, irctc.filter(f => f.slug !== file.slug));
}

// Aadhaar cluster - group into sub-topics for relevance
const aadhaar = buildCluster([`${guidesDir}/*aadhaar*.md`]);

// Sub-groups for better relevance
const aadhaarGroups = {
  address: ['aadhaar-address-change-online', 'aadhaar-address-update-online-not-working-fix', 'aadhaar-address-update-rejected-fix'],
  biometric: ['aadhaar-biometric-lock-unlock', 'aadhaar-biometric-lock-not-working-fix', 'aadhaar-biometric-verification-failed-fix', 'aadhaar-face-authentication-failed-fix'],
  download: ['aadhaar-card-download-online', 'aadhaar-card-download-not-working-fix', 'download-e-aadhaar-card-online', 'aadhaar-pvc-card-order-online', 'aadhaar-pvc-card-not-delivered-fix'],
  name: ['aadhaar-name-correction-online', 'aadhaar-name-correction-rejected-fix'],
  apply: ['aadhaar-card-apply-online', 'tatkal-aadhaar-enrollment', 'find-nearest-aadhaar-centre-google-maps', 'aadhaar-enrollment-id-lost-retrieve-fix', 'baal-aadhaar-child-aadhaar-card'],
  link: ['aadhaar-linking-guide', 'aadhaar-pan-link', 'pan-aadhaar-link-failed-fix', 'pan-aadhaar-link-failed-common-errors', 'aadhaar-voter-id-linking-online', 'bank-account-aadhaar-link-not-working-fix'],
  mobile: ['aadhaar-update-mobile-email', 'change-mobile-number-in-aadhaar-card', 'aadhaar-otp-not-received-fix'],
  esign: ['aadhaar-esign-online-guide', 'e-sign-aadhaar-based', 'digilocker-aadhaar-verification-failed-fix'],
  update: ['aadhaar-update-status-check', 'aadhaar-common-problems-solutions', 'minor-to-major-aadhaar-update', 'lost-aadhaar-card-retrieval'],
  compare: ['aadhaar-vs-pan-difference', 'aadhaar-vs-voter-id-vs-passport-id-proof'],
  special: ['jan-aadhaar-card-rajasthan'],
};

// For each aadhaar file, find its group and pick related from same group + general
function findAadhaarRelated(slug) {
  // Find which groups this slug belongs to
  const myGroups = [];
  for (const [group, slugs] of Object.entries(aadhaarGroups)) {
    if (slugs.includes(slug)) myGroups.push(group);
  }
  
  // Collect related: same group first, then general helpful ones
  const related = new Set();
  for (const g of myGroups) {
    for (const s of aadhaarGroups[g]) {
      if (s !== slug) related.add(s);
    }
  }
  // Add common ones
  for (const s of ['aadhaar-common-problems-solutions', 'aadhaar-card-download-online', 'aadhaar-update-status-check', 'aadhaar-linking-guide', 'aadhaar-card-apply-online']) {
    if (s !== slug) related.add(s);
  }
  
  const result = [];
  for (const s of related) {
    const entry = aadhaar.find(a => a.slug === s);
    if (entry) result.push(entry);
    if (result.length >= 5) break;
  }
  return result;
}

for (const file of aadhaar) {
  addRelatedGuides(file.path, findAadhaarRelated(file.slug));
}

// Voter ID cluster
const voter = buildCluster([`${guidesDir}/voter-id-*.md`, `${guidesDir}/e-epic-*.md`, `${guidesDir}/aadhaar-voter-id-*.md`, `${guidesDir}/aadhaar-vs-voter-id-*.md`]);

for (const file of voter) {
  const others = voter.filter(f => f.slug !== file.slug);
  // Pick most relevant 5
  addRelatedGuides(file.path, others.slice(0, 5));
}

// Banking/Payment cluster - sub-group for relevance
const banking = buildCluster([
  `${guidesDir}/*payment*.md`, `${guidesDir}/*upi*.md`, `${guidesDir}/*bank*.md`,
  `${guidesDir}/neft-*.md`, `${guidesDir}/bharat-bill-*.md`, `${guidesDir}/phonepe-*.md`,
  `${guidesDir}/paytm-*.md`, `${guidesDir}/whatsapp-payment-*.md`, `${guidesDir}/sbi-net-*.md`,
  `${guidesDir}/hdfc-*.md`, `${guidesDir}/nach-*.md`, `${guidesDir}/open-bank-*.md`,
  `${guidesDir}/nomination-update-*.md`
]);

const bankingGroups = {
  upi: ['upi-payment-setup-guide', 'upi-payment-failed-money-debited-refund-fix', 'upi-payment-refund-not-received-fix', 'upi-transaction-failed-fix', 'neft-rtgs-imps-upi-difference', 'whatsapp-payment-upi-not-working-fix', 'phonepe-payment-failed-fix', 'paytm-payment-failed-fix'],
  netbanking: ['sbi-net-banking-registration-login', 'sbi-net-banking-login-not-working-fix', 'hdfc-netbanking-mobile-banking-not-working-fix', 'bank-balance-check-online-all-banks'],
  bankaccount: ['open-bank-account-online', 'bank-account-frozen-blocked-unblock-fix', 'bank-account-aadhaar-link-not-working-fix', 'nomination-update-bank-insurance-epf', 'bank-locker-rules-charges-rbi'],
  bills: ['electricity-bill-payment-online', 'electricity-bill-payment-failed-fix', 'water-bill-payment-online', 'property-tax-payment-online', 'property-tax-payment-failed-fix', 'bharat-bill-payment-system', 'lic-premium-payment-online'],
  govt: ['pm-kisan-payment-not-received-fix', 'nrega-job-card-payment-status', 'pension-payment-not-credited-fix', 'scholarship-payment-not-received-fix', 'scholarship-payment-delayed-tracking-fix'],
};

function findBankingRelated(slug) {
  const myGroups = [];
  for (const [group, slugs] of Object.entries(bankingGroups)) {
    if (slugs.includes(slug)) myGroups.push(group);
  }
  const related = new Set();
  for (const g of myGroups) {
    for (const s of bankingGroups[g]) {
      if (s !== slug) related.add(s);
    }
  }
  // Add general useful ones
  for (const s of ['upi-payment-setup-guide', 'neft-rtgs-imps-upi-difference', 'bharat-bill-payment-system', 'open-bank-account-online', 'bank-balance-check-online-all-banks']) {
    if (s !== slug) related.add(s);
  }
  const result = [];
  for (const s of related) {
    const entry = banking.find(a => a.slug === s);
    if (entry) result.push(entry);
    if (result.length >= 5) break;
  }
  return result;
}

// Skip non-core files from banking cluster
const skipBanking = ['irctc-payment-deducted-ticket-not-booked-fix', 'ladli-behna-yojana-mp-status-payment', 'advance-tax-payment-guide', 'bank-holidays-march-2026', 'banking-exam-preparation-guide', 'nach-auto-debit-payment-failed-fix'];

for (const file of banking) {
  if (skipBanking.includes(file.slug)) continue;
  const related = findBankingRelated(file.slug);
  if (related.length > 0) addRelatedGuides(file.path, related);
}

console.log('Done!');

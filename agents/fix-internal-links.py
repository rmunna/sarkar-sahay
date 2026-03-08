#!/usr/bin/env python3
"""Fix broken internal links by remapping to existing slugs. Uses regex word boundaries."""
import os, re, glob

GUIDES_DIR = os.path.expanduser('~/.openclaw/workspace/sarkar-sahay/content/guides')
UPDATES_DIR = os.path.expanduser('~/.openclaw/workspace/sarkar-sahay/content/updates')

MAPPING = {
    'aadhaar-bank-linking-guide': 'aadhaar-card-apply-online',
    'aadhaar-card-complete-guide': 'aadhaar-card-apply-online',
    'aadhaar-card-download': 'aadhaar-card-download-online',
    'aadhaar-card-update': 'aadhaar-card-reprint-online',
    'aadhaar-name-change-online': 'aadhaar-name-correction-online',
    'ayushman-bharat-pmjay-guide': 'ayushman-bharat-pmjay',
    'ayushman-bharat-pmjay-health-card': 'ayushman-bharat-pmjay',
    'ayushman-bharat-yojana': 'ayushman-bharat-pmjay',
    'baal-aadhaar-card-apply': 'baal-aadhaar-child-aadhaar-card',
    'bank-po-exam': 'ssc-cgl-vs-ssc-chsl-comparison',
    'cbse-single-girl-child-scholarship': 'national-scholarship-portal-apply',
    'cds-exam-preparation-guide': 'cds-exam-guide',
    'cibil-score-check-free': 'cibil-score-check-free-online',
    'consumer-court-complaint-online': 'consumer-court-guide-detailed',
    'death-certificate-online-apply': 'death-certificate-apply-online',
    'death-certificate-online': 'death-certificate-apply-online',
    'digilocker-account-create-online': 'digilocker-nac-certificate-download',
    'digilocker-account-setup': 'digilocker-advanced-features',
    'domicile-certificate': 'domicile-certificate-apply-online',
    'driving-licence-apply-online': 'driving-licence-renewal-online',
    'driving-licence-online-apply': 'driving-licence-renewal-online',
    'driving-licence-online': 'driving-licence-renewal-online',
    'e-district-portal-online-certificates': 'up-e-district-certificate',
    'encumbrance-certificate': 'encumbrance-certificate-apply',
    'epf-withdrawal-online': 'epf-withdrawal-online-guide',
    'government-job-application-guide': 'government-jobs-apply-online',
    'government-job-preparation-tips': 'government-exam-preparation-guide',
    'government-jobs-after-graduation': 'government-jobs-apply-online',
    'gst-registration-online-guide': 'gst-registration-online',
    'how-to-apply-government-schemes-online': 'how-to-apply-government-jobs-online',
    'ibps-po-exam-guide': 'ibps-so-exam-guide',
    'igrsup-property-registration': 'igrs-maharashtra-property-registration',
    'income-certificate-apply': 'income-certificate-apply-online',
    'income-tax-calculator-india': 'income-tax-slab-rates-guide',
    'income-tax-efiling-guide': 'income-tax-slab-rates-guide',
    'income-tax-efiling-portal': 'income-tax-return-filing-errors-fix',
    'income-tax-return-filing-online': 'income-tax-return-file-online',
    'income-tax-return-filing': 'income-tax-return-file-online',
    'irctc-train-ticket-booking': 'irctc-train-ticket-pnr-status',
    'jan-dhan-yojana': 'jan-dhan-yojana-account-open',
    'jeevan-pramaan-life-certificate': 'jeevan-pramaan-life-certificate-failed-fix',
    'kisan-credit-card-apply-online': 'kisan-credit-card-apply',
    'mgnrega-job-card-apply': 'nrega-job-card-apply-check',
    'mobile-number-portability-mnp': 'mobile-number-portability-mnp-failed-fix',
    'mudra-loan-yojana': 'mudra-loan-application-rejected-fix',
    'national-scholarship-portal-guide': 'national-scholarship-portal-apply',
    'nps-national-pension-system': 'nps-national-pension-system-account',
    'old-age-pension-scheme': 'old-age-pension-apply-online',
    'pan-aadhaar-link-online': 'pan-aadhaar-link-failed-common-errors',
    'pan-aadhaar-link-status-check': 'pan-aadhaar-link-failed-common-errors',
    'pan-aadhaar-link-status-online': 'pan-aadhaar-link-failed-common-errors',
    'pan-aadhaar-link': 'pan-aadhaar-link-failed-common-errors',
    'pan-card-application': 'pan-card-correction-name-dob-online',
    'passport-application-guide': 'passport-apply-online',
    'passport-application': 'passport-apply-online',
    'passport-apply-online-india': 'passport-apply-online',
    'personal-loan-balance-transfer': 'personal-loan-apply-online-compare',
    'pm-kisan-samman-nidhi-check-status': 'pm-kisan-samman-nidhi',
    'pm-kisan-status-check': 'pm-kisan-status-check-beneficiary-list',
    'pmkvy-skill-india': 'skill-india-mission-pmkvy',
    'post-office-savings-schemes-guide': 'post-office-savings-schemes',
    'ppf-account-guide': 'ppf-account-open-guide',
    'ppf-public-provident-fund': 'ppf-public-provident-fund-account',
    'pradhan-mantri-awas-yojana-pmay': 'pmay-online-apply',
    'property-registration-online-india': 'property-registration-online-guide',
    'property-registration': 'property-registration-online-guide',
    'ration-card-online-apply': 'ration-card-apply-online',
    'ration-card-status-check': 'ration-card-status-check-download',
    'rc-registration-certificate-download': 'vehicle-rc-transfer-online',
    'sarkari-naukri-government-jobs-guide': 'sarkari-naukri-government-jobs',
    'sarkari-result-check-online': 'exam-results-check-online-guide',
    'scholarships-education-india': 'national-scholarship-portal-apply',
    'scholarships-for-students-india': 'scholarship-for-sc-st-obc',
    'ssc-cgl-exam-guide': 'ssc-exam-complete-guide',
    'ssc-cgl-exam': 'ssc-cgl-vs-ssc-chsl-comparison',
    'ssc-chsl-exam-guide': 'ssc-exam-complete-guide',
    'ssc-exam-guide': 'ssc-exam-complete-guide',
    'stamp-duty': 'stamp-duty-calculator-state-wise',
    'udyam-registration-online': 'udyam-registration-aadhaar-otp-fix',
    'uiic-ao-exam-guide': 'lic-aao-exam-guide',
    'upi-payment-failed-money-debited-fix': 'upi-payment-failed-money-debited-refund-fix',
    'upi-payment-not-working-fix': 'upi-payment-failed-money-debited-refund-fix',
    'upsc-civil-services-exam-guide': 'upsc-civil-services-preparation-guide',
    'upsc-civil-services-exam': 'upsc-civil-services-preparation-guide',
    'upsc-exam-guide': 'upsc-civil-services-preparation-guide',
    'vehicle-registration-online': 'vehicle-registration-certificate-transfer',
    'vehicle-registration-transfer': 'vehicle-registration-certificate-transfer',
    # Short slugs that caused substring issues - handle with special "exact match only" marker
    'aadhaar-card': 'aadhaar-card-apply-online',
}

# Verify all targets exist
existing = set(f[:-3] for f in os.listdir(GUIDES_DIR) if f.endswith('.md'))
for broken, target in MAPPING.items():
    if target not in existing:
        print(f"WARNING: target {target} does not exist!")

# Sort by length descending so longer slugs match first (prevents partial matches)
sorted_mapping = sorted(MAPPING.items(), key=lambda x: -len(x[0]))

# Build regex patterns - match /guide/SLUG followed by non-alphanumeric-dash (or end)
patterns = []
for broken, target in sorted_mapping:
    # Match /guide/broken-slug only when followed by ), ", ', space, newline, or end
    pattern = re.compile(r'/guide/' + re.escape(broken) + r'(?=[^a-z0-9\-]|$)')
    replacement = f'/guide/{target}'
    patterns.append((pattern, replacement, broken))

total_replacements = 0
files_changed = 0

for d in [GUIDES_DIR, UPDATES_DIR]:
    for fpath in glob.glob(os.path.join(d, '*.md')):
        with open(fpath, 'r') as f:
            content = f.read()
        
        new_content = content
        file_count = 0
        for pattern, replacement, broken_slug in patterns:
            new_content, n = pattern.subn(replacement, new_content)
            file_count += n
        
        if new_content != content:
            with open(fpath, 'w') as f:
                f.write(new_content)
            total_replacements += file_count
            files_changed += 1

print(f"\n✅ Fixed {total_replacements} broken links across {files_changed} files")

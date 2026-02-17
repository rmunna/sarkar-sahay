#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const guidesDir = path.join(__dirname, '..', 'content', 'guides');

// All available slugs
const allSlugs = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));

// Files to process
const filesToFix = `aadhaar-address-change-online, aadhaar-card-apply-online, aadhaar-name-correction-online, aadhaar-pan-link, aadhaar-update-status-check, ayushman-bharat-health-card, bhumi-jankari-land-records-bihar, birth-certificate-apply-online, board-exam-results-check-download, caste-certificate-online, change-mobile-number-in-aadhaar-card, cibil-score-check-improve, consumer-complaint-online, death-certificate-apply-online, dharani-portal-telangana-land-records, digilocker-guide, disability-certificate-udid-card, domicile-certificate-online, download-e-aadhaar-card-online, download-e-pan-card-online, driving-license-apply-online, driving-license-renewal-online, e-shram-card-registration, electricity-connection-apply-online, epf-pf-withdrawal-online, fastag-apply-recharge-online, fir-online-police-complaint, government-jobs-apply-online, gst-registration-online, income-certificate-online, income-tax-return-file-online, indira-rasoi-yojana-rajasthan, irctc-train-ticket-pnr-status, jeevan-pramaan-life-certificate-online, kanyashree-prakalpa-west-bengal, ladli-bahna-yojana-mp, lakshmir-bhandar-west-bengal, land-records-bhulekh-online, lost-documents-replacement-guide, lpg-subsidy-ujjwala-yojana, majhi-ladki-bahin-yojana-maharashtra, marriage-certificate-apply-online, mudra-loan-apply-online, mukhyamantri-kanya-utthan-yojana-bihar, national-scholarship-portal-apply, nrega-job-card-apply-download, pan-card-apply-online, pan-card-correction-online, passport-application-status-track, passport-apply-online, passport-renewal-online-india, pm-awas-yojana-apply, pm-jan-dhan-yojana, pm-kisan-samman-nidhi, pm-vishwakarma-yojana, property-registration-online, ration-card-apply-online, rti-online-application, rythu-bandhu-telangana, seekho-kamao-yojana-mp, senior-citizen-savings-scheme, shakti-free-bus-karnataka, ssc-exam-apply-hall-ticket, student-credit-card-bihar, sukanya-samriddhi-yojana, udyam-msme-registration-online, vehicle-rc-transfer-online, voter-id-card-apply-online, voter-id-correction-online, water-connection-apply-online, widow-pension-vidhwa-pension-apply`.split(', ');

// Define related links for each guide (2-4 links each)
const crosslinks = {
  'aadhaar-address-change-online': {
    inline: [
      { find: 'Aadhaar card', replace: '[Aadhaar card](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'update status', replace: '[update status](/guide/aadhaar-update-status-check)', once: true },
    ],
    related: [
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction Online' },
      { slug: 'change-mobile-number-in-aadhaar-card', text: 'Change Mobile Number in Aadhaar' },
      { slug: 'download-e-aadhaar-card-online', text: 'Download e-Aadhaar Card Online' },
    ]
  },
  'aadhaar-card-apply-online': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'DigiLocker', replace: '[DigiLocker](/guide/digilocker-guide)', once: true },
    ],
    related: [
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN Card' },
      { slug: 'download-e-aadhaar-card-online', text: 'Download e-Aadhaar Card Online' },
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar Online' },
    ]
  },
  'aadhaar-name-correction-online': {
    inline: [
      { find: 'Aadhaar card', replace: '[Aadhaar card](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'update status', replace: '[update status](/guide/aadhaar-update-status-check)', once: true },
    ],
    related: [
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar Online' },
      { slug: 'change-mobile-number-in-aadhaar-card', text: 'Change Mobile Number in Aadhaar' },
      { slug: 'download-e-aadhaar-card-online', text: 'Download e-Aadhaar Card' },
    ]
  },
  'aadhaar-pan-link': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'income tax', replace: '[income tax](/guide/income-tax-return-file-online)', once: true },
    ],
    related: [
      { slug: 'download-e-pan-card-online', text: 'Download e-PAN Card Online' },
      { slug: 'aadhaar-card-apply-online', text: 'Apply for Aadhaar Card Online' },
      { slug: 'pan-card-correction-online', text: 'PAN Card Correction Online' },
    ]
  },
  'aadhaar-update-status-check': {
    inline: [
      { find: 'Aadhaar card', replace: '[Aadhaar card](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar Online' },
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction Online' },
      { slug: 'change-mobile-number-in-aadhaar-card', text: 'Change Mobile Number in Aadhaar' },
      { slug: 'download-e-aadhaar-card-online', text: 'Download e-Aadhaar Card Online' },
    ]
  },
  'ayushman-bharat-health-card': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'ration card', replace: '[ration card](/guide/ration-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'disability-certificate-udid-card', text: 'Disability Certificate & UDID Card' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
    ]
  },
  'bhumi-jankari-land-records-bihar': {
    inline: [
      { find: 'land records', replace: '[land records](/guide/land-records-bhulekh-online)', once: true },
    ],
    related: [
      { slug: 'property-registration-online', text: 'Property Registration Online' },
      { slug: 'dharani-portal-telangana-land-records', text: 'Dharani Portal Telangana Land Records' },
      { slug: 'mukhyamantri-kanya-utthan-yojana-bihar', text: 'Mukhyamantri Kanya Utthan Yojana Bihar' },
    ]
  },
  'birth-certificate-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'DigiLocker', replace: '[DigiLocker](/guide/digilocker-guide)', once: true },
    ],
    related: [
      { slug: 'death-certificate-apply-online', text: 'Death Certificate Apply Online' },
      { slug: 'marriage-certificate-apply-online', text: 'Marriage Certificate Apply Online' },
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
    ]
  },
  'board-exam-results-check-download': {
    inline: [
      { find: 'DigiLocker', replace: '[DigiLocker](/guide/digilocker-guide)', once: true },
    ],
    related: [
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'ssc-exam-apply-hall-ticket', text: 'SSC Exam Apply & Hall Ticket' },
      { slug: 'government-jobs-apply-online', text: 'Government Jobs Apply Online' },
    ]
  },
  'caste-certificate-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
    ],
    related: [
      { slug: 'domicile-certificate-online', text: 'Domicile Certificate Online' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'government-jobs-apply-online', text: 'Government Jobs Apply Online' },
    ]
  },
  'change-mobile-number-in-aadhaar-card': {
    inline: [
      { find: 'Aadhaar card', replace: '[Aadhaar card](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'e-Aadhaar', replace: '[e-Aadhaar](/guide/download-e-aadhaar-card-online)', once: true },
    ],
    related: [
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar' },
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction Online' },
      { slug: 'aadhaar-update-status-check', text: 'Check Aadhaar Update Status' },
    ]
  },
  'cibil-score-check-improve': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'mudra-loan-apply-online', text: 'Mudra Loan Apply Online' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return Online' },
    ]
  },
  'consumer-complaint-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'rti-online-application', text: 'RTI Online Application' },
      { slug: 'fir-online-police-complaint', text: 'FIR Online Police Complaint' },
      { slug: 'electricity-connection-apply-online', text: 'Electricity Connection Apply Online' },
    ]
  },
  'death-certificate-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'birth-certificate-apply-online', text: 'Birth Certificate Apply Online' },
      { slug: 'marriage-certificate-apply-online', text: 'Marriage Certificate Apply Online' },
      { slug: 'widow-pension-vidhwa-pension-apply', text: 'Widow Pension Apply' },
    ]
  },
  'dharani-portal-telangana-land-records': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'land-records-bhulekh-online', text: 'Land Records Bhulekh Online' },
      { slug: 'property-registration-online', text: 'Property Registration Online' },
      { slug: 'rythu-bandhu-telangana', text: 'Rythu Bandhu Telangana' },
    ]
  },
  'digilocker-guide': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'driving licence', replace: '[driving licence](/guide/driving-license-apply-online)', once: true },
    ],
    related: [
      { slug: 'download-e-aadhaar-card-online', text: 'Download e-Aadhaar Card' },
      { slug: 'download-e-pan-card-online', text: 'Download e-PAN Card' },
    ]
  },
  'disability-certificate-udid-card': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'ayushman-bharat-health-card', text: 'Ayushman Bharat Health Card' },
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'widow-pension-vidhwa-pension-apply', text: 'Pension Schemes Online' },
    ]
  },
  'domicile-certificate-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'caste certificate', replace: '[caste certificate](/guide/caste-certificate-online)', once: true },
    ],
    related: [
      { slug: 'income-certificate-online', text: 'Income Certificate Online' },
      { slug: 'birth-certificate-apply-online', text: 'Birth Certificate Apply Online' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
    ]
  },
  'download-e-aadhaar-card-online': {
    inline: [
      { find: 'Aadhaar card', replace: '[Aadhaar card](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'DigiLocker', replace: '[DigiLocker](/guide/digilocker-guide)', once: true },
    ],
    related: [
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar' },
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction' },
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN' },
    ]
  },
  'download-e-pan-card-online': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'pan-card-correction-online', text: 'PAN Card Correction Online' },
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return Online' },
    ]
  },
  'driving-license-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'driving-license-renewal-online', text: 'Driving License Renewal Online' },
      { slug: 'vehicle-rc-transfer-online', text: 'Vehicle RC Transfer Online' },
      { slug: 'fastag-apply-recharge-online', text: 'FASTag Apply & Recharge' },
    ]
  },
  'driving-license-renewal-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'driving licence', replace: '[driving licence](/guide/driving-license-apply-online)', once: true },
    ],
    related: [
      { slug: 'vehicle-rc-transfer-online', text: 'Vehicle RC Transfer Online' },
      { slug: 'fastag-apply-recharge-online', text: 'FASTag Apply & Recharge' },
    ]
  },
  'e-shram-card-registration': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'ration card', replace: '[ration card](/guide/ration-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'nrega-job-card-apply-download', text: 'NREGA Job Card Apply' },
      { slug: 'pm-awas-yojana-apply', text: 'PM Awas Yojana Apply' },
    ]
  },
  'electricity-connection-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'water-connection-apply-online', text: 'Water Connection Apply Online' },
      { slug: 'property-registration-online', text: 'Property Registration Online' },
      { slug: 'consumer-complaint-online', text: 'Consumer Complaint Online' },
    ]
  },
  'epf-pf-withdrawal-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN', replace: '[PAN](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return' },
      { slug: 'jeevan-pramaan-life-certificate-online', text: 'Jeevan Pramaan Life Certificate' },
    ]
  },
  'fastag-apply-recharge-online': {
    inline: [
      { find: 'vehicle RC', replace: '[vehicle RC](/guide/vehicle-rc-transfer-online)', once: true },
    ],
    related: [
      { slug: 'driving-license-apply-online', text: 'Driving License Apply Online' },
      { slug: 'driving-license-renewal-online', text: 'Driving License Renewal' },
      { slug: 'pan-card-apply-online', text: 'PAN Card Apply Online' },
    ]
  },
  'fir-online-police-complaint': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'consumer-complaint-online', text: 'Consumer Complaint Online' },
      { slug: 'rti-online-application', text: 'RTI Online Application' },
      { slug: 'lost-documents-replacement-guide', text: 'Lost Documents Replacement Guide' },
    ]
  },
  'government-jobs-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'caste certificate', replace: '[caste certificate](/guide/caste-certificate-online)', once: true },
    ],
    related: [
      { slug: 'ssc-exam-apply-hall-ticket', text: 'SSC Exam Apply & Hall Ticket' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'domicile-certificate-online', text: 'Domicile Certificate Online' },
    ]
  },
  'gst-registration-online': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'udyam-msme-registration-online', text: 'Udyam MSME Registration' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return' },
      { slug: 'mudra-loan-apply-online', text: 'Mudra Loan Apply Online' },
    ]
  },
  'income-certificate-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'caste certificate', replace: '[caste certificate](/guide/caste-certificate-online)', once: true },
    ],
    related: [
      { slug: 'domicile-certificate-online', text: 'Domicile Certificate Online' },
      { slug: 'ration-card-apply-online', text: 'Ration Card Apply Online' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
    ]
  },
  'income-tax-return-file-online': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN' },
      { slug: 'download-e-pan-card-online', text: 'Download e-PAN Card' },
      { slug: 'gst-registration-online', text: 'GST Registration Online' },
    ]
  },
  'indira-rasoi-yojana-rajasthan': {
    inline: [],
    related: [
      { slug: 'ration-card-apply-online', text: 'Ration Card Apply Online' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'nrega-job-card-apply-download', text: 'NREGA Job Card Apply' },
    ]
  },
  'irctc-train-ticket-pnr-status': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'jeevan-pramaan-life-certificate-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'senior-citizen-savings-scheme', text: 'Senior Citizen Savings Scheme' },
      { slug: 'epf-pf-withdrawal-online', text: 'EPF/PF Withdrawal Online' },
      { slug: 'widow-pension-vidhwa-pension-apply', text: 'Widow Pension Apply' },
    ]
  },
  'kanyashree-prakalpa-west-bengal': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'lakshmir-bhandar-west-bengal', text: 'Lakshmir Bhandar West Bengal' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'sukanya-samriddhi-yojana', text: 'Sukanya Samriddhi Yojana' },
    ]
  },
  'ladli-bahna-yojana-mp': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'seekho-kamao-yojana-mp', text: 'Seekho Kamao Yojana MP' },
      { slug: 'majhi-ladki-bahin-yojana-maharashtra', text: 'Majhi Ladki Bahin Yojana Maharashtra' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
    ]
  },
  'lakshmir-bhandar-west-bengal': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'kanyashree-prakalpa-west-bengal', text: 'Kanyashree Prakalpa West Bengal' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'widow-pension-vidhwa-pension-apply', text: 'Widow Pension Apply' },
    ]
  },
  'land-records-bhulekh-online': {
    inline: [],
    related: [
      { slug: 'property-registration-online', text: 'Property Registration Online' },
      { slug: 'dharani-portal-telangana-land-records', text: 'Dharani Portal Telangana' },
      { slug: 'bhumi-jankari-land-records-bihar', text: 'Bhumi Jankari Bihar Land Records' },
    ]
  },
  'lost-documents-replacement-guide': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'fir-online-police-complaint', text: 'FIR Online Police Complaint' },
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
      { slug: 'driving-license-apply-online', text: 'Driving License Apply Online' },
      { slug: 'voter-id-card-apply-online', text: 'Voter ID Card Apply Online' },
    ]
  },
  'lpg-subsidy-ujjwala-yojana': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'ration card', replace: '[ration card](/guide/ration-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'pm-awas-yojana-apply', text: 'PM Awas Yojana Apply' },
    ]
  },
  'majhi-ladki-bahin-yojana-maharashtra': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'ladli-bahna-yojana-mp', text: 'Ladli Bahna Yojana MP' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'ration-card-apply-online', text: 'Ration Card Apply Online' },
    ]
  },
  'marriage-certificate-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'birth-certificate-apply-online', text: 'Birth Certificate Apply Online' },
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction (after marriage)' },
    ]
  },
  'mudra-loan-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'udyam-msme-registration-online', text: 'Udyam MSME Registration' },
      { slug: 'pm-vishwakarma-yojana', text: 'PM Vishwakarma Yojana' },
      { slug: 'gst-registration-online', text: 'GST Registration Online' },
    ]
  },
  'mukhyamantri-kanya-utthan-yojana-bihar': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'student-credit-card-bihar', text: 'Student Credit Card Bihar' },
      { slug: 'sukanya-samriddhi-yojana', text: 'Sukanya Samriddhi Yojana' },
    ]
  },
  'national-scholarship-portal-apply': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
      { find: 'caste certificate', replace: '[caste certificate](/guide/caste-certificate-online)', once: true },
    ],
    related: [
      { slug: 'domicile-certificate-online', text: 'Domicile Certificate Online' },
      { slug: 'board-exam-results-check-download', text: 'Board Exam Results Check' },
    ]
  },
  'nrega-job-card-apply-download': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'ration card', replace: '[ration card](/guide/ration-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'pm-awas-yojana-apply', text: 'PM Awas Yojana Apply' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
    ]
  },
  'pan-card-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN' },
      { slug: 'pan-card-correction-online', text: 'PAN Card Correction Online' },
      { slug: 'download-e-pan-card-online', text: 'Download e-PAN Card' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return' },
    ]
  },
  'pan-card-correction-online': {
    inline: [
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'download-e-pan-card-online', text: 'Download e-PAN Card' },
      { slug: 'aadhaar-pan-link', text: 'Link Aadhaar with PAN' },
      { slug: 'income-tax-return-file-online', text: 'File Income Tax Return' },
    ]
  },
  'passport-application-status-track': {
    inline: [
      { find: 'passport', replace: '[passport](/guide/passport-apply-online)', once: true },
    ],
    related: [
      { slug: 'passport-renewal-online-india', text: 'Passport Renewal Online' },
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'passport-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'birth certificate', replace: '[birth certificate](/guide/birth-certificate-apply-online)', once: true },
    ],
    related: [
      { slug: 'passport-renewal-online-india', text: 'Passport Renewal Online' },
      { slug: 'passport-application-status-track', text: 'Track Passport Application Status' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'passport-renewal-online-india': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'passport-apply-online', text: 'Passport Apply Online' },
      { slug: 'passport-application-status-track', text: 'Track Passport Application Status' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'pm-awas-yojana-apply': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
    ],
    related: [
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'ration-card-apply-online', text: 'Ration Card Apply Online' },
      { slug: 'property-registration-online', text: 'Property Registration Online' },
    ]
  },
  'pm-jan-dhan-yojana': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'pm-kisan-samman-nidhi', text: 'PM Kisan Samman Nidhi' },
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'sukanya-samriddhi-yojana', text: 'Sukanya Samriddhi Yojana' },
    ]
  },
  'pm-kisan-samman-nidhi': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'land records', replace: '[land records](/guide/land-records-bhulekh-online)', once: true },
    ],
    related: [
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'nrega-job-card-apply-download', text: 'NREGA Job Card Apply' },
      { slug: 'rythu-bandhu-telangana', text: 'Rythu Bandhu Telangana' },
    ]
  },
  'pm-vishwakarma-yojana': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'mudra-loan-apply-online', text: 'Mudra Loan Apply Online' },
      { slug: 'udyam-msme-registration-online', text: 'Udyam MSME Registration' },
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
    ]
  },
  'property-registration-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'land-records-bhulekh-online', text: 'Land Records Bhulekh Online' },
      { slug: 'electricity-connection-apply-online', text: 'Electricity Connection Apply Online' },
      { slug: 'water-connection-apply-online', text: 'Water Connection Apply Online' },
    ]
  },
  'ration-card-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
    ],
    related: [
      { slug: 'lpg-subsidy-ujjwala-yojana', text: 'LPG Subsidy Ujjwala Yojana' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'pm-awas-yojana-apply', text: 'PM Awas Yojana Apply' },
    ]
  },
  'rti-online-application': {
    inline: [],
    related: [
      { slug: 'consumer-complaint-online', text: 'Consumer Complaint Online' },
      { slug: 'fir-online-police-complaint', text: 'FIR Online Police Complaint' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'rythu-bandhu-telangana': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'land records', replace: '[land records](/guide/land-records-bhulekh-online)', once: true },
    ],
    related: [
      { slug: 'pm-kisan-samman-nidhi', text: 'PM Kisan Samman Nidhi' },
      { slug: 'dharani-portal-telangana-land-records', text: 'Dharani Portal Telangana' },
    ]
  },
  'seekho-kamao-yojana-mp': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'ladli-bahna-yojana-mp', text: 'Ladli Bahna Yojana MP' },
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
    ]
  },
  'senior-citizen-savings-scheme': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN', replace: '[PAN](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'sukanya-samriddhi-yojana', text: 'Sukanya Samriddhi Yojana' },
      { slug: 'jeevan-pramaan-life-certificate-online', text: 'Jeevan Pramaan Life Certificate' },
      { slug: 'epf-pf-withdrawal-online', text: 'EPF/PF Withdrawal Online' },
    ]
  },
  'shakti-free-bus-karnataka': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'e-shram-card-registration', text: 'e-Shram Card Registration' },
      { slug: 'voter-id-card-apply-online', text: 'Voter ID Card Apply Online' },
      { slug: 'ration-card-apply-online', text: 'Ration Card Apply Online' },
    ]
  },
  'ssc-exam-apply-hall-ticket': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'government-jobs-apply-online', text: 'Government Jobs Apply Online' },
      { slug: 'board-exam-results-check-download', text: 'Board Exam Results Check' },
      { slug: 'caste-certificate-online', text: 'Caste Certificate Online' },
    ]
  },
  'student-credit-card-bihar': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
    ],
    related: [
      { slug: 'mukhyamantri-kanya-utthan-yojana-bihar', text: 'Mukhyamantri Kanya Utthan Yojana Bihar' },
      { slug: 'national-scholarship-portal-apply', text: 'National Scholarship Portal' },
      { slug: 'cibil-score-check-improve', text: 'CIBIL Score Check & Improve' },
    ]
  },
  'sukanya-samriddhi-yojana': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN', replace: '[PAN](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
      { slug: 'senior-citizen-savings-scheme', text: 'Senior Citizen Savings Scheme' },
      { slug: 'birth-certificate-apply-online', text: 'Birth Certificate Apply Online' },
    ]
  },
  'udyam-msme-registration-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'PAN card', replace: '[PAN card](/guide/pan-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'gst-registration-online', text: 'GST Registration Online' },
      { slug: 'mudra-loan-apply-online', text: 'Mudra Loan Apply Online' },
      { slug: 'pm-vishwakarma-yojana', text: 'PM Vishwakarma Yojana' },
    ]
  },
  'vehicle-rc-transfer-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'driving-license-apply-online', text: 'Driving License Apply Online' },
      { slug: 'fastag-apply-recharge-online', text: 'FASTag Apply & Recharge' },
      { slug: 'driving-license-renewal-online', text: 'Driving License Renewal' },
    ]
  },
  'voter-id-card-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'voter-id-correction-online', text: 'Voter ID Correction Online' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
      { slug: 'aadhaar-address-change-online', text: 'Change Address in Aadhaar' },
    ]
  },
  'voter-id-correction-online': {
    inline: [
      { find: 'voter ID', replace: '[voter ID](/guide/voter-id-card-apply-online)', once: true },
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'aadhaar-name-correction-online', text: 'Aadhaar Name Correction' },
      { slug: 'pan-card-correction-online', text: 'PAN Card Correction' },
      { slug: 'digilocker-guide', text: 'DigiLocker Guide' },
    ]
  },
  'water-connection-apply-online': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
    ],
    related: [
      { slug: 'electricity-connection-apply-online', text: 'Electricity Connection Apply Online' },
      { slug: 'property-registration-online', text: 'Property Registration Online' },
      { slug: 'consumer-complaint-online', text: 'Consumer Complaint Online' },
    ]
  },
  'widow-pension-vidhwa-pension-apply': {
    inline: [
      { find: 'Aadhaar', replace: '[Aadhaar](/guide/aadhaar-card-apply-online)', once: true },
      { find: 'income certificate', replace: '[income certificate](/guide/income-certificate-online)', once: true },
    ],
    related: [
      { slug: 'death-certificate-apply-online', text: 'Death Certificate Apply Online' },
      { slug: 'jeevan-pramaan-life-certificate-online', text: 'Jeevan Pramaan Life Certificate' },
      { slug: 'pm-jan-dhan-yojana', text: 'PM Jan Dhan Yojana' },
    ]
  },
};

function processFile(slug) {
  const filePath = path.join(guidesDir, `${slug}.md`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const config = crosslinks[slug];
  if (!config) {
    console.log(`SKIP: No config for ${slug}`);
    return;
  }

  // Split frontmatter and body
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`SKIP: No frontmatter found in ${slug}`);
    return;
  }
  
  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // Check if body already has internal links
  if (body.includes('(/guide/')) {
    console.log(`SKIP: ${slug} already has internal links`);
    return;
  }

  // Apply inline replacements (only first occurrence, only in body, not in headings/links)
  for (const rule of config.inline) {
    // Find first occurrence that's not already in a link or heading
    const regex = new RegExp(`(?<!\\[)(?<!\\/)\\b${rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?!\\])(?!\\()`, 'i');
    if (regex.test(body)) {
      body = body.replace(regex, rule.replace);
    }
  }

  // Add related section at the end
  if (config.related && config.related.length > 0) {
    const relatedSection = `\n\n---\n\n## You May Also Need\n\n${config.related.map(r => `- [${r.text}](/guide/${r.slug})`).join('\n')}\n`;
    body = body.trimEnd() + relatedSection;
  }

  fs.writeFileSync(filePath, frontmatter + body);
  console.log(`DONE: ${slug}`);
}

for (const slug of filesToFix) {
  processFile(slug);
}

console.log('\nAll files processed!');

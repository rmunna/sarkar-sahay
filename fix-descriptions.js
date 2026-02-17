const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'content/guides');

const newDescs = {
  "aadhaar-address-change-online": "Update your Aadhaar address online via myAadhaar portal or offline at enrolment centres. Documents, fees, and tracking guide.",
  "aadhaar-common-problems-solutions": "Fix common Aadhaar problems — update rejected, OTP not received, biometric lock, name mismatch. Step-by-step solutions with UIDAI helpline.",
  "aadhaar-linking-guide": "Link Aadhaar with PAN, bank account, mobile, EPF, LPG, ration card, voter ID, and driving licence. Step-by-step process and deadlines.",
  "aadhaar-name-correction-online": "Correct or change your name in Aadhaar card online via myaadhaar.uidai.gov.in. Documents required, fees, and status tracking guide.",
  "aadhaar-pvc-card-order-online": "Order Aadhaar PVC card online from UIDAI for ₹50. Step-by-step process, payment methods, delivery time, and tracking your plastic Aadhaar.",
  "atal-pension-yojana-apy": "Atal Pension Yojana (APY) guide — get ₹1,000 to ₹5,000/month pension after 60. Eligibility, contribution chart, and online application process.",
  "baal-aadhaar-child-aadhaar-card": "Apply for Baal Aadhaar card for children below 5 years. Documents required, fees, biometric update at age 5 and 15, and download process.",
  "birth-certificate-apply-online": "Apply for birth certificate online via CRS portal. Step-by-step process, documents required, delayed registration, fees, and common FAQs.",
  "board-exam-results-check-download": "Check 10th and 12th board exam results online for CBSE, ICSE, and state boards. Download marksheet, use DigiLocker, and apply for revaluation.",
  "character-certificate-online": "Apply for character certificate (police verification) online. State-wise process for UP, Bihar, MP, Rajasthan with documents and fees.",
  "child-minor-passport-apply": "Apply for child or minor passport in India — documents, fees, online steps, special cases for single parents and divorced parents explained.",
  "cibil-score-check-improve": "Check your CIBIL score for free and improve your credit score in India. Score ranges, proven tips, and official links in one guide.",
  "company-registration-mca-online": "Register a company in India via MCA portal. SPICe+ form, DSC, DIN, name reservation, MOA/AOA, fees, and compliance steps explained.",
  "consumer-complaint-online": "File a consumer complaint online via National Consumer Helpline (1800-11-4000) and eDaakhil portal. Know your rights, documents, and tracking.",
  "digilocker-guide": "DigiLocker guide — create your account, fetch Aadhaar, PAN, driving licence and other government documents. Use them for KYC and verification.",
  "disability-certificate-udid-card": "Apply for UDID card (Unique Disability ID) online. Eligibility, documents, step-by-step process, benefits, pension details, and download guide.",
  "disability-pension-benefits-udid": "UDID card benefits guide — disability pension, Section 80U/80DD tax relief, railway concessions, ADIP scheme, scholarships, and job reservation.",
  "download-e-pan-card-online": "Download e-PAN card online for free using Aadhaar from Income Tax portal, NSDL, and UTIITSL. Also check PAN status and reprint options.",
  "driving-license-renewal-online": "Renew your driving licence online via Sarathi Parivahan portal. Documents required, fees, medical certificate rules, and digital DL download.",
  "e-challan-traffic-fine-pay-online": "Check and pay traffic e-challans online via echallan.parivahan.gov.in. Check status by vehicle number, pay fines, and dispute challans.",
  "e-shram-card-registration": "Register for e-Shram card online — for unorganized workers. Eligibility, documents, step-by-step process, download card, and ₹2 lakh insurance.",
  "encumbrance-certificate-online": "Apply for Encumbrance Certificate online. Learn what EC is, check property encumbrance, state-wise portals, documents needed, and fees.",
  "epf-pf-withdrawal-online": "Check PF balance, withdraw EPF online, transfer PF to new employer, activate UAN, and track claim status — complete step-by-step guide.",
  "fastag-apply-recharge-online": "Buy FASTag online or offline, recharge via UPI/Paytm/PhonePe, check balance, track toll transactions, and fix common FASTag problems.",
  "fir-online-police-complaint": "File FIR online in India via state portals and cybercrime.gov.in. Zero FIR, complaint tracking, and what to do if police refuse your FIR.",
  "gem-government-emarketplace-register": "Register on GeM portal as seller or buyer. Step-by-step process, documents required, bidding, product listing, and benefits explained.",
  "gst-registration-online": "Register for GST online on gst.gov.in. Who needs GST, documents required, step-by-step process, fees, processing time, and application tracking.",
  "international-driving-permit-apply": "Apply for International Driving Permit online via Sarathi Parivahan or at RTO. Documents, fees, validity, and step-by-step process guide.",
  "irctc-train-ticket-pnr-status": "Check PNR status, book train tickets on IRCTC, tatkal booking tips, cancel tickets, get refunds, and order food on train — complete guide.",
  "jeevan-pramaan-life-certificate-online": "Generate Jeevan Pramaan digital life certificate online. Pensioners can submit via app, CSC, bank, or face authentication — step-by-step.",
  "kisan-credit-card-apply": "Kisan Credit Card (KCC) guide — eligibility, 4% interest rate, documents, how to apply online and offline. Covers farming and fisheries.",
  "land-records-bhulekh-online": "Check land records online — access Bhulekh, Bhu Naksha, 7/12 Extract, Khasra Khatauni, and RTC records state-wise with step-by-step guide.",
  "learner-licence-apply-online": "Apply for Learner's Licence online via Sarathi Parivahan portal. Eligibility, documents, fees, LL test tips, and how to download your LL.",
  "lost-documents-replacement-guide": "Lost Aadhaar, PAN, Voter ID, licence, or passport? Step-by-step guide to replace all lost government documents online — fees and timelines.",
  "marriage-certificate-apply-online": "Apply for marriage certificate online in India. Documents required, fees, Hindu Marriage Act vs Special Marriage Act, and state-wise process.",
  "mudra-loan-apply-online": "Apply for Mudra Loan online under PMMY. Know Shishu, Kishore, Tarun categories, eligibility, documents, interest rates, and application steps.",
  "national-scholarship-portal-apply": "Apply on NSP for Pre-Matric, Post-Matric, Central Sector, and PM scholarships. Step-by-step process, documents, eligibility, and status check.",
  "nrega-job-card-apply-download": "NREGA/MGNREGA job card guide — apply online or offline, check status, download job card, view payment details, and file complaints easily.",
  "obc-ews-certificate-apply-online": "Apply for OBC and EWS certificate online in India. Eligibility, required documents, fees, validity, and step-by-step process for all states.",
  "old-age-pension-vridha-pension-apply": "Apply for old age pension (Vridha Pension) online in India. IGNOAPS scheme details, state-wise amounts, eligibility, documents, and status check.",
  "open-bank-account-online": "Open a savings bank account online in India. Covers zero balance, Jan Dhan, salary, minor, and NRI accounts with SBI, HDFC, ICICI, and more.",
  "pan-card-correction-online": "Correct PAN card name, DOB, photo, or signature online via NSDL (Protean) and UTIITSL. Documents required, fees, and tracking process guide.",
  "pan-card-status-check": "Check PAN card application status online via NSDL/Protean or UTIITSL. Track PAN, verify details, check PAN-Aadhaar link, and know your PAN.",
  "passport-application-status-track": "Track Indian passport application status online via Passport Seva Portal, mPassport app, and SMS. Status meanings and delivery tracking guide.",
  "passport-special-cases-tatkal-lost": "Guide for tatkal passport, lost or damaged passport, ECR/ECNR, name change after marriage, and spouse name addition. Fees and documents covered.",
  "pension-benefits-status-online": "Check pension status on CPAO, Bhavishya, and SPARSH portals. Download pension slip, track PPO, apply for family pension — guide for retirees.",
  "pensioner-life-certificate-submission": "Submit pensioner life certificate via Jeevan Pramaan, face authentication, bank, or India Post. Know deadlines to avoid pension stoppage.",
  "pm-kisan-maandhan-pension": "PM Kisan Maandhan Yojana guide — eligibility, contribution chart, documents, and how farmers get ₹3,000/month pension after age 60. Apply now.",
  "pm-kisan-status-check-beneficiary-list": "Check PM Kisan beneficiary status, village-wise list, instalment payments, complete eKYC, and fix rejected payments on pmkisan.gov.in.",
  "pm-surya-ghar-solar-rooftop": "PM Surya Ghar Yojana — get free solar panels with government subsidy up to ₹78,000. Eligibility, documents, application process, and status check.",
  "pm-svanidhi-street-vendor-loan": "PM SVANidhi scheme — get ₹10,000 to ₹50,000 loan for street vendors with 7% interest subsidy. Step-by-step online application process guide.",
  "pm-vishwakarma-yojana": "PM Vishwakarma Yojana guide — 18 eligible trades, ₹1-2 lakh collateral-free loans at 5% interest, skill training, and online application process.",
  "pmegp-loan-apply": "Apply for PMEGP loan online — eligibility, subsidy rates (15-35%), documents, project report, and bank sanction steps via kviconline.gov.in.",
  "pmfby-crop-insurance-apply": "Apply for PMFBY crop insurance online. Premium rates, eligibility, documents required, claim process, and application status check on pmfby.gov.in.",
  "police-clearance-certificate-apply": "Apply for Police Clearance Certificate (PCC) online via Passport Seva. Documents required, fees, processing time, and step-by-step guide.",
  "property-tax-payment-online": "Pay property tax online in India — step-by-step for Delhi MCD, Mumbai BMC, Bangalore BBMP, Chennai, and Hyderabad GHMC with official links.",
  "ration-card-apply-online-bihar": "Apply for a new ration card online in Bihar via serviceonline.bihar.gov.in. Eligibility, documents, fees, processing time, and tracking guide.",
  "ration-card-apply-online-karnataka": "Apply for ration card online in Karnataka through AHARA portal. Documents needed, fees, processing time, and how to track your application.",
  "ration-card-apply-online-tamil-nadu": "Apply for Smart Ration Card in Tamil Nadu via TNPDS portal. Documents required, fees, processing time, and application tracking steps.",
  "ration-card-status-download-update": "Check ration card status, download e-ration card, add or remove members, correct details, link Aadhaar, and use ONORC — all states guide.",
  "rti-online-application": "File RTI online via rtionline.gov.in — step-by-step process, fees, application format, appeal process, and timelines under RTI Act 2005.",
  "senior-citizen-savings-scheme": "SCSS guide for senior citizens — eligibility, 8.2% interest rate, how to open account, Section 80C tax benefits, and premature withdrawal rules.",
  "soil-health-card-apply": "Apply for Soil Health Card online and offline. Get free soil testing, know your soil nutrients, and get crop-wise fertilizer recommendations.",
  "stand-up-india-loan-scheme": "Stand Up India loan scheme guide — eligibility, loan amount, interest rate, documents, and how to apply on standupmitra.in for SC/ST and women.",
  "tds-return-filing-online": "TDS guide — rates for salary, FD, rent, how to file TDS return online, check Form 26AS, download Form 16, claim refund, and correct returns.",
  "udyam-msme-registration-online": "Free Udyam MSME Registration online — step-by-step process, documents, benefits, MSME classification, and how to download your Udyam certificate.",
  "vehicle-insurance-online": "Buy or renew car and bike insurance online in India. Types of vehicle insurance, documents, claim process, NCB explained, and status check.",
  "vehicle-rc-transfer-online": "Transfer vehicle RC online in India — ownership transfer, address change, duplicate RC, and NOC for interstate transfer via Vahan portal guide.",
  "voter-id-correction-online": "Correct Voter ID (EPIC) details online using Form 8 on NVSP portal. Fix name, address, photo, DOB, and download e-EPIC — step-by-step guide.",
  "water-connection-apply-online": "Apply for new water connection online in India — Delhi, Mumbai, Bangalore, Chennai, Hyderabad. Documents, fees, process, and FAQs covered.",
  "widow-pension-vidhwa-pension-apply": "Apply for widow pension (vidhwa pension) online in India. State-wise amounts, eligibility, documents, application process, and status check."
};

let fixed = 0;
for (const [slug, newDesc] of Object.entries(newDescs)) {
  const len = newDesc.length;
  if (len < 140 || len > 160) {
    console.error(`BAD LENGTH ${slug}: ${len} chars: "${newDesc}"`);
    continue;
  }
  const fp = path.join(dir, slug + '.md');
  let content = fs.readFileSync(fp, 'utf8');
  const match = content.match(/^(description:\s*)"(.*?)"/m) || content.match(/^(description:\s*)'(.*?)'/m);
  if (!match) { console.error(`NO MATCH: ${slug}`); continue; }
  content = content.replace(match[0], `${match[1]}"${newDesc}"`);
  fs.writeFileSync(fp, content);
  fixed++;
}
console.log(`Fixed ${fixed} files`);

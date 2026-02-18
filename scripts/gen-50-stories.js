const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'stories');
const SITE = 'https://www.citizennest.com';

const stories = [
  // === 15 Government Schemes ===
  { slug: 'pm-kisan-yojana-guide', title: 'PM Kisan Samman Nidhi Yojana', description: 'Complete guide to PM Kisan scheme - eligibility, registration, and how to get ₹6,000 per year directly in your bank account.', category: 'Government Schemes', guideSlug: 'pm-kisan-samman-nidhi', slides: [
    { title: 'What is PM Kisan?', points: ['₹6,000 per year to farmer families', 'Paid in 3 installments of ₹2,000 each', 'Direct bank transfer (DBT)', 'Launched in February 2019'] },
    { title: 'Who is Eligible?', points: ['All landholding farmer families', 'Must have cultivable land in records', 'Not for income tax payers', 'Not for government employees'] },
    { title: 'Documents Required', points: ['Aadhaar card (mandatory)', 'Bank account with IFSC', 'Land ownership records', 'Mobile number linked to Aadhaar'] },
    { title: 'How to Register Online', points: ['Visit pmkisan.gov.in', 'Click "New Farmer Registration"', 'Enter Aadhaar number & state', 'Fill form and submit documents'] },
    { title: 'Check Payment Status', points: ['Go to pmkisan.gov.in', 'Click "Beneficiary Status"', 'Enter Aadhaar or account number', 'View installment history'] },
  ]},
  { slug: 'ayushman-bharat-card-guide', title: 'Ayushman Bharat Yojana (PMJAY)', description: 'How to get Ayushman Bharat health card, check eligibility, and avail free treatment up to ₹5 lakh per family.', category: 'Government Schemes', guideSlug: 'ayushman-bharat-yojana', slides: [
    { title: 'What is Ayushman Bharat?', points: ['Free health insurance up to ₹5 lakh/year', 'Covers 1,500+ medical procedures', 'For economically weaker families', 'Cashless treatment at empanelled hospitals'] },
    { title: 'Eligibility Criteria', points: ['Based on SECC 2011 data', 'Rural: deprivation criteria families', 'Urban: listed occupational categories', 'Check at mera.pmjay.gov.in'] },
    { title: 'How to Get Ayushman Card', points: ['Visit nearest CSC or empanelled hospital', 'Carry Aadhaar + ration card', 'eKYC verification done on spot', 'Card generated digitally'] },
    { title: 'How to Use for Treatment', points: ['Visit any PMJAY empanelled hospital', 'Show Ayushman card at reception', 'Treatment is 100% cashless', 'No pre-existing disease exclusion'] },
    { title: 'Check Your Eligibility Online', points: ['Visit mera.pmjay.gov.in', 'Enter mobile number for OTP', 'Search by name, ration card, or RSBY ID', 'Download e-card if eligible'] },
  ]},
  { slug: 'pm-awas-yojana-guide', title: 'PM Awas Yojana (PMAY) Housing Scheme', description: 'Apply for PMAY - get subsidy up to ₹2.67 lakh on home loans for affordable housing under Pradhan Mantri Awas Yojana.', category: 'Government Schemes', guideSlug: 'pm-awas-yojana', slides: [
    { title: 'What is PM Awas Yojana?', points: ['Affordable housing for all Indians', 'Interest subsidy on home loans (CLSS)', 'Up to ₹2.67 lakh subsidy benefit', 'Covers urban and rural areas'] },
    { title: 'Income Categories & Subsidy', points: ['EWS: Income up to ₹3 lakh - 6.5% subsidy', 'LIG: ₹3-6 lakh - 6.5% subsidy', 'MIG-I: ₹6-12 lakh - 4% subsidy', 'MIG-II: ₹12-18 lakh - 3% subsidy'] },
    { title: 'Eligibility Requirements', points: ['No pucca house in family name', 'Not availed any housing scheme before', 'Aadhaar mandatory for all members', 'Property must be in woman\'s name (EWS/LIG)'] },
    { title: 'How to Apply', points: ['Visit pmaymis.gov.in', 'Click "Citizen Assessment" > "Under CLSS"', 'Fill form with Aadhaar & income details', 'Apply through bank for loan + subsidy'] },
    { title: 'Track Application Status', points: ['Visit pmaymis.gov.in', 'Use "Track Your Assessment" option', 'Enter assessment ID or mobile/name', 'Check approval and subsidy status'] },
  ]},
  { slug: 'pm-ujjwala-yojana-guide', title: 'PM Ujjwala Yojana - Free LPG Connection', description: 'Get free LPG gas connection under PM Ujjwala Yojana. Check eligibility, required documents, and application process.', category: 'Government Schemes', guideSlug: 'pm-ujjwala-yojana', slides: [
    { title: 'What is Ujjwala Yojana?', points: ['Free LPG connection to BPL families', 'Ujjwala 2.0 launched in 2021', 'No documentation hassle for migrants', '₹1,600 assistance for connection'] },
    { title: 'Who Can Apply?', points: ['Women from BPL households', 'No existing LPG connection in family', 'Age must be 18 years or above', 'Priority to SC/ST/PMAY beneficiaries'] },
    { title: 'Documents Required', points: ['Aadhaar card of applicant', 'BPL ration card or certificate', 'Bank account passbook', 'Passport size photograph'] },
    { title: 'How to Apply', points: ['Visit nearest LPG distributor', 'Fill Ujjwala application form', 'Submit KYC documents', 'Connection delivered within 7 days'] },
    { title: 'Ujjwala 2.0 Benefits', points: ['Free first refill and stove', 'No address proof needed for migrants', 'Self-declaration sufficient', 'Apply online at pmuy.gov.in'] },
  ]},
  { slug: 'pm-mudra-yojana-loan', title: 'PM Mudra Yojana - Business Loans up to ₹10 Lakh', description: 'Get collateral-free business loans up to ₹10 lakh under PMMY. Know about Shishu, Kishore, and Tarun categories.', category: 'Government Schemes', guideSlug: 'pm-mudra-yojana', slides: [
    { title: 'What is Mudra Yojana?', points: ['Collateral-free loans for small businesses', 'Loans from ₹50,000 to ₹10 lakh', 'Available at all banks and NBFCs', 'No processing fee charged'] },
    { title: 'Three Loan Categories', points: ['Shishu: Up to ₹50,000 (startup stage)', 'Kishore: ₹50,001 to ₹5 lakh (growth)', 'Tarun: ₹5,00,001 to ₹10 lakh (expansion)', 'Interest rates vary by bank (7-12%)'] },
    { title: 'Who Can Apply?', points: ['Any Indian starting/expanding business', 'Small manufacturers & traders', 'Shopkeepers, vendors, artisans', 'Women entrepreneurs get priority'] },
    { title: 'Documents Required', points: ['Identity proof (Aadhaar/PAN)', 'Address proof', 'Business plan or proposal', 'Passport photos & bank statements'] },
    { title: 'How to Apply', points: ['Visit any bank branch', 'Or apply on mudra.org.in', 'Fill Mudra loan application form', 'Loan sanctioned in 7-10 working days'] },
  ]},
  { slug: 'sukanya-samriddhi-yojana-guide', title: 'Sukanya Samriddhi Yojana (SSY)', description: 'Open SSY account for your daughter - earn 8.2% interest, get tax benefits under 80C, and secure her future.', category: 'Government Schemes', guideSlug: 'sukanya-samriddhi-yojana', slides: [
    { title: 'What is Sukanya Samriddhi?', points: ['Savings scheme for girl child', 'Current interest rate: 8.2% per annum', 'Tax-free returns (EEE status)', 'Government-backed - zero risk'] },
    { title: 'Eligibility & Rules', points: ['Girl child must be under 10 years', 'Max 2 accounts (one per daughter)', 'Minimum deposit: ₹250/year', 'Maximum deposit: ₹1.5 lakh/year'] },
    { title: 'Account Duration', points: ['Deposit for 15 years from opening', 'Account matures after 21 years', 'Partial withdrawal at 18 (50% for education)', 'Full withdrawal on maturity or marriage after 18'] },
    { title: 'Tax Benefits', points: ['Deposit deductible under Section 80C', 'Interest earned is tax-free', 'Maturity amount fully tax-free', 'Triple tax benefit (EEE)'] },
    { title: 'How to Open Account', points: ['Visit any post office or authorized bank', 'Fill SSY account opening form', 'Carry birth certificate of girl child', 'Parent\'s Aadhaar and PAN required'] },
  ]},
  { slug: 'atal-pension-yojana-guide', title: 'Atal Pension Yojana (APY)', description: 'Get guaranteed pension of ₹1,000 to ₹5,000 per month after 60. Complete guide to APY enrollment and benefits.', category: 'Government Schemes', guideSlug: 'atal-pension-yojana', slides: [
    { title: 'What is Atal Pension Yojana?', points: ['Guaranteed monthly pension after age 60', 'Pension of ₹1,000 to ₹5,000/month', 'Government co-contribution for eligible', 'Available for all Indian citizens'] },
    { title: 'Who Can Join?', points: ['Age between 18-40 years', 'Must have a savings bank account', 'Not an income tax payer', 'Must have mobile number & Aadhaar'] },
    { title: 'Pension Options', points: ['₹1,000/month: Pay ₹42-291/month', '₹2,000/month: Pay ₹84-582/month', '₹3,000/month: Pay ₹126-873/month', '₹5,000/month: Pay ₹210-1,454/month'] },
    { title: 'Key Benefits', points: ['Guaranteed pension for life', 'Spouse gets same pension after death', 'Nominee gets accumulated corpus', 'Auto-debit from bank - hassle free'] },
    { title: 'How to Enroll', points: ['Visit your bank branch', 'Or enroll via net banking/mobile app', 'Fill APY registration form', 'Set up auto-debit for contributions'] },
  ]},
  { slug: 'national-pension-system-guide', title: 'National Pension System (NPS)', description: 'Invest in NPS for retirement - get extra ₹50,000 tax deduction under 80CCD(1B) plus market-linked returns.', category: 'Government Schemes', guideSlug: 'national-pension-system', slides: [
    { title: 'What is NPS?', points: ['Market-linked retirement savings scheme', 'Regulated by PFRDA (Government body)', 'Low-cost investment with tax benefits', 'Available for all citizens aged 18-70'] },
    { title: 'Two Account Types', points: ['Tier I: Retirement account (lock-in till 60)', 'Tier II: Voluntary savings (no lock-in)', 'Tier I minimum: ₹500/year', 'Choose from Equity, Corporate Bond, Govt Securities'] },
    { title: 'Tax Benefits', points: ['Up to ₹1.5 lakh under Section 80CCD(1)', 'Extra ₹50,000 under Section 80CCD(1B)', 'Employer contribution: 80CCD(2) - no limit for central govt', '60% corpus tax-free on withdrawal'] },
    { title: 'Investment Choices', points: ['Active Choice: Pick your own allocation', 'Auto Choice: Age-based auto allocation', 'Choose from 7+ pension fund managers', 'Switch fund managers once a year'] },
    { title: 'How to Open NPS Account', points: ['Visit enps.nsdl.com for online opening', 'eKYC via Aadhaar OTP or PAN', 'Minimum ₹500 initial contribution', 'Get 12-digit PRAN (Permanent Account Number)'] },
  ]},
  { slug: 'pmjjby-life-insurance-guide', title: 'PM Jeevan Jyoti Bima Yojana (PMJJBY)', description: 'Get ₹2 lakh life insurance cover at just ₹436/year under PMJJBY. Know eligibility, claim process, and enrollment.', category: 'Government Schemes', guideSlug: 'pmjjby-life-insurance', slides: [
    { title: 'What is PMJJBY?', points: ['Life insurance cover of ₹2 lakh', 'Annual premium: Just ₹436', 'Covers death due to any reason', 'Available through bank accounts'] },
    { title: 'Eligibility', points: ['Age: 18 to 50 years', 'Must have savings bank account', 'Aadhaar linked to bank account', 'Auto-debit consent required'] },
    { title: 'Coverage Details', points: ['₹2 lakh on death due to any cause', 'Cover period: 1 June to 31 May', 'Annual renewal by auto-debit', 'Can be renewed up to age 55'] },
    { title: 'How to Enroll', points: ['Visit your bank branch', 'Or enroll via net banking app', 'Fill consent-cum-declaration form', 'Premium auto-debited on 31 May each year'] },
    { title: 'How to Claim', points: ['Nominee contacts the bank', 'Submit death certificate', 'Fill claim form with bank details', 'Amount credited within 30 days'] },
  ]},
  { slug: 'pmsby-accident-insurance-guide', title: 'PM Suraksha Bima Yojana (PMSBY)', description: 'Accidental insurance cover of ₹2 lakh at just ₹20/year. Complete guide to PMSBY benefits and enrollment.', category: 'Government Schemes', guideSlug: 'pmsby-accident-insurance', slides: [
    { title: 'What is PMSBY?', points: ['Accidental death & disability insurance', 'Annual premium: Only ₹20', 'Coverage: ₹2 lakh (death/full disability)', '₹1 lakh for partial disability'] },
    { title: 'Who Can Enroll?', points: ['Age: 18 to 70 years', 'Must have savings bank account', 'Aadhaar linked to bank', 'One policy per person'] },
    { title: 'What is Covered?', points: ['Accidental death: ₹2 lakh', 'Total permanent disability: ₹2 lakh', 'Partial permanent disability: ₹1 lakh', 'Covers road, rail & other accidents'] },
    { title: 'How to Enroll', points: ['SMS your bank or visit branch', 'Enroll via net banking/UPI app', 'Premium debited once on 1 June yearly', 'No medical examination needed'] },
    { title: 'Claim Process', points: ['Nominee informs the bank', 'Submit FIR + disability/death certificate', 'Hospital records for disability claims', 'Claim settled within 30 days'] },
  ]},
  { slug: 'e-shram-card-registration', title: 'e-Shram Card Registration Guide', description: 'Register on e-Shram portal for unorganized workers. Get UAN, insurance cover, and access to government benefits.', category: 'Government Schemes', guideSlug: 'e-shram-card', slides: [
    { title: 'What is e-Shram Card?', points: ['National database of unorganized workers', 'Free registration - no charges', 'Get Universal Account Number (UAN)', 'Access to social security schemes'] },
    { title: 'Who Should Register?', points: ['Construction workers, street vendors', 'Domestic workers, agricultural laborers', 'Gig workers, platform workers', 'Any worker without EPFO/ESIC coverage'] },
    { title: 'Benefits of e-Shram Card', points: ['₹2 lakh accidental insurance (PMSBY)', '₹1 lakh for partial disability', 'Access to PM schemes & benefits', 'Future social security benefits'] },
    { title: 'How to Register', points: ['Visit eshram.gov.in', 'Enter Aadhaar-linked mobile number', 'Verify with OTP', 'Fill occupation & bank details'] },
    { title: 'Download e-Shram Card', points: ['Login at eshram.gov.in', 'Card available instantly after registration', 'Download PDF or save to DigiLocker', 'Also register at nearest CSC center'] },
  ]},
  { slug: 'pmkvy-skill-training-guide', title: 'PM Kaushal Vikas Yojana (PMKVY)', description: 'Get free skill training and certification under PMKVY. Improve employability with government-funded courses.', category: 'Government Schemes', guideSlug: 'pmkvy-skill-training', slides: [
    { title: 'What is PMKVY?', points: ['Free skill development training', 'Government-certified courses', 'Training in 200+ job roles', 'Monetary reward on certification'] },
    { title: 'Who Can Join?', points: ['Indian citizens, any age group', 'Class 10/12 dropouts eligible', 'No prior experience needed', 'Priority to SC/ST/minorities'] },
    { title: 'Types of Training', points: ['Short Term Training: 150-300 hours', 'Recognition of Prior Learning (RPL)', 'Special Projects for specific sectors', 'Industry-aligned curriculum'] },
    { title: 'Benefits', points: ['Training is completely free', 'Get NSQF-aligned certificate', 'Placement assistance provided', 'Insurance coverage during training'] },
    { title: 'How to Enroll', points: ['Visit pmkvyofficial.org', 'Find nearest training center', 'Visit center with Aadhaar & photo', 'Choose course and start training'] },
  ]},
  { slug: 'standup-india-loan-scheme', title: 'Stand Up India - Loans for SC/ST & Women', description: 'Get bank loans from ₹10 lakh to ₹1 crore for SC/ST and women entrepreneurs under Stand Up India scheme.', category: 'Government Schemes', guideSlug: 'standup-india-loan', slides: [
    { title: 'What is Stand Up India?', points: ['Loans for SC/ST & women entrepreneurs', 'Loan range: ₹10 lakh to ₹1 crore', 'For greenfield (new) enterprises', 'Manufacturing, services, or trading'] },
    { title: 'Eligibility', points: ['SC/ST or women entrepreneur', 'Age 18 years and above', 'No existing default to any bank', 'New enterprise (not expansion)'] },
    { title: 'Loan Features', points: ['Composite loan (term + working capital)', 'Repayment period: up to 7 years', 'Moratorium period: up to 18 months', 'Margin money: up to 25%'] },
    { title: 'How to Apply', points: ['Visit standupmitra.in portal', 'Register and fill online application', 'Or approach any bank branch directly', 'Connect with SIDBI handholding support'] },
    { title: 'Documents Required', points: ['Identity & address proof', 'SC/ST certificate (if applicable)', 'Business plan/project report', 'Quotations for machinery/equipment'] },
  ]},
  { slug: 'pm-vishwakarma-yojana-guide', title: 'PM Vishwakarma Yojana - For Artisans', description: 'PM Vishwakarma scheme for traditional artisans and craftworkers. Get training, toolkit, loans, and digital support.', category: 'Government Schemes', guideSlug: 'pm-vishwakarma-yojana', slides: [
    { title: 'What is PM Vishwakarma?', points: ['Support scheme for traditional artisans', 'Covers 18 traditional trades', 'Training, toolkit & loan support', 'Launched on 17 September 2023'] },
    { title: 'Covered Trades', points: ['Carpenter, blacksmith, goldsmith, potter', 'Sculptor, cobbler, tailor, weaver', 'Boat maker, armourer, locksmith', 'Basket/mat/broom maker, toy maker'] },
    { title: 'Benefits Package', points: ['Free 5-15 day skill training', 'Toolkit incentive of ₹15,000', 'Collateral-free loans up to ₹3 lakh', 'Digital & marketing support'] },
    { title: 'Loan Details', points: ['First tranche: ₹1 lakh at 5% interest', 'Second tranche: ₹2 lakh at 5% interest', 'Interest subvention by government', 'Repayment period: 18 months per tranche'] },
    { title: 'How to Apply', points: ['Visit pmvishwakarma.gov.in', 'Register with Aadhaar and mobile', 'Verify at nearest CSC or GP office', 'Get PM Vishwakarma certificate & ID'] },
  ]},
  { slug: 'pm-svanidhi-street-vendors', title: 'PM SVANidhi - Loans for Street Vendors', description: 'Get working capital loans up to ₹50,000 for street vendors under PM SVANidhi scheme with interest subsidy.', category: 'Government Schemes', guideSlug: 'pm-svanidhi-scheme', slides: [
    { title: 'What is PM SVANidhi?', points: ['Micro-credit for street vendors', 'Working capital loan facility', 'Digital payments incentive', 'Launched during COVID-19 pandemic'] },
    { title: 'Loan Amounts', points: ['First loan: ₹10,000', 'Second loan: ₹20,000 (on repayment)', 'Third loan: ₹50,000', '7% interest subsidy by government'] },
    { title: 'Who is Eligible?', points: ['Street vendors with vending certificate', 'Or identified in urban survey', 'Letter of recommendation from ULB', 'Must vend in urban areas'] },
    { title: 'Digital Payment Reward', points: ['Cashback on digital transactions', '₹50-100/month for using UPI/QR', 'Encourages cashless payments', 'Track via PM SVANidhi app'] },
    { title: 'How to Apply', points: ['Visit pmsvanidhi.mohua.gov.in', 'Register with mobile number', 'Upload photo & vending certificate', 'Apply to nearest lending institution'] },
  ]},

  // === 10 Identity Documents ===
  { slug: 'aadhaar-update-online-guide', title: 'How to Update Aadhaar Card Online', description: 'Step-by-step guide to update your Aadhaar details online - name, address, mobile, photo, and biometrics.', category: 'Identity Documents', guideSlug: 'aadhaar-card-apply-online', slides: [
    { title: 'What Can You Update?', points: ['Name, date of birth, gender', 'Address, mobile number, email', 'Photo and biometrics (at center only)', 'Document updates online or at center'] },
    { title: 'Online Update Process', points: ['Visit myaadhaar.uidai.gov.in', 'Login with Aadhaar + OTP', 'Select "Update Aadhaar" option', 'Choose fields to update'] },
    { title: 'Documents Accepted', points: ['Passport, voter ID, DL for identity', 'Bank statement, utility bill for address', 'Birth certificate for DOB', 'Upload clear scanned copies'] },
    { title: 'Fees & Timeline', points: ['Online update: ₹50 per request', 'At center: ₹50 (biometric: ₹100)', 'Processing time: 10-30 days', 'Track at uidai.gov.in with URN'] },
    { title: 'Important Tips', points: ['Keep URN safe for tracking', 'Only 1 online update per field allowed', 'Biometric update requires center visit', 'Free biometric update once every 10 years'] },
  ]},
  { slug: 'pan-card-correction-guide', title: 'PAN Card Correction & Update Guide', description: 'How to correct name, DOB, father\'s name, or other details on your PAN card online through NSDL or UTIITSL.', category: 'Identity Documents', guideSlug: 'pan-card-correction-online', slides: [
    { title: 'What Can Be Corrected?', points: ['Name, date of birth, gender', 'Father\'s name', 'Address and contact details', 'Photo and signature on card'] },
    { title: 'Online Correction via NSDL', points: ['Visit onlineservices.nsdl.com', 'Select "Changes/Correction in PAN"', 'Fill Form 49A with correct details', 'Upload supporting documents'] },
    { title: 'Via UTIITSL', points: ['Visit utiitsl.com/PAN', 'Select "PAN card correction"', 'Fill application with corrections', 'Upload documents and pay fee'] },
    { title: 'Fees & Delivery', points: ['₹107 for Indian address delivery', '₹1,017 for foreign address', 'Physical card delivered in 15-20 days', 'e-PAN available in 48 hours'] },
    { title: 'Documents Required', points: ['Identity proof with correct details', 'DOB proof for date correction', 'Address proof for address change', 'Aadhaar can be used for all corrections'] },
  ]},
  { slug: 'passport-renewal-guide', title: 'How to Renew Indian Passport Online', description: 'Complete guide to renew your Indian passport - online application, documents, fees, and appointment process.', category: 'Identity Documents', guideSlug: 'passport-renewal-online', slides: [
    { title: 'When to Renew?', points: ['Passport expired or expiring within 1 year', 'All pages used up', 'Damaged passport', 'Name/address change needed'] },
    { title: 'Online Application Steps', points: ['Visit passportindia.gov.in', 'Register/login and fill application', 'Choose "Re-issue of Passport"', 'Pay fee and book appointment'] },
    { title: 'Documents Required', points: ['Old passport (original)', 'Aadhaar card', 'Address proof if changed', 'Self-attested photocopies'] },
    { title: 'Fees', points: ['36 pages: ₹1,500 (normal), ₹3,500 (tatkal)', '60 pages: ₹2,000 (normal), ₹4,000 (tatkal)', 'Normal processing: 30 days', 'Tatkal processing: 1-3 days'] },
    { title: 'Appointment Day Tips', points: ['Reach PSK 15 min before slot', 'Carry all original documents', 'No mobile phones inside PSK', 'Police verification may follow'] },
  ]},
  { slug: 'driving-license-renewal-guide', title: 'Driving License Renewal Online', description: 'How to renew your driving license online through Parivahan portal - step by step with documents and fees.', category: 'Identity Documents', guideSlug: 'driving-license-renewal', slides: [
    { title: 'When to Renew DL?', points: ['DL valid for 20 years or till age 50', 'Renew 1 year before to 1 year after expiry', 'Late renewal attracts penalty', 'Commercial DL: renew every 3 years'] },
    { title: 'Online Application', points: ['Visit parivahan.gov.in/sarathi', 'Select state and "DL Renewal"', 'Fill Form 9 with DL number', 'Upload photo, signature, documents'] },
    { title: 'Documents Required', points: ['Existing driving license', 'Address proof (Aadhaar/passport)', 'Medical certificate (Form 1A) for 50+', 'Passport size photographs'] },
    { title: 'Fees', points: ['DL renewal: ₹200', 'Smart card fee: ₹200', 'Late fee: ₹1,000 (after 1 year)', 'Medical test fee: ₹50-200'] },
    { title: 'After Application', points: ['Book slot at RTO if required', 'Download receipt and track status', 'DL dispatched by speed post', 'Takes 7-30 days depending on state'] },
  ]},
  { slug: 'voter-id-correction-guide', title: 'Voter ID Card Correction Online', description: 'How to correct name, photo, address, or other details on your Voter ID (EPIC) card through NVSP portal.', category: 'Identity Documents', guideSlug: 'voter-id-correction-online', slides: [
    { title: 'What Can Be Corrected?', points: ['Name, father/husband name', 'Date of birth, gender', 'Photo, address', 'Constituency/polling station shift'] },
    { title: 'Online Correction Process', points: ['Visit voters.eci.gov.in or NVSP', 'Login with mobile/email', 'Fill Form 8 for corrections', 'Upload supporting documents'] },
    { title: 'Documents Required', points: ['Aadhaar card for identity', 'Passport/DL for name proof', 'Address proof for address change', 'Birth certificate for DOB correction'] },
    { title: 'Timeline & Status', points: ['Processing takes 15-30 days', 'BLO may visit for verification', 'Track at voters.eci.gov.in', 'Download e-EPIC after correction'] },
    { title: 'Download e-EPIC', points: ['e-EPIC is digital voter ID', 'Available on voters.eci.gov.in', 'Also in Voter Helpline App', 'Valid as identity proof'] },
  ]},
  { slug: 'birth-certificate-online-guide', title: 'How to Apply for Birth Certificate Online', description: 'Register birth and get birth certificate online. Step-by-step guide for new registration and delayed registration.', category: 'Identity Documents', guideSlug: 'birth-certificate-apply-online', slides: [
    { title: 'Why Birth Certificate Matters', points: ['Essential for school admission', 'Required for Aadhaar, passport', 'Age proof for all purposes', 'Free if registered within 21 days'] },
    { title: 'Online Registration', points: ['Visit crsorgi.gov.in', 'Or state-specific portal', 'Fill birth registration form', 'Hospital births auto-registered usually'] },
    { title: 'Documents Required', points: ['Hospital discharge summary', 'Parents\' Aadhaar cards', 'Marriage certificate of parents', 'Proof of address'] },
    { title: 'Delayed Registration', points: ['After 21 days: registrar permission needed', 'After 30 days: magistrate order required', 'Affidavit may be needed', 'Late fee applicable'] },
    { title: 'Download Certificate', points: ['Login to state portal after registration', 'Certificate available in 7-15 days', 'Download digitally signed copy', 'Also available on DigiLocker'] },
  ]},
  { slug: 'marriage-certificate-guide', title: 'Marriage Certificate - How to Apply Online', description: 'Apply for marriage certificate online under Hindu/Special Marriage Act. Documents, process, and state-wise guide.', category: 'Identity Documents', guideSlug: 'marriage-certificate-apply-online', slides: [
    { title: 'Why You Need It', points: ['Legal proof of marriage', 'Required for spouse visa/passport', 'Name change after marriage', 'Joint property & insurance claims'] },
    { title: 'Which Act Applies?', points: ['Hindu Marriage Act: Hindu, Sikh, Jain, Buddhist', 'Special Marriage Act: Inter-faith/civil marriages', 'Registration process differs by act', '30-day notice period for Special Marriage Act'] },
    { title: 'Documents Required', points: ['Aadhaar of both spouses', 'Age proof (birth certificate/10th marksheet)', 'Wedding photos & invitation card', 'Witness Aadhaar (2-3 witnesses)'] },
    { title: 'Online Application', points: ['Visit state SDM/municipal portal', 'Fill marriage registration form', 'Upload all documents', 'Book appointment date'] },
    { title: 'Appointment Day', points: ['Both spouses must be present', 'Bring witnesses with ID proof', 'Fees: ₹100-500 (varies by state)', 'Certificate issued same day or within 7 days'] },
  ]},
  { slug: 'e-aadhaar-download-guide', title: 'How to Download e-Aadhaar Online', description: 'Download your e-Aadhaar PDF in 2 minutes. Step-by-step guide using Aadhaar number, VID, or enrollment ID.', category: 'Identity Documents', guideSlug: 'aadhaar-card-apply-online', slides: [
    { title: 'What is e-Aadhaar?', points: ['Digital version of your Aadhaar card', 'Legally valid as physical Aadhaar', 'Password-protected PDF document', 'Can be stored on phone or computer'] },
    { title: 'Download Using Aadhaar Number', points: ['Visit myaadhaar.uidai.gov.in', 'Enter 12-digit Aadhaar number', 'Enter captcha and request OTP', 'Download e-Aadhaar PDF'] },
    { title: 'Download Using VID', points: ['Generate VID at UIDAI website', 'Use 16-digit VID instead of Aadhaar', 'More secure than sharing Aadhaar', 'Same download process as above'] },
    { title: 'Using Enrollment ID', points: ['Use 14-digit enrollment ID + date/time', 'Useful if you don\'t have Aadhaar number', 'Available on enrollment slip', 'OTP sent to registered mobile'] },
    { title: 'e-Aadhaar Password', points: ['Password: First 4 letters of name (CAPS) + birth year', 'Example: RAJE1990', 'Change password after opening', 'Print or save securely'] },
  ]},
  { slug: 'digilocker-guide', title: 'DigiLocker - Digital Document Wallet', description: 'How to use DigiLocker for storing and accessing official documents. Link Aadhaar, DL, marksheets, and more digitally.', category: 'Identity Documents', guideSlug: 'digilocker-guide', slides: [
    { title: 'What is DigiLocker?', points: ['Government digital document platform', 'Store and access documents online', 'Legally valid digital copies', 'Free for all Indian citizens'] },
    { title: 'Key Features', points: ['Issued Documents: Directly from govt departments', 'Uploaded Documents: Scan and store your own', 'Available as app and website', 'Linked to Aadhaar for authentication'] },
    { title: 'Documents You Can Access', points: ['Aadhaar, PAN, Driving License', 'Vehicle RC, Insurance policies', 'Class 10/12 marksheets (CBSE)', 'Birth certificate, Caste certificate'] },
    { title: 'How to Register', points: ['Download DigiLocker app or visit digilocker.gov.in', 'Sign up with Aadhaar or mobile number', 'Verify with OTP', 'Create 6-digit security PIN'] },
    { title: 'Why Use DigiLocker?', points: ['No need to carry physical documents', 'Accepted for government verification', 'Self-attested = deemed verified', 'Reduce use of paper documents'] },
  ]},
  { slug: 'maadhaar-app-guide', title: 'mAadhaar App - Complete Guide', description: 'Use mAadhaar app to carry Aadhaar on phone, share via QR, lock biometrics, and update details easily.', category: 'Identity Documents', guideSlug: 'aadhaar-card-apply-online', slides: [
    { title: 'What is mAadhaar?', points: ['Official UIDAI mobile app', 'Carry Aadhaar on your smartphone', 'Available on Android and iOS', 'Acts as valid Aadhaar proof'] },
    { title: 'Key Features', points: ['View and share Aadhaar profile', 'Show QR code for verification', 'Lock/unlock biometrics', 'Generate VID and TOTP'] },
    { title: 'How to Set Up', points: ['Download from Play Store/App Store', 'Enter Aadhaar number', 'Verify with OTP on registered mobile', 'Set 4-digit PIN for security'] },
    { title: 'Share Aadhaar Safely', points: ['Generate VID (Virtual ID) for sharing', 'Use QR code instead of number', 'Lock biometrics when not in use', 'TOTP replaces OTP for authentication'] },
    { title: 'Additional Services', points: ['Check Aadhaar update status', 'Locate nearest enrollment center', 'View Aadhaar authentication history', 'Raise grievance directly from app'] },
  ]},

  // === 10 Tax & Finance ===
  { slug: 'itr-filing-guide', title: 'How to File ITR Online - Complete Guide', description: 'Step-by-step guide to file Income Tax Return online on the new e-filing portal. Choose the right ITR form and file easily.', category: 'Tax & Finance', guideSlug: 'income-tax-return-file-online', slides: [
    { title: 'Who Must File ITR?', points: ['Income above ₹2.5 lakh (below 60)', 'Senior citizens: above ₹3 lakh', 'Super seniors: above ₹5 lakh', 'Mandatory if TDS deducted'] },
    { title: 'Choose the Right ITR Form', points: ['ITR-1 (Sahaj): Salary up to ₹50 lakh', 'ITR-2: Capital gains, foreign income', 'ITR-3: Business/profession income', 'ITR-4 (Sugam): Presumptive income'] },
    { title: 'Documents Required', points: ['Form 16 from employer', 'Bank interest certificates', 'Investment proofs (80C, 80D)', 'AIS/TIS from income tax portal'] },
    { title: 'Filing Steps', points: ['Login at efilingindia.gov.in', 'Select AY and ITR form', 'Pre-fill data from AIS', 'Verify deductions and submit'] },
    { title: 'Verify Your ITR', points: ['e-Verify within 30 days of filing', 'Use Aadhaar OTP (fastest)', 'Or net banking, DSC, bank ATM', 'Unverified ITR = not filed!'] },
  ]},
  { slug: 'gst-registration-guide', title: 'GST Registration Online - Step by Step', description: 'Complete guide to register for GST on the GST portal. Who needs GST, documents required, and registration process.', category: 'Tax & Finance', guideSlug: 'gst-registration-online', slides: [
    { title: 'Who Needs GST Registration?', points: ['Turnover above ₹40 lakh (goods)', 'Turnover above ₹20 lakh (services)', 'Interstate suppliers (any turnover)', 'E-commerce sellers'] },
    { title: 'Documents Required', points: ['PAN card of business/proprietor', 'Aadhaar card', 'Business address proof', 'Bank account statement/cancelled cheque'] },
    { title: 'Registration Process', points: ['Visit gst.gov.in', 'Fill Part A: PAN, mobile, email', 'Verify with OTP → get TRN', 'Fill Part B: Business details, documents'] },
    { title: 'After Registration', points: ['GSTIN allotted within 7 working days', '15-digit GST number issued', 'Start filing GST returns monthly/quarterly', 'Display GSTIN at business place'] },
    { title: 'Composition Scheme', points: ['For turnover up to ₹1.5 crore', 'Pay flat 1-6% tax rate', 'Quarterly return instead of monthly', 'Cannot claim input tax credit'] },
  ]},
  { slug: 'epf-withdrawal-guide', title: 'EPF Withdrawal Online - Complete Process', description: 'How to withdraw EPF/PF money online. Full withdrawal, partial withdrawal, and advance claims explained.', category: 'Tax & Finance', guideSlug: 'epf-withdrawal-online', slides: [
    { title: 'Types of EPF Withdrawal', points: ['Full withdrawal: On retirement/2 months unemployment', 'Partial: For home, medical, education, marriage', 'Advance: COVID, natural disaster', 'Pension withdrawal: After 10 years service'] },
    { title: 'Online Withdrawal Steps', points: ['Login at unifiedportal-mem.epfindia.gov.in', 'Go to Online Services > Claim (Form-31/19/10C)', 'Select claim type and enter details', 'Verify with Aadhaar OTP'] },
    { title: 'Requirements for Online Claim', points: ['UAN must be activated', 'Aadhaar and bank linked to UAN', 'Mobile number linked to Aadhaar', 'KYC approved by employer'] },
    { title: 'Partial Withdrawal Rules', points: ['Home purchase: Up to 36 months salary (5 yrs)', 'Medical: 6 months salary (no minimum)', 'Marriage: 50% of employee share (7 yrs)', 'Education: 50% of employee share (7 yrs)'] },
    { title: 'Processing Time', points: ['Online claims: 10-20 days', 'Amount credited to linked bank', 'Track at passbook.epfindia.gov.in', 'Contact EPFO if delayed beyond 20 days'] },
  ]},
  { slug: 'ppf-account-opening-guide', title: 'PPF Account - How to Open & Invest', description: 'Open a Public Provident Fund account for tax-free returns at 7.1%. Complete guide to PPF rules, benefits, and process.', category: 'Tax & Finance', guideSlug: 'ppf-account-guide', slides: [
    { title: 'What is PPF?', points: ['Government savings scheme', 'Current interest rate: 7.1% p.a.', 'Tax-free returns (EEE status)', 'Lock-in period: 15 years'] },
    { title: 'Key Features', points: ['Minimum deposit: ₹500/year', 'Maximum deposit: ₹1.5 lakh/year', 'Interest compounded annually', 'Can extend in blocks of 5 years'] },
    { title: 'Tax Benefits', points: ['Deposit deductible under Section 80C', 'Interest earned is fully tax-free', 'Maturity amount is tax-free', 'Best risk-free tax saving instrument'] },
    { title: 'How to Open', points: ['Open at post office or bank (SBI, etc.)', 'Online opening via net banking available', 'Need PAN, Aadhaar, and photographs', 'Minor account can be opened by guardian'] },
    { title: 'Withdrawal & Loan', points: ['Partial withdrawal from 7th year', 'Loan against PPF from 3rd to 6th year', 'Premature closure after 5 years (conditions apply)', 'Nomination facility available'] },
  ]},
  { slug: 'section-80c-tax-saving-guide', title: 'Section 80C - Save Tax up to ₹46,800', description: 'Complete guide to Section 80C deductions. Best investments to save up to ₹1.5 lakh in taxable income.', category: 'Tax & Finance', guideSlug: 'section-80c-guide', slides: [
    { title: 'What is Section 80C?', points: ['Tax deduction up to ₹1.5 lakh per year', 'Reduces taxable income', 'Save up to ₹46,800 in tax (30% slab)', 'Available under Old Tax Regime only'] },
    { title: 'Popular 80C Investments', points: ['PPF: 7.1% tax-free (15 yr lock-in)', 'ELSS Mutual Funds: Market returns (3 yr lock-in)', 'NSC: 7.7% (5 yr lock-in)', 'Tax-saving FD: ~7% (5 yr lock-in)'] },
    { title: 'Other 80C Eligible Items', points: ['EPF employee contribution', 'Life insurance premium', 'Children\'s tuition fees (max 2 children)', 'Home loan principal repayment'] },
    { title: 'Best Strategy', points: ['EPF contribution already counts', 'Top up with ELSS for higher returns', 'PPF for guaranteed tax-free returns', 'Don\'t invest just for tax saving'] },
    { title: 'Beyond 80C', points: ['80CCD(1B): ₹50,000 extra for NPS', '80D: Health insurance premium', '80E: Education loan interest (no limit)', '80TTA: ₹10,000 savings interest exemption'] },
  ]},
  { slug: 'tds-tax-deducted-source-guide', title: 'TDS - Tax Deducted at Source Explained', description: 'Understand TDS rates, how to check TDS in Form 26AS, and how to claim TDS refund while filing ITR.', category: 'Tax & Finance', guideSlug: 'tds-guide', slides: [
    { title: 'What is TDS?', points: ['Tax collected at source of income', 'Employer/bank/client deducts before paying', 'Deposited to government on your behalf', 'Adjusted against total tax liability'] },
    { title: 'Common TDS Rates', points: ['Salary: As per income tax slab', 'Bank FD interest: 10% (above ₹40,000)', 'Rent: 10% (above ₹2.4 lakh/year)', 'Professional fees: 10%'] },
    { title: 'How to Check TDS', points: ['Login at incometax.gov.in', 'View Form 26AS (Tax Credit Statement)', 'Check AIS for complete TDS details', 'Match with Form 16/16A received'] },
    { title: 'Claim TDS Refund', points: ['File ITR if TDS exceeds actual tax', 'Refund processed within 20-45 days', 'Credited to bank linked with PAN', 'Track refund at incometax.gov.in'] },
    { title: 'Avoid Excess TDS', points: ['Submit Form 15G/15H if no tax liability', '15G for below 60 years, 15H for seniors', 'Submit to bank at start of financial year', 'Apply for lower TDS certificate (13)'] },
  ]},
  { slug: 'form-16-salary-certificate-guide', title: 'Form 16 - Everything You Need to Know', description: 'What is Form 16, how to get it from employer, and how to use it for filing income tax return easily.', category: 'Tax & Finance', guideSlug: 'form-16-guide', slides: [
    { title: 'What is Form 16?', points: ['TDS certificate from employer', 'Shows salary, deductions & tax paid', 'Issued annually by 15th June', 'Essential document for ITR filing'] },
    { title: 'Two Parts of Form 16', points: ['Part A: TDS deducted & deposited details', 'Part B: Salary breakup & deductions claimed', 'Part A downloadable from TRACES', 'Part B prepared by employer'] },
    { title: 'How to Get Form 16', points: ['Request from HR/accounts department', 'Usually shared by email or HRMS portal', 'Available by 15 June each year', 'Ask employer if not received'] },
    { title: 'Using Form 16 for ITR', points: ['Income details auto-populate from AIS', 'Cross-verify with Form 16', 'Ensure HRA, 80C deductions match', 'Report any mismatch to employer'] },
    { title: 'No Form 16? What to Do', points: ['Check Form 26AS for TDS details', 'Use salary slips to calculate income', 'AIS on IT portal has all info', 'File ITR without Form 16 if needed'] },
  ]},
  { slug: 'advance-tax-payment-guide', title: 'Advance Tax - Who Should Pay & How', description: 'Understand advance tax liability, due dates, calculation, and how to pay online through the income tax portal.', category: 'Tax & Finance', guideSlug: 'advance-tax-guide', slides: [
    { title: 'What is Advance Tax?', points: ['Pay-as-you-earn tax system', 'Pay tax in installments during the year', 'Required if tax liability > ₹10,000', 'Salaried (with other income), freelancers, businesses'] },
    { title: 'Due Dates', points: ['15 June: 15% of total tax', '15 September: 45% cumulative', '15 December: 75% cumulative', '15 March: 100% of total tax'] },
    { title: 'How to Calculate', points: ['Estimate total annual income', 'Apply tax slab rates', 'Subtract TDS already deducted', 'Balance = advance tax payable'] },
    { title: 'How to Pay Online', points: ['Visit incometax.gov.in > e-Pay Tax', 'Select Challan 280 (Income Tax)', 'Enter PAN, AY, and tax amount', 'Pay via net banking/UPI/debit card'] },
    { title: 'Interest on Non-Payment', points: ['Section 234B: Non/short payment of advance tax', 'Section 234C: Deferment of installments', 'Interest: 1% per month on shortfall', 'Seniors (no business income) exempt'] },
  ]},
  { slug: 'capital-gains-tax-guide', title: 'Capital Gains Tax in India Explained', description: 'Complete guide to capital gains tax on property, stocks, mutual funds, and gold. STCG, LTCG rates and exemptions.', category: 'Tax & Finance', guideSlug: 'capital-gains-tax-guide', slides: [
    { title: 'What is Capital Gains Tax?', points: ['Tax on profit from selling assets', 'Short-term (STCG) vs Long-term (LTCG)', 'Holding period determines type', 'Different rates for different assets'] },
    { title: 'LTCG Rates (New Rules from July 2024)', points: ['Listed equity/funds: 12.5% above ₹1.25 lakh', 'Property/gold/debt funds: 12.5%', 'No indexation benefit (new rule)', 'Holding: 12 months (equity), 24 months (others)'] },
    { title: 'STCG Rates', points: ['Listed equity/funds: 20%', 'Other assets: As per income tax slab', 'Equity holding < 12 months = STCG', 'Property holding < 24 months = STCG'] },
    { title: 'Exemptions Available', points: ['Section 54: Reinvest in new house (property)', 'Section 54EC: Invest in specified bonds', 'Section 54F: Non-house asset → house', 'LTCG up to ₹1.25 lakh exempt (equity)'] },
    { title: 'How to Report', points: ['Report in ITR-2 or ITR-3', 'Broker provides capital gains statement', 'Include all asset sales in the year', 'Set off losses against gains within rules'] },
  ]},
  { slug: 'senior-citizen-tax-benefits-guide', title: 'Tax Benefits for Senior Citizens', description: 'Complete guide to income tax benefits for senior citizens (60+) and super senior citizens (80+) in India.', category: 'Tax & Finance', guideSlug: 'senior-citizen-tax-guide', slides: [
    { title: 'Higher Exemption Limits', points: ['Senior (60-80): ₹3 lakh basic exemption', 'Super senior (80+): ₹5 lakh exemption', 'Vs ₹2.5 lakh for others (old regime)', 'New regime: ₹3 lakh for all ages'] },
    { title: 'Section 80TTB', points: ['Interest income exemption up to ₹50,000', 'Covers FD, RD, savings, post office', 'Replaces 80TTA (₹10,000) for seniors', 'Available only under old regime'] },
    { title: 'Health Insurance - 80D', points: ['Premium deduction up to ₹50,000', 'Vs ₹25,000 for non-seniors', 'Medical expenditure if no insurance', 'Extra ₹50,000 for senior parents'] },
    { title: 'No Advance Tax', points: ['Seniors with no business income - exempt', 'No need to pay quarterly advance tax', 'Pay full tax at time of ITR filing', 'Only for those without business/profession'] },
    { title: 'ITR Filing Benefits', points: ['ITR-1 (Sahaj) available for seniors', 'Can file paper return (super seniors)', 'Refund processed faster for seniors', 'Form 15H to avoid TDS on interest'] },
  ]},

  // === 10 Jobs & Exams ===
  { slug: 'ssc-chsl-exam-guide', title: 'SSC CHSL Exam - Complete Guide 2025', description: 'SSC CHSL exam pattern, eligibility, syllabus, preparation tips, and selection process for LDC, DEO, and PA/SA posts.', category: 'Jobs & Exams', guideSlug: 'ssc-chsl-exam-guide', slides: [
    { title: 'What is SSC CHSL?', points: ['Combined Higher Secondary Level exam', 'For 12th pass candidates', 'Posts: LDC, DEO, PA/SA, JSA', 'Central government job - great perks'] },
    { title: 'Eligibility', points: ['Age: 18-27 years (relaxation for SC/ST/OBC)', 'Education: 12th pass from recognized board', 'Indian nationality required', 'No experience needed'] },
    { title: 'Exam Pattern', points: ['Tier I: CBT - 200 marks, 60 minutes', 'Tier II: CBT + Typing/Skill Test', 'Subjects: English, GK, Quant, Reasoning', 'Negative marking: 0.50 per wrong answer'] },
    { title: 'Preparation Strategy', points: ['Focus on Quant and Reasoning first', 'Practice English comprehension daily', 'Current affairs: Last 6 months', 'Solve previous year papers regularly'] },
    { title: 'Selection Process', points: ['Merit list based on Tier I + II', 'Document verification', 'Typing test for LDC/JSA posts', 'Salary: ₹25,500-81,100 (Level 4)'] },
  ]},
  { slug: 'ibps-clerk-exam-guide', title: 'IBPS Clerk Exam - Complete Guide 2025', description: 'IBPS Clerk exam pattern, eligibility, syllabus, and preparation strategy for bank clerk recruitment.', category: 'Jobs & Exams', guideSlug: 'ibps-clerk-exam-guide', slides: [
    { title: 'What is IBPS Clerk?', points: ['Bank clerical cadre recruitment exam', 'For 19 public sector banks', 'Graduate-level examination', 'One of the largest bank recruitments'] },
    { title: 'Eligibility', points: ['Age: 20-28 years (relaxation applicable)', 'Education: Any graduate degree', 'Computer literacy required', 'Valid state domicile needed'] },
    { title: 'Exam Pattern - Prelims', points: ['English: 30 questions, 30 marks', 'Numerical Ability: 35 questions, 35 marks', 'Reasoning: 35 questions, 35 marks', 'Duration: 60 minutes, qualifying only'] },
    { title: 'Exam Pattern - Mains', points: ['General/Financial Awareness: 50 marks', 'English: 40 marks', 'Reasoning + Computer: 50 marks', 'Quantitative Aptitude: 50 marks'] },
    { title: 'Salary & Career', points: ['Starting salary: ₹28,000-30,000/month', 'Perks: HRA, DA, medical, pension', 'Promotion to Officer cadre possible', 'Job security with government benefits'] },
  ]},
  { slug: 'rrb-ntpc-exam-guide', title: 'RRB NTPC Exam - Complete Guide 2025', description: 'RRB NTPC exam for railway non-technical popular categories. Eligibility, exam pattern, syllabus, and preparation tips.', category: 'Jobs & Exams', guideSlug: 'rrb-ntpc-exam-guide', slides: [
    { title: 'What is RRB NTPC?', points: ['Non-Technical Popular Categories exam', 'Indian Railways recruitment', 'Posts: Station Master, Clerk, TA, CA', 'Graduate-level examination'] },
    { title: 'Eligibility', points: ['Age: 18-33 years (varies by post)', 'Education: 12th pass to Graduate', 'Depends on specific post category', 'Age relaxation for reserved categories'] },
    { title: 'Exam Pattern - CBT Stages', points: ['CBT 1: 100 questions, 90 minutes', 'CBT 2: 120 questions, 90 minutes', 'Subjects: Math, GI, General Awareness', 'Negative marking: 1/3 of marks'] },
    { title: 'Preparation Tips', points: ['Strong focus on General Awareness', 'Railway-specific current affairs', 'Practice math shortcuts', 'Previous year papers are gold'] },
    { title: 'Posts & Salary', points: ['Level 2: ₹19,900 (Clerk, Typist)', 'Level 3: ₹21,700 (Traffic Asst)', 'Level 4: ₹25,500 (Commercial Apprentice)', 'Level 5/6: ₹29,200-35,400 (Station Master)'] },
  ]},
  { slug: 'upsc-capf-exam-guide', title: 'UPSC CAPF (AC) - Assistant Commandant Exam', description: 'UPSC CAPF exam for Assistant Commandant in BSF, CRPF, CISF, ITBP, SSB. Eligibility, pattern, and preparation guide.', category: 'Jobs & Exams', guideSlug: 'upsc-capf-exam-guide', slides: [
    { title: 'What is UPSC CAPF?', points: ['Central Armed Police Forces exam', 'For Assistant Commandant (Group A)', 'Forces: BSF, CRPF, CISF, ITBP, SSB', 'Gazetted officer-level post'] },
    { title: 'Eligibility', points: ['Age: 20-25 years', 'Education: Any bachelor\'s degree', 'Physical standards required', 'Unmarried (at time of appointment)'] },
    { title: 'Exam Pattern', points: ['Paper I: General Ability & Intelligence (250 marks)', 'Paper II: General Studies, Essay (200 marks)', 'Physical/Medical Test', 'Interview/Personality Test (150 marks)'] },
    { title: 'Physical Standards', points: ['Height: 165 cm (male), 157 cm (female)', 'Chest: 81 cm with 5 cm expansion', 'Eyesight: 6/6 and 6/9 uncorrected', 'Physical Efficiency Test: Running, long jump'] },
    { title: 'Career Prospects', points: ['Starting pay: Level 10 (₹56,100)', 'Can rise to DG rank', 'Paramilitary force officer benefits', 'Subsidized housing, canteen, travel'] },
  ]},
  { slug: 'nda-exam-guide', title: 'NDA Exam - National Defence Academy Guide', description: 'NDA exam guide for joining Indian Army, Navy, or Air Force. Eligibility, exam pattern, SSB interview preparation.', category: 'Jobs & Exams', guideSlug: 'nda-exam-guide', slides: [
    { title: 'What is NDA Exam?', points: ['Entry to National Defence Academy', 'Join Army, Navy, or Air Force', 'Conducted by UPSC twice a year', 'After 12th - youngest officer entry'] },
    { title: 'Eligibility', points: ['Age: 16.5 to 19.5 years', 'Education: 12th pass (or appearing)', 'Physics/Math compulsory for Air Force/Navy', 'Unmarried males (females now eligible)'] },
    { title: 'Written Exam Pattern', points: ['Math: 300 marks (2.5 hours)', 'GAT: 600 marks (2.5 hours)', 'GAT includes English, GK, Science', 'Negative marking: 1/3 of marks'] },
    { title: 'SSB Interview (5 Days)', points: ['Day 1: Screening (OIR + PPDT)', 'Day 2-3: Psychology tests', 'Day 4: Group tasks (GTO)', 'Day 5: Conference and results'] },
    { title: 'Training & Career', points: ['3 years training at NDA, Khadakwasla', '1 year at respective academy (IMA/INA/AFA)', 'Commissioned as Lieutenant', 'Prestigious career serving the nation'] },
  ]},
  { slug: 'cds-exam-guide', title: 'CDS Exam - Combined Defence Services Guide', description: 'CDS exam for graduates to join IMA, INA, AFA, and OTA. Complete guide to eligibility, exam pattern, and SSB.', category: 'Jobs & Exams', guideSlug: 'cds-exam-guide', slides: [
    { title: 'What is CDS Exam?', points: ['Combined Defence Services Examination', 'For graduates joining defence forces', 'Entry to IMA, INA, AFA, OTA', 'Conducted by UPSC twice a year'] },
    { title: 'Eligibility', points: ['IMA/OTA: Any degree', 'INA: Engineering degree', 'AFA: Degree with Physics & Math', 'Age: 19-25 years (varies by academy)'] },
    { title: 'Exam Pattern', points: ['English: 100 marks', 'General Knowledge: 100 marks', 'Elementary Math: 100 marks (not for OTA)', 'Duration: 2 hours per paper'] },
    { title: 'SSB Interview', points: ['5-day selection process', 'Tests: Psychological, Group, Interview', 'Assesses Officer Like Qualities (OLQ)', 'Medical examination follows'] },
    { title: 'Training & Career', points: ['IMA: 18 months (Dehradun)', 'INA: Naval Academy (Ezhimala)', 'AFA: Air Force Academy (Dundigal)', 'Permanent/Short Service Commission'] },
  ]},
  { slug: 'afcat-exam-guide', title: 'AFCAT - Air Force Common Admission Test', description: 'AFCAT exam guide for joining Indian Air Force as an officer. Eligibility, exam pattern, and AFSB interview process.', category: 'Jobs & Exams', guideSlug: 'afcat-exam-guide', slides: [
    { title: 'What is AFCAT?', points: ['Air Force Common Admission Test', 'Officer entry into Indian Air Force', 'Flying, Technical, and Ground Duty branches', 'Conducted twice a year by IAF'] },
    { title: 'Eligibility', points: ['Age: 20-24 years (Flying), 20-26 (others)', 'Education: Graduate (60% for Flying)', 'Engineering for Technical branch', 'Any degree for Ground Duty'] },
    { title: 'Exam Pattern', points: ['300 marks, 2 hours duration', 'Sections: English, GK, Math, Reasoning', '100 questions, 3 marks each', 'Negative marking: 1 mark per wrong answer'] },
    { title: 'AFSB Interview (5 Days)', points: ['Stage 1: OIR + PPDT (screening)', 'Stage 2: Psychological, GTO, Interview', 'Computerised Pilot Selection System (CPSS) for Flying', 'Medical examination'] },
    { title: 'Career & Benefits', points: ['Starting pay: ₹56,100 (Level 10)', 'Flying allowance for pilots', 'Subsidized mess, canteen, housing', 'Adventure sports and foreign postings'] },
  ]},
  { slug: 'kvs-teacher-recruitment-guide', title: 'KVS Teacher Recruitment Guide', description: 'KVS recruitment for PGT, TGT, PRT, and Librarian posts in Kendriya Vidyalaya schools across India.', category: 'Jobs & Exams', guideSlug: 'kvs-teacher-guide', slides: [
    { title: 'What is KVS Recruitment?', points: ['Kendriya Vidyalaya Sangathan hiring', 'Teaching posts in 1,200+ KV schools', 'Posts: PRT, TGT, PGT, Librarian', 'Central government teaching job'] },
    { title: 'Post-wise Eligibility', points: ['PRT: Graduate + B.Ed + CTET', 'TGT: Subject graduate + B.Ed + CTET', 'PGT: Post-graduate + B.Ed', 'Age limit: 30-40 years (varies)'] },
    { title: 'Exam Pattern', points: ['Part I: General Hindi/English (20 marks)', 'Part II: GK, Reasoning, Computer (40 marks)', 'Part III: Subject + Pedagogy (100 marks)', 'Part IV: Demo teaching & Interview'] },
    { title: 'Salary & Benefits', points: ['PRT: Level 6 (₹35,400-1,12,400)', 'TGT: Level 7 (₹44,900-1,42,400)', 'PGT: Level 8 (₹47,600-1,51,100)', 'HRA, DA, medical, pension benefits'] },
    { title: 'How to Apply', points: ['Visit kvsangathan.nic.in', 'Register and fill online application', 'Upload photo, signature, documents', 'Pay fee and download admit card'] },
  ]},
  { slug: 'ctet-exam-guide', title: 'CTET Exam - Central Teacher Eligibility Test', description: 'CTET exam pattern, eligibility, syllabus, and preparation tips for Paper 1 (Class 1-5) and Paper 2 (Class 6-8).', category: 'Jobs & Exams', guideSlug: 'ctet-exam-guide', slides: [
    { title: 'What is CTET?', points: ['Central Teacher Eligibility Test', 'Mandatory for teaching in central schools', 'KVS, NVS, and other central govt schools', 'Conducted by CBSE twice a year'] },
    { title: 'Eligibility', points: ['Paper I (Class 1-5): 12th + D.El.Ed/B.El.Ed', 'Paper II (Class 6-8): Graduation + B.Ed', 'Can appear for both papers', 'No age limit to appear'] },
    { title: 'Paper I Pattern (Primary)', points: ['Child Development: 30 questions', 'Language I & II: 30+30 questions', 'Mathematics: 30 questions', 'Environmental Studies: 30 questions'] },
    { title: 'Paper II Pattern (Upper Primary)', points: ['Child Development: 30 questions', 'Language I & II: 30+30 questions', 'Math/Science OR Social Science: 60 questions', 'Total: 150 questions, 150 marks'] },
    { title: 'Qualifying & Validity', points: ['Minimum 60% to qualify (55% for SC/ST/OBC)', 'Certificate valid for lifetime (since 2021)', 'Can improve score by re-appearing', 'Apply with CTET score to KVS/NVS/DSSSB'] },
  ]},
  { slug: 'ugc-net-jrf-exam-guide', title: 'UGC NET JRF Exam - Complete Guide', description: 'UGC NET exam for Assistant Professor eligibility and JRF fellowship. Exam pattern, preparation, and career scope.', category: 'Jobs & Exams', guideSlug: 'ugc-net-jrf-guide', slides: [
    { title: 'What is UGC NET?', points: ['National Eligibility Test for teaching', 'Qualifies for Assistant Professor', 'JRF: Junior Research Fellowship (₹37,000/month)', 'Conducted by NTA twice a year'] },
    { title: 'Eligibility', points: ['Post-graduation with 55% marks', '50% for SC/ST/OBC/PwD', 'JRF age limit: 31 years (relaxation available)', 'NET (Lectureship): No age limit'] },
    { title: 'Exam Pattern', points: ['Paper I: Teaching Aptitude, Research (50 questions)', 'Paper II: Subject-specific (100 questions)', 'Total duration: 3 hours combined', 'No negative marking'] },
    { title: 'Paper I Topics', points: ['Teaching Aptitude & Methodology', 'Research Aptitude & Ethics', 'Communication & ICT', 'Higher Education, Governance, Environment'] },
    { title: 'JRF Benefits', points: ['Fellowship: ₹37,000/month (first 2 years)', '₹42,000/month (3rd year onwards)', 'HRA and contingency grant', 'Valid for PhD admission across India'] },
  ]},

  // === 5 Calculators ===
  { slug: 'emi-calculator-guide', title: 'EMI Calculator - How to Calculate EMI', description: 'Understand how EMI is calculated for home, car, and personal loans. Use our free EMI calculator to plan your finances.', category: 'Utilities', guideSlug: 'emi-calculator', slides: [
    { title: 'What is EMI?', points: ['Equated Monthly Installment', 'Fixed monthly payment on loans', 'Includes principal + interest', 'Stays same throughout loan tenure'] },
    { title: 'EMI Formula', points: ['EMI = P × r × (1+r)^n / ((1+r)^n - 1)', 'P = Principal loan amount', 'r = Monthly interest rate', 'n = Number of monthly installments'] },
    { title: 'Factors Affecting EMI', points: ['Loan amount: Higher amount = higher EMI', 'Interest rate: Higher rate = higher EMI', 'Tenure: Longer tenure = lower EMI', 'Prepayment reduces total interest'] },
    { title: 'Typical EMI Examples', points: ['Home loan ₹50L at 8.5%, 20 yrs = ₹43,391', 'Car loan ₹8L at 9%, 5 yrs = ₹16,607', 'Personal loan ₹5L at 12%, 3 yrs = ₹16,607', 'Education loan ₹10L at 8%, 7 yrs = ₹15,586'] },
    { title: 'Tips to Reduce EMI', points: ['Negotiate for lower interest rate', 'Make prepayments when possible', 'Choose longer tenure (but pay more interest)', 'Compare across banks before borrowing'] },
  ]},
  { slug: 'sip-calculator-guide', title: 'SIP Calculator - Plan Your Investments', description: 'Calculate SIP returns and plan your mutual fund investments. Understand how SIP works and wealth creation potential.', category: 'Utilities', guideSlug: 'sip-calculator', slides: [
    { title: 'What is SIP?', points: ['Systematic Investment Plan', 'Invest fixed amount monthly in mutual funds', 'Start with as low as ₹500/month', 'Automates your investment discipline'] },
    { title: 'How SIP Works', points: ['Fixed amount debited monthly', 'Buys units at current NAV', 'Rupee cost averaging reduces risk', 'Power of compounding grows wealth'] },
    { title: 'SIP Returns Examples', points: ['₹5,000/month for 10 years at 12% = ₹11.6 lakh', '₹10,000/month for 20 years at 12% = ₹1 crore', '₹15,000/month for 25 years at 12% = ₹2.6 crore', 'Early start = massive difference'] },
    { title: 'SIP Calculation Formula', points: ['FV = P × [(1+r)^n - 1] / r × (1+r)', 'P = Monthly SIP amount', 'r = Expected monthly return rate', 'n = Total number of months'] },
    { title: 'SIP Tips', points: ['Start early - time is your biggest ally', 'Step-up SIP: Increase amount yearly', 'Don\'t stop during market crashes', 'Use CitizenNest SIP calculator for planning'] },
  ]},
  { slug: 'ppf-calculator-guide', title: 'PPF Calculator - Calculate Maturity Amount', description: 'Calculate PPF maturity amount, interest earned, and yearly balance. Plan your 15-year PPF investment.', category: 'Utilities', guideSlug: 'ppf-calculator', slides: [
    { title: 'PPF Calculator Basics', points: ['Current PPF interest rate: 7.1%', 'Compounded annually', 'Investment period: 15 years', 'Deposit ₹500 to ₹1.5 lakh per year'] },
    { title: 'Investment Examples', points: ['₹1.5L/year for 15 yrs = ₹40.7 lakh', '₹1L/year for 15 yrs = ₹27.1 lakh', '₹50,000/year for 15 yrs = ₹13.6 lakh', 'Invest before 5th of month for max interest'] },
    { title: 'Tax-Free Returns', points: ['All deposits qualify under Section 80C', 'Interest earned is 100% tax-free', 'Maturity amount fully tax-free', 'Triple exempt (EEE) status'] },
    { title: 'Extension Benefits', points: ['Extend in blocks of 5 years', 'With or without fresh contributions', 'Interest continues at prevailing rate', 'Partial withdrawals allowed during extension'] },
    { title: 'PPF Tips', points: ['Deposit before 5th of each month', 'Lump sum in April = maximum interest', 'Use CitizenNest PPF calculator', 'Compare with NPS and ELSS returns'] },
  ]},
  { slug: 'nps-calculator-guide', title: 'NPS Calculator - Plan Your Pension', description: 'Calculate your NPS corpus, monthly pension, and tax savings. Plan retirement with the NPS pension calculator.', category: 'Utilities', guideSlug: 'nps-calculator', slides: [
    { title: 'NPS Calculator Inputs', points: ['Your current age and retirement age (60)', 'Monthly/yearly contribution amount', 'Expected rate of return (8-14%)', 'Annuity percentage (minimum 40%)'] },
    { title: 'NPS Return Examples', points: ['₹5,000/month from age 25 at 10% = ₹1.1 crore', '₹10,000/month from age 30 at 10% = ₹1.3 crore', '₹15,000/month from age 35 at 10% = ₹1 crore', 'Starting early makes a huge difference'] },
    { title: 'At Retirement', points: ['Minimum 40% must buy annuity (pension)', '60% can be withdrawn lump sum (tax-free)', 'Annuity provides monthly pension for life', 'Choose from 7+ annuity service providers'] },
    { title: 'Tax Benefits', points: ['Up to ₹1.5 lakh under 80CCD(1)', 'Extra ₹50,000 under 80CCD(1B)', 'Employer contribution: 80CCD(2)', '60% withdrawal is tax-free'] },
    { title: 'NPS Tips', points: ['Choose Active Choice for higher equity', 'Review and rebalance annually', 'Increase contribution with salary hikes', 'Use CitizenNest NPS calculator for planning'] },
  ]},
  { slug: 'gst-calculator-guide', title: 'GST Calculator - Calculate Tax Amount', description: 'Calculate GST on any amount with different tax rates. Understand CGST, SGST, IGST, and inclusive/exclusive GST calculation.', category: 'Utilities', guideSlug: 'gst-calculator', slides: [
    { title: 'GST Rates in India', points: ['0%: Essential items (milk, rice, wheat)', '5%: Common items (packaged food, footwear <₹1000)', '12%: Processed food, medicines', '18%: Most goods & services, 28%: Luxury/sin goods'] },
    { title: 'GST Calculation Formula', points: ['GST Amount = Base Price × GST Rate / 100', 'Total Price = Base Price + GST Amount', 'Exclusive: Add GST to price', 'Inclusive: GST already in price'] },
    { title: 'CGST, SGST, IGST', points: ['Intra-state: CGST + SGST (half each)', 'Inter-state: Full IGST', 'Example: 18% GST = 9% CGST + 9% SGST', 'IGST collected by central government'] },
    { title: 'GST Examples', points: ['₹10,000 item at 18% = ₹1,800 GST = ₹11,800 total', '₹5,000 service at 12% = ₹600 GST = ₹5,600 total', '₹50,000 product at 28% = ₹14,000 GST = ₹64,000', 'Restaurant (non-AC): 5% GST'] },
    { title: 'Input Tax Credit (ITC)', points: ['Businesses can claim GST paid on purchases', 'Reduces net GST liability', 'Maintain proper invoices for ITC', 'Use CitizenNest GST calculator for quick math'] },
  ]},
];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeJson(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function generateStory(story) {
  const color = '#f97316'; // orange
  const dark = '#c2410c';

  const pages = story.slides.map((slide, i) => `
    <amp-story-page id="page-${i + 1}">
      <amp-story-grid-layer template="fill">
        <div style="width:100%;height:100%;background:linear-gradient(135deg, ${color} 0%, ${dark} 100%);"></div>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="story-layer">
        <div style="padding:24px;">
          <h2 style="color:#fff;font-size:1.4em;margin-bottom:16px;line-height:1.3;">${escapeHtml(slide.title)}</h2>
          ${slide.points.map(p => `<p style="color:rgba(255,255,255,0.92);font-size:0.95em;margin:8px 0;line-height:1.5;">• ${escapeHtml(p)}</p>`).join('\n          ')}
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`).join('\n');

  const titlePage = `
    <amp-story-page id="cover">
      <amp-story-grid-layer template="fill">
        <div style="width:100%;height:100%;background:linear-gradient(135deg, ${color} 0%, ${dark} 100%);"></div>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="story-layer">
        <div style="padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
          <p style="color:rgba(255,255,255,0.7);font-size:0.85em;margin-bottom:12px;letter-spacing:2px;text-transform:uppercase;">CitizenNest</p>
          <h1 style="color:#fff;font-size:1.6em;line-height:1.3;margin-bottom:16px;">${escapeHtml(story.title)}</h1>
          <p style="color:rgba(255,255,255,0.85);font-size:0.9em;line-height:1.5;">${escapeHtml(story.description.slice(0, 120))}</p>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`;

  const ctaPage = `
    <amp-story-page id="page-cta">
      <amp-story-grid-layer template="fill">
        <div style="width:100%;height:100%;background:linear-gradient(135deg, ${color} 0%, ${dark} 100%);"></div>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="story-layer">
        <div style="padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
          <h2 style="color:#fff;font-size:1.5em;margin-bottom:12px;">Read the Full Guide</h2>
          <p style="color:rgba(255,255,255,0.85);font-size:1em;margin-bottom:24px;">${escapeHtml(story.description.slice(0, 120))}</p>
          <a href="${SITE}/guide/${story.guideSlug}" style="background:#fff;color:${color};padding:14px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:1.1em;">Read on CitizenNest →</a>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`;

  return `<!doctype html>
<html ⚡>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(story.title)} - Web Story | CitizenNest</title>
  <link rel="canonical" href="${SITE}/stories/${story.slug}.html">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${escapeHtml(story.description.slice(0, 160))}">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"><\/script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"><\/script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${escapeJson(story.title)}",
    "description": "${escapeJson(story.description.slice(0, 160))}",
    "publisher": {
      "@type": "Organization",
      "name": "CitizenNest",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE}/favicon.svg"
      }
    }
  }
  <\/script>
  <style amp-custom>
    * { box-sizing: border-box; }
    .story-layer { display: flex; align-items: center; }
  </style>
</head>
<body>
  <amp-story standalone
    title="${escapeHtml(story.title)}"
    publisher="CitizenNest"
    publisher-logo-src="${SITE}/favicon.svg"
    poster-portrait-src="${SITE}/favicon.svg">
${titlePage}
${pages}
${ctaPage}
  </amp-story>
</body>
</html>`;
}

// Generate all stories
fs.mkdirSync(OUT_DIR, { recursive: true });
const generated = [];

for (const story of stories) {
  const html = generateStory(story);
  const outPath = path.join(OUT_DIR, `${story.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf-8');
  generated.push(story);
  console.log(`✅ ${story.slug} (${story.slides.length + 2} slides)`);
}

// Update manifest
let manifest = [];
const manifestPath = path.join(OUT_DIR, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}
const existingSlugs = new Set(manifest.map(m => m.slug));
for (const s of generated) {
  if (!existingSlugs.has(s.slug)) {
    manifest.push({ slug: s.slug, title: s.title, description: s.description.slice(0, 200), category: s.category || 'General' });
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

// Update sitemap
const allStoryFiles = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.html'));
const today = new Date().toISOString().split('T')[0];
const sitemapUrls = allStoryFiles.map(f => `  <url>
    <loc>${SITE}/stories/${f}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`;
fs.writeFileSync(path.join(__dirname, '..', 'public', 'stories-sitemap.xml'), sitemap, 'utf-8');

console.log(`\n🎉 Generated ${generated.length} new web stories`);
console.log(`📋 Manifest: ${manifest.length} total entries`);
console.log(`🗺️ Sitemap: ${allStoryFiles.length} stories`);

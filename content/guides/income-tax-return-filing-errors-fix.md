---
title: "Income Tax Return Filing Errors — How to Fix"
description: "Fix common ITR filing errors on the income tax portal including JSON schema errors, Form 26AS mismatch, TDS issues, and Aadhaar OTP failures."
slug: "income-tax-return-filing-errors-fix"
category: "Tax & Finance"
keywords:
  - "ITR filing error fix"
  - "JSON schema error income tax"
  - "Form 26AS mismatch"
  - "TDS not matching in ITR"
  - "bank account pre-validation failed"
  - "DSC not working income tax portal"
  - "Aadhaar OTP failed ITR"
  - "ITR-V not received"
  - "how to revise income tax return"
  - "income tax portal errors"
  - "ITR filing problems solution"
readingTime: "12 min"
lastUpdated: 2025-07-05
officialLinks:
  incomeTaxPortal: "https://www.incometax.gov.in"
  eFilingLogin: "https://eportal.incometax.gov.in/iec/foservices/#/login"
  form26AS: "https://www.incometax.gov.in/iec/foportal/help/how-to-view-form-26as"
  preValidateBankAccount: "https://www.incometax.gov.in/iec/foportal/help/how-to-pre-validate-bank-account"
  abortalDsc: "https://www.incometax.gov.in/iec/foportal/help/how-to-link-dsc"
  grievancePortal: "https://www.incometax.gov.in/iec/foportal/help/e-nivaran"
  aadhaarLinkStatus: "https://www.incometax.gov.in/iec/foportal/help/how-to-link-aadhaar"
---

# Income Tax Return Filing Errors — How to Fix

Filing your Income Tax Return (ITR) on the new e-filing portal can be frustrating when errors block your submission. This guide covers every common ITR filing error — from JSON schema failures to Aadhaar OTP issues — with step-by-step fixes.

## Common ITR Filing Errors and Solutions

### 1. JSON Schema Validation Error

**Error message:** _"The uploaded JSON is not as per the schema"_ or _"JSON schema validation failed"_

**Why it happens:**
- You used an outdated version of the offline Java/Excel utility
- The JSON file was manually edited and structure got corrupted
- Wrong Assessment Year selected in the utility

**How to fix:**
1. Download the **latest version** of the offline utility from [incometax.gov.in](https://www.incometax.gov.in)
2. Ensure the correct **Assessment Year** (e.g., AY 2025-26 for FY 2024-25) is selected
3. Re-enter your data in the fresh utility and generate a new JSON file
4. Do **not** manually edit the JSON file in a text editor
5. Clear your browser cache before uploading again
6. If using a CA/tax professional's software, ask them to update to the latest schema version

---

### 2. Form 26AS Mismatch / TDS Not Matching

**Error message:** _"TDS amount claimed is more than the amount available in 26AS"_ or _"Mismatch in TDS details"_

**Why it happens:**
- Your employer or deductor has not filed/updated their TDS return
- Quarterly TDS statement for the latest quarter is pending
- You entered TDS amounts manually instead of pre-filling

**How to fix:**
1. Log in to the [e-filing portal](https://eportal.incometax.gov.in/iec/foservices/#/login) → **e-File** → **View Form 26AS**
2. Also check **Annual Information Statement (AIS)** under **Services** → **AIS** for the latest data
3. Compare TDS entries in your ITR with Form 26AS — ensure **TAN**, **amount**, and **section** match exactly
4. If TDS is missing from 26AS:
   - Contact your employer/deductor and ask them to file or correct their TDS return
   - Wait for the updated 26AS to reflect (takes 7–15 days after deductor files)
5. Use the **Pre-fill** option on the portal to auto-import 26AS data instead of manual entry
6. For minor mismatches (₹1-2 difference due to rounding), claim only the amount shown in 26AS

> **Tip:** Always file your ITR after June 15 to ensure Q4 TDS data (Jan–Mar) is reflected in 26AS.

---

### 3. Bank Account Pre-Validation Failed

**Error message:** _"Bank account pre-validation failed"_ or _"Bank account is not validated for refund"_

**Why it happens:**
- Name in bank account doesn't match PAN records
- IFSC code is outdated (bank mergers change IFSC codes)
- Bank account is inactive, dormant, or NRE type

**How to fix:**
1. Go to **Profile** → **My Bank Account** on the e-filing portal
2. Add your bank account with correct **account number**, **IFSC code**, and **account type**
3. Ensure the **name on the bank account** matches your PAN name exactly
4. For merged banks (e.g., erstwhile banks merged into SBI/PNB), use the **new IFSC code** — check on [ifsc.bankifsccode.com](https://ifsc.bankifsccode.com) or your bank's website
5. Nominate the account for **ECS refund** by enabling the refund flag
6. Validation takes **24–72 hours** — wait and then retry filing
7. If validation keeps failing, try a **different bank account** or contact your bank to confirm KYC status

---

### 4. DSC (Digital Signature Certificate) Not Working

**Error message:** _"DSC registration failed"_ or _"Unable to detect DSC"_ or _"emsigner error"_

**Why it happens:**
- emsigner utility is not installed or not running
- DSC token driver is missing or outdated
- Browser compatibility issues
- DSC has expired

**How to fix:**
1. Install the **latest emsigner utility** from the [e-filing portal](https://www.incometax.gov.in) → Downloads section
2. Ensure the **emsigner service is running** — check system tray (Windows) or run `sudo service emsigner start` (Linux)
3. Use **Google Chrome** or **Microsoft Edge** (latest version) — Firefox may have issues
4. Install the correct **USB token driver** for your DSC (Capricorn, eMudhra, Sify, etc.)
5. Check DSC expiry — if expired, renew from your Certifying Authority
6. Allow **pop-ups** and disable ad-blockers on the income tax portal
7. If using **Mac**, ensure Java Runtime is installed and security preferences allow the emsigner app
8. Try registering/re-registering the DSC: **My Account** → **Register DSC**

> **Alternative:** If DSC continues to fail, use **Aadhaar OTP** or **EVC (Electronic Verification Code)** via net banking to verify your ITR instead.

---

### 5. Aadhaar OTP Verification Failed

**Error message:** _"Aadhaar OTP validation failed"_ or _"OTP expired"_ or _"Unable to generate OTP"_

**Why it happens:**
- Mobile number linked to Aadhaar is outdated
- UIDAI server is down or overloaded (common near due dates)
- PAN-Aadhaar linking is inactive or pending
- OTP entered after 10-minute expiry window

**How to fix:**
1. Verify your **Aadhaar-linked mobile number** — the OTP goes to the number registered with UIDAI, not the income tax portal
2. To check/update Aadhaar mobile, visit the nearest **Aadhaar Enrolment Centre** (cannot be done online)
3. Ensure **PAN-Aadhaar is linked** — check at: **Services** → **Link Aadhaar Status** on the portal
4. If PAN-Aadhaar link is inactive, pay the ₹1,000 fee and re-link before proceeding
5. Enter the OTP **within 10 minutes** of generation — do not request multiple OTPs rapidly
6. Try during **off-peak hours** (early morning or late night) to avoid UIDAI server congestion
7. If OTP still fails, use alternative verification:
   - **EVC via net banking** (login to your bank → generate EVC)
   - **EVC via bank account** (pre-validated account)
   - **EVC via Demat account**
   - **DSC** (for companies/audit cases)

---

### 6. ITR-V / Acknowledgement Not Received

**Error message:** You filed the ITR but never received the ITR-V PDF or acknowledgement email.

**Why it happens:**
- Email in profile is incorrect or inbox is full
- ITR was filed but e-verification is pending
- Portal glitch during submission

**How to fix:**
1. Log in to the [e-filing portal](https://eportal.incometax.gov.in/iec/foservices/#/login) → **e-File** → **Income Tax Returns** → **View Filed Returns**
2. Download the **ITR-V / Acknowledgement** directly from the portal
3. Check **e-Verify status** — if it shows "Pending for e-Verification", you must verify within **30 days** of filing
4. Update your **email address** in Profile settings if it's incorrect
5. Check spam/junk folder for emails from `donotreply@incometax.gov.in`
6. If the return doesn't show as filed, it may not have been submitted successfully — file again

> **Important:** If you don't e-verify within 30 days, your ITR is treated as **not filed**. E-verify via Aadhaar OTP, net banking, bank EVC, or by sending a signed physical ITR-V to CPC Bengaluru.

---

### 7. "Return Already Filed" or Duplicate Filing Error

**Error message:** _"Return for this assessment year has already been filed"_

**How to fix:**
1. Check **View Filed Returns** to confirm if a return was already submitted for this AY
2. If you need to make corrections, file a **Revised Return** (see below)
3. If someone else filed using your PAN fraudulently, immediately:
   - File a **grievance** on the [e-Nivaran portal](https://www.incometax.gov.in/iec/foportal/help/e-nivaran)
   - Lodge an **FIR** for identity theft
   - Change your e-filing portal password

---

## How to File a Revised Return (Section 139(5))

If you discover errors after filing, you can correct them by filing a **Revised Return**:

### Steps to Revise:

1. Log in to the **e-filing portal**
2. Go to **e-File** → **Income Tax Returns** → **File Income Tax Return**
3. Select the relevant **Assessment Year**
4. Choose **Filing Type** → **Revised Return u/s 139(5)**
5. Enter the **Acknowledgement Number** and **Date of Filing** of the original return
6. Correct the errors in the ITR form
7. **Validate** all sections and submit
8. **E-verify** the revised return (mandatory)

### Key Points About Revised Returns:

| Detail | Information |
|---|---|
| **Section** | 139(5) of Income Tax Act |
| **Deadline** | 31st December of the Assessment Year (e.g., 31 Dec 2025 for AY 2025-26) or before assessment completion |
| **Number of revisions** | No limit — you can revise multiple times before the deadline |
| **Original return required?** | Yes — you can only revise a return that was originally filed |
| **Belated return** | Can also be revised under the same section |
| **Processing** | The revised return **replaces** the original return entirely |

---

## Quick Troubleshooting Checklist

Before filing your ITR, ensure:

- [ ] Browser is updated (Chrome/Edge recommended)
- [ ] Cache and cookies cleared for `incometax.gov.in`
- [ ] PAN-Aadhaar is linked and active
- [ ] Bank account is pre-validated (check 24–72 hours before filing)
- [ ] Form 26AS and AIS data are up to date
- [ ] Using the **latest version** of offline utility (if applicable)
- [ ] Email and mobile number in profile are correct
- [ ] DSC/emsigner installed (if using DSC verification)

---

## Still Facing Issues?

If the error persists after trying the above fixes:

1. **Raise a grievance** on the [e-Nivaran portal](https://www.incometax.gov.in/iec/foportal/help/e-nivaran) — select "e-Filing" category
2. **Call the helpdesk:** 1800-103-0025 (toll-free) or 1800-419-0025
3. **Email:** ask@incometax.gov.in
4. **Live chat:** Available on the portal during business hours
5. Visit the nearest **Aaykar Seva Kendra** with your PAN card for in-person help

---

## Related Guides

- [Income Tax Portal Not Working — How to Fix](/guides/income-tax-portal-not-working-fix)
- [Income Tax Refund Not Received — How to Fix](/guides/income-tax-refund-not-received-fix)
- [GST Return Filing Errors — How to Fix](/guides/gst-return-filing-errors-fix)

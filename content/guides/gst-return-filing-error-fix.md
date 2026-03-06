---
title: GST Return Filing Error? Fix GSTR-1 and GSTR-3B Issues
description: >-
  Fix common GST return filing errors including JSON upload failed, nil return
  issues, late fee problems, server timeout, and ITC mismatch in GSTR-3B.
category: Tax & Finance
keywords:
  - gst return filing error
  - gstr-1 error fix
  - gstr-3b error fix
  - gst json upload error
  - gst nil return filing
  - gst late fee
  - gst server timeout
  - gst itc mismatch
  - gst offset liability error
  - gst return not filed
readingTime: 11 min
lastUpdated: '2026-03-06'
officialLinks:
  - 'https://www.gst.gov.in/'
  - 'https://services.gst.gov.in/services/login'
  - 'https://selfservice.gstsystem.in/'
  - 'https://cbic-gst.gov.in/'
---

# GST Return Filing Error? Fix GSTR-1 and GSTR-3B Issues

Filing GST returns on the GST portal can be frustrating when you run into errors — JSON upload failures, server timeouts, late fee issues, or ITC mismatches. This guide covers all common GSTR-1 and GSTR-3B filing errors with step-by-step fixes.

> **Disclaimer:** CitizenNest is an independent platform and is not affiliated with the Government of India or GSTN. Always verify with official GST portal guidelines.

---

## Common GST Return Filing Errors and Fixes

### 1. JSON Upload Error in GSTR-1

**Error messages:** "Error in JSON file," "Invalid JSON," or "File processing failed"

**Causes:**
- JSON file generated from old version of the offline tool
- File is corrupted or exceeds size limit
- Mismatch between GSTIN in the file and logged-in GSTIN

**How to fix:**
1. Download the latest version of the GST offline tool from [gst.gov.in](https://www.gst.gov.in/) > Downloads > Offline Tools
2. Re-generate the JSON file using the updated tool
3. Ensure the GSTIN in the file matches your logged-in GSTIN exactly
4. If the file is large, split it into multiple smaller files (the tool allows this)
5. Check that the return period in the file matches the period you are filing for
6. Clear browser cache and try uploading again in Google Chrome

### 2. Nil Return Filing Issues

**Error message:** "Unable to file nil return" or button greyed out

**Causes:**
- You have saved data in the return that needs to be deleted first
- Previous period returns are pending
- System error or browser issue

**How to fix:**
1. Check if any data has been auto-populated or saved — go to each section (B2B, B2C, etc.) and delete all saved entries
2. Ensure all previous period returns are filed — nil returns cannot be filed if earlier returns are pending
3. For GSTR-3B nil return: Go to GSTR-3B > check all "Nil" boxes > Submit > File with EVC/DSC
4. For GSTR-1 nil return: Go to GSTR-1 > click "Generate Summary" > then "File Nil GSTR-1"
5. Try using a different browser or incognito mode if the button is not responding

### 3. GST Late Fee Issues

**Problem:** High late fee charged for delayed return filing

**Late fee structure:**

| Return | Late Fee (CGST + SGST) | Maximum Cap |
|--------|----------------------|-------------|
| GSTR-1 (Nil) | ₹10/day + ₹10/day | ₹500 (₹250 CGST + ₹250 SGST) |
| GSTR-1 (With tax) | ₹25/day + ₹25/day | ₹5,000 (₹2,500 CGST + ₹2,500 SGST) |
| GSTR-3B (Nil) | ₹10/day + ₹10/day | ₹500 (₹250 CGST + ₹250 SGST) |
| GSTR-3B (With tax) | ₹25/day + ₹25/day | ₹5,000 (₹2,500 CGST + ₹2,500 SGST) |

**How to handle:**
1. Late fee is auto-calculated and added to your next return — you cannot avoid it once the due date has passed
2. Check for any government amnesty schemes that may reduce or waive late fees — GSTN periodically announces such schemes
3. Pay the late fee through the electronic cash ledger — it cannot be offset against ITC
4. To avoid future late fees, set calendar reminders for return due dates
5. GSTR-1 is due by the 11th of the following month; GSTR-3B by the 20th (or 22nd/24th based on state and turnover)

### 4. Server Timeout During Filing

**Error message:** "Request timed out," "Server error," or page not loading

**Causes:**
- High traffic on the GST portal, especially near due dates
- Slow internet connection
- Browser or session timeout

**How to fix:**
1. Avoid filing on the last 2-3 days before the due date — portal traffic is highest during this period
2. File during off-peak hours: early morning (6-9 AM) or late night (after 10 PM)
3. Use a stable broadband connection instead of mobile data
4. If you get a timeout after clicking "File," check your filing status — the return may have been filed successfully
5. Go to Services > Returns > Track Return Status to verify
6. Do not click "File" multiple times — this can cause duplicate processing errors
7. Report persistent issues at [selfservice.gstsystem.in](https://selfservice.gstsystem.in/)

### 5. Offset Liability Error

**Error message:** "Insufficient balance in electronic cash/credit ledger" or "Offset unsuccessful"

**Causes:**
- Insufficient balance in electronic cash ledger for tax payment
- ITC not available in electronic credit ledger
- Incorrect order of utilization (IGST must be used first)

**How to fix:**
1. Check your electronic cash ledger balance: Go to Services > Ledgers > Electronic Cash Ledger
2. Check ITC balance: Go to Services > Ledgers > Electronic Credit Ledger
3. If cash balance is low, create a challan: Services > Payments > Create Challan
4. Pay using net banking, UPI, NEFT/RTGS, or over-the-counter at authorized banks
5. Wait for the payment to reflect in your cash ledger (usually within 2 hours for net banking)
6. Follow the correct ITC utilization order: IGST → CGST → SGST (IGST credit must be fully used first)
7. Re-attempt the offset after ensuring sufficient balance

### 6. ITC Mismatch Between GSTR-2A/2B and GSTR-3B

**Problem:** Input Tax Credit claimed in GSTR-3B does not match GSTR-2A/2B

**Causes:**
- Supplier has not filed their GSTR-1
- Invoice details entered incorrectly by the supplier
- Duplicate invoices or wrong GSTIN

**How to fix:**
1. Download GSTR-2A/2B from the portal: Returns > GSTR-2A/2B > download for the relevant period
2. Compare with your purchase register to identify mismatched invoices
3. Contact your supplier and ask them to file/amend their GSTR-1
4. For invoices not appearing in GSTR-2A, you can still claim ITC in GSTR-3B if you have valid tax invoices — but follow Rule 36(4) limits
5. Under Rule 36(4), ITC on invoices not in GSTR-2B is restricted to 5% of eligible ITC available in GSTR-2B
6. Use the ITC reconciliation tool available on the GST portal for bulk comparison
7. See our [GST invoice mismatch guide](/guide/gst-invoice-mismatch-fix) for detailed reconciliation steps

---

## Step-by-Step: How to File GSTR-3B Correctly

1. Log in to [gst.gov.in](https://www.gst.gov.in/) with your credentials
2. Go to Services > Returns > Returns Dashboard
3. Select the return period and click "Prepare Online" for GSTR-3B
4. Fill Table 3.1 (Outward supplies) with your sales details
5. Fill Table 4 (ITC) with eligible input tax credit details
6. Fill Table 5 (Exempt, nil-rated, and non-GST supplies)
7. Fill Table 6 (Payment of tax) — the system auto-calculates based on your entries
8. Click "Save GSTR-3B" and then "Submit"
9. Offset the tax liability using ITC and cash ledger
10. File using EVC (for turnover up to ₹5 crore) or DSC

---

## Important Tips

1. Always file GSTR-1 before GSTR-3B — GSTR-1 data auto-populates parts of GSTR-3B
2. Reconcile ITC monthly by comparing GSTR-2B with your purchase register
3. File returns even if there is no business activity (nil return) to avoid late fees
4. Keep the GST offline tool updated to the latest version
5. Save your work frequently while filling returns — portal sessions can time out

---

## Frequently Asked Questions

### Q1. Can I revise a GST return after filing?
No. GST returns cannot be revised once filed. You can make corrections in the next period's return. For GSTR-1, use the amendment tables in the subsequent period.

### Q2. What happens if I do not file GST returns?
Your GST registration may be suspended or cancelled. You will also face late fees and interest on unpaid tax at 18% per annum. You cannot file the next period's return without filing previous ones.

### Q3. How do I file a nil GSTR-3B through SMS?
Send SMS to 14409 in the format: NIL <GSTIN> <Return Period (MMYYYY)> <OTP>. You will receive a confirmation SMS. This facility is available for nil returns only.

### Q4. The portal shows "Return already filed" but I did not file it. What should I do?
This is rare but can happen due to server glitches. Verify by downloading the filed return from the portal. If there is unauthorized filing, report it immediately at [selfservice.gstsystem.in](https://selfservice.gstsystem.in/) and to your jurisdictional GST officer.

### Q5. Can I claim ITC for invoices older than one year?
No. ITC for any invoice can be claimed only up to November 30 of the following financial year or the date of filing the annual return, whichever is earlier.

### Q6. What is the penalty for wrong ITC claim in GSTR-3B?
If ITC is wrongly claimed, you must reverse it with interest at 18% per annum. In cases of fraud, a penalty of 100% of the tax amount may be imposed under Section 74 of the CGST Act.

### Q7. How can I check if my GST return was filed successfully?
Log in to [gst.gov.in](https://www.gst.gov.in/) > Services > Returns > Track Return Status. Select the financial year and return period. Status should show "Filed."

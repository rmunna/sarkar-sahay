---
title: "E-Way Bill Generation Failed — How to Fix"
description: >-
  Fix e-way bill generation errors on ewaybillgst.gov.in. Resolve invalid GSTIN, distance mismatch, vehicle number, duplicate bill, and Part-B update issues.
category: "Tax & Finance"
keywords:
  - e-way bill generation failed
  - e-way bill error
  - ewaybillgst.gov.in not working
  - e-way bill invalid gstin
  - e-way bill distance mismatch
  - e-way bill vehicle number wrong
  - e-way bill duplicate
  - e-way bill expired extension
  - e-way bill part b update
  - e-way bill cancel
  - e-way bill penalty
  - e-way bill sms generation
  - e-way bill api
  - eway bill problem
  - gst e-way bill fix
readingTime: 14 min
lastUpdated: 2025-07-05
officialLinks:
  - "https://ewaybillgst.gov.in/"
  - "https://docs.ewaybillgst.gov.in/"
  - "https://www.gst.gov.in/"
  - "https://einvoice1.gst.gov.in/"
---

# E-Way Bill Generation Failed — How to Fix

An **E-Way Bill (EWB)** is a mandatory electronic document required for movement of goods worth more than ₹50,000 under GST. It is generated on the **ewaybillgst.gov.in** portal. If generation fails — due to invalid GSTIN, distance errors, vehicle number issues, or portal glitches — your goods can be detained and you face heavy penalties.

This guide covers every common e-way bill error, how to fix it, and how to use alternative methods like SMS and API when the portal is down.

## How E-Way Bill Generation Works

1. Log in to **ewaybillgst.gov.in** with your GSTIN credentials
2. Go to **E-Way Bill → Generate New**
3. Fill **Part A** — supply type, document details, item details, GSTIN of recipient, HSN code, value, and place of delivery
4. Fill **Part B** — vehicle number or transporter ID (TRANS ID)
5. System validates and generates a **12-digit EWB number** with a QR code
6. E-way bill is valid for a distance-based period (1 day per 200 km for regular cargo)

> **Important:** Part A alone generates a valid e-way bill number, but goods **cannot move** until Part B (vehicle details) is updated.

---

## Common E-Way Bill Errors and Fixes

### 1. Invalid GSTIN Error

**Error:** "The entered GSTIN is invalid" or "GSTIN not found"

**Why it happens:**
- Typo in the supplier or recipient GSTIN
- The GSTIN is cancelled, suspended, or surrendered
- New GSTIN not yet reflected on the e-way bill portal (sync delay of up to 24 hours)

**How to fix:**
1. Verify the GSTIN on the [GST portal search](https://www.gst.gov.in/search/searchtp) — check status is **Active**
2. Re-enter the 15-digit GSTIN carefully (format: 2 digits state code + 10-digit PAN + 1 digit entity + 1 digit Z + 1 check digit)
3. If the GSTIN was recently registered, wait **24 hours** for it to sync to the e-way bill system
4. For composition dealers or exempt entities, confirm they are eligible for e-way bill generation
5. If your own [GST registration was recently rejected](/guides/gst-registration-rejected-fix), you cannot generate e-way bills until re-registered

### 2. Distance Mismatch Error

**Error:** "The distance entered is not matching with the pin codes" or "Distance cannot exceed X km"

**Why it happens:**
- The system auto-calculates distance based on PIN codes; your entered distance deviates by more than 10%
- Wrong PIN code entered for source or destination
- The portal's distance mapping for certain PIN codes is incorrect

**How to fix:**
1. Let the system **auto-populate the distance** — leave the distance field blank or enter 0, and the system fills it based on PIN codes
2. If auto-distance is wrong, you can override it — but the system allows a maximum of **10% deviation** from its calculated distance (or up to 100 km extra, whichever is higher)
3. Verify source and destination **PIN codes** are correct
4. For multi-stop shipments, generate separate e-way bills for each leg or enter the total route distance
5. If distance genuinely exceeds the system limit, use the **"distance exceeds"** option by providing supporting documents

> **Note:** Since October 2023, the system auto-populates distance. Manual entry is only needed when PIN codes are unmapped.

### 3. Vehicle Number Format Error

**Error:** "Invalid vehicle number" or "Vehicle number format is incorrect"

**Why it happens:**
- Vehicle number not entered in the correct format (no spaces, no special characters)
- Wrong state code prefix
- Temporary registration numbers or defence vehicles entered incorrectly

**How to fix:**
1. Enter the vehicle number **without spaces or hyphens** — e.g., `KA01AB1234` not `KA-01-AB-1234`
2. Use **uppercase letters** only
3. For temporary numbers, use the format as shown on the RC: e.g., `KA01T1234`
4. Defence vehicles: use the format `01A1234A` (numeric-alpha-numeric-alpha pattern)
5. For ships/railways/airways, select the correct **transport mode** first — vehicle number format changes accordingly (Bill of Lading number for ship, RR number for rail, Airway Bill for air)

### 4. Duplicate E-Way Bill Error

**Error:** "E-Way Bill already generated for this document number" or "Duplicate document detected"

**Why it happens:**
- An e-way bill was already generated using the same invoice/document number and date
- The previous e-way bill may still be active or was not cancelled

**How to fix:**
1. Search existing e-way bills: go to **E-Way Bill → Search** and enter your document number
2. If the previous EWB is still valid, **cancel it first** before generating a new one (see [How to Cancel](#how-to-cancel-an-e-way-bill) below)
3. If the previous EWB has expired, you can generate a new one with the **same document number** — append a suffix like `/R1` to the document number if the system still blocks it
4. If another party generated the EWB against your document, ask them to cancel it or reject it from your dashboard under **Reject → Inward Supplies**

### 5. E-Way Bill Expired — Extension Failed

**Error:** "E-Way Bill has expired and cannot be extended" or "Extension can only be done within 8 hours before/after expiry"

**Why it happens:**
- Extension request was made too early (more than 8 hours before expiry) or too late (more than 8 hours after expiry)
- The goods have already reached the destination as per system records
- Extension was already done once and a second extension is attempted without valid reason

**How to fix:**
1. Extensions can only be requested **within 8 hours before or after expiry** — time it correctly
2. Go to **E-Way Bill → Extend Validity** and enter the EWB number
3. Provide a valid reason: natural calamity, law and order situation, transshipment delay, accident, or vehicle breakdown
4. Enter the **current location** of the goods (PIN code) and updated vehicle details
5. If the 8-hour window has passed, generate a **fresh e-way bill** with the same invoice — update Part B with current vehicle details
6. Keep proof of delay (FIR copy, breakdown certificate, toll receipts with timestamps) for any future audit

> **Rule:** E-way bill validity is calculated from the time of Part B update, not Part A generation.

### 6. HSN Code Error

**Error:** "Invalid HSN code" or "HSN code does not match the tax rate"

**How to fix:**
1. Use the correct **4-digit or 6-digit HSN code** based on your turnover (6-digit mandatory for turnover above ₹5 crore)
2. Verify HSN codes at [cbic-gst.gov.in](https://cbic-gst.gov.in/) or search on the GST portal
3. Ensure the tax rate entered matches the HSN code's prescribed rate
4. If facing [GST return filing errors](/guides/gst-return-filing-errors-fix) due to HSN mismatch, fix the HSN in your e-way bill and returns both

### 7. Portal Down or Technical Errors

**Error:** "Service temporarily unavailable" or page not loading

**How to fix:**
1. Try during **off-peak hours** (before 10 AM or after 8 PM)
2. Clear browser cache or use incognito mode
3. Use **SMS-based generation** (see [Generate via SMS](#generate-e-way-bill-via-sms) below)
4. Use **API-based generation** through your GST software (see [Generate via API](#generate-e-way-bill-via-api) below)
5. Use the **NIC e-Way Bill app** available on Android

---

## Part-B Update Issues

Part B contains vehicle/transport details and must be filled before goods move.

### Common Part-B Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Part B already updated" | Vehicle details already entered | Use **Update Part B → Update Vehicle** to change vehicle |
| "Cannot update — EWB expired" | E-way bill validity has lapsed | Extend validity first, then update Part B |
| "Transporter ID not found" | Wrong TRANS ID entered | Verify the transporter's 15-digit GSTIN/TRANS ID |
| "Only generator can update" | You are not the EWB generator | Ask the generator (supplier/recipient) to update, or get transporter assignment |

### How to Update Part B

1. Go to **E-Way Bill → Update Part B**
2. Enter the 12-digit EWB number
3. Select reason: **Due to breakdown**, **Transshipment**, or **First time update**
4. Enter the new vehicle number and mode of transport
5. Click **Submit** — the validity timer restarts from the update time

> **Tip:** A transporter assigned via TRANS ID can also update Part B from their login.

---

## How to Cancel an E-Way Bill

You can cancel an e-way bill within **24 hours** of generation, provided the goods have not been verified in transit by any officer.

### Steps to Cancel

1. Log in to **ewaybillgst.gov.in**
2. Go to **E-Way Bill → Cancel**
3. Enter the 12-digit EWB number
4. Select cancellation reason: **Order cancelled**, **Duplicate entry**, **Data entry mistake**, or **Others**
5. Click **Submit**

### Cancellation Rules

- **24-hour limit** — cannot cancel after 24 hours from generation time
- **Verified bills** — if a tax officer has verified the EWB in transit, it cannot be cancelled
- **Other party generated** — if the other party (recipient/transporter) generated the EWB, you can **reject** it from your dashboard but cannot cancel it
- After cancellation, you can generate a new e-way bill with the same document number

---

## Penalty for Not Having a Valid E-Way Bill

Moving goods without a valid e-way bill attracts serious penalties under **Section 129 of the CGST Act**:

| Situation | Penalty |
|-----------|---------|
| Goods with valid tax invoice but no EWB | **₹10,000 or tax amount** (whichever is higher) under CGST + equal amount under SGST |
| Goods without invoice and without EWB | **Tax amount + penalty equal to tax amount** under CGST + equal under SGST |
| Detention of vehicle | Vehicle and goods detained until penalty is paid or security is furnished |
| Repeated offence | Goods may be **confiscated** under Section 130 |

### What Happens When Goods Are Detained

1. The officer issues **Form GST MOV-06** (detention order)
2. You must pay the penalty or furnish a **security bond** within **14 days**
3. If not paid, the officer initiates **confiscation proceedings** under Section 130
4. You can file an **appeal** within 30 days of the detention order

> **Practical tip:** Always carry a printed or digital copy of the e-way bill. The officer can verify via the QR code or EWB number on the portal.

---

## Generate E-Way Bill via SMS

When the portal is down or you don't have internet access, generate e-way bills via SMS:

### One-Time Setup

1. Log in to **ewaybillgst.gov.in**
2. Go to **Registration → For SMS**
3. Register your mobile number for SMS-based generation
4. You'll receive a confirmation SMS with your registered user ID

### SMS Commands

Send SMS to **77382 99899**:

| Action | SMS Format |
|--------|------------|
| Generate EWB | `EWBG TranType DocType DocNo DocDate FromGSTIN ToGSTIN TotalValue HSN ApproxDist VehicleNo` |
| Update Vehicle | `EWBV EWBNo VehicleNo ReasonCode FromPlace` |
| Cancel EWB | `EWBC EWBNo` |
| Check Status | `EWBS EWBNo` |

### Example

To generate an outward e-way bill:
```
EWBG O TI INV001 01/03/2026 29AABCT1234F1ZX 27AABCU5678G1ZD 75000 8471 350 KA01AB1234
```

> **Note:** SMS generation supports limited fields. For multi-item invoices or complex scenarios, use the portal or API.

---

## Generate E-Way Bill via API

For bulk generation or integration with your billing software:

### API Registration

1. Log in to **ewaybillgst.gov.in**
2. Go to **Registration → For API**
3. Enter your **GSP (GST Suvidha Provider)** details
4. Your API credentials (API key + secret) are generated

### API Endpoints

- **Base URL:** `https://gsp.adaequare.com/` (or your GSP's URL)
- **Authentication:** OAuth 2.0 token-based
- **Generate EWB:** `POST /ewayapi/dec/v1.03/ewayBill`
- **Cancel EWB:** `POST /ewayapi/dec/v1.03/ewayBill/cancel`
- **Update Part B:** `POST /ewayapi/dec/v1.03/ewayBill/updatePartB`

### Popular Software with Built-in EWB API

- Tally Prime
- Zoho Books / Zoho GST
- ClearTax
- Busy Accounting
- SAP Business One

> **Tip:** E-invoicing (for businesses with turnover above ₹5 crore) **auto-generates** the e-way bill. If you use [e-invoicing on einvoice1.gst.gov.in](https://einvoice1.gst.gov.in/), the EWB is created automatically when Part B details are provided in the e-invoice JSON.

---

## E-Way Bill Validity Period

| Distance | Validity (Regular/ODC) |
|----------|----------------------|
| Up to 200 km | 1 day |
| 200–400 km | 2 days (regular) / 2 days (ODC) |
| Every additional 200 km | +1 day |
| Over Dimensional Cargo (ODC) | 1 day per 200 km |

- Validity starts from the **Part B update time** (or generation time if Part B is filled during generation)
- **Day** = midnight to midnight (24 hours)

---

## Quick Troubleshooting Checklist

- [ ] GSTIN is active and correctly entered (verify on gst.gov.in)
- [ ] PIN codes are correct for source and destination
- [ ] Distance is within 10% of system-calculated distance
- [ ] Vehicle number is in correct format (no spaces/hyphens, uppercase)
- [ ] Document number is not already used in an active e-way bill
- [ ] HSN code matches the goods and tax rate
- [ ] Part B is updated before goods movement
- [ ] E-way bill is not expired (extend within 8-hour window if needed)
- [ ] You are using a [valid GST registration](/guides/gst-registration-rejected-fix)
- [ ] Your [GST returns are filed](/guides/gst-return-filing-errors-fix) and up to date (EWB is blocked if returns are pending for 2+ months)

---

## EWB Blocked for Non-Filing of Returns

Since 2019, the e-way bill system **blocks generation** if you have not filed GST returns (GSTR-3B) for **two or more consecutive months** (or quarters for QRMP filers).

**How to fix:**
1. File all pending [GSTR-3B returns](/guides/gst-return-filing-errors-fix) on the GST portal
2. Wait **24 hours** after filing for the block to be lifted on the EWB portal
3. Try generating the e-way bill again

---

## Frequently Asked Questions

**Q: Can I generate an e-way bill for goods worth less than ₹50,000?**
Yes, you can voluntarily generate an EWB for any value. It is **mandatory** only when the consignment value exceeds ₹50,000 (or as specified by state-specific rules — some states have lower thresholds).

**Q: Who can generate the e-way bill?**
The **supplier**, the **recipient** (if the supplier hasn't generated it), or the **transporter** can generate the e-way bill.

**Q: Can I edit an e-way bill after generation?**
No. You cannot edit an EWB. You must **cancel** it (within 24 hours) and generate a new one. However, you can **update Part B** (vehicle details) without cancelling.

**Q: What if my vehicle breaks down mid-transit?**
Update Part B with the new vehicle number. If the EWB is about to expire, **extend validity** citing vehicle breakdown as the reason.

**Q: Is e-way bill required for intra-city movement?**
Yes, if the consignment value exceeds ₹50,000 and the movement is to a different location (not within the same premises). Some states exempt intra-city movement under specific conditions.

---

## Related Guides

- [GST Registration Rejected — How to Fix](/guides/gst-registration-rejected-fix)
- [GST Return Filing Errors — How to Fix](/guides/gst-return-filing-errors-fix)

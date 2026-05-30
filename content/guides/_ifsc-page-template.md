---
# TEMPLATE — Branch IFSC Code Page
# Use this structure for every bank branch IFSC page
# Data sourced from: RBI IFSC Directory (rbi.org.in)
# Variables to replace: {BANK}, {BRANCH_NAME}, {CITY}, {STATE}, {IFSC}, {MICR}, {ADDRESS}, {BANK_CODE}

title: "{BANK} {BRANCH_NAME} Branch IFSC Code — {CITY}"
description: "{BANK} {BRANCH_NAME} branch IFSC code is {IFSC}. MICR code: {MICR}. Use for NEFT, RTGS, IMPS transfers to {BANK} {BRANCH_NAME}, {CITY}."
category: "Banking & Finance"
lastUpdated: "2026-05-24"
dataSource: "RBI IFSC Directory"
keywords:
  - "{bank lowercase} {branch lowercase} ifsc code"
  - "{bank lowercase} {branch lowercase} {city lowercase} ifsc"
  - "{bank lowercase} {branch lowercase} micr code"
  - "{bank lowercase} {city lowercase} ifsc code"
  - "{branch lowercase} {city lowercase} bank ifsc"
officialLinks:
  - https://www.rbi.org.in
relatedGuides:
  - ifsc-code-search-find-online
  - neft-rtgs-imps-upi-difference
---

# {BANK} {BRANCH_NAME} Branch — IFSC Code

> **Data sourced from RBI's official IFSC directory. Last verified: {DATE}. Always confirm at your bank's official website or app before initiating large transactions.**

---

## IFSC Code — {BANK} {BRANCH_NAME}

| Detail | Value |
|--------|-------|
| **IFSC Code** | **{IFSC}** |
| **MICR Code** | {MICR} |
| **Bank** | {BANK} |
| **Branch** | {BRANCH_NAME} |
| **City** | {CITY} |
| **State** | {STATE} |
| **Branch Address** | {ADDRESS} |

---

## How to Use This IFSC Code

Use **{IFSC}** when:
- Sending NEFT or RTGS transfer TO a {BANK} {BRANCH_NAME} account
- Adding {BANK} {BRANCH_NAME} as a beneficiary in your bank's net banking / app
- Receiving IMPS transfer from another bank to your {BANK} account
- Filling online forms that ask for recipient's IFSC code

---

## IFSC Code Format Explained

```
{BANK_CODE}  0  {BRANCH_CODE}
└───────┘  │  └───────────┘
Bank code  Reserved  Branch code
(4 chars)  (always 0)  (6 chars)
```

- **{BANK_CODE}** = {BANK}'s bank code
- **0** = 5th character, always zero for all IFSC codes
- **Last 6 characters** = unique identifier for {BRANCH_NAME} branch

---

## Step-by-Step: Add This Branch as Beneficiary

1. Login to your bank's mobile app or net banking
2. Go to **Fund Transfer → Add Beneficiary**
3. Enter:
   - Account holder name
   - Account number (recipient's {BANK} account number)
   - IFSC Code: **{IFSC}**
   - Bank: {BANK}
4. Wait 30 minutes to 24 hours for beneficiary activation
5. Transfer via NEFT (any amount, free) or RTGS (₹2 lakh+, real-time)

---

## Verify This IFSC Code — Official Sources

Before large transactions, verify at:
- **{BANK} official website** → Branch Locator → Search {BRANCH_NAME}
- **RBI IFSC directory** → rbi.org.in → Payment Systems → NEFT
- **Your bank's net banking** → while adding beneficiary, the bank validates the IFSC

> **Note:** IFSC codes can change when branches merge, relocate, or close. If you're using this for a recurring transfer set up long ago, re-verify periodically.

---

## Frequently Asked Questions

**What is the IFSC code of {BANK} {BRANCH_NAME} branch?**
The IFSC code is **{IFSC}**. This is specific to the {BRANCH_NAME} branch in {CITY}. Other {BANK} branches in {CITY} have different IFSC codes.

**What is the MICR code of {BANK} {BRANCH_NAME}?**
The MICR code is **{MICR}**. MICR code is used for cheque processing (not for digital transfers). You'll find it on your cheque book.

**Can I use this IFSC for UPI transfers?**
UPI transfers using a UPI ID (like name@upi) don't require IFSC — the app resolves it automatically. IFSC is needed for NEFT/RTGS/IMPS when adding a beneficiary using account number.

**Is this IFSC code valid for international transfers?**
No. IFSC is for domestic transfers within India only. For international wire transfers to {BANK}, use {BANK}'s SWIFT code instead.

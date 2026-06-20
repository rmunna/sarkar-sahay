---
title: "UMANG App Common Errors 2026 — Fix EPFO, Passport, DigiLocker & Aadhaar Service Issues"
description: "UMANG app service-specific fixes: EPFO balance not loading → use epfindia.gov.in directly; mPassport error → use mPassport app instead; DigiLocker crash in UMANG → re-link at digilocker.gov.in; Aadhaar OTP issue → use myAadhaar.uidai.gov.in. App update + cache clear fixes most general UMANG errors."
category: "Utilities"
lastUpdated: 2025-07-05
keywords:
  - umang app error code
  - umang app epfo error
  - umang mpassport not working
  - umang digilocker integration error
  - umang aadhaar service failed
  - umang app technical error
  - umang something went wrong
  - umang service unavailable
  - umang app fix errors
  - umang pf balance error
readingTime: "9 min"
officialLinks:
  umangApp: "https://web.umang.gov.in"
  umangPlayStore: "https://play.google.com/store/apps/details?id=in.org.npci.upiapp.umang"
  umangAppStore: "https://apps.apple.com/in/app/umang/id1272753849"
  umangHelpdesk: "https://web.umang.gov.in/web_new/department/service/250"
  epfoPortal: "https://www.epfindia.gov.in"
  digilockerPortal: "https://www.digilocker.gov.in"
  mPassportSeva: "https://www.passportindia.gov.in"
---

# UMANG App Common Errors and Solutions: Service-Wise Troubleshooting

The **UMANG (Unified Mobile Application for New-age Governance)** app integrates 1,700+ government services. With so many backend integrations, service-specific errors are common. This guide covers **exact error messages, error codes, and service-wise fixes** for UMANG app failures.

> **Looking for general troubleshooting?** See our guide on [UMANG App Not Working — How to Fix](/guide/umang-app-not-working-fix) for login, OTP, crash, and cache-clearing solutions.

---

## Common UMANG Error Messages and What They Mean

### "Something Went Wrong, Please Try Again Later"

This is UMANG's generic catch-all error. Common causes:

- **Backend service downtime** — The specific department server (EPFO, CBSE, etc.) is temporarily offline
- **Session expired** — Your login session timed out during a request
- **API rate limiting** — Too many requests from your account in a short time

**Fix:**
1. Close the app completely and reopen after 2–3 minutes
2. Log out and log back in to refresh your session token
3. Check if the specific service works on its **own portal** (e.g., EPFO on epfindia.gov.in) — if that's also down, it's a server-side issue

### "Service Temporarily Unavailable"

This means the specific department's API is not responding to UMANG.

**Fix:**
- Wait 30–60 minutes and retry
- Try the service through UMANG's **web version** at [web.umang.gov.in](https://web.umang.gov.in)
- Use the department's own website or app as a fallback

### "Technical Error — Error Code: 500 / 502 / 503"

These are HTTP server errors from the backend:

| Error Code | Meaning | Action |
|-----------|---------|--------|
| **500** | Internal server error at department end | Wait and retry after 1 hour |
| **502** | Bad gateway — UMANG can't reach the service | Check your internet; retry later |
| **503** | Service overloaded or under maintenance | Try during off-peak hours (before 10 AM or after 8 PM) |
| **504** | Gateway timeout | Switch to Wi-Fi; retry |

### "Request Timed Out"

The department server took too long to respond.

**Fix:**
1. Switch from mobile data to Wi-Fi (or vice versa)
2. Disable VPN if active — UMANG services may block VPN IPs
3. Try during off-peak hours

---

## EPFO Services Errors on UMANG

### PF Balance Not Showing / "Unable to Fetch Data"

**Causes:**
- UAN not linked to Aadhaar
- EPFO server maintenance (common on 1st–5th of every month due to high traffic)
- Mismatch between registered mobile number and UMANG login number

**Fix:**
1. Verify your **UAN is activated** at [unifiedportal-mem.epfindia.gov.in](https://unifiedportal-mem.epfindia.gov.in)
2. Ensure your **Aadhaar is linked to UAN** — this is mandatory for UMANG EPFO services
3. Check that the **mobile number** linked to your UAN matches your UMANG login number
4. Try the **missed call method** as alternative: Give a missed call to **011-22901406** from your registered number

> **Related:** [EPF Passbook Not Updating — How to Fix](/guide/epf-passbook-not-updating-fix)

### "Employee Details Not Found"

- Your employer may not have updated your details on the EPFO portal
- Contact your employer's HR to verify your UAN activation status
- If you recently changed jobs, wait 2–3 months for the new employer to update records

### EPF Claim Status Error

If claim tracking shows an error:
1. Ensure you're entering the correct **claim reference number**
2. EPFO claim status updates take **3–7 working days** after submission
3. Use EPFO's own portal for more detailed claim tracking

---

## Aadhaar Services Errors on UMANG

### "Aadhaar Service Not Responding"

UIDAI's servers face heavy load. UMANG acts as a middleware, adding latency.

**Fix:**
1. Try directly on [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in) — faster for most operations
2. Retry on UMANG during **off-peak hours** (early morning or late evening)
3. For eKYC failures, ensure your **mobile number is linked to Aadhaar**

### "Aadhaar Authentication Failed"

- Biometric data mismatch — visit an Aadhaar centre for biometric update
- OTP not received — check if your **mobile number is updated** in Aadhaar records
- Captcha errors — update UMANG app to the latest version

---

## mPassport Seva Errors on UMANG

### "Unable to Connect to Passport Service"

mPassport integration on UMANG frequently breaks due to API changes.

**Fix:**
1. Use the **dedicated mPassport Seva app** instead — it's more reliable
2. For appointment booking, go directly to [passportindia.gov.in](https://www.passportindia.gov.in)
3. If you only need **application status**, try UMANG's web version

### "Appointment Slots Not Available"

This is not an error — slots are genuinely limited.
- New slots open at **midnight** and around **3–4 PM** daily
- Book in the first week of the month for best availability
- Try smaller Passport Seva Kendras instead of metro-city centres

---

## DigiLocker Integration Errors

### "DigiLocker Authentication Failed" / "Unable to Link DigiLocker"

**Causes:**
- DigiLocker session expired
- Aadhaar number mismatch between UMANG and DigiLocker accounts
- DigiLocker server downtime

**Fix:**
1. Unlink DigiLocker from UMANG: **Profile → Linked Accounts → DigiLocker → Unlink**
2. Relink with the **same mobile number** used for both UMANG and DigiLocker
3. Ensure your DigiLocker account is **Aadhaar-verified**
4. If relinking fails, log into [digilocker.gov.in](https://www.digilocker.gov.in) directly and check your account status

> **Related:** [DigiLocker Login Not Working — How to Fix](/guide/digilocker-login-not-working-fix)

### "Document Fetch Failed"

- The issuing department's API is down — retry after a few hours
- Some older documents may not be available digitally yet
- Check if the document is available directly on DigiLocker's own app first

---

## Other Service-Specific Errors

### Scholarship Portal (NSP) Errors
- **"Application Not Found"** — Verify your NSP application ID; UMANG only shows finalized applications
- **Payment status not updating** — NSP disbursements take 15–45 days; check on [scholarships.gov.in](https://scholarships.gov.in)

### Income Tax / PAN Services
- **"PAN Verification Failed"** — Ensure PAN-Aadhaar linking is complete
- Use the [Income Tax e-Filing portal](https://www.incometax.gov.in) for more reliable service

### Driving Licence / Vehicle Services (Parivahan)
- **"DL Details Not Found"** — Enter DL number in exact format (e.g., MH01-20190001234)
- State-wise availability varies — not all RTOs are integrated with UMANG

---

## When UMANG Errors Won't Resolve: Alternative Access Methods

If a specific service consistently fails on UMANG:

| Service | Direct Alternative |
|---------|-------------------|
| EPFO / PF Balance | [epfindia.gov.in](https://www.epfindia.gov.in) or missed call to 011-22901406 |
| Aadhaar | [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in) |
| Passport | [passportindia.gov.in](https://www.passportindia.gov.in) or mPassport Seva app |
| DigiLocker | [digilocker.gov.in](https://www.digilocker.gov.in) or DigiLocker app |
| Income Tax | [incometax.gov.in](https://www.incometax.gov.in) |
| Scholarships | [scholarships.gov.in](https://scholarships.gov.in) |

### UMANG Web Version

Many errors are app-specific. Try the web version at **[web.umang.gov.in](https://web.umang.gov.in)** — it bypasses app-related bugs and works on any browser.

---

## How to Report Errors to UMANG Support

If an error persists:

1. **Screenshot the error** — include any error code visible
2. **Note the service name** and exact time of the error
3. Contact UMANG support:
   - **Toll-free:** 1800-115-565
   - **Email:** support-umang@digitalindia.gov.in
   - **In-app:** Menu → Help → Raise a Ticket
4. Include your **registered mobile number** and **device model** in the complaint

---

## Quick Reference: Error → Fix

| Error Message | Most Likely Fix |
|--------------|----------------|
| Something went wrong | Log out → Log in → Retry |
| Service temporarily unavailable | Wait 1 hour; use department's own portal |
| Error 500/502/503 | Server-side; retry during off-peak hours |
| Unable to fetch PF data | Verify UAN-Aadhaar linking; check mobile number match |
| Aadhaar authentication failed | Update mobile in Aadhaar; use myaadhaar.uidai.gov.in |
| DigiLocker link failed | Unlink and relink; ensure same mobile on both |
| mPassport connection error | Use mPassport Seva app directly |
| Request timed out | Switch network; disable VPN |

---

## Frequently Asked Questions

### Why does UMANG show different errors for different services?
UMANG is a **unified gateway** — each service connects to a different government department's server. An error in one service doesn't affect others.

### Are UMANG errors more common at certain times?
Yes. **Month-start (1st–5th)** sees heavy EPFO traffic. **Office hours (10 AM–5 PM)** have peak load across all services. Try early morning or late evening.

### Should I reinstall UMANG for service errors?
Reinstalling only helps for **app-level bugs** (crashes, freezes). For service errors (500, timeout, authentication), the issue is server-side — reinstalling won't help.

### Is the UMANG web version more reliable than the app?
For many services, **yes**. The web version avoids app-specific bugs, cached data issues, and is updated server-side without needing app store updates.

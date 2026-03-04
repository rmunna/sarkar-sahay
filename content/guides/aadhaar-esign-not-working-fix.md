---
title: "Aadhaar eSign Not Working? Fix OTP, Browser & Certificate Errors"
description: "Aadhaar eSign not working or failing? Fix OTP issues, browser errors, NSDL/CDAC gateway problems, and certificate failures with this troubleshooting guide."
category: "Identity Documents"
keywords:
  - "aadhaar esign not working"
  - "aadhaar based e signature"
  - "e sign failed"
  - "aadhaar esign otp not received"
  - "esign error fix"
  - "aadhaar esign something went wrong"
  - "nsdl esign not working"
  - "cdac esign failed"
  - "aadhaar digital signature error"
  - "esign gateway error"
readingTime: "9 min"
officialLinks:
  - "https://uidai.gov.in/"
  - "https://cca.gov.in/"
  - "https://egov-appstore.nic.in/"
---

# Aadhaar eSign Not Working: Complete Troubleshooting Guide

Aadhaar eSign allows any Aadhaar holder to digitally sign documents using OTP verification. It's used across government portals — income tax filing, MCA filings, NVSP voter registration, GST registration, DigiLocker, and more. When it fails, your entire application gets stuck.

This guide covers every known eSign failure and how to fix it. For a general overview of Aadhaar eSign, see our [Aadhaar eSign guide](/guide/aadhaar-esign-online-guide).

---

## How Aadhaar eSign Works (Briefly)

1. You click "eSign" on a government portal
2. You're redirected to an **eSign gateway** (NSDL eGov or CDAC)
3. You enter your Aadhaar number
4. OTP is sent to your Aadhaar-linked mobile
5. After OTP verification, a digital signature certificate is generated and applied

Failure can happen at **steps 2, 3, 4, or 5**. Let's fix each one.

---

## Error 1: "eSign Failed — Something Went Wrong"

This is the most generic error. Common causes:

### Fix: Browser Issues
- **Use Google Chrome** (latest version) — most compatible
- **Disable popup blocker** for the portal you're using
- **Allow third-party cookies** — the eSign gateway uses redirects that need cookies
- **Disable extensions** — ad blockers, privacy extensions, and VPN extensions interfere
- **Try Incognito mode** — Ctrl+Shift+N in Chrome

### Fix: Session Timeout
- The eSign session expires in **2-3 minutes**. Complete the OTP entry quickly
- Don't switch tabs or minimize the browser during eSign
- Don't click the back button — it invalidates the session

---

## Error 2: OTP Not Received

### Causes:
- Mobile number not linked to Aadhaar
- Network congestion (OTP delayed)
- DND (Do Not Disturb) activated on your number
- Telecom operator blocking transactional SMS

### Fixes:
1. **Verify your Aadhaar-linked mobile** at [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/)
2. **Wait up to 5 minutes** — OTPs can be delayed during peak hours
3. **Deactivate DND** — send "STOP" to 1909 from your phone
4. **Check if UIDAI SMS works** — try generating an OTP on the myAadhaar portal. If that also fails, it's a UIDAI server issue
5. **Try after 30 minutes** — there may be a rate limit if you've requested too many OTPs

> If your mobile number is not linked to Aadhaar, you must visit an **Aadhaar Enrolment Centre** to update it. This cannot be done online. See our [Aadhaar update guide](/guide/aadhaar-card-apply-online).

---

## Error 3: "Aadhaar Authentication Failed"

This means UIDAI couldn't verify your Aadhaar number.

### Causes & Fixes:
| Cause | Fix |
|---|---|
| Wrong Aadhaar number entered | Double-check all 12 digits |
| Aadhaar is deactivated/suspended | Contact UIDAI at 1947 |
| Aadhaar biometrics locked | Unlock biometrics at [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/) (not needed for OTP-based eSign, but some portals check this) |
| Name mismatch between portal and Aadhaar | Ensure the name on the portal matches your Aadhaar name exactly |

---

## Error 4: NSDL vs CDAC Gateway Issues

Different government portals use different eSign service providers:

| Portal | eSign Gateway |
|---|---|
| Income Tax (e-filing) | NSDL eGov |
| MCA (company filings) | NSDL eGov |
| GST Portal | NSDL eGov |
| NVSP (voter ID) | CDAC / NSDL |
| DigiLocker | CDAC |
| State portals | Varies |

### NSDL-Specific Fixes:
- NSDL eSign requires **Java-enabled browser** in some older integrations — though most modern implementations don't
- If you see a **certificate error**, check if your system date/time is correct
- NSDL gateway URL: esign.egov-nsdl.co.in — ensure this is not blocked by your firewall

### CDAC-Specific Fixes:
- CDAC eSign gateway may show a **blank page** on Firefox — use Chrome
- CDAC occasionally has **downtime during maintenance** (typically late night IST)
- If the redirect page loads but OTP doesn't trigger, **clear cookies** and retry

### How to Check if the Gateway is Down:
- If eSign fails on multiple portals simultaneously, the gateway itself is likely down
- Check [uidai.gov.in](https://uidai.gov.in/) for maintenance notices
- Try eSign on [DigiLocker](https://www.digilocker.gov.in/) as a test — if that works, the issue is portal-specific

---

## Error 5: "Digital Signature Certificate Error"

After OTP verification, the gateway generates a temporary digital signature certificate. This can fail due to:

- **CCA (Controller of Certifying Authorities) service outage**
- **Timestamp mismatch** — your computer clock is wrong
- **SSL/TLS error** — outdated browser doesn't support required encryption

### Fixes:
1. **Sync your computer clock** — Windows: Settings → Time → Sync Now. Mac: System Settings → Date & Time → Set Automatically
2. **Update your browser** to the latest version
3. **Don't use outdated OS** — Windows 7/8 may not support modern TLS certificates
4. **Try a different device** — if it fails on desktop, try on a smartphone (or vice versa)

---

## Error 6: eSign Works But Document Not Signed

Sometimes the OTP verification succeeds but the signed document doesn't reflect on the portal.

### Fixes:
- **Don't close the browser** until you see a confirmation message on the original portal
- **Check your email** — some portals send the signed document via email
- **Log back into the portal** and check if the document shows as "Signed"
- If the portal shows "Pending eSign" despite success, **retry after clearing cache**

---

## General Best Practices

1. **Use a stable internet connection** — mobile data often works better than congested Wi-Fi
2. **Don't use VPN** — eSign gateways may reject VPN connections
3. **Keep only one tab open** for the eSign process
4. **Complete within 2 minutes** of OTP generation
5. **Have your Aadhaar number ready** — don't waste time looking it up after the popup opens

---

## When Nothing Works: Alternatives to eSign

If Aadhaar eSign consistently fails, consider these alternatives:

| Alternative | Use Case |
|---|---|
| **DSC (Digital Signature Certificate)** | For MCA, GST, income tax — purchase from licensed CAs like eMudhra, Sify |
| **Physical signature + courier** | Some forms accept printed, signed copies mailed to the office |
| **Visit the office in person** | Submit the application offline with physical signature |
| **DigiLocker Sign** | Some portals accept DigiLocker-based document verification instead of eSign |

For DSC details, see our [Digital Signature Certificate guide](/guide/digital-signature-certificate-dsc).

---

## Frequently Asked Questions

### Is Aadhaar eSign legally valid?
Yes. Aadhaar eSign is legally valid under the Information Technology Act, 2000. It has the same legal standing as a physical signature for electronic documents.

### Does eSign cost money?
For individuals on government portals, eSign is typically **free**. Some third-party platforms charge ₹5-20 per eSign transaction.

### Can I eSign from my phone?
Yes. Aadhaar eSign works on mobile browsers (Chrome on Android, Safari on iOS). Some portals also have dedicated apps with built-in eSign.

### How many times can I eSign in a day?
There's no official daily limit for eSign. However, if you request too many OTPs (10+), UIDAI may temporarily block OTP generation for your Aadhaar. Wait 30 minutes and retry.

### My eSign keeps timing out. What's the fastest way?
Keep your Aadhaar number copied to clipboard. When the eSign popup opens, paste it immediately, and enter the OTP as soon as it arrives. The entire process should take under 60 seconds.

### Can NRIs use Aadhaar eSign?
Yes, as long as your Aadhaar is active and the linked mobile number receives OTPs. If you're abroad, ensure your Indian SIM is active for receiving SMS, or use an international roaming plan.

### eSign worked once but fails on retry. Why?
Some portals generate a one-time eSign session. If it partially succeeds, the portal may not allow a retry. Contact the portal's support team to reset your application's eSign status.

---

*Disclaimer: CitizenNest is an independent platform not affiliated with UIDAI, NSDL, CDAC, or any government body. For official Aadhaar information, visit [uidai.gov.in](https://uidai.gov.in/).*

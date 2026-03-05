---
title: "GST Portal Not Working? How to Fix Login, Filing, and Server Errors"
description: "GST portal not working or showing errors? Fix GST login failures, filing errors, server timeouts, and EVC/DSC issues with this troubleshooting guide."
slug: "gst-portal-not-working-fix"
category: "Tax & Finance"
tags: ["GST", "GST portal", "GST login", "GSTR filing", "GST error", "tax filing"]
readingTime: "9 min"
lastUpdated: "2026-03-05"
officialLinks:
  - "https://www.gst.gov.in"
  - "https://selfservice.gstsystem.in"
  - "https://services.gst.gov.in/services/login"
---

# GST Portal Not Working? How to Fix Login, Filing, and Server Errors

The GST portal (gst.gov.in) is notorious for crashing during filing deadlines, throwing cryptic errors, and locking users out. If you're a business owner, CA, or tax professional struggling with the portal, this guide covers every common error and its fix.

## Common Error Messages on GST Portal

### Login Errors
- **"Invalid Username or Password"**
- **"Your account has been locked. Try after 30 minutes."**
- **"Captcha validation failed. Please try again."**
- **"OTP not received on registered mobile/email"**
- **"Session expired. Please login again."**
- **"Access Denied. You are not authorized to access this page."**

### Filing Errors
- **"GSTR-1/3B could not be filed. Please try again later."**
- **"Error occurred while processing your request. Reference ID: XXXXXXX"**
- **"System is under maintenance. Please try after some time."**
- **"504 Gateway Timeout"**
- **"Offset submission failed. Please retry."**
- **"DSC is not registered. Please register your DSC first."**
- **"EVC verification failed"**
- **"JSON file upload failed — invalid format"**
- **"Challan generation failed. Payment gateway error."**

### Technical Errors
- **"ERR_CONNECTION_TIMED_OUT"**
- **"This site can't be reached — gst.gov.in took too long to respond"**
- **"HTTP 502 Bad Gateway"**
- **"The page isn't working — gst.gov.in is currently unable to handle this request"**

## Quick Fixes for Common GST Portal Issues

### Fix 1: Portal Not Loading / Timeout Errors

The GST portal receives massive traffic near filing deadlines (11th, 13th, 20th of each month).

**Solutions:**
1. **Try off-peak hours:** Access between **12 AM - 6 AM** or **2 PM - 5 PM**
2. **Use a different browser:** Chrome works best; avoid Internet Explorer
3. **Clear cache and cookies:** Press `Ctrl + Shift + Delete` and clear browsing data
4. **Disable VPN/proxy** — GST portal sometimes blocks VPN connections
5. **Try incognito mode:** `Ctrl + Shift + N` in Chrome
6. **Check GST portal status:** Visit [selfservice.gstsystem.in](https://selfservice.gstsystem.in) for maintenance announcements

### Fix 2: Login Failures

**"Invalid Username or Password":**
1. Username is your **15-digit GSTIN** (not email or PAN)
2. Password is **case-sensitive** — check Caps Lock
3. If forgotten, click **"Forgot Password"** and reset via registered email/mobile

**"Account Locked":**
1. Wait exactly **30 minutes** (don't keep trying)
2. After 30 minutes, use **"Forgot Password"** to reset
3. If still locked, contact GST helpdesk: 1800-103-4786

**"Captcha Validation Failed":**
1. **Refresh the captcha** by clicking the reload icon
2. Captcha is **case-sensitive** — enter exactly as shown
3. Disable any **auto-fill extensions** that interfere with captcha
4. If captcha image doesn't load, clear browser cache

### Fix 3: OTP Not Received

1. Wait **10 minutes** — GST OTPs are often delayed
2. Check if **DND is active** on your mobile — disable it via your carrier
3. Ensure your **registered mobile number** is active and has signal
4. Check **email spam folder** — OTP is sent to both mobile and email
5. Click **"Resend OTP"** (max 3 attempts per session)
6. If OTP consistently fails, update your mobile number via the portal under Profile

### Fix 4: GSTR Filing Errors

**"Could not be filed" / Processing Error:**
1. **Don't press submit multiple times** — it creates duplicate entries
2. Wait 15-30 minutes and check **"Track Return Status"** — it may have been filed
3. Log out completely, clear cache, log back in
4. If using JSON upload, validate your JSON file at [jsonlint.com](https://jsonlint.com)

**"Offset Submission Failed":**
1. Ensure your **cash ledger has sufficient balance**
2. Check if **ITC amounts are correctly entered**
3. Try submitting the offset in a different browser
4. If challan payment is pending, complete it first under **Services > Payments > Create Challan**

### Fix 5: DSC (Digital Signature Certificate) Issues

**"DSC not registered":**
1. First register your DSC: **My Profile > Register/Update DSC**
2. Install the **emSigner** utility from [gst.gov.in](https://www.gst.gov.in)
3. Ensure emSigner is **running** when you sign (check system tray)
4. Your DSC token must be **plugged in** and the driver installed

**"emSigner not working":**
1. Download the latest version from [selfservice.gstsystem.in](https://selfservice.gstsystem.in)
2. Run as **Administrator**
3. Allow it through your **firewall/antivirus**
4. Use **Chrome or Firefox** — Edge doesn't work well with emSigner
5. Check that Java Runtime Environment (JRE) is installed

### Fix 6: EVC Verification Failed

1. Ensure you're using the **correct Aadhaar-linked mobile** for EVC
2. OTP is valid for only **10 minutes** — enter quickly
3. If EVC fails repeatedly, try **DSC signing** instead
4. Verify your Aadhaar is linked under **My Profile > Manage Authorized Signatory**

### Fix 7: Challan/Payment Issues

**"Challan generation failed":**
1. Use **Net Banking** instead of credit/debit card — higher success rate
2. Ensure you're using a **supported bank** (SBI, HDFC, ICICI, Axis, PNB)
3. If bank deducted money but challan failed, wait **24 hours** — it usually auto-reconciles
4. Check payment status: **Services > Payments > Challan History**
5. If money is stuck, file a grievance at [selfservice.gstsystem.in](https://selfservice.gstsystem.in)

## Browser and System Requirements

For smooth GST portal access:
- **Browser:** Google Chrome (latest version) or Firefox
- **Pop-ups:** Allow pop-ups for gst.gov.in
- **JavaScript:** Must be enabled
- **Screen resolution:** 1024x768 or higher
- **Internet speed:** Minimum 2 Mbps
- **For DSC:** emSigner installed, Java 8+, USB token driver

## Emergency: Filing Deadline Approaching

If the portal is down near the deadline:
1. **Take screenshots** of the error as proof
2. **File via GST Suvidha Provider (GSP)** — third-party portals like ClearTax, Zoho GST
3. **Government often extends deadlines** when the portal crashes — check Twitter [@aboraboram](https://twitter.com/IncomeTaxIndia) for official announcements
4. **File grievance immediately** at [selfservice.gstsystem.in](https://selfservice.gstsystem.in) with screenshots

## Related Guides

- [How to File GST Returns Online](/guides/file-gst-returns-online)
- [How to Register for GST Online](/guides/gst-registration-online)
- [PAN Aadhaar Name Mismatch Fix](/guides/pan-aadhaar-name-mismatch-fix)

## Frequently Asked Questions

### Why does the GST portal crash so often?
The GST portal handles **millions of concurrent users** during filing deadlines. GSTN infrastructure struggles with peak loads, especially on the 11th (GSTR-1), 13th (GSTR-1 IFF), and 20th (GSTR-3B) of each month.

### Can I file GST returns if the portal is down?
Yes, use a **GST Suvidha Provider (GSP)** like ClearTax, TallyPrime, Zoho GST, or Masters India. These platforms connect to GSTN through APIs and often work even when the main portal is slow.

### How do I unlock my GST portal account?
Wait **30 minutes** after the last failed attempt. Then use the **"Forgot Password"** option to reset your password via registered email and mobile OTP. If still locked, call 1800-103-4786.

### The GST portal deducted my payment but shows no challan. What do I do?
Wait **24-48 hours** — the payment usually auto-reconciles. If not, go to **Services > Payments > Challan History** to check status. For stuck payments, raise a ticket at [selfservice.gstsystem.in](https://selfservice.gstsystem.in) with your bank transaction reference number.

### Can I use the GST portal on my mobile phone?
The GST portal is **not optimized for mobile browsers**. For basic tasks, use the official **GST app** available on Google Play Store. For filing returns, use a desktop/laptop for the best experience.

### How do I contact GST helpdesk for portal issues?
Call the **GST helpline: 1800-103-4786** (toll-free, available 9 AM - 9 PM). You can also raise a ticket at [selfservice.gstsystem.in](https://selfservice.gstsystem.in) or email helpdesk@gst.gov.in.

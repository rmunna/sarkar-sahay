---
title: "Aadhaar Biometric Lock Not Working? How to Fix Lock/Unlock Errors"
description: "Aadhaar biometric lock not working on myAadhaar or mAadhaar app? Fix OTP failures, TOTP errors, unlock issues, and authentication problems with this guide."
category: "Identity Documents"
keywords:
  - aadhaar biometric lock not working
  - aadhaar biometric unlock failed
  - myaadhaar biometric lock error
  - maadhaar biometric lock not working
  - aadhaar biometric lock otp not received
  - aadhaar lock vs biometric lock
  - aadhaar biometric lock status check
  - aadhaar totp not working
  - aadhaar biometric locked but authentication failing
  - aadhaar enable biometric lock
  - aadhaar unlock biometrics online
  - uidai biometric lock error
readingTime: 10 min
lastUpdated: 2025-07-05
officialLinks:
  - "https://myaadhaar.uidai.gov.in/"
  - "https://resident.uidai.gov.in/bio-lock"
  - "https://uidai.gov.in/en/contact-support.html"
  - "https://play.google.com/store/apps/details?id=in.gov.uidai.mAadhaarPlus"
---

# Aadhaar Biometric Lock Not Working — How to Fix

The Aadhaar biometric lock feature lets you disable fingerprint and iris authentication to protect against misuse. But many residents face errors while trying to lock, unlock, or check biometric lock status on the myAadhaar portal or mAadhaar app. This guide covers every common problem and its fix.

## Common Error Messages

You may see these errors when trying to use the biometric lock feature:

- **"Unable to process your request. Please try again later"** — server-side issue on myAadhaar
- **"OTP could not be sent"** — mobile number not linked or UIDAI SMS gateway down
- **"Invalid TOTP"** — time sync issue with mAadhaar-generated TOTP
- **"Biometric lock/unlock is not enabled for this Aadhaar"** — feature not yet activated
- **"Technical error"** — portal downtime or browser issue
- Biometrics show as locked but authentication still fails at POS devices
- mAadhaar app crashes or hangs on biometric lock screen
- Lock status shows conflicting information on portal vs app

---

## Biometric Lock vs Aadhaar Lock — Key Difference

Before troubleshooting, understand the two different features:

| Feature | Biometric Lock | Aadhaar Lock (Number Lock) |
|---|---|---|
| **What it locks** | Fingerprint and iris authentication | Your Aadhaar number itself |
| **Authentication method** | Blocks biometric auth; OTP auth still works | Blocks use of 12-digit Aadhaar; must use VID |
| **Where to enable** | myAadhaar portal or mAadhaar app | myAadhaar portal or mAadhaar app |
| **Use case** | Prevent fingerprint/iris misuse | Prevent Aadhaar number misuse |
| **Can both be active?** | Yes | Yes |

> **Important:** If you have locked your **biometrics** and are trying to authenticate via fingerprint at a bank or mobile store, it will fail. This is expected behaviour — you need to temporarily unlock biometrics first. See our [biometric verification failed guide](/guide/aadhaar-biometric-verification-failed-fix) for related fixes.

---

## How to Check Your Biometric Lock Status

Before attempting fixes, confirm your current lock status:

### On myAadhaar Portal

1. Go to [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/)
2. Log in with your Aadhaar number and OTP
3. Navigate to **My Aadhaar → Aadhaar Services → Lock/Unlock Biometrics**
4. Your current status is displayed — **Locked** or **Unlocked**

### On mAadhaar App

1. Open the mAadhaar app and log in with your Aadhaar profile
2. Tap **Biometric Lock** from the main menu
3. The toggle shows your current lock status

### Via UIDAI Helpline

- Call **1947** (toll-free) and follow the IVR to check biometric lock status

---

## Fix 1: Biometric Lock/Unlock Not Working on myAadhaar Portal

### Symptoms
- Button doesn't respond, page hangs, or shows "technical error"

### Solutions

1. **Use a supported browser** — Chrome or Edge (latest version). Avoid Firefox for UIDAI portals as it sometimes causes session issues.
2. **Clear browser cache and cookies** — Stale session data causes most portal errors.
3. **Disable VPN/proxy** — UIDAI servers may block non-Indian IP addresses.
4. **Try during off-peak hours** — The portal is least busy between 7 AM–9 AM and after 9 PM IST.
5. **Check UIDAI server status** — Visit [uidai.gov.in](https://uidai.gov.in) to check for maintenance announcements.
6. **Use incognito/private mode** — This eliminates extension and cache conflicts.

---

## Fix 2: OTP Not Received for Biometric Lock/Unlock

This is the most common issue. You need OTP to lock or unlock biometrics, and if it doesn't arrive, you're stuck.

### Solutions

1. **Verify your registered mobile number** — The OTP goes to the number linked with UIDAI, not your current SIM. Check your linked number at [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/).
2. **Wait and retry** — OTPs can be delayed by 2–5 minutes during peak hours. Don't click "Resend" too quickly.
3. **Check SMS blockers** — Some phones block OTPs via spam filters. Check your blocked messages or spam folder.
4. **Ensure network signal** — Weak signal can delay or block SMS delivery.
5. **Try after 30 minutes** — Clicking "Resend OTP" too many times triggers a temporary cooldown.
6. **Use TOTP instead** — Generate a TOTP from the mAadhaar app (see below) as an alternative to SMS OTP.

> 📌 For detailed OTP troubleshooting, see our [Aadhaar OTP not received guide](/guide/aadhaar-otp-not-received-fix).

---

## Fix 3: TOTP Not Working for Biometric Lock

TOTP (Time-based One-Time Password) from the mAadhaar app is a useful alternative to SMS OTP, but it has its own issues.

### Common TOTP Problems and Fixes

1. **TOTP expired** — TOTP is valid for only **30 seconds**. Generate it and enter immediately — don't wait.
2. **Phone time out of sync** — TOTP depends on accurate device time. Go to **Settings → Date & Time → Enable "Set Automatically"** on your phone.
3. **Wrong Aadhaar profile** — If you have multiple profiles in mAadhaar, ensure you're generating TOTP for the correct Aadhaar number.
4. **Outdated mAadhaar app** — Update to the latest version from [Google Play Store](https://play.google.com/store/apps/details?id=in.gov.uidai.mAadhaarPlus) or Apple App Store.
5. **App cache corrupted** — Clear mAadhaar app cache: **Settings → Apps → mAadhaar → Clear Cache**. Then re-login and try TOTP again.

---

## Fix 4: Biometrics Locked but Authentication Still Failing

This is confusing — you've locked your biometrics intentionally but authentication fails even after unlocking.

### Why This Happens

- **Unlock didn't process** — The unlock request may have timed out. Go back to myAadhaar and verify the status shows **Unlocked**.
- **Temporary unlock expired** — If you used the "Unlock for Single Authentication" option, it re-locks automatically after one successful authentication or after a timeout.
- **Server sync delay** — After unlocking, wait **10–15 minutes** before attempting biometric authentication. UIDAI systems may take time to propagate the change.
- **Biometric data itself is the issue** — If your fingerprints are worn or changed, unlocking won't help. You may need a [biometric update](/guide/aadhaar-biometric-verification-failed-fix).

### What To Do

1. Log into [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/) and confirm status is **Unlocked**
2. Wait 15 minutes before retrying authentication
3. If using temporary unlock, ensure you authenticate within the valid window
4. If it still fails, the issue may be with your biometric data, not the lock

---

## Fix 5: mAadhaar App Biometric Lock Not Working

### Symptoms
- App crashes on biometric lock screen
- Toggle doesn't change state
- Error after entering OTP/TOTP

### Solutions

1. **Update the app** — Old versions have known bugs with the biometric lock feature.
2. **Force stop and reopen** — Go to **Settings → Apps → mAadhaar → Force Stop**, then reopen.
3. **Clear app data** — **Settings → Apps → mAadhaar → Clear Data**. You'll need to re-add your Aadhaar profile.
4. **Reinstall** — Uninstall and reinstall from the Play Store or App Store.
5. **Check phone storage** — Low storage can cause app crashes.
6. **Use the portal instead** — If the app consistently fails, use the [myAadhaar portal](https://myaadhaar.uidai.gov.in/) on a desktop browser.

---

## Fix 6: "Biometric Lock Not Enabled" Error

If you see this error, the biometric lock feature hasn't been activated for your Aadhaar.

### How to Enable Biometric Lock

1. Go to [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in/)
2. Log in with Aadhaar + OTP
3. Go to **Aadhaar Services → Lock/Unlock Biometrics**
4. Click **Enable** to activate the biometric lock feature
5. Once enabled, you can toggle lock/unlock anytime

> **Note:** You must enable the feature first before you can lock or unlock biometrics. This is a one-time step.

---

## When to Contact UIDAI Support

Contact UIDAI if none of the above fixes work:

- **Helpline:** 1947 (toll-free, available in 12 languages)
- **Email:** help@uidai.gov.in
- **Grievance portal:** [uidai.gov.in/en/contact-support.html](https://uidai.gov.in/en/contact-support.html)
- **Regional offices:** Visit [uidai.gov.in](https://uidai.gov.in) for nearest office details

### Information to keep ready:
- Your 12-digit Aadhaar number or VID
- Registered mobile number
- Screenshot of the error (if available)
- Date and time of the failed attempt

---

## Related Guides

- [Aadhaar Biometric Lock & Unlock](/guide/aadhaar-biometric-lock-unlock)
- [Aadhaar Biometric Not Matching? Fix Face & Fingerprint](/guide/aadhaar-biometric-verification-failed-fix)
- [Aadhaar Face Authentication Failed — How to Fix Face Match Errors](/guide/aadhaar-face-authentication-failed-fix)
- [Aadhaar Card Common Problems & Solutions](/guide/aadhaar-common-problems-solutions)
- [How to Download e-Aadhaar Card PDF Online — Step-by-Step Guide](/guide/aadhaar-card-download-online)

## Frequently Asked Questions

### Is biometric lock free?
Yes. Locking and unlocking biometrics is completely free on both the myAadhaar portal and mAadhaar app.

### Will locking biometrics affect Aadhaar-based OTP authentication?
No. Biometric lock only blocks fingerprint and iris authentication. OTP-based authentication (eKYC via OTP) continues to work normally.

### Can I lock biometrics permanently?
Yes. Once locked, biometrics remain locked until you manually unlock them. There is no auto-expiry.

### How often can I lock and unlock?
There is no limit. You can lock and unlock as many times as needed.

### Does biometric lock protect against Aadhaar number misuse?
Partially. It prevents biometric-based misuse. For full protection, also enable **Aadhaar Number Lock** and use a **Virtual ID (VID)** for services.

### Can someone unlock my biometrics without my knowledge?
No. Unlocking requires OTP sent to your registered mobile number. As long as your phone is secure, your biometric lock is secure.

---

## Related Aadhaar Guides

- [Aadhaar Fingerprint Not Matching? Fix Biometric Verification Failed](/guide/aadhaar-biometric-verification-failed-fix)
- [Aadhaar Face Authentication Failed — How to Fix Face Match Errors](/guide/aadhaar-face-authentication-failed-fix)
- [Aadhaar Biometric Lock & Unlock](/guide/aadhaar-biometric-lock-unlock)
- [Aadhaar OTP Not Coming? 8 Quick Fixes for Mobile & Email OTP](/guide/aadhaar-otp-not-received-fix)
- [Aadhaar Card Common Problems & Solutions](/guide/aadhaar-common-problems-solutions)

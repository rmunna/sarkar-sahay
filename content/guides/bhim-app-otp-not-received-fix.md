---
title: "BHIM App OTP Not Received? Fix SMS Verification Issues"
description: "BHIM app OTP not received for registration or UPI PIN reset? Fix DND blocks, SMS permissions, network issues, and bank SMS delays with this guide."
category: "Utilities"
keywords:
  - bhim app otp not received
  - bhim otp not coming
  - bhim sms verification failed
  - bhim upi pin otp not received
  - bhim registration otp issue
  - bhim dnd blocking otp
  - bhim sms permission fix
  - bhim bank otp delay
  - bhim otp wrong mobile number
  - bhim app sms not received
  - upi otp not received fix
  - bhim otp network error
readingTime: "8 min"
lastUpdated: 2026-03-06
officialLinks:
  - "https://www.bhimupi.org.in/"
  - "https://www.npci.org.in/what-we-do/bhim/product-overview"
  - "https://trai.gov.in/consumer-info/telecom/do-not-disturb-dnd"
---

# BHIM App OTP Not Received — How to Fix SMS Verification Issues

BHIM uses OTP (One-Time Password) verification for registration, UPI PIN setup, and UPI PIN reset. If you're not receiving the OTP SMS, it could be due to DND blocks, wrong mobile numbers, network issues, or bank-side delays. This guide covers every possible cause and fix.

## When Does BHIM Need an OTP?

BHIM requires OTP at these steps:
- **First-time registration** — verification SMS sent to/from your phone
- **Setting UPI PIN** — OTP from your bank
- **Resetting UPI PIN** — OTP from your bank
- **Adding a new bank account** — OTP from the bank

The registration SMS is different from bank OTPs. Registration uses a device-to-server SMS, while UPI PIN OTPs come from your bank's SMS gateway.

---

## Fix 1: Check DND (Do Not Disturb) Settings

DND service can block transactional OTP messages in some cases:

1. **Check DND status:**
   - Airtel/Jio/Vi: Dial **1909** from your phone
   - BSNL: Send **START 0** to **1909**
2. **Activate DND Category 0** — this allows transactional messages (OTPs) while blocking promotional SMS
3. **Alternatively, deactivate DND temporarily:**
   - Send **STOP** to **1909** from your registered number
   - Re-enable after successful registration
4. DND changes take **24-48 hours** to take effect with some operators

**Important:** Even with DND active, bank transactional OTPs (Category 0) should not be blocked. If they are, your telecom operator may have misconfigured your DND preferences — call their customer care.

---

## Fix 2: Verify Your Mobile Number

The OTP is sent to the mobile number registered with your bank, not the number you type in BHIM:

1. Confirm which number is linked to your bank account:
   - Check your bank passbook or welcome letter
   - Call your bank's customer care
   - Check in net banking under profile settings
2. Ensure the same SIM is in your phone
3. If you recently changed numbers, update your bank records first
4. Wait 24-48 hours after updating your number at the bank before trying BHIM

See our [BHIM registration guide](/guide/bhim-upi-registration-failed-fix) for number-related fixes.

---

## Fix 3: Check Network and Signal Strength

Poor network can delay or prevent OTP delivery:

1. Ensure your phone has at least **2-3 signal bars**
2. Move to an area with better coverage if signal is weak
3. Toggle **Airplane Mode** on for 10 seconds, then off — this forces your phone to reconnect to the tower
4. Restart your phone if signal issues persist
5. If you're in a basement or building with poor reception, step outside
6. **Wi-Fi calling doesn't affect SMS** — OTPs are delivered via mobile network regardless of Wi-Fi status

---

## Fix 4: Grant SMS Permissions to BHIM

BHIM needs SMS permissions to auto-read OTPs:

### Android:
1. Go to **Settings → Apps → BHIM**
2. Tap **Permissions**
3. Enable **SMS** (Read, Send, Receive)
4. Enable **Phone** (needed for SIM detection)
5. Restart BHIM and try again

### iOS:
- iPhone doesn't require explicit SMS permissions
- OTPs appear in the keyboard auto-fill suggestion
- If auto-fill doesn't work, manually type the OTP from the SMS notification

---

## Fix 5: Fix Bank-Side SMS Delays

The OTP for UPI PIN setup/reset comes from your bank, not NPCI:

1. **Peak hours delay:** Banks experience high SMS traffic between 10 AM - 2 PM and 6 PM - 9 PM. Try during off-peak hours.
2. **Bank server maintenance:** Some banks do maintenance at night (12 AM - 6 AM) — OTPs won't work during this window
3. **Wait 5 minutes:** Bank OTPs can take up to 5 minutes. Don't request another OTP too quickly.
4. **Request limit:** Most banks allow only 3-5 OTP requests per hour. If you've exceeded this, wait 1 hour.
5. **Check spam/blocked:** Ensure your phone hasn't auto-blocked the bank's SMS sender ID

---

## Fix 6: Check for Blocked Numbers or SMS Filters

Your phone might be silently blocking OTP messages:

1. **Check blocked numbers:** Settings → Messages → Blocked → ensure bank numbers aren't listed
2. **Disable third-party SMS filters:** Apps like Truecaller, SMS Organizer, or Hiya can sometimes misclassify bank OTPs as spam
3. **Check spam folder:** Some messaging apps have a spam/filtered folder — look there
4. **Default SMS app:** Set the stock messaging app as default temporarily (Settings → Apps → Default Apps → SMS)
5. **Samsung/Xiaomi/Realme:** These phones have built-in spam filters — check Settings → Messages → Spam protection

---

## Fix 7: Network-Specific Issues

| Telecom Operator | Known Issues | Fix |
|-----------------|--------------|-----|
| Jio | SMS delays during congestion | Restart phone, try after 10 min |
| Airtel | DND sometimes blocks transactional SMS | Dial 1909, activate Category 0 |
| Vi (Vodafone-Idea) | Network congestion in some circles | Try at off-peak hours |
| BSNL | Frequent SMS gateway delays | Wait 5-10 min for OTP, try twice |
| MTNL | Limited UPI SMS support | Consider switching to another SIM for registration |

---

## Fix 8: Last Resort Solutions

If nothing works:

1. **Try on a different device** with the same SIM — rules out phone-specific issues
2. **Request OTP via call** — some banks offer IVR-based OTP (check with your bank)
3. **Visit bank branch** — get UPI PIN set via the bank's debit card PIN/Green PIN
4. **Wait 24 hours** — NPCI and bank SMS systems occasionally have prolonged issues
5. **Contact BHIM helpline:** **18001201740**

---

## Important Tips

1. **Don't request OTP repeatedly** — wait at least 2-3 minutes between requests to avoid temporary blocks
2. **Bank OTPs expire in 3-10 minutes** — enter the OTP quickly once received
3. **Registration SMS costs ₹1-1.50** — ensure your prepaid balance covers it
4. **Keep your phone unlocked** during OTP wait — some phones block background SMS reading when locked
5. **OTPs are for one-time use** — if you request a new OTP, the previous one becomes invalid

---

## Frequently Asked Questions

### Q1: Why am I not receiving OTP on BHIM even though I get OTPs for other apps?
BHIM OTPs come from your bank's SMS gateway, which is different from other services. Your bank may have SMS delivery issues. Try at a different time or contact your bank to check if their SMS service is active for your account.

### Q2: Can I use BHIM without OTP verification?
No. OTP is mandatory for registration and UPI PIN setup. It's a security requirement by NPCI and RBI. There's no way to bypass this step.

### Q3: I'm getting OTP for registration but not for UPI PIN setup. Why?
Registration OTP comes from NPCI/BHIM's system. UPI PIN OTP comes from your bank. If the bank OTP isn't coming, the issue is with your bank's SMS gateway. Contact your bank's customer care.

### Q4: Does DND really block bank OTPs?
Technically, DND should not block transactional messages (Category 0) including bank OTPs. However, misconfigurations by telecom operators can sometimes block them. Dial 1909 and explicitly enable Category 0 to be safe.

### Q5: OTP received but BHIM says "Invalid OTP." What's wrong?
This happens when: (1) You entered an expired OTP — request a new one, (2) You requested multiple OTPs and entered an older one — use the latest, (3) Your phone's time is incorrect — set date/time to automatic, (4) There's a server mismatch — clear cache and retry.

### Q6: How long does the BHIM OTP remain valid?
Bank OTPs for UPI PIN typically expire in 3-10 minutes depending on the bank. If you don't enter it within this window, you'll need to request a new one.

---

*Disclaimer: CitizenNest is an independent informational platform and is not affiliated with NPCI, BHIM, TRAI, or any government body. Information is based on publicly available official sources. Verify the latest details on [bhimupi.org.in](https://www.bhimupi.org.in/) or contact your bank/telecom provider.*

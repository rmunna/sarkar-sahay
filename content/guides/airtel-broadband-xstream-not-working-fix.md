---
title: "Airtel Broadband/Xstream Fiber Not Working — How to Fix Internet Issues"
description: "Airtel broadband or Xstream Fiber not working? Fix no internet, slow speed, WiFi drops, router errors, and billing issues with this troubleshooting guide."
category: "Utilities"
keywords:
  - airtel broadband not working
  - airtel xstream fiber problem
  - airtel wifi not working
  - airtel fiber slow speed
  - airtel internet down fix
  - airtel router red light
  - airtel broadband no internet
  - airtel xstream fiber disconnecting
  - airtel broadband complaint
  - airtel broadband plan change
  - airtel router login 192.168.1.1
  - airtel thanks app complaint
readingTime: 12 min
lastUpdated: 2026-03-02
officialLinks:
  - "https://www.airtel.in/broadband"
  - "https://www.airtel.in/myplan-infinity/"
  - "https://www.airtel.in/help"
---

# Airtel Broadband / Xstream Fiber Not Working — How to Fix

Airtel Xstream Fiber is one of India's most popular broadband services, but users frequently face issues like no internet despite being connected, slow speeds, frequent disconnections, or billing-related outages. This guide covers every common Airtel broadband problem and how to fix it step by step.

> **Disclaimer:** CitizenNest is an independent platform and is not affiliated with Bharti Airtel Limited. Information here is for educational purposes. For official support, contact Airtel directly.

## Quick First Steps (Try These Before Anything Else)

Before diving into specific fixes, try these basic troubleshooting steps:

1. **Restart your router** — Unplug the power cable, wait 30 seconds, plug it back in. Wait 2-3 minutes for it to fully boot up.
2. **Check all cable connections** — Ensure the fiber cable, LAN cable, and power adapter are firmly connected.
3. **Check for area outage** — Open the Airtel Thanks app → Help → Report an issue → check if there's a known outage in your area.
4. **Try a different device** — Connect another phone or laptop to confirm whether the issue is with your device or the connection.

---

## Airtel Xstream Fiber Connected but No Internet

This is the most common issue — your device shows "Connected" to the WiFi network but pages don't load.

### Causes and Fixes

| Cause | Fix |
|-------|-----|
| Router needs restart | Power cycle the router (unplug 30 sec, replug) |
| DNS server issue | Change DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1) — see DNS section below |
| IP conflict | Forget the WiFi network on your device, reconnect |
| Bill overdue | Check payment status on Airtel Thanks app |
| ISP-side issue | Call Airtel helpline 121 or 198 |

### Step-by-Step Fix

1. Open **Settings → WiFi** on your phone/laptop.
2. Check if you're connected to the correct Airtel network (not a neighbour's).
3. Forget the network and reconnect with password.
4. If still not working, connect via **LAN cable** directly to rule out WiFi issues.
5. Open browser and try accessing **192.168.1.1** — if router admin opens, the router is working but internet is down.
6. Check the **WAN/Internet status** in router admin panel — if it shows "Disconnected", the issue is from Airtel's side.

---

## Understanding Airtel Router Lights

The LED lights on your Airtel Xstream router indicate connection status:

| Light | Colour/State | Meaning |
|-------|-------------|---------|
| Power | Green (solid) | Router is on and working |
| Power | Red (solid) | Hardware error — try factory reset or replacement |
| Internet/WAN | Green (solid) | Internet connected and working |
| Internet/WAN | Red (solid) | No internet — ISP issue or bill overdue |
| Internet/WAN | Orange/Amber | Authenticating or connecting — wait 2-3 minutes |
| Internet/WAN | Blinking green | Data transfer in progress (normal) |
| LOS (fiber) | Red (solid or blinking) | **Fiber cable issue** — check if the cable is bent, damaged, or disconnected at the ONT |
| WiFi | Green | WiFi broadcast active |
| WiFi | Off | WiFi disabled — press the WiFi button or enable from admin panel |

**Key takeaway:** If **LOS light is red**, there is a physical fiber issue. Check the cable from the wall socket to the ONT (Optical Network Terminal). Do not bend fiber cables sharply. If damaged, call Airtel for a technician visit.

---

## Slow Speed — How to Test and Fix

### Step 1: Run a Speed Test

1. Connect your device to the router via **LAN cable** (not WiFi) for an accurate test.
2. Visit [speedtest.net](https://www.speedtest.net) or use the **Airtel Thanks app** speed test.
3. Compare the result with your subscribed plan speed.

### Step 2: WiFi vs Wired Speed

WiFi speeds are always lower than wired due to signal interference. Common issues:

- **Router placed in a corner/enclosed cabinet** — move to a central, elevated location
- **Too many walls between router and device** — use a WiFi extender or mesh system
- **2.4 GHz vs 5 GHz** — 5 GHz is faster but shorter range; 2.4 GHz reaches farther but is slower
- **Too many devices connected** — disconnect unused devices

### Step 3: Change DNS Servers

Slow page loading (but fast speed test) often means DNS issues:

1. Open router admin at **192.168.1.1** (see login section below).
2. Go to **Network → LAN → DHCP Settings**.
3. Change Primary DNS to `8.8.8.8` and Secondary DNS to `8.8.4.4` (Google DNS).
4. Alternatively, use Cloudflare DNS: `1.1.1.1` and `1.0.0.1`.
5. Save and restart the router.

**On individual devices:** You can also change DNS directly in your phone/laptop network settings without touching the router.

### Step 4: Check for FUP (Fair Usage Policy)

Some older Airtel plans have FUP limits — after exceeding the data cap, speeds are throttled. Check your data usage in the Airtel Thanks app. If FUP is exhausted, upgrade to an unlimited plan.

---

## Bill Payment Failed — Auto-Disconnect

Airtel automatically suspends internet service if your bill is overdue. Signs:

- Internet suddenly stops working on the due date
- Router lights show connected but browsing redirects to an Airtel payment page
- Airtel Thanks app shows "Overdue" status

### How to Fix

1. Open the **Airtel Thanks app** or visit [airtel.in/myaccount](https://www.airtel.in/myaccount).
2. Check your bill status and due date.
3. Pay the outstanding amount via UPI, card, or net banking.
4. Internet usually restores within **15-30 minutes** after payment.
5. If not restored after 1 hour, restart the router and call **121**.

**Tip:** Enable auto-pay via the Airtel Thanks app to avoid disconnections due to missed payments.

---

## Airtel Router Admin Login (192.168.1.1)

You may need to access the router admin panel to change WiFi password, DNS settings, or check connection status.

### How to Login

1. Connect to your Airtel WiFi or via LAN cable.
2. Open a browser and type **192.168.1.1** in the address bar.
3. Enter the login credentials:
   - **Username:** `admin`
   - **Password:** `password` (default) — or check the sticker on the bottom of your router
4. If default credentials don't work, the password may have been changed during installation. Try the password the Airtel technician set.

### If You Forgot the Password

1. **Factory reset** the router — press and hold the small Reset button (use a pin) on the back of the router for 10-15 seconds.
2. The router will restart with default settings.
3. Login with default credentials from the router sticker.
4. **Note:** You'll need to reconfigure WiFi name and password after a factory reset.

---

## Frequent Disconnections — Fiber Cable and ONT Issues

If your Airtel broadband keeps disconnecting every few minutes or hours:

### Check These

1. **Fiber cable damage** — Inspect the thin fiber optic cable from the wall to the ONT. Any sharp bend, crack, or pinch can cause signal loss. Fiber cables are fragile.
2. **Loose connection at ONT** — Ensure the fiber connector is firmly plugged into the ONT box.
3. **ONT overheating** — If the ONT box is hot, move it to a ventilated area. Overheating causes intermittent drops.
4. **Router overheating** — Same applies to the router. Avoid stacking it with other devices.
5. **Check for interference** — Microwave ovens, cordless phones, and other routers on the same WiFi channel can cause drops.

### Advanced Fix

1. Login to router admin (192.168.1.1).
2. Go to **WiFi Settings** → Change the **WiFi channel** from Auto to a specific channel (1, 6, or 11 for 2.4 GHz).
3. If on 5 GHz, try channels 36, 40, 44, or 48.
4. Save and test stability.

If disconnections persist after these steps, the issue is likely at Airtel's end — register a complaint.

---

## How to Register a Complaint on Airtel Thanks App

### Step-by-Step

1. Download/open the **Airtel Thanks app** ([Play Store](https://play.google.com/store/apps/details?id=com.myairtelapp) | [App Store](https://apps.apple.com/in/app/airtel-thanks/id382aborea)).
2. Login with your registered mobile number.
3. Tap **Help** (bottom menu) or the **?** icon.
4. Select **Airtel Xstream / Broadband**.
5. Choose your issue category (No internet, Slow speed, Frequent disconnection, etc.).
6. Follow the guided troubleshooting. If unresolved, tap **Raise a complaint**.
7. Note down the **complaint/ticket number** for tracking.

### Other Ways to Complain

| Method | Details |
|--------|---------|
| Call | Dial **121** (toll-free from Airtel) or **198** (complaint) |
| WhatsApp | Message **+91 83838 83838** |
| Email | 121@airtel.in |
| Twitter/X | Tweet to [@airabortel](https://x.com/airabortel) or DM |
| Website | [airtel.in/help](https://www.airtel.in/help) |
| Nodal Officer | If complaint unresolved in 7 days, escalate to the Appellate Authority via [airtel.in/forme/nodal-officer](https://www.airtel.in/forme/nodal-officer) |

**Response time:** Airtel typically resolves broadband complaints within 24-72 hours. If a technician visit is needed, it may take 1-3 working days.

---

## Airtel Broadband Plan Upgrade or Downgrade

### How to Change Your Plan

1. Open the **Airtel Thanks app**.
2. Go to **My Account → My Plan**.
3. Browse available plans and tap **Change Plan**.
4. Select your desired plan (upgrade or downgrade).
5. Confirm the change.

### Important Points

- **Upgrade** takes effect immediately or from the next billing cycle (based on plan).
- **Downgrade** usually takes effect from the next billing cycle.
- If you're on a contract/lock-in period, early termination charges may apply.
- You can also call **121** and request a plan change.
- Visit [airtel.in/broadband](https://www.airtel.in/broadband) to compare current plans and prices.

---

## Important Tips

1. **Always restart the router first** — 70% of broadband issues are fixed by a simple power cycle.
2. **Use 5 GHz WiFi** for speed-sensitive tasks like video calls and streaming. Use 2.4 GHz only for devices far from the router.
3. **Keep firmware updated** — Check router admin panel for firmware updates periodically.
4. **Don't bend fiber cables** — Fiber optic cables break internally even with slight bends. Use cable clips to route them safely.
5. **Save your complaint number** — Always note the ticket number when raising complaints for follow-up and escalation.

---

## Frequently Asked Questions

### Why is my Airtel Xstream Fiber connected but not working?
This usually happens due to a DNS issue, overdue bill, or ISP-side outage. Try restarting the router, check bill status on the Airtel Thanks app, and change DNS to 8.8.8.8. If the router admin panel at 192.168.1.1 shows WAN as disconnected, the issue is from Airtel's side — call 121.

### What does the red LOS light on my Airtel router mean?
The red LOS (Loss of Signal) light means there is a fiber optic cable issue between your home and Airtel's network. Check if the fiber cable is bent, broken, or disconnected. Do not try to fix the fiber yourself — call Airtel at 121 to request a technician visit.

### How do I check my Airtel broadband speed?
Connect your laptop to the router via LAN cable (not WiFi) and visit speedtest.net. Compare the result with your plan speed. WiFi speeds are always lower due to signal loss. If wired speed is also low, raise a complaint with Airtel.

### How do I login to my Airtel router?
Open a browser and go to 192.168.1.1. Enter username "admin" and the password on the sticker at the bottom of your router. If you've forgotten the changed password, factory reset the router by holding the Reset button for 10-15 seconds.

### My Airtel broadband stopped after bill due date. What do I do?
Airtel auto-disconnects internet for overdue bills. Pay the pending amount via the Airtel Thanks app or airtel.in. Internet usually restores within 15-30 minutes. If not, restart the router and call 121.

### How do I register a complaint for Airtel broadband?
Use the Airtel Thanks app → Help → Select your issue → Raise a complaint. You can also call 121, email 121@airtel.in, or message +91 83838 83838 on WhatsApp.

### Can I downgrade my Airtel broadband plan?
Yes, you can downgrade via the Airtel Thanks app under My Plan section or by calling 121. Downgrades usually apply from the next billing cycle. Check for any lock-in period charges before changing.

### Why does my Airtel WiFi keep disconnecting?
Frequent drops are usually caused by router overheating, fiber cable damage, WiFi channel congestion, or ONT issues. Move the router to a ventilated spot, check the fiber cable for bends, and try changing the WiFi channel from the router admin panel.

---

*Last updated: March 2026. Information is based on Airtel's publicly available support documentation. Service terms and processes may change — verify current details on [airtel.in](https://www.airtel.in) or the Airtel Thanks app.*

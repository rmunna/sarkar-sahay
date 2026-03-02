---
title: "JioFiber Internet Not Working — How to Fix WiFi, Speed & Router Issues"
description: "JioFiber not working? Fix WiFi connected but no internet, red light on router, slow speed, DNS issues, and more with this step-by-step troubleshooting guide."
category: "Utilities"
keywords:
  - jio fiber not working
  - jio fiber wifi problem
  - jio fiber slow speed
  - jio fiber red light
  - jio fiber internet down
  - jio fiber connected but no internet
  - jio fiber router restart
  - jio fiber dns settings
  - jio fiber ont red light
  - jio fiber bill payment failed
  - jio fiber app not working
  - jio fiber installation delayed
readingTime: "12 min"
lastUpdated: 2026-03-02
officialLinks:
  - "https://www.jio.com/selfcare"
  - "https://www.jio.com/fiber"
  - "https://www.jio.com/jio-fiber-plans"
---

# JioFiber Internet Not Working — How to Fix WiFi, Speed & Router Issues

JioFiber is one of the most popular broadband services in India, but connection issues can happen to anyone. Whether your WiFi shows "connected" but has no internet, you see a red or orange light on your router, or your speed is frustratingly slow — this guide covers every common JioFiber problem and how to fix it step by step.

> **Disclaimer:** CitizenNest is an independent platform and is not affiliated with Reliance Jio or JioFiber. Information here is for educational purposes. For official support, contact JioFiber at 198 or visit [jio.com/selfcare](https://www.jio.com/selfcare).

---

## 1. JioFiber WiFi Connected but No Internet

This is the most common complaint — your phone or laptop shows WiFi is connected, but websites don't load.

### Quick Fixes (Try These First)

1. **Turn off WiFi on your device**, wait 10 seconds, turn it back on
2. **Try a different device** — if internet works on another phone/laptop, the issue is with your device, not JioFiber
3. **Check if all devices are affected** — if yes, the problem is with the router or JioFiber service
4. **Open the browser** — sometimes a Jio login/captive portal page needs to be accepted

### If All Devices Have No Internet

1. **Restart the router** (see Section 4 below for proper procedure)
2. **Check ONT (modem) lights** — if the LOS light is red, there's a fiber issue (see Section 2)
3. **Check your JioFiber account** — your plan may have expired or bill payment may have failed
4. **Try connecting via LAN cable** — if wired internet works but WiFi doesn't, it's a WiFi-specific issue

### Still Not Working?

- Open **MyJio app → JioFiber section → Run diagnostics**
- Call JioFiber support at **198** (option 3 for fiber)
- Log a complaint via the [Jio selfcare portal](https://www.jio.com/selfcare)

---

## 2. Red/Orange Light on JioFiber Router — What Each Light Means

The lights on your JioFiber ONT (modem) and router indicate the connection status. Understanding them helps you identify the problem quickly.

### JioFiber ONT (Modem) Light Indicators

| Light | Color | Meaning |
|-------|-------|---------|
| **Power** | Green (solid) | ONT is powered on and working |
| **Power** | Off | No power — check adapter and switch |
| **PON** | Green (solid) | Fiber connection is active and authenticated |
| **PON** | Green (blinking) | Trying to connect to JioFiber network |
| **PON** | Off | No fiber signal detected |
| **LOS** | Off | Normal — no signal loss |
| **LOS** | Red (solid/blinking) | **Fiber cable is broken or disconnected** — most critical issue |
| **LAN** | Green | Ethernet connection to router is active |
| **LAN** | Off | No cable connection between ONT and router |

### JioFiber Router Light Indicators

| Light | Color | Meaning |
|-------|-------|---------|
| **Internet** | Green/White | Internet is working |
| **Internet** | Red/Orange | No internet from ONT — check ONT first |
| **WiFi** | Green/White | WiFi is broadcasting |
| **WiFi** | Off | WiFi is disabled (check router settings) |

### What to Do If LOS Light Is Red

1. **Check the fiber cable** from the wall to the ONT — look for bends, damage, or disconnections
2. **Gently clean the fiber connector** if accessible (use dry cloth, never touch the glass tip)
3. **Do not bend the fiber cable** sharply — it's fragile and can crack internally
4. If the cable looks fine, **call JioFiber at 198** — it may be an area-level fiber issue or a damaged cable inside the wall

---

## 3. Slow Speed Despite High-Speed Plan

Paying for a 100 Mbps or 300 Mbps plan but getting much less? Here's how to diagnose and fix.

### Step 1: Test Your Actual Speed

1. Connect your laptop to the router via **LAN cable** (not WiFi)
2. Go to [speedtest.net](https://www.speedtest.net) or [fast.com](https://fast.com)
3. Run the test — note download, upload, and ping

**If wired speed is fine but WiFi is slow**, the problem is WiFi signal, not JioFiber.

### Step 2: Fix WiFi-Specific Slow Speed

- **Move closer to the router** — walls and distance reduce WiFi speed significantly
- **Switch to 5 GHz band** — connect to the network ending in "_5G" for faster speed (shorter range)
- **Reduce connected devices** — too many devices sharing bandwidth causes slowdowns
- **Change WiFi channel** — use the JioFiber router admin panel (192.168.29.1) to switch to a less crowded channel
- **Keep router in an open, central location** — not inside a cupboard or behind furniture

### Step 3: Fix Slow Speed on Wired Connection

- **Restart ONT and router** (see Section 4)
- **Check plan validity** — after data limit on some plans, speed may be throttled
- **Check for area-level issues** — ask neighbors on JioFiber or check [downdetector.in](https://downdetector.in/status/jio-fiber/)
- **Change DNS settings** (see Section 6) — sometimes Jio's default DNS is slow

### Step 4: Contact JioFiber

If speed is consistently below 50% of your plan speed on wired connection, file a complaint:
- Call **198**
- Use **MyJio app → Support → Raise a complaint**
- TRAI mandates that ISPs must provide at least 80% of promised speed

---

## 4. Router Restart and Factory Reset Procedure

A simple restart fixes most temporary issues. A factory reset is for persistent problems.

### How to Restart JioFiber Router (Recommended First)

1. **Turn off the router** using the power button
2. **Turn off the ONT** (modem) as well
3. **Wait 30 seconds** (this clears the temporary memory)
4. **Turn on the ONT first** — wait until PON light turns solid green (1-2 minutes)
5. **Then turn on the router** — wait for internet light to turn green
6. **Test your connection**

> **Tip:** Restart both ONT and router together. Restarting only the router may not fix ONT-level issues.

### How to Factory Reset JioFiber Router

⚠️ **Warning:** Factory reset erases your WiFi name, password, and all custom settings. Only do this if restart doesn't work.

1. Find the **small reset button** on the back of the router (you'll need a pin or paperclip)
2. **Press and hold** the reset button for 10-15 seconds
3. The router will restart — all lights will blink
4. Wait 2-3 minutes for it to fully boot
5. Connect to the default WiFi (check the label on the bottom of the router for default name and password)
6. Open **192.168.29.1** in your browser to reconfigure

---

## 5. ONT (Modem) vs Router — What's the Difference?

Many JioFiber users don't know they have two devices. Understanding which one is causing the issue saves time.

### ONT (Optical Network Terminal)

- The **smaller white box** where the fiber cable enters your home
- Converts fiber optic signal to electrical signal
- Has lights: Power, PON, LOS, LAN
- **If ONT lights show red (LOS) or PON is off** — the issue is with the fiber line, not your router
- You usually **cannot fix ONT issues yourself** — call JioFiber support

### Router (WiFi Device)

- The **larger device** that broadcasts WiFi
- Connected to the ONT via a LAN cable
- **If ONT is fine but router shows red internet light** — try restarting the router or checking settings
- You can access router settings at **192.168.29.1**

### Troubleshooting by Device

| Symptom | Problem Device | Action |
|---------|---------------|--------|
| LOS red light | ONT (fiber issue) | Call JioFiber at 198 |
| PON blinking | ONT (authentication) | Wait 5 min, then restart ONT |
| Internet light red/orange on router | Router or ONT | Restart both, check ONT first |
| WiFi not showing | Router | Check if WiFi is enabled in router settings |
| Wired works, WiFi doesn't | Router | Restart router, check WiFi settings |

---

## 6. Change DNS Settings for Better Speed

JioFiber's default DNS servers can sometimes be slow or cause certain websites to not load. Changing DNS can improve browsing speed.

### Option A: Change DNS on Your Device (Easiest)

**On Android:**
1. Go to **Settings → Network & Internet → Private DNS**
2. Select **Private DNS provider hostname**
3. Enter: `dns.google` (for Google DNS) or `one.one.one.one` (for Cloudflare DNS)
4. Save

**On iPhone/iPad:**
1. Go to **Settings → WiFi → tap (i) next to your network**
2. Scroll down to **Configure DNS → Manual**
3. Delete existing entries, add: `8.8.8.8` and `8.8.4.4`
4. Save

**On Windows:**
1. Open **Settings → Network & Internet → WiFi → Hardware properties**
2. Click **Edit** next to DNS server assignment
3. Set to Manual, enable IPv4
4. Preferred DNS: `8.8.8.8`, Alternate: `8.8.4.4`
5. Save

### Option B: Change DNS on Router (Applies to All Devices)

1. Open **192.168.29.1** in your browser
2. Login with admin credentials (default is on router label)
3. Go to **Network → WAN/Internet settings**
4. Change DNS to:
   - **Google DNS:** 8.8.8.8 and 8.8.4.4
   - **Cloudflare DNS:** 1.1.1.1 and 1.0.0.1
5. Save and restart the router

### Recommended DNS Servers

| Provider | Primary | Secondary | Best For |
|----------|---------|-----------|----------|
| Google | 8.8.8.8 | 8.8.4.4 | Reliability |
| Cloudflare | 1.1.1.1 | 1.0.0.1 | Speed & privacy |
| Quad9 | 9.9.9.9 | 149.112.112.112 | Security (blocks malware) |

---

## 7. JioFiber Bill Payment Failed — Service Disconnected

If your JioFiber bill payment fails, your service may get disconnected after the grace period.

### Why Bill Payment Fails

- **Insufficient bank balance** or credit card limit
- **Auto-pay not set up** or bank declined the auto-debit
- **UPI payment timeout** — transaction didn't complete
- **JioFiber app/website error** during payment

### How to Fix and Restore Service

1. **Open MyJio app** → JioFiber → View Bill
2. **Pay the pending amount** using UPI, debit card, credit card, or net banking
3. If payment fails on the app, try **jio.com/selfcare** on a browser
4. You can also pay via **Paytm, PhonePe, or Google Pay** (search for Jio Fiber under bill payments)
5. After successful payment, internet usually **restores within 15-30 minutes**
6. If not restored, **restart ONT and router**

### Set Up Auto-Pay to Avoid Future Issues

1. Open **MyJio app → JioFiber → Auto-pay**
2. Link your UPI ID, credit card, or debit card
3. Payment will be auto-deducted before the due date

> **Tip:** Keep a ₹500+ buffer in your linked account to avoid auto-pay failures.

---

## 8. MyJio App Not Showing JioFiber Connection

Sometimes the MyJio app doesn't display your JioFiber account or shows "No active plan."

### Fixes

1. **Make sure you're logged in with the same Jio number** linked to your JioFiber account
2. **Update the MyJio app** to the latest version from Play Store or App Store
3. **Clear app cache:** Settings → Apps → MyJio → Clear Cache
4. **Uninstall and reinstall** the MyJio app
5. **Switch to mobile data** while opening the app (sometimes JioFiber network blocks app authentication)
6. If your JioFiber is registered under a **different number**, you need to log in with that number

### Still Not Showing?

- Visit [jio.com/selfcare](https://www.jio.com/selfcare) and log in with your JioFiber registered number
- Call **198** and ask the executive to check your account linking

---

## 9. JioFiber Installation Delayed or Stuck

Booked a JioFiber connection but installation is delayed beyond the promised date?

### Normal Timeline

- **Urban areas:** 3-7 working days after booking
- **Semi-urban/new areas:** 7-15 working days
- **If fiber infrastructure isn't available** in your area, installation may take longer or may not be possible

### What to Do If Installation Is Delayed

1. **Check status in MyJio app** → JioFiber → Track Installation
2. **Call 198** and ask for your installation ticket status
3. **Visit the nearest Jio Store** with your booking reference number
4. **Escalate on social media** — tweet to [@JioCare](https://twitter.com/JioCare) with your booking ID
5. If delayed beyond **15 days**, you can file a complaint with the **Telecom Consumer Complaint** portal at [trai.gov.in](https://trai.gov.in)

### Tips for Faster Installation

- Ensure your **building society/RWA allows JioFiber** installation
- Provide **correct address and landmark** during booking
- Be available at home on the **scheduled installation date**
- If the area doesn't have Jio fiber lines yet, ask the engineer for an **estimated timeline**

---

## Important Tips

1. **Always restart both ONT and router together** — restarting only the router misses ONT-level issues
2. **Use 5 GHz WiFi for speed** — the 2.4 GHz band is slower but has better range
3. **Keep the router in an open area** — cupboards, corners, and metal surfaces block WiFi signals
4. **Check plan expiry regularly** on the MyJio app to avoid sudden disconnections
5. **Save the JioFiber support number (198)** — it's the fastest way to get help for fiber-level issues

---

## Frequently Asked Questions

### Why does my JioFiber show connected but no internet?

This usually means the router is working but the ONT has lost its connection to JioFiber's network. Check if the LOS light on the ONT is red. If yes, there's a fiber cable issue — call 198. If ONT lights are normal, restart both ONT and router.

### What does a red light on JioFiber router mean?

A red LOS (Loss of Signal) light on the ONT means the fiber optic cable is broken, disconnected, or there's an area-level outage. Check the cable for visible damage and call JioFiber support at 198. A red internet light on the router means it's not getting internet from the ONT.

### How do I restart my JioFiber router properly?

Turn off both the router and ONT. Wait 30 seconds. Turn on the ONT first and wait for PON light to be solid green (1-2 minutes). Then turn on the router. Wait for the internet light to turn green before testing your connection.

### Why is my JioFiber speed slow even on a 300 Mbps plan?

Test speed on a wired (LAN) connection first. If wired speed is fine, the issue is WiFi — switch to the 5 GHz band, move closer to the router, and reduce connected devices. If wired speed is also slow, restart ONT and router, change DNS settings, and contact JioFiber if it persists.

### Can I change DNS settings on JioFiber?

Yes. You can change DNS on individual devices or on the router itself (at 192.168.29.1). Google DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1) are popular alternatives that can improve speed and reliability.

### What is the difference between ONT and router in JioFiber?

The ONT (Optical Network Terminal) is the small box where the fiber cable enters — it converts fiber signal to electrical signal. The router connects to the ONT and broadcasts WiFi. Most JioFiber setups have both devices. Some newer setups have a combined ONT-router unit.

### My JioFiber was disconnected after bill payment failed. How long to restore?

After making the pending payment, JioFiber service usually restores within 15-30 minutes. If it doesn't, restart your ONT and router. If still not working after 1 hour, call 198.

### How do I check if JioFiber is down in my area?

Visit [downdetector.in/status/jio-fiber](https://downdetector.in/status/jio-fiber/) to check live outage reports. You can also call 198 or check the MyJio app for any area-level maintenance notifications.

### How do I access JioFiber router settings?

Open any browser and go to **192.168.29.1**. Log in with the admin credentials (default username and password are printed on a label on the bottom of your router). From here you can change WiFi name, password, DNS, channel, and other settings.

### JioFiber installation is delayed — what can I do?

Call 198 with your booking reference number to check status. If delayed beyond 15 days, escalate on Twitter to @JioCare or visit a Jio Store. For excessive delays, you can file a complaint at TRAI's consumer complaint portal.

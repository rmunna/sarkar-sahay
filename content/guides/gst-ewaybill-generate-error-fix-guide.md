---
title: "GST E-Waybill 2026 — Generate at ewaybill.nic.in, ₹50,000 Threshold, Common Errors Fixed"
description: "E-Waybill required for goods movement above ₹50,000 (GST). Generate at ewaybill.nic.in. Validity: 100 km per day. Common errors: transporter ID invalid, GSTIN mismatch, Part B not filled. E-waybill for intra-state movement: threshold varies by state. Penalty for missing e-waybill: goods seized + 100% tax as penalty."
category: "GST & Business"
keywords:
  - gst ewaybill how to generate
  - ewaybill nic in generate 2026
  - e waybill gst 50000 threshold
  - ewaybill common errors fix
  - gst e waybill validity period
  - how to generate eway bill india
  - ewaybill transporter id error fix
  - eway bill part b not filled
  - intra state eway bill rules
  - ewaybill extension validity
readingTime: "8 min"
lastUpdated: "2026-06-21"
officialLinks:
  - "https://ewaybill.nic.in/"
  - "https://gst.gov.in/"
---

# GST E-Waybill Guide 2026 — Generate, Validity, Errors & Penalties

An **E-Waybill (Electronic Way Bill)** is a document required for the movement of goods above ₹50,000 in value. Without it, the transporter can be stopped at checkpoints, and goods seized. This guide covers how to generate it, rules, validity, and common errors.

## When Is E-Waybill Required?

| Situation | E-Waybill Required? |
|-----------|-------------------|
| Goods worth > ₹50,000 moving between states | ✅ Mandatory |
| Goods worth > ₹50,000 moving within the same state | ✅ Mandatory (for most states) |
| Goods worth ≤ ₹50,000 | ❌ Not required (unless state mandates it) |
| Exempt goods (certain farm products, etc.) | ❌ Not required (category-specific) |
| Transport by non-motorized vehicles | ❌ Not required |
| Goods transported less than 50 km to/from port/airport/railway station | ❌ Exempted |

**Note**: Several states have set lower thresholds (below ₹50,000) for intra-state movement. Check your state's e-waybill notification.

## Who Generates the E-Waybill?

| Who | When |
|-----|------|
| **Supplier** (if registered) | Most common — supplier generates before dispatching goods |
| **Recipient** (if registered) | When supplier hasn't generated |
| **Transporter** | When both supplier and recipient are unregistered, or for Part B (vehicle details) |

## How to Generate E-Waybill at ewaybill.nic.in

### Step 1: Login

1. Go to **[ewaybill.nic.in](https://ewaybill.nic.in/)**
2. Login with your GSTIN + password (same as GST portal login)
3. If not registered: Register using your GSTIN

### Step 2: Generate New E-Waybill

1. Click **"Generate New"** under E-Waybill
2. Select: Supply type (outward/inward), Sub-type (supply, import, export, etc.)
3. Enter:
   - **Document type**: Invoice / Bill of Entry / Delivery Challan
   - **Document number**: Invoice number
   - **Document date**: Invoice date
   - **From address**: Your GSTIN + state
   - **To address**: Recipient GSTIN + address (or state if recipient is unregistered)
   - **Item details**: HSN code, quantity, value, tax rate
   - **Total taxable value** (must exceed ₹50,000)

### Step 3: Fill Part B (Transport Details)

After entering Part A (goods details), fill Part B:
- **Vehicle number**: Format AP 01 AB 1234 (no spaces in the field)
- **Transporter ID**: GSTIN of the transporter (if using a registered transporter)
- **Mode of transport**: Road, Rail, Air, Ship

**Part B can be filled by transporter** if they're registered — supplier fills Part A, transporter fills Part B before moving the goods.

### Step 4: Generate and Download

Click "Generate" → E-Waybill number (EWB number) is generated. Download and share with the driver/transporter.

## E-Waybill Validity Period

| Distance (One Way) | Validity |
|-------------------|---------|
| Up to 200 km | 1 day |
| 201–400 km | 3 days |
| 401–600 km | 5 days |
| 601–800 km | 7 days |
| 801–1,000 km | 10 days |
| Above 1,000 km | 15 days |

**For ODC (Over Dimensional Cargo)**: Validity is double the above.

**Extending validity**: If goods can't reach in time, the transporter can extend the e-waybill before it expires:
1. Login to ewaybill.nic.in as transporter
2. Go to "Extend Validity" → Enter EWB number
3. Extend by another day (up to 8 hours before or after expiry)
4. Provide reason (breakdown, weather, etc.)

## Common E-Waybill Errors and Fixes

### Error: "Invalid Transporter ID"

**Cause**: You entered a transporter GSTIN that doesn't exist or has been cancelled.

**Fix**: 
- Verify transporter GSTIN at [gst.gov.in](https://gst.gov.in/) → Search Taxpayer
- If transporter is unregistered, enter **TRANS-ID** (transporter enrollment ID) instead of GSTIN
- For your own vehicle: Enter your own GSTIN as transporter

### Error: "GSTIN of Recipient Not Valid"

**Cause**: Recipient GSTIN is wrong, cancelled, or suspended.

**Fix**:
- Verify recipient GSTIN at gst.gov.in → Search Taxpayer
- If recipient is unregistered: Select "URP" (Unregistered Person) and enter state only (no GSTIN)
- If GSTIN was recently activated, wait 24 hours and retry

### Error: "Part B Not Filled — E-Waybill Cannot Be Used"

**Cause**: You generated Part A (goods details) but Part B (vehicle) is empty. E-waybill without Part B is not valid for road transport.

**Fix**:
- Login → Find the EWB under "Update Part B / Vehicle"
- Enter vehicle number and transport details
- E-waybill becomes valid once Part B is filled

### Error: "EWB Already Cancelled"

**Cause**: The e-waybill was cancelled (by you or recipient) but the driver is still carrying it.

**Fix**: 
- Generate a new e-waybill for the same shipment
- Cancel is irreversible — a new EWB number must be generated

### Error: "Duplicate Invoice" When Generating

**Cause**: You already generated an EWB for this invoice number.

**Fix**:
- Check the existing EWB under "View Generated EWB"
- If the existing EWB is wrong: Cancel it, then regenerate
- If the existing EWB is correct: Use the same EWB number — don't generate a duplicate

## Cancelling an E-Waybill

E-waybill can be cancelled within **24 hours** of generation IF:
- Goods were not dispatched
- Invoice was cancelled
- Wrong details entered

After 24 hours: If the goods are in transit, the EWB cannot be cancelled. If movement hasn't started, contact the EWB helpline.

**How to cancel**:
ewaybill.nic.in → Cancel EWB → Enter EWB number → Select reason → Cancel

## Penalties for Missing E-Waybill

| Situation | Penalty |
|-----------|---------|
| No e-waybill for taxable goods | ₹10,000 or **tax amount (whichever is higher)** |
| Expired e-waybill | Same as above |
| Goods can be detained | Yes — detained until penalty paid |
| Vehicle can be seized | Yes |
| Fake/incorrect EWB | 100% of tax + equal penalty |

## E-Waybill Helpline

| Channel | Details |
|---------|---------|
| **Helpline** | 14599 (toll-free) |
| **Email** | helpdesk.eway@nicin.in |
| **Portal** | ewaybill.nic.in |

---

*Disclaimer: CitizenNest is independent and not affiliated with GSTN or NIC. E-waybill rules may vary by state. Verify at [ewaybill.nic.in](https://ewaybill.nic.in/).*

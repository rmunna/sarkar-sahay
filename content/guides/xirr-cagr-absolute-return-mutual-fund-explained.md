---
title: "XIRR vs CAGR vs Absolute Return — What Your Mutual Fund Returns Actually Mean (India 2026)"
description: "XIRR is the correct return metric for SIPs — CAGR is for lumpsum. If your SIP XIRR is 14%, it means ₹1 invested on any day would become ₹1.14 after 1 year. Absolute return = (current value − invested) / invested × 100. Why Groww shows XIRR and what 12% XIRR means for your portfolio."
category: "Tax & Finance"
keywords:
  - xirr meaning mutual fund india
  - xirr vs cagr difference
  - absolute return vs cagr vs xirr
  - how to calculate xirr in mutual fund
  - what is good xirr for sip india
  - cagr meaning in mutual fund
  - annualized return meaning india
  - mutual fund returns explained india
  - how to read mutual fund returns
  - sip returns calculation india
readingTime: "8 min"
lastUpdated: "2026-06-22"
officialLinks:
  - "https://www.amfiindia.com"
---

# XIRR vs CAGR vs Absolute Return — Which Return Number Should You Look At?

Every mutual fund app shows different return numbers — XIRR, CAGR, absolute return, 1Y/3Y/5Y returns. Most investors don't know which one actually matters for their portfolio. Here's exactly what each means.

---

## Absolute Return — The Simplest Number

**Formula**: `(Current Value − Amount Invested) / Amount Invested × 100`

**Example**: You invested ₹1,00,000 and your portfolio is now ₹1,35,000.
- Absolute Return = (1,35,000 − 1,00,000) / 1,00,000 × 100 = **35%**

**Problem with absolute return**: It doesn't account for time. A 35% return in 2 years is much better than 35% in 10 years.

**When to use it**: Quick sanity check on total profit. Not useful for comparing funds or strategies.

---

## CAGR — For Lumpsum Investments

**CAGR** = Compound Annual Growth Rate. It answers: "If my investment grew at a consistent annual rate, what would that rate be?"

**Formula**: `CAGR = (Ending Value / Beginning Value)^(1/n) − 1`

where n = number of years

**Example**: ₹1,00,000 invested as lumpsum, now worth ₹2,01,136 after 5 years.
- CAGR = (2,01,136 / 1,00,000)^(1/5) − 1 = 2.01136^0.2 − 1 = **15%**

**What 15% CAGR means**: Your investment doubled every 4.8 years (Rule of 72: 72/15 = 4.8).

**CAGR on mutual fund websites**: When a fund shows "5-year return: 18%", that's CAGR — the fund grew at an equivalent rate of 18% per year compounded. ₹1L invested 5 years ago → ₹2.29L.

**Problem with CAGR for SIPs**: CAGR assumes a single investment at the start. SIPs invest monthly — each installment has a different starting point and different time in the market. CAGR misrepresents SIP returns.

---

## XIRR — The Right Metric for SIPs

**XIRR** = Extended Internal Rate of Return. It's the annualized return that accounts for multiple cash flows at different times.

In plain terms: XIRR is the single annual interest rate that, if applied to each of your SIP installments from the exact date you invested each one, would give your current portfolio value.

**Example**:
- Jan 2023: SIP ₹5,000
- Feb 2023: SIP ₹5,000
- ... continuing monthly ...
- Jun 2026: Portfolio value ₹2,45,000

XIRR calculates an annualized return that accounts for the fact that the first installment has been in the market for 3.5 years, the last one for only a month.

**Why Groww / Zerodha / Coin show XIRR**: XIRR is the correct return metric for SIPs. All major platforms now display XIRR for SIP portfolios.

### What Is a Good XIRR for SIP?

| XIRR | Interpretation |
|------|---------------|
| 6–8% | Poor — barely beating FD (check if invested in debt fund or underperforming equity) |
| 10–12% | Average — roughly in line with Nifty 50 long-term average |
| 14–16% | Good — you've picked a decent fund or held through market ups/downs |
| 18%+ | Excellent — likely a midcap/smallcap heavy portfolio in a bull period |
| <0% | Negative — you're in loss; normal for <3 years in equity |

**Important**: XIRR fluctuates daily with market movements. An XIRR of 14% one day can drop to 10% after a 5% market correction. Don't obsess over daily XIRR — what matters is 7–10 year average.

---

## 1Y / 3Y / 5Y Returns on Fund Fact Sheets

When AMC fact sheets or comparison sites show "5-Year Return: 18.4%" — this is **point-to-point CAGR** of the fund itself (not your personal XIRR).

It means: If you had invested a lumpsum exactly 5 years ago, your CAGR would be 18.4%.

This is NOT the same as your personal SIP XIRR because:
1. You didn't invest all money 5 years ago
2. Your SIP amounts were invested at different market levels

**Use fund CAGR to compare funds**. Use XIRR to understand your personal portfolio performance.

---

## Annualized Return vs Absolute Return — Quick Comparison

| Metric | Best For | Accounts for Time? | Handles Multiple Cash Flows? |
|--------|----------|--------------------|------------------------------|
| Absolute Return | Total profit (quick check) | No | Yes |
| CAGR | Lumpsum investments, fund comparison | Yes | No (single investment) |
| XIRR | SIP portfolios | Yes | Yes |

---

## How to Calculate XIRR Yourself

XIRR is available in Excel, Google Sheets, and most broker apps.

### In Google Sheets / Excel:
1. Column A: Dates of each SIP installment + final date
2. Column B: Amount (negative for investments, positive for current value)
3. Formula: `=XIRR(B1:B37, A1:A37)`

**Example setup** (₹5K SIP for 3 years + final value):

| Date | Cash Flow |
|------|-----------|
| 01/01/2023 | -5000 |
| 01/02/2023 | -5000 |
| ... | ... |
| 01/12/2025 | -5000 |
| 22/06/2026 | +2,05,000 (current value) |

XIRR formula gives you the annualized return on this SIP.

---

## Expense Ratio — The Silent Return Killer

Every mutual fund charges an annual fee called the **expense ratio**. This is deducted daily from NAV — you never see it as a line item, but it directly reduces your returns.

| Fund Type | Typical Expense Ratio |
|-----------|----------------------|
| Direct Index Fund (Nifty 50) | 0.05%–0.20% |
| Direct Actively Managed Equity Fund | 0.5%–1.5% |
| Regular Plan (same fund via broker) | 1.0%–2.5% |

**Impact over 20 years**: An extra 1% in expense ratio reduces your corpus by ~18–20% over 20 years. On a ₹1 crore corpus, that's ₹18–20 lakh gone to the AMC.

**Always choose Direct plans** over Regular plans — they have the same underlying portfolio but lower expense ratio. Buy direct plans at [mfcentral.com](https://www.mfcentral.com), [groww.in](https://groww.in), or direct on AMC websites.

---

## NAV — What It Is and What It Isn't

**NAV** (Net Asset Value) is the per-unit price of a mutual fund on a given day.

**Formula**: `NAV = (Total assets of fund − Liabilities) / Number of units`

**NAV is NOT**: A measure of how expensive or cheap a fund is. A fund with NAV of ₹200 is not "more expensive" than a fund with NAV of ₹20. NAV just reflects the history of the fund's returns since launch.

**What matters**: Fund's returns (CAGR), expense ratio, and portfolio quality — not NAV.

When you invest ₹5,000 in a fund with NAV ₹200, you get 25 units. When you invest ₹5,000 in a fund with NAV ₹20, you get 250 units. After 1 year, if both grow 15%, both investments are worth ₹5,750 — irrespective of NAV.

---

## Frequently Asked Questions

### My Groww XIRR shows 0% even though I've been investing for 6 months. Is something wrong?

No — this is normal for short holding periods in equity. XIRR reflects current market value vs investment. If markets have been flat or down since you started, XIRR can be 0% or negative. Equity SIPs need 5–7 years to show reliable positive XIRR. Don't judge SIP performance in 6 months.

### My XIRR is 14% but the fund's 5-year return shown on websites is 18%. Why the difference?

Because the fund's "5-year return" is CAGR for a lumpsum invested exactly 5 years ago. Your XIRR is personalized — based on when each of your SIP installments was invested and at what market level. Both numbers can be valid simultaneously.

### What XIRR should I expect from a Nifty 50 SIP over 10 years?

Historically, 10-12% XIRR over a 10-year SIP in Nifty 50 is a reasonable expectation. The actual number depends on entry/exit market levels — a SIP started at peak markets may show lower XIRR.

### Is negative XIRR always bad?

For equity funds, negative XIRR in the first 2–3 years is common. If you started SIP during a bull market and markets corrected, you'll see negative XIRR initially — but as markets recover and SIP continues, XIRR turns positive. Only worry if XIRR is negative after 5+ years.

### How do I check my XIRR on Zerodha?

Open Coin app → Holdings → your fund → you'll see XIRR displayed for each fund separately. For overall portfolio XIRR, you can export your statement to Excel and calculate.

---

*Disclaimer: Return examples are illustrative. Actual mutual fund returns are not guaranteed. CitizenNest is an independent information platform.*

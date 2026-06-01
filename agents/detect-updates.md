# Update Detection — Cron Task Prompt

You are scanning for new government job notifications, exam updates, admit cards, and results for CitizenNest.

## Steps

1. Read `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/source-monitors.json` — get the list of sources to scan
2. Based on the tier specified in the cron trigger (tier1 or tier2), filter sources
3. List existing updates: `ls /Users/rajakumar/.openclaw/workspace/sarkar-sahay/content/updates/`
4. For each source in the tier:
   a. Run `web_search` with the source's searchQueries (use freshness "pw" for past week)
   b. Check search results for NEW announcements not already covered
   c. Look for: new notifications, admit card releases, result declarations, exam date announcements
   d. **IMPORTANT:** Treat each paper/phase/session result as a SEPARATE update. E.g., JEE Main Paper 1 result and Paper 2 result are different updates. UPSC Prelims result and Mains result are different. Don't skip a result just because a related result was already published.
   d. Update `lastScanned` in source-monitors.json

5. For each NEW announcement found:
   a. **VERIFY** — Search again specifically for the announcement. Cross-reference dates/details from at least 2 sources. Check the official website URL.
   b. If verified, generate the content file (see Generation Rules below)
   c. Run QA validation on the generated file

6. After all sources scanned:
   a. Commit all new files + updated source-monitors.json
   b. `cd /Users/rajakumar/.openclaw/workspace/sarkar-sahay && git add content/updates/ agents/source-monitors.json && git commit -m "content: add [N] new updates ([summary])" && git push`
   c. **Immediately submit new URLs to Google Indexing API** (do this right after push, before Vercel finishes deploying):
      ```bash
      # For each new slug just committed:
      node /Users/rajakumar/.openclaw/workspace/sarkar-sahay/scripts/google-index-submit.js "https://www.citizennest.com/update/{slug}"
      ```
      Then submit to IndexNow for Bing/Yandex:
      ```bash
      node /Users/rajakumar/.openclaw/workspace/sarkar-sahay/scripts/submit-indexnow.js
      ```
   d. For each new update published, post to Telegram channel `@citizennest`:
      ```
      message(action=send, channel=telegram, accountId=midas, target=@citizennest, message=...)
      ```
      ⚠️  ONLY post exam and job notifications — NOT government schemes, NOT citizen service guides.
      The Telegram channel is dedicated to Jobs & Exams only.
      Format: 🔴 **[Exam Name] [Stage]** — [key detail e.g. "14,582 vacancies" or "Result declared"]
      Last date/result date + direct link: citizennest.com/update/{slug}
      Example: 🔴 **SSC CGL 2026 Notification** — 14,582 vacancies. Apply by March 15.
      👉 citizennest.com/update/ssc-cgl-2026-notification
   e. Summarize: what was found, what was published, what was skipped and why

## Generation Rules

Output each update as: `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/content/updates/{slug}.md`

### Slug format
`{org-lowercase}-{exam-lowercase}-{year}-{stage}`
Examples: `ssc-cgl-2026-notification`, `upsc-nda-2-2026-result`, `ibps-po-2026-admit-card`

### Frontmatter (YAML)
```yaml
---
title: "SSC CGL 2026 Notification — Dates, Vacancies, Eligibility & Apply Online"
description: "SSC CGL 2026 recruitment notification out. 14,582 vacancies..." # 140-160 chars
category: "Government Jobs"  # Government Jobs | Entrance Exams | Results | Admit Cards
type: "notification"          # notification | admit-card | exam-schedule | result | cutoff | answer-key
organization: "SSC"
examName: "SSC CGL 2026"
stage: "notification"
keywords: ["ssc cgl 2026", "ssc cgl notification", ...]
importantDates:
  notificationDate: "2026-02-15"
  lastDateToApply: "2026-03-15"
  examDate: "2026-06-01"        # Use "TBA" if unknown — do NOT fabricate
officialLinks:
  - "https://ssc.gov.in/..."
readingTime: "6 min"
publishedDate: "2026-02-17"     # Today's date
expiryDate: "2026-03-16"        # Day after last date to apply (for notifications)
status: "active"
vacancies: 14582                # Number or "TBA"
relatedStages: []               # Fill if other stages exist
---
```

### Content Structure
```markdown
## What is [Exam Name]?
Brief intro (2-3 sentences)

## Important Dates
| Event | Date |
|-------|------|
| ... | ... |

## Vacancy Details
Total posts, category-wise breakdown if available

## Eligibility Criteria
- Age limit
- Educational qualification
- Nationality

## Application Fee
| Category | Fee |
|----------|-----|
| ... | ... |

## How to Apply Online
1. Step-by-step numbered process
2. ...

## Selection Process
Stages of selection

## Exam Pattern
- Number of questions, marks, duration
- Sections/subjects

## Syllabus (Brief Overview)
Key topics per section

## Preparation Tips
3-5 actionable tips

## FAQs
5+ Q&As in "## FAQ" or "### Q: ..." format

## Important Links
- [Official Notification PDF](url)
- [Apply Online](url)
```

### CRITICAL RULES
1. **NEVER fabricate dates** — if a date is not confirmed, write "To be announced"
2. **NEVER fabricate vacancy numbers** — use "TBA" if not confirmed
3. **NEVER fabricate fee amounts** — verify from official notification
4. **All officialLinks must be real .gov.in/.nic.in/.ac.in domains** (exception: sbi.co.in, ibps.in)
5. **Two-source verification** — don't publish based on a single blog/news source
6. **If uncertain about ANY fact, skip the update** — accuracy > speed
7. All frontmatter keys must be camelCase
8. officialLinks must be plain URL strings (not objects)
9. readingTime format: "X min" (not "X min read")
10. description must be 140-160 characters

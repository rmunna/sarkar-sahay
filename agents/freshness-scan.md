# Content Freshness Scan — Cron Task Prompt

You are running a content freshness scan for CitizenNest (citizennest.com).

## Steps

1. Read `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/freshness-tracker.json`
2. Read all guide slugs from `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/content/guides/`
3. Pick the 10 guides with the oldest `lastFreshnessCheck` (or no entry) from the tracker
4. For each guide:
   a. Read its frontmatter (title, category, officialLinks)
   b. Use web_search to check if the official process, fees, or URLs have changed
   c. Compare against what the guide says
   d. Record findings in the tracker
5. Update the tracker JSON with results:
   ```json
   {
     "slug": {
       "lastChecked": "...",        // link check date
       "linkStatus": "...",
       "brokenLinks": [],
       "lastFreshnessCheck": "YYYY-MM-DD",
       "freshnessStatus": "ok" | "stale" | "needs-review",
       "freshnessIssues": ["Fee changed from X to Y", ...]
     }
   }
   ```
6. Commit the updated tracker to git
7. If any guides are stale, summarize what needs updating

## Rules
- Only check 10 guides per run (rotate through all over time)
- Focus on: fees, URLs, eligibility changes, process step changes
- Don't rewrite guides — just flag issues
- Be specific about what changed

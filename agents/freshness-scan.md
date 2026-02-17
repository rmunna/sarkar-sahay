# Content Freshness Scan — Cron Task Prompt

You are running a content freshness scan for CitizenNest (citizennest.com).

## Steps

1. Read `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/priority-guides.json` — this is the priority list (tier1 = highest traffic, tier2 = medium)
2. Read `/Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/freshness-tracker.json`
3. Pick the 10 guides with the oldest `lastFreshnessCheck` (or no entry), prioritizing **tier1 first, then tier2, then everything else**
4. For each guide:
   a. Read its markdown file from `content/guides/{slug}.md`
   b. Use web_search to check if the official process, fees, or URLs have changed
   c. Compare against what the guide says
   d. Record findings in the tracker
5. Update the tracker JSON with results:
   ```json
   {
     "slug": {
       "lastChecked": "...",
       "linkStatus": "...",
       "brokenLinks": [],
       "lastFreshnessCheck": "YYYY-MM-DD",
       "freshnessStatus": "ok" | "stale" | "needs-review",
       "freshnessIssues": ["Fee changed from X to Y", ...]
     }
   }
   ```
6. Commit the updated tracker: `git add agents/freshness-tracker.json && git commit -m 'chore: freshness scan results YYYY-MM-DD'`
7. If any guides are stale, summarize what needs updating

## Rules
- Only check 10 guides per run (rotate through all over time)
- Tier1 guides should be checked at least monthly, tier2 at least quarterly
- Focus on: fees, URLs, eligibility changes, process step changes
- Don't rewrite guides — just flag issues
- Be specific about what changed (old value → new value)
- When analytics data is available, update priority-guides.json with real traffic data

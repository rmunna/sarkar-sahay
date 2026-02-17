# Pipeline Orchestration — Midas Playbook

How to run the 3-stage content pipeline for CitizenNest.

## Pipeline Overview

```
Stage 1 (Research) → Stage 2 (Write) → Stage 3 (Validate & Publish)
```

Each stage is a separate sub-agent spawn. Stages are sequential — each depends on the previous output.

## Running a Single Piece of Content

### Step 1: Research
```
sessions_spawn:
  task: |
    Follow /Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/stage-1-research.md
    
    Topic: {TOPIC}
    Content type: {guide|update}
    Slug: {SLUG}
    
    Brave search budget: {N} searches max.
  label: "research-{SLUG}"
```

Wait for completion. Check the announce for confidence score.
- If confidence >= 70: proceed to Stage 2
- If confidence < 70 or abort: stop, report to Munna

### Step 2: Write
```
sessions_spawn:
  task: |
    Follow /Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/stage-2-write.md
    
    Slug: {SLUG}
    Content type: {guide|update}
    
    Research JSON is at: .pipeline/{SLUG}/research.json
  label: "write-{SLUG}"
```

Wait for completion.

### Step 3: Validate & Publish
```
sessions_spawn:
  task: |
    Follow /Users/rajakumar/.openclaw/workspace/sarkar-sahay/agents/stage-3-validate.md
    
    Slug: {SLUG}
    Content type: {guide|update}
    
    Research: .pipeline/{SLUG}/research.json
    Draft: .pipeline/{SLUG}/draft.md
  label: "validate-{SLUG}"
```

Wait for completion. Check the announce for decision (published/revised/rejected).

## Running a Batch

For multiple topics, run Stage 1 in parallel (up to 5 concurrent), then Stage 2 in parallel for those that passed, then Stage 3 in parallel.

```
Batch of N topics:
  Round 1: Spawn Stage 1 for all N (max 5 concurrent)
  Wait for all Stage 1 to complete
  Filter: keep only confidence >= 70
  
  Round 2: Spawn Stage 2 for passed topics (max 5 concurrent)
  Wait for all Stage 2 to complete
  
  Round 3: Spawn Stage 3 for all drafts (max 5 concurrent)
  Wait for all Stage 3 to complete
  
  Report: X published, Y rejected, Z warnings
```

## For Cron Detection Jobs

The cron detection prompt (detect-updates.md) handles its own research inline since it needs to first DISCOVER what's new before researching. Flow:

1. Cron detect job finds new announcements via Brave search
2. For each new announcement, it writes research.json + draft.md + validates + publishes
3. This is acceptable for cron because the detect job IS the research stage

For manual/batch content generation, always use the 3-stage pipeline.

## Brave API Budget Tracking

Track searches per run. Monthly budget: 2,000 requests.

Estimated usage:
- Tier 1 daily scan: ~15/day × 30 = 450/month
- Tier 2 2x/week scan: ~10 × 8 = 80/month
- Freshness scan 2x/month: ~20 × 2 = 40/month
- Manual research: ~10/guide × variable
- Buffer: ~1,400 for manual content generation

At 10 searches per guide, that's ~140 new guides/month capacity from Brave alone.

## Error Recovery

If Stage 1 fails: Re-run with different search queries
If Stage 2 fails: Re-run (it's deterministic from research.json)
If Stage 3 rejects: Read validation.json for reasons, fix research or re-run Stage 2
If Stage 3 finds fact errors: Stage 1 needs re-run with better sources

Pipeline artifacts in `.pipeline/{SLUG}/` persist until Stage 3 publishes (then cleaned up).
Rejected artifacts persist for debugging.

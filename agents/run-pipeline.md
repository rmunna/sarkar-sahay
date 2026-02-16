# CitizenNest 6-Agent Pipeline Runner

## How Midas Runs the Pipeline

For each topic, Midas spawns 6 sequential sub-agents:

### Stage 1: Research Agent
```
Label: sarkar-research-{slug}
Task: Research prompt with topic
Output: JSON with raw facts
```

### Stage 2: Structuring Agent  
```
Label: sarkar-structure-{slug}
Task: Structure prompt with Stage 1 JSON output
Output: Normalized JSON schema
```

### Stage 3: Writer Agent
```
Label: sarkar-write-{slug}
Task: Writer prompt with Stage 2 JSON output
Output: JSON with markdown content + metadata
```

### Stage 4: Validator Agent
```
Label: sarkar-validate-{slug}
Task: Validator prompt with Stage 3 JSON output
Output: JSON with approved/needs_revision/rejected
Decision: If rejected → skip. If needs_revision → re-run writer with fixes.
```

### Stage 5: SEO Agent
```
Label: sarkar-seo-{slug}
Task: SEO prompt with Stage 3 JSON output
Output: JSON with SEO improvements
```

### Stage 6: Publisher Agent
```
Label: sarkar-publish-{slug}
Task: Publisher prompt with Stage 3 + Stage 5 combined
Output: JSON with slug + final markdown content
Action: Midas writes the file to content/guides/{slug}.md
```

## After All Topics Complete
Midas runs:
1. `cd sarkar-sahay && npm run build`
2. `git add -A && git commit && git push`
3. `npx vercel --yes --prod`
4. Sends Telegram notification

## Pipeline Rules
- Validator MUST approve before proceeding to SEO
- If Validator rejects, topic is skipped with a log
- If Validator says needs_revision, Writer re-runs with fixes (max 2 retries)
- All agents output ONLY JSON (no conversational text)
- Each agent is a separate sessions_spawn call

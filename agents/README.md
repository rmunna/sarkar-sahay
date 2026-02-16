# SarkarSahay Multi-Agent Pipeline

## Architecture

```
Research Agent → Structuring Agent → Writer Agent → Validator Agent → SEO Agent → Publisher Agent
```

Each agent is invoked via OpenClaw `sessions_spawn` with a structured JSON prompt.
The orchestrator script chains them together.

## Agent Roles

1. **Researcher** — Scrapes/researches official govt sources, outputs raw structured data
2. **Structurer** — Normalizes raw data into content schema
3. **Writer** — Produces SEO-optimized markdown guide
4. **Validator** — Fact-checks, ensures accuracy ≥90% confidence
5. **SEO** — Optimizes metadata, keywords, internal links
6. **Publisher** — Writes final markdown file to content/guides/

## Content Schema

Guides are stored as markdown files in `content/guides/` with YAML frontmatter.
See `content/guides/aadhaar-card-apply-online.md` for reference format.

## Running the Pipeline

```bash
# From workspace root, trigger via OpenClaw:
# The orchestrator spawns each agent in sequence
```

#!/bin/bash
# Exam Site Poller — runs every 5 min via launchd
# Zero LLM cost. Pure HTTP requests.
# When changes detected, auto-triggers Claude agent to generate content.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONITOR="$SCRIPT_DIR/exam-site-monitor.js"
RESULT="$SCRIPT_DIR/exam-monitor-latest.json"
ALERT_FILE="$SCRIPT_DIR/.exam-alert-pending"
LOCK_FILE="$SCRIPT_DIR/.content-gen-running"
LOG="/tmp/exam-poll.log"
CONTENT_GEN_LOG="/tmp/exam-content-gen.log"

# Only poll during daytime (6AM - 11PM IST)
HOUR=$(TZ=Asia/Calcutta date +%H)
if [ "$HOUR" -lt 6 ] || [ "$HOUR" -gt 22 ]; then
    exit 0
fi

cd "$PROJECT_DIR"
node "$MONITOR" >> "$LOG" 2>&1

# Only alert on real changes (NEW_NOTICE, NEW_PDF, PDF_CHANGE) — skip CONTENT_CHANGE (cosmetic)
REAL_CHANGES=$(node -e "try{const d=require('$RESULT');const real=d.changes.filter(c=>c.type!=='CONTENT_CHANGE');console.log(real.length)}catch(e){console.log(0)}")

if [ "$REAL_CHANGES" -gt 0 ]; then
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[${TIMESTAMP}] 🔴 $REAL_CHANGES real change(s) detected!" >> "$LOG"
    echo "${TIMESTAMP}|${REAL_CHANGES}" >> "$ALERT_FILE"

    # Auto-trigger Gemini content generation if not already running
    if [ ! -f "$LOCK_FILE" ]; then
        echo "[${TIMESTAMP}] 🤖 Triggering Gemini content generation..." >> "$LOG"
        touch "$LOCK_FILE"

        # Load GEMINI_API_KEY from .env.local if not already set
        if [ -z "$GEMINI_API_KEY" ] && [ -f "$PROJECT_DIR/.env.local" ]; then
            export GEMINI_API_KEY=$(grep "^GEMINI_API_KEY=" "$PROJECT_DIR/.env.local" | cut -d= -f2)
        fi

        # Run Gemini generator in background — deduplication + validation built in
        (
            node "$PROJECT_DIR/scripts/generate-updates-gemini.js" \
                >> "$CONTENT_GEN_LOG" 2>&1
            EXIT_CODE=$?

            # If new files were generated, commit and push
            if [ "$EXIT_CODE" -eq 0 ] && [ -f "$PROJECT_DIR/agents/.newly-generated-slugs" ]; then
                cd "$PROJECT_DIR"
                git add content/updates/ agents/source-monitors.json
                SLUG_COUNT=$(wc -l < "$PROJECT_DIR/agents/.newly-generated-slugs" | tr -d ' ')
                if ! git diff --staged --quiet; then
                    git commit -m "content: auto-add ${SLUG_COUNT} exam update(s) [$(date +%Y-%m-%d)]"
                    git push
                    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✅ Pushed ${SLUG_COUNT} update(s)" >> "$LOG"

                    # Submit to Google Indexing API + IndexNow
                    while IFS= read -r slug; do
                        node "$PROJECT_DIR/scripts/google-index-submit.js" \
                            "https://www.citizennest.com/update/$slug" >> "$LOG" 2>&1 || true
                    done < "$PROJECT_DIR/agents/.newly-generated-slugs"
                    node "$PROJECT_DIR/scripts/submit-indexnow.js" >> "$LOG" 2>&1 || true
                fi
                rm -f "$PROJECT_DIR/agents/.newly-generated-slugs"
            fi

            rm -f "$LOCK_FILE"
            rm -f "$ALERT_FILE"
            echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✅ Generation run complete" >> "$LOG"
        ) &

        echo "[${TIMESTAMP}] 🚀 Content generation started (PID=$!)" >> "$LOG"
    else
        echo "[${TIMESTAMP}] ⏳ Content gen already running, skipping trigger" >> "$LOG"
    fi
fi

# Daily health-check: warn if log hasn't been updated in 7+ hours
LAST_MODIFIED=$(stat -f "%m" "$LOG" 2>/dev/null || stat -c "%Y" "$LOG" 2>/dev/null || echo 0)
NOW=$(date +%s)
AGE=$(( NOW - LAST_MODIFIED ))
if [ "$AGE" -gt 25200 ] && [ "$HOUR" -eq 9 ]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ⚠️  HEALTH CHECK: Log not updated in ${AGE}s — daemon may have stopped" >> "$LOG"
fi

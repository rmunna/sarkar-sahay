#!/bin/bash
# Exam Site Poller — runs every 5 min via launchd
# Zero LLM cost. Pure HTTP requests.
# When changes detected, writes alert file for OpenClaw to pick up.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONITOR="$SCRIPT_DIR/exam-site-monitor.js"
RESULT="$SCRIPT_DIR/exam-monitor-latest.json"
ALERT_FILE="$SCRIPT_DIR/.exam-alert-pending"
LOG="/tmp/exam-poll.log"

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
fi

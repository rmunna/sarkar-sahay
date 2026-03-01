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

# Check if changes were detected
CHANGES=$(node -e "try{const d=require('$RESULT');console.log(d.changesDetected||0)}catch(e){console.log(0)}")

if [ "$CHANGES" -gt 0 ]; then
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[${TIMESTAMP}] 🔴 $CHANGES change(s) detected!" >> "$LOG"
    # Append to alert file (don't overwrite — accumulate until OpenClaw reads it)
    echo "${TIMESTAMP}|${CHANGES}" >> "$ALERT_FILE"
fi

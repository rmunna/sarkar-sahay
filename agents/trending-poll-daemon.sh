#!/bin/bash
# Trending Topic Poller — runs every 4 hours via launchd
# Zero LLM cost. Calls Google Trends API + RSS directly.
# When new content opportunities found, writes alert file for OpenClaw heartbeat.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PYTRENDS_OUT="$SCRIPT_DIR/trending-pytrends.json"
SCAN_OUT="$SCRIPT_DIR/trending-latest.json"
ALERT_FILE="$SCRIPT_DIR/.trending-alert-pending"
LOG="/tmp/trending-poll.log"

# Only poll during daytime (7AM - 11PM IST)
HOUR=$(TZ=Asia/Calcutta date +%H)
if [ "$HOUR" -lt 7 ] || [ "$HOUR" -gt 22 ]; then
    exit 0
fi

cd "$PROJECT_DIR"

# Run pytrends (Google Trends API)
python3 "$SCRIPT_DIR/trending-pytrends.py" >> "$LOG" 2>&1

# Run Google Trends RSS scan
node "$SCRIPT_DIR/trending-scan.js" >> "$LOG" 2>&1

# Check pytrends opportunities
PY_OPPS=$(node -e "try{const d=require('$PYTRENDS_OUT');console.log((d.opportunities||[]).length)}catch(e){console.log(0)}")

# Check RSS opportunities
RSS_OPPS=$(node -e "try{const d=require('$SCAN_OUT');console.log((d.govtTrends||[]).filter(t=>!t.guideExists).length)}catch(e){console.log(0)}")

TOTAL=$((PY_OPPS + RSS_OPPS))

if [ "$TOTAL" -gt 0 ]; then
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[${TIMESTAMP}] 📈 $TOTAL trending opportunity/ies (pytrends=$PY_OPPS, rss=$RSS_OPPS)" >> "$LOG"
    echo "${TIMESTAMP}|pytrends=${PY_OPPS}|rss=${RSS_OPPS}" >> "$ALERT_FILE"
fi

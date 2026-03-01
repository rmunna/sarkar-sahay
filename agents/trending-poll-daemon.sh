#!/bin/bash
# Trending Topic Poller — runs every 2 hours via launchd
# Zero LLM cost. Calls Google Trends API + RSS directly.
# Only alerts when NEW opportunities appear (deduped via tracker).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PYTRENDS_OUT="$SCRIPT_DIR/trending-pytrends.json"
SCAN_OUT="$SCRIPT_DIR/trending-latest.json"
ALERT_FILE="$SCRIPT_DIR/.trending-alert-pending"
SEEN_FILE="$SCRIPT_DIR/.trending-seen-topics"
LOG="/tmp/trending-poll.log"

# Only poll during daytime (7AM - 11PM IST)
HOUR=$(TZ=Asia/Calcutta date +%H)
if [ "$HOUR" -lt 7 ] || [ "$HOUR" -gt 22 ]; then
    exit 0
fi

cd "$PROJECT_DIR"

# Create seen file if missing
touch "$SEEN_FILE"

# Run pytrends (Google Trends API)
python3 "$SCRIPT_DIR/trending-pytrends.py" >> "$LOG" 2>&1

# Run Google Trends RSS scan
node "$SCRIPT_DIR/trending-scan.js" >> "$LOG" 2>&1

# Extract opportunity topics, dedupe against seen file
NEW_TOPICS=$(node -e "
const fs = require('fs');
const seen = new Set(fs.readFileSync('$SEEN_FILE','utf8').split('\n').map(s=>s.trim().toLowerCase()).filter(Boolean));
let topics = [];
try {
  const py = JSON.parse(fs.readFileSync('$PYTRENDS_OUT','utf8'));
  topics.push(...(py.opportunities||[]).map(o=>o.topic));
} catch(e) {}
try {
  const rss = JSON.parse(fs.readFileSync('$SCAN_OUT','utf8'));
  topics.push(...(rss.govtTrends||[]).filter(t=>!t.guideExists).map(t=>t.title));
} catch(e) {}
const fresh = topics.filter(t => !seen.has(t.toLowerCase().trim()));
// Dedupe within batch
const unique = [...new Set(fresh.map(t=>t.toLowerCase().trim()))];
unique.forEach(t => console.log(t));
")

NEW_COUNT=$(echo "$NEW_TOPICS" | grep -c '[a-z]' 2>/dev/null)
NEW_COUNT=${NEW_COUNT:-0}

if [ "$NEW_COUNT" -gt 0 ]; then
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[${TIMESTAMP}] 📈 $NEW_COUNT NEW trending opportunity/ies" >> "$LOG"
    echo "$NEW_TOPICS" >> "$LOG"
    
    # Add to seen file (persist across runs)
    echo "$NEW_TOPICS" >> "$SEEN_FILE"
    
    # Write alert for heartbeat
    echo "${TIMESTAMP}|new=${NEW_COUNT}" >> "$ALERT_FILE"
    # Also write the actual topics to a separate file for the LLM
    echo "$NEW_TOPICS" > "$SCRIPT_DIR/.trending-new-topics"
else
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[${TIMESTAMP}] ✅ No new opportunities (all seen before)" >> "$LOG"
fi

# Clean seen file weekly (keep last 200 entries to avoid stale blocking)
LINES=$(wc -l < "$SEEN_FILE")
if [ "$LINES" -gt 200 ]; then
    tail -100 "$SEEN_FILE" > "$SEEN_FILE.tmp" && mv "$SEEN_FILE.tmp" "$SEEN_FILE"
fi

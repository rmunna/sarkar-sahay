#!/bin/bash
# Quick URL audit — check if official links from guide frontmatter are reachable
# Checks only officialLinks (YAML frontmatter), not inline content links
cd /Users/rajakumar/.openclaw/workspace/sarkar-sahay

echo "=== CitizenNest URL Audit ==="
echo ""

TOTAL=0
OK=0
FAIL=0
FAILURES=""

# Extract officialLinks from all guides
for f in content/guides/*.md; do
  slug=$(basename "$f" .md)
  # Extract URLs from officialLinks array in frontmatter
  urls=$(sed -n '/^officialLinks:/,/^[a-zA-Z]/p' "$f" | grep -o 'https://[^"'"'"' ]*' | head -10)
  for url in $urls; do
    TOTAL=$((TOTAL + 1))
    # Quick HEAD check with 10s timeout
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 -A "Mozilla/5.0" "$url" 2>/dev/null)
    if [ "$status" -ge 200 ] && [ "$status" -lt 400 ]; then
      OK=$((OK + 1))
    else
      FAIL=$((FAIL + 1))
      FAILURES="$FAILURES\n❌ $status | $slug | $url"
    fi
  done
done

echo "Checked: $TOTAL URLs"
echo "✅ OK: $OK"
echo "❌ Failed: $FAIL"
echo ""
if [ -n "$FAILURES" ]; then
  echo "=== FAILURES ==="
  echo -e "$FAILURES"
fi

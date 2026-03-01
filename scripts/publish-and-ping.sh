#!/bin/bash
# Publish new content and ping search engines with exact URLs
# Usage: ./scripts/publish-and-ping.sh
# Automatically detects new/modified content files from git, commits, pushes,
# regenerates sitemap, and pings search engines with the exact new URLs.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SITE="https://www.citizennest.com"

cd "$PROJECT_DIR"

# Find new/modified content files
NEW_FILES=$(git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)
NEW_CONTENT=$(echo "$NEW_FILES" | grep -E "^content/(guides|updates)/" | grep "\.md$" || true)

if [ -z "$NEW_CONTENT" ]; then
    echo "No new content files to publish."
    exit 0
fi

# Build URL list
URLS=""
while IFS= read -r file; do
    [ -z "$file" ] && continue
    slug=$(basename "$file" .md)
    if echo "$file" | grep -q "content/updates/"; then
        url="$SITE/update/$slug"
    elif echo "$file" | grep -q "content/guides/"; then
        url="$SITE/guide/$slug"
    else
        continue
    fi
    URLS="$URLS $url"
    echo "📄 $url"
done <<< "$NEW_CONTENT"

COUNT=$(echo "$URLS" | wc -w | tr -d ' ')
echo ""
echo "Found $COUNT new pages to publish."

# Regenerate sitemap
echo "🗺️  Regenerating sitemap..."
npx tsx scripts/generate-sitemap.ts 2>/dev/null

# Git add, commit, push
echo "📦 Committing and pushing..."
git add -A
git commit -m "Publish $COUNT new pages + sitemap" 2>/dev/null || true
git push 2>/dev/null

# Ping search engines with exact URLs
echo ""
bash "$SCRIPT_DIR/ping-search-engines.sh" $URLS

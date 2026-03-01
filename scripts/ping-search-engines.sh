#!/bin/bash
# Ping search engines after publishing new pages
# Usage: ./scripts/ping-search-engines.sh [url1] [url2] ...
# If no URLs passed, pings sitemap only.

SITE="https://www.citizennest.com"
SITEMAP="$SITE/sitemap.xml"
INDEXNOW_KEY="0a27db7c4d814e6ebc070df3513d0d93"

echo "🔔 Pinging search engines..."

# 1. Google Sitemap Ping
echo "  → Google sitemap ping..."
curl -s "https://www.google.com/ping?sitemap=$SITEMAP" > /dev/null 2>&1
echo "    ✅ Google pinged"

# 2. IndexNow (Bing + Yandex + others)
if [ "$#" -gt 0 ]; then
    # Ping specific URLs
    URLS_JSON=$(printf '"%s",' "$@" | sed 's/,$//')
    echo "  → IndexNow: $# URLs..."
    curl -s -X POST "https://api.indexnow.org/indexnow" \
        -H "Content-Type: application/json" \
        -d "{
            \"host\": \"www.citizennest.com\",
            \"key\": \"$INDEXNOW_KEY\",
            \"keyLocation\": \"$SITE/$INDEXNOW_KEY.txt\",
            \"urlList\": [$URLS_JSON]
        }" > /dev/null 2>&1
    echo "    ✅ IndexNow pinged ($# URLs)"
else
    # Ping sitemap URL
    echo "  → IndexNow: sitemap..."
    curl -s "https://api.indexnow.org/indexnow?url=$SITEMAP&key=$INDEXNOW_KEY" > /dev/null 2>&1
    echo "    ✅ IndexNow pinged (sitemap)"
fi

# 3. Bing Sitemap Ping
echo "  → Bing sitemap ping..."
curl -s "https://www.bing.com/ping?sitemap=$SITEMAP" > /dev/null 2>&1
echo "    ✅ Bing pinged"

echo "✅ All search engines notified!"

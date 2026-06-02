#!/usr/bin/env python3
"""
CitizenNest Trending Scanner — Category-based approach
Monitors Google Trends RISING queries in:
  - Jobs (958) and Education (174) categories → exam/recruitment spikes
  - Government (17) category → trending citizen services and schemes

Usage: python3 agents/trending-pytrends.py
Output: agents/trending-pytrends.json
"""

import json
import os
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

try:
    from pytrends.request import TrendReq
except ImportError:
    print("❌ pytrends not installed. Run: pip3 install pytrends")
    sys.exit(1)

GUIDES_DIR = os.path.join(os.path.dirname(__file__), '..', 'content', 'guides')
UPDATES_DIR = os.path.join(os.path.dirname(__file__), '..', 'content', 'updates')
OUT_PATH = os.path.join(os.path.dirname(__file__), 'trending-pytrends.json')

# Spike patterns — indicate an imminent traffic event (result / admit card / answer key)
SPIKE_PATTERNS = [
    'result', 'results', 'admit card', 'answer key', 'cut off', 'cutoff',
    'merit list', 'scorecard', 'score card', 'counselling', 'counseling',
    'rank card', 'marksheet', 'final answer',
    'notification', 'vacancy', 'recruitment', 'apply online', 'last date',
    'registration', 'application form', 'exam date', 'schedule',
]

# Minimum rising value to be considered a spike opportunity
SPIKE_THRESHOLD = 200

# Categories to monitor
CATEGORIES = [
    (958, 'Jobs'),
    (174, 'Education'),
    (17,  'Government'),   # Citizen services, government schemes, portals
]

# Categories where a trending query signals a scheme/service (no Telegram post)
SCHEME_CATEGORIES = {'Government'}

# Skip patterns — stuff we don't create guides for
SKIP_PATTERNS = [
    'youtube', 'whatsapp', 'instagram', 'google', 'chatgpt', 'netflix',
    'hotstar', 'movie', 'song', 'video', 'cricket', 'ipl', 'match',
    'resume', 'compiler', 'github', 'java', 'python', 'chemistry',
    'physics', 'science project', 'blackpink', 'rashmika', 'age',
    'perplexity', 'indigo', 'gold rate', 'ucl', 'pw ',
    't20 world cup', 'hcl', 'flowchart',
]

# Citizen-relevant patterns — things we DO want
RELEVANT_PATTERNS = [
    # Exam / job
    'result', 'admit card', 'recruitment', 'vacancy', 'notification',
    'sarkari', 'exam', 'apply', 'login', 'status', 'download',
    'registration', 'form',
    'ssc', 'upsc', 'neet', 'jee', 'kvs', 'nvs', 'cbse', 'icai',
    'rbse', 'bser', 'ctet', 'rrb', 'ibps', 'sbi', 'rbi',
    'bpsc', 'uppsc', 'tnpsc', 'kpsc', 'mppsc', 'rpsc',
    'police', 'army', 'navy', 'itbp', 'crpf', 'bsf', 'cisf',
    'sainik', 'navodaya', 'kendriya', 'ignou', 'university',
    'deled', 'bed', 'nta', 'ugc', 'gate', 'cuet', 'clat',
    'uan', 'epf', 'pan card', 'aadhaar', 'passport', 'voter',
    'railway', 'fastag', 'msbte', 'dsssb',
    # Scheme / citizen service (Government category)
    'scheme', 'yojana', 'portal', 'ration', 'pension', 'scholarship',
    'loan', 'subsidy', 'electricity', 'pm kisan', 'pmkisan', 'kisan',
    'ayushman', 'ujjwala', 'mudra', 'pmay', 'awas', 'ujala',
    'jan dhan', 'jandhan', 'svamitva', 'ladli', 'kanya',
    'beneficiary', 'eligibility', 'list', 'ekyc', 'e-kyc',
]


def is_relevant(query):
    """Check if query is citizen-relevant and not noise."""
    lower = query.lower()
    if any(skip in lower for skip in SKIP_PATTERNS):
        return False
    return any(rel in lower for rel in RELEVANT_PATTERNS)


def is_spike(query, rising_value):
    """True if this query signals an imminent high-traffic event."""
    lower = query.lower()
    return rising_value >= SPIKE_THRESHOLD and any(p in lower for p in SPIKE_PATTERNS)


def check_guide_exists(topic):
    """Check if we have a guide or update matching this topic."""
    slug_words = [w for w in topic.lower().split() if len(w) > 2]
    skip_words = {
        '2024','2025','2026','2027','result','results','online','india',
        'apply','status','check','download','card','form','exam','test',
    }
    for d in [GUIDES_DIR, UPDATES_DIR]:
        if not os.path.exists(d):
            continue
        for f in os.listdir(d):
            if not f.endswith('.md'):
                continue
            name_words = set(f.replace('.md', '').lower().split('-'))
            meaningful_matches = [
                w for w in slug_words if w in name_words and w not in skip_words
            ]
            # Two-word match always counts — OR one highly-distinctive word (len>=5)
            # catches cases like "comedk results 2026" → only "comedk" is distinctive
            if len(meaningful_matches) >= 2:
                return f.replace('.md', '')
            if len(meaningful_matches) == 1 and len(meaningful_matches[0]) >= 5:
                return f.replace('.md', '')
    return None


def fetch_realtime_trends():
    """
    Fetch from Google Trends RSS feed — reliable public endpoint, no auth required.
    Works from GitHub Actions unlike the /api/realtimetrends endpoint (returns 404).

    URL: https://trends.google.com/trending/rss?geo=IN
    Returns top ~20 trending searches in India with approx traffic counts.
    """
    RSS_URL = "https://trends.google.com/trending/rss?geo=IN"
    # XML namespace used by Google Trends RSS
    NS = 'https://trends.google.com/trending/rss'

    results = []
    seen_titles = set()

    try:
        req = urllib.request.Request(RSS_URL, headers={
            'User-Agent': (
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            ),
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        })
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read()

        root = ET.fromstring(raw)
        items = root.findall('.//item')
        print(f"  🌐 Google Trends RSS India: {len(items)} trending items")

        for item in items:
            title_el = item.find('title')
            if title_el is None or not title_el.text:
                continue
            title = title_el.text.strip()

            if title.lower() in seen_titles:
                continue

            # Grab approx_traffic for scoring (e.g. "50,000+" → 50)
            traffic_el = item.find(f'{{{NS}}}approx_traffic')
            traffic_str = (traffic_el.text or '0') if traffic_el is not None else '0'
            # Convert "500,000+" or "2M+" to an integer
            traffic_clean = traffic_str.replace(',', '').replace('+', '').strip()
            if traffic_clean.endswith('M'):
                traffic_num = int(float(traffic_clean[:-1]) * 1_000_000)
            elif traffic_clean.endswith('K'):
                traffic_num = int(float(traffic_clean[:-1]) * 1_000)
            else:
                try:
                    traffic_num = int(traffic_clean)
                except ValueError:
                    traffic_num = 0

            # Collect related news headlines to broaden matching
            news_titles = [
                el.text.strip()
                for el in item.findall(f'{{{NS}}}news_item_title')
                if el.text
            ]
            combined = ' '.join([title] + news_titles[:3]).lower()

            # Apply relevance + skip filters
            if not is_relevant(title) and not is_relevant(combined):
                continue

            guide = check_guide_exists(title)
            spike = any(p in title.lower() for p in SPIKE_PATTERNS) or \
                    any(p in combined for p in SPIKE_PATTERNS)

            seen_titles.add(title.lower())
            # Scale traffic to a rising_value (cap at 999 for highest priority)
            rising_value = min(999, max(100, traffic_num // 1000))

            results.append({
                'topic': title,
                'category': 'Realtime RSS',
                'rising_value': rising_value,
                'guide_exists': guide,
                'is_spike': spike,
                'is_scheme': False,
                'source': 'realtime-rss',
            })

    except Exception as e:
        print(f"  ⚠️  Google Trends RSS failed: {e}", file=sys.stderr)

    return results


def main():
    pytrends = TrendReq(hl='en-IN', geo='IN')
    all_rising = []

    # ── Source 1: Google Trends RSS (same-day spikes, works in GitHub Actions) ─
    print("🌐 Fetching Google Trends RSS (trends.google.com/trending/rss?geo=IN)...")
    realtime = fetch_realtime_trends()
    all_rising.extend(realtime)
    print(f"   → {len(realtime)} relevant realtime topics\n")

    # ── Source 2: pytrends Rising Queries (7-day trend, catches upcoming exams) ─
    # NOTE: Using empty-string [''] approach for category-level trending.
    # GitHub Actions IPs are sometimes rate-limited; failures are silently skipped.
    print("📈 Fetching pytrends rising queries (7-day window)...")
    pytrends_got_data = False
    for cat_id, cat_name in CATEGORIES:
        try:
            pytrends.build_payload([''], geo='IN', timeframe='now 7-d', cat=cat_id)
            related = pytrends.related_queries()
            rising = related.get('', {}).get('rising', None)

            if rising is not None and not rising.empty:
                pytrends_got_data = True
                print(f"  📊 {cat_name}: {len(rising)} rising queries")
                for _, row in rising.iterrows():
                    query = row['query']
                    value = int(row['value'])
                    if is_relevant(query) and value >= 50:
                        guide = check_guide_exists(query)
                        all_rising.append({
                            'topic': query,
                            'category': cat_name,
                            'rising_value': value,
                            'guide_exists': guide,
                            'is_spike': is_spike(query, value),
                            'is_scheme': cat_name in SCHEME_CATEGORIES,
                        })
            else:
                print(f"  ⚠️  {cat_name}: no rising data (rate-limited or empty)")
            time.sleep(2)
        except Exception as e:
            print(f"  ⚠️  {cat_name} failed: {e}", file=sys.stderr)

    # ── Source 3: pytrends Today Searches fallback (if related_queries failed) ──
    # trending_searches() works when related_queries() is rate-blocked
    if not pytrends_got_data:
        print("📈 pytrends related_queries returned nothing — trying trending_searches()...")
        try:
            df = pytrends.trending_searches(pn='india')
            if df is not None and not df.empty:
                for query in df[0].tolist()[:30]:
                    if is_relevant(query):
                        guide = check_guide_exists(query)
                        spike = is_spike(query, SPIKE_THRESHOLD)
                        all_rising.append({
                            'topic': query,
                            'category': 'Trending India',
                            'rising_value': 150,  # unknown magnitude — use middle value
                            'guide_exists': guide,
                            'is_spike': spike,
                            'is_scheme': False,
                        })
                print(f"  ✅ trending_searches: {len(df)} queries fetched")
        except Exception as e:
            print(f"  ⚠️  trending_searches also failed: {e}", file=sys.stderr)

    # Deduplicate by topic
    seen = set()
    unique = []
    for item in all_rising:
        key = item['topic'].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(item)

    # Sort by rising value
    unique.sort(key=lambda x: x['rising_value'], reverse=True)

    # Print report
    print(f"\n📊 CitizenNest Category Trends — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    opportunities = [x for x in unique if not x['guide_exists']]
    covered = [x for x in unique if x['guide_exists']]

    if opportunities:
        print(f"🔴 OPPORTUNITIES ({len(opportunities)} trending topics, no guide):\n")
        for o in opportunities:
            print(f"  📈 {o['topic']} (rising: {o['rising_value']}, cat: {o['category']})")

    if covered:
        print(f"\n✅ COVERED ({len(covered)} trending topics with existing guides):\n")
        for c in covered:
            print(f"  ✅ {c['topic']} → {c['guide_exists']}")

    if not unique:
        print("  No relevant rising queries found.")

    # spike_candidates = exam/job only (Jobs + Education categories) — goes to Telegram via spike-detector
    spike_candidates = [
        x for x in unique
        if x.get('is_spike') and not x['guide_exists'] and not x.get('is_scheme')
    ]

    # scheme_opportunities = Government category trends without a guide — separate pipeline, NO Telegram
    scheme_opportunities = [
        x for x in unique
        if x.get('is_scheme') and not x['guide_exists']
    ]

    if spike_candidates:
        print(f"\n🚨 SPIKE CANDIDATES ({len(spike_candidates)} — exam/job, will post to Telegram):\n")
        for s in spike_candidates:
            print(f"  🔥 {s['topic']} (rising: {s['rising_value']}, cat: {s['category']})")

    if scheme_opportunities:
        print(f"\n🏛  SCHEME OPPORTUNITIES ({len(scheme_opportunities)} — Government cat, no guide yet):\n")
        for s in scheme_opportunities:
            print(f"  📋 {s['topic']} (rising: {s['rising_value']})")

    # Save JSON
    output = {
        'scannedAt': datetime.now().isoformat(),
        'results': unique,
        'opportunities': opportunities,
        'covered': covered,
        'spike_candidates': spike_candidates,        # exam/job only — triggers Telegram
        'scheme_opportunities': scheme_opportunities,  # Government cat — handled by scheme-detector
    }
    with open(OUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n💾 Saved to agents/trending-pytrends.json")


if __name__ == '__main__':
    main()

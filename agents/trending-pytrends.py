#!/usr/bin/env python3
"""
CitizenNest Trending Scanner — Category-based approach
Monitors Google Trends RISING queries in Jobs (958) and Education (174) categories.
Catches what's actually trending without needing hardcoded terms.

Usage: python3 agents/trending-pytrends.py
Output: agents/trending-pytrends.json
"""

import json
import os
import sys
import time
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
]

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
    'result', 'admit card', 'recruitment', 'vacancy', 'notification',
    'sarkari', 'exam', 'apply', 'login', 'status', 'download',
    'scheme', 'yojana', 'portal', 'registration', 'form',
    'ssc', 'upsc', 'neet', 'jee', 'kvs', 'nvs', 'cbse', 'icai',
    'rbse', 'bser', 'ctet', 'rrb', 'ibps', 'sbi', 'rbi',
    'bpsc', 'uppsc', 'tnpsc', 'kpsc', 'mppsc', 'rpsc',
    'police', 'army', 'navy', 'itbp', 'crpf', 'bsf', 'cisf',
    'sainik', 'navodaya', 'kendriya', 'ignou', 'university',
    'deled', 'bed', 'nta', 'ugc', 'gate', 'cuet', 'clat',
    'uan', 'epf', 'pan card', 'aadhaar', 'passport', 'voter',
    'ration', 'pension', 'scholarship', 'loan', 'subsidy',
    'railway', 'fastag', 'electricity', 'msbte', 'dsssb',
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
    for d in [GUIDES_DIR, UPDATES_DIR]:
        if not os.path.exists(d):
            continue
        for f in os.listdir(d):
            if not f.endswith('.md'):
                continue
            name_words = f.replace('.md', '').lower().split('-')
            # Require matching on meaningful words (not years/generic terms)
            skip_words = {'2024','2025','2026','2027','result','results','online','india','apply','status','check','download','card','form'}
            meaningful_matches = sum(1 for w in slug_words if w in name_words and w not in skip_words)
            if meaningful_matches >= 2:
                return f.replace('.md', '')
    return None


def main():
    pytrends = TrendReq(hl='en-IN', geo='IN')
    all_rising = []

    for cat_id, cat_name in CATEGORIES:
        try:
            pytrends.build_payload([''], geo='IN', timeframe='now 7-d', cat=cat_id)
            related = pytrends.related_queries()
            rising = related.get('', {}).get('rising', None)

            if rising is not None and not rising.empty:
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
                        })
            time.sleep(1)
        except Exception as e:
            print(f"⚠️  {cat_name} failed: {e}", file=sys.stderr)

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

    spike_candidates = [x for x in unique if x.get('is_spike') and not x['guide_exists']]

    if spike_candidates:
        print(f"\n🚨 SPIKE CANDIDATES ({len(spike_candidates)} — imminent traffic events):\n")
        for s in spike_candidates:
            print(f"  🔥 {s['topic']} (rising: {s['rising_value']}, cat: {s['category']})")

    # Save JSON
    output = {
        'scannedAt': datetime.now().isoformat(),
        'results': unique,
        'opportunities': opportunities,
        'covered': covered,
        'spike_candidates': spike_candidates,
    }
    with open(OUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n💾 Saved to agents/trending-pytrends.json")


if __name__ == '__main__':
    main()

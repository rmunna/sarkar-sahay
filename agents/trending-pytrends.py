#!/usr/bin/env python3
"""
CitizenNest Trending Topic Scanner using Google Trends (pytrends)
Checks search interest for government/citizen service topics in India.
Identifies rising topics we should create content for.

Usage: python3 agents/trending-pytrends.py
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
OUT_PATH = os.path.join(os.path.dirname(__file__), 'trending-pytrends.json')

# Topics to monitor — grouped in batches of 5 (pytrends limit)
TOPIC_BATCHES = [
    # Batch 1: Top schemes
    ['pm kisan status', 'ladli behna status', 'pm awas yojana list', 'ration card status', 'ayushman bharat card'],
    # Batch 2: Documents & services
    ['aadhaar card download', 'pan card apply online', 'passport apply online', 'voter id apply', 'driving licence apply'],
    # Batch 3: Finance
    ['income tax filing', 'gst return filing', 'epf withdrawal', 'credit score check', 'personal loan apply'],
    # Batch 4: Jobs & exams
    ['ssc cgl result', 'upsc result', 'neet result', 'sarkari naukri', 'admit card download'],
    # Batch 5: State schemes
    ['shakti card karnataka', 'gruha lakshmi karnataka', 'banglar yuva sathi', 'mahtari vandana', 'pm rahat scheme'],
    # Batch 6: Utilities
    ['fastag recharge', 'electricity bill online', 'water bill online', 'gas booking online', 'ration card apply'],
]

def check_guide_exists(topic):
    """Check if we have a guide matching this topic."""
    slug_words = topic.lower().split()
    files = os.listdir(GUIDES_DIR)
    for f in files:
        if not f.endswith('.md'):
            continue
        name = f.replace('.md', '').lower()
        name_words = name.split('-')
        # Check if at least 2 significant words match
        matches = sum(1 for w in slug_words if len(w) > 2 and w in name_words)
        if matches >= 2:
            return f.replace('.md', '')
    return None

def main():
    pytrends = TrendReq(hl='en-IN', geo='IN')
    
    results = []
    
    for i, batch in enumerate(TOPIC_BATCHES):
        try:
            pytrends.build_payload(batch, geo='IN', timeframe='now 7-d')
            df = pytrends.interest_over_time()
            
            if df.empty:
                continue
                
            for topic in batch:
                if topic in df.columns:
                    interest = int(df[topic].sum())
                    recent = int(df[topic].iloc[-3:].mean()) if len(df) >= 3 else 0
                    earlier = int(df[topic].iloc[:3].mean()) if len(df) >= 3 else 0
                    trend = 'rising' if recent > earlier * 1.3 else ('falling' if recent < earlier * 0.7 else 'stable')
                    guide = check_guide_exists(topic)
                    
                    results.append({
                        'topic': topic,
                        'interest_7d': interest,
                        'recent_avg': recent,
                        'earlier_avg': earlier,
                        'trend': trend,
                        'guide_exists': guide,
                    })
            
            time.sleep(1)  # Rate limit
        except Exception as e:
            print(f"⚠️  Batch {i+1} failed: {e}", file=sys.stderr)
            time.sleep(2)
    
    # Sort by interest
    results.sort(key=lambda x: x['interest_7d'], reverse=True)
    
    # Print report
    print(f"\n📊 CitizenNest Trending Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    print(f"{'Topic':<35} {'Interest':>8} {'Trend':>8} {'Guide':>10}")
    print('-' * 70)
    
    opportunities = []
    for r in results:
        status = '✅' if r['guide_exists'] else '❌'
        trend_emoji = '📈' if r['trend'] == 'rising' else ('📉' if r['trend'] == 'falling' else '➡️')
        print(f"  {r['topic']:<33} {r['interest_7d']:>8} {trend_emoji}{r['trend']:>7} {status:>6}")
        
        if not r['guide_exists'] and r['interest_7d'] > 100:
            opportunities.append(r)
    
    if opportunities:
        print(f"\n🔴 CONTENT OPPORTUNITIES ({len(opportunities)} topics with no guide):\n")
        for o in opportunities:
            print(f"  • {o['topic']} (interest: {o['interest_7d']}, {o['trend']})")
    else:
        print(f"\n✅ All high-interest topics have existing guides!")
    
    # Save JSON
    output = {
        'scannedAt': datetime.now().isoformat(),
        'results': results,
        'opportunities': opportunities,
    }
    with open(OUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Saved to agents/trending-pytrends.json")

if __name__ == '__main__':
    main()

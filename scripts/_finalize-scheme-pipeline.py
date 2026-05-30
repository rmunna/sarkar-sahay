#!/usr/bin/env python3
"""
Finalize scheme pipeline:
1. Add langs field to schemes that don't have it
2. Print a summary report
"""
import json, pathlib

HINDI_STATES = {"Central","Uttar Pradesh","Bihar","Madhya Pradesh","Rajasthan",
                "Haryana","Uttarakhand","Jharkhand","Chhattisgarh","Delhi"}

f = pathlib.Path("agents/scheme-pipeline-list.json")
d = json.loads(f.read_text())

fixed = 0
for s in d["schemes"]:
    if "langs" not in s:
        s["langs"] = ["en","hi"] if s.get("state","") in HINDI_STATES else ["en"]
        fixed += 1

f.write_text(json.dumps(d, indent=2, ensure_ascii=False))

# Summary
from collections import Counter
states = Counter(s["state"] for s in d["schemes"])
priorities = Counter(s.get("priority",3) for s in d["schemes"])
hi_count = sum(1 for s in d["schemes"] if "hi" in s.get("langs",[]))
en_only = sum(1 for s in d["schemes"] if s.get("langs",[]) == ["en"])
cats = Counter(s["category"] for s in d["schemes"])

print(f"\n{'='*50}")
print(f"SCHEME PIPELINE SUMMARY")
print(f"{'='*50}")
print(f"Total schemes: {len(d['schemes'])}")
print(f"langs field added to {fixed} schemes")
print(f"Hindi+English: {hi_count} schemes")
print(f"English only:  {en_only} schemes")
print(f"\nPriority breakdown:")
for p in sorted(priorities): print(f"  P{p}: {priorities[p]} schemes")
print(f"\nTop 10 states:")
for state,count in states.most_common(10): print(f"  {state}: {count}")
print(f"\nTop 10 categories:")
for cat,count in cats.most_common(10): print(f"  {cat}: {count}")
print(f"\nEstimated guide pages to generate:")
existing_guides = list(pathlib.Path("content/guides").glob("*.md"))
existing_slugs = {p.stem for p in existing_guides}
pending = [s for s in d["schemes"] if s["slug"] not in existing_slugs]
print(f"  Already generated: {len(d['schemes']) - len(pending)}")
print(f"  Pending EN guides: {len(pending)}")
pending_hi = [s for s in pending if "hi" in s.get("langs",[])]
print(f"  Pending HI guides: {len(pending_hi)}")
print(f"{'='*50}")

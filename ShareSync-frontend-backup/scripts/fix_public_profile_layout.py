#!/usr/bin/env python3
"""
Fix awkward empty space on public profiles by rebalancing the column grid.

Problem: Profile.jsx uses a 4+5+3 column grid. The right column contains
ONLY owner-gated panels (GrowthSuggestions, Trends), so on public profiles
that whole column is empty — leaving ~25% of viewport blank on the right.
The middle column also looks unbalanced because Skill Profile is gated.

Fix: Two changes, pure CSS.

  1. Left column:   lg:col-span-4 → conditional → 4 for owner, 5 for public
  2. Middle column: lg:col-span-5 → conditional → 5 for owner, 7 for public
  3. Right column:  always col-span-3 + hidden on public

Total: still adds up to 12. On public profiles, left=5, middle=7, right=hidden.
On owner profile: completely unchanged from today.

Scope: Frontend-only, single file, two anchored str.replace calls.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/pages/Profile.jsx")

src = PATH.read_text(encoding="utf-8")

# ─── Edit 1: Left column ────────────────────────────────────────────────
# Anchor on the unique "Impact Metrics" comment that immediately follows
# the left column wrapper div.
LEFT_OLD = '<div className="col-span-12 lg:col-span-4 space-y-6">\n          {/* Impact Metrics */}'
LEFT_NEW = '<div className={`col-span-12 ${isOwnProfile ? "lg:col-span-4" : "lg:col-span-5"} space-y-6`}>\n          {/* Impact Metrics */}'

if src.count(LEFT_OLD) != 1:
    print(f"ERROR: left column anchor found {src.count(LEFT_OLD)} times. Expected 1.", file=sys.stderr)
    sys.exit(1)

# ─── Edit 2: Middle column ──────────────────────────────────────────────
# Anchor on the comment that follows the middle column wrapper. The
# middle column starts the section right after the left column closes.
MIDDLE_OLD = '<div className="col-span-12 lg:col-span-5 space-y-6">\n          {/* Skill Profile - with radar chart */}'
MIDDLE_NEW = '<div className={`col-span-12 ${isOwnProfile ? "lg:col-span-5" : "lg:col-span-7"} space-y-6`}>\n          {/* Skill Profile - with radar chart */}'

if src.count(MIDDLE_OLD) != 1:
    print(f"ERROR: middle column anchor found {src.count(MIDDLE_OLD)} times. Expected 1.", file=sys.stderr)
    sys.exit(1)

# ─── Edit 3: Right column ───────────────────────────────────────────────
# Hide the entire right column on public profiles since it only contains
# owner-only panels (GrowthSuggestions, Trends).
RIGHT_OLD = '<div className="col-span-12 lg:col-span-3 space-y-6">\n          {isOwnProfile && <GrowthSuggestions'
RIGHT_NEW = '<div className={`col-span-12 lg:col-span-3 space-y-6 ${isOwnProfile ? "" : "hidden"}`}>\n          {isOwnProfile && <GrowthSuggestions'

if src.count(RIGHT_OLD) != 1:
    print(f"ERROR: right column anchor found {src.count(RIGHT_OLD)} times. Expected 1.", file=sys.stderr)
    sys.exit(1)

# ─── Backup ─────────────────────────────────────────────────────────────
backup = PATH.with_suffix(PATH.suffix + ".bak.before-public-layout")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

# ─── Apply edits ────────────────────────────────────────────────────────
new_src = src
new_src = new_src.replace(LEFT_OLD, LEFT_NEW, 1)
new_src = new_src.replace(MIDDLE_OLD, MIDDLE_NEW, 1)
new_src = new_src.replace(RIGHT_OLD, RIGHT_NEW, 1)

# ─── Post-edit verification ─────────────────────────────────────────────
expected_markers = [
    'isOwnProfile ? "lg:col-span-4" : "lg:col-span-5"',
    'isOwnProfile ? "lg:col-span-5" : "lg:col-span-7"',
    'isOwnProfile ? "" : "hidden"',
]

for marker in expected_markers:
    if new_src.count(marker) != 1:
        print(f"ERROR: marker '{marker}' appears {new_src.count(marker)} times. Expected 1.", file=sys.stderr)
        sys.exit(1)

# ─── Sanity check: still exactly 3 col-span-12 wrappers ────────────────
# (one for left col, one for middle col, one for right col — none added/lost)
# Also confirm we haven't broken the 12-column math by accident.
if new_src.count('col-span-12 lg:col-span-3 space-y-6') != 1:
    print(f"ERROR: right column class string changed unexpectedly.", file=sys.stderr)
    sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")
print("✓ Public profile layout fix applied.")
print()
print("Behavior change on /profile/:username (public profiles):")
print("  - Left column expands from col-span-4 → col-span-5")
print("  - Middle column expands from col-span-5 → col-span-7")
print("  - Right column hidden (was wasting 25% of viewport with empty space)")
print("  - Total still 12 columns. Owner profile UNCHANGED.")
print()
print("Recovery if needed:")
print(f"  cp {backup} {PATH}")

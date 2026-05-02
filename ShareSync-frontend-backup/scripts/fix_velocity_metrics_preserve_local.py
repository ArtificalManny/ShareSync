#!/usr/bin/env python3
"""
Preserve locally-calculated focus and efficiency in useHomeRealtime.

Bug: When /users/me/stats responds successfully, the merge into
lastGoodRef.current.summary overwrites focus and efficiency with 0
because the backend doesn't return those fields. This destroys the
values that were just computed by the local fallback calculator at
lines 99-144.

Fix: Add lastGoodRef.current.summary?.focus and ?.efficiency as
fallbacks BEFORE the final ?? 0, so locally-calculated values
survive the merge when the backend stays silent on these fields.

Two merge sites get the same fix:
  - Initial fetch (around line 803-808)
  - Polling refresh (around line 886-892)

Both blocks share an identical anchor — we use a unique surrounding
context to differentiate them.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/hooks/useHomeRealtime.js")

src = PATH.read_text(encoding="utf-8")

# ─────────────────────────────────────────────────────────────────────
# EDIT 1: Initial fetch merge block (around line 802-812)
# Anchored on the surrounding "Phase 4" comment for uniqueness.
# ─────────────────────────────────────────────────────────────────────
OLD_INITIAL = """      // ⭐ Phase 4: Merge real stats from /users/me/stats into summary
      if (statsRes.status === "fulfilled" && statsRes.value) {
        const stats = statsRes.value;
        const merged = {
          ...(lastGoodRef.current.summary || {}),
          ships: stats.ships ?? stats.weeklyShips ?? 0,
          streakDays: stats.streakDays ?? 0,
          focus: stats.focus ?? stats.completionRate ?? 0,
          efficiency: stats.efficiency ?? 0,
        };"""

NEW_INITIAL = """      // ⭐ Phase 4: Merge real stats from /users/me/stats into summary
      // Note: focus/efficiency fall back to locally-calculated values
      // (computed in deriveSummaryFromActivities) when backend omits them.
      if (statsRes.status === "fulfilled" && statsRes.value) {
        const stats = statsRes.value;
        const merged = {
          ...(lastGoodRef.current.summary || {}),
          ships: stats.ships ?? stats.weeklyShips ?? 0,
          streakDays: stats.streakDays ?? 0,
          focus: stats.focus ?? stats.completionRate ?? lastGoodRef.current.summary?.focus ?? 0,
          efficiency: stats.efficiency ?? lastGoodRef.current.summary?.efficiency ?? 0,
        };"""

# ─────────────────────────────────────────────────────────────────────
# EDIT 2: Polling merge block (around line 886-892)
# Anchored on the surrounding setInterval + fetchUserStats context.
# ─────────────────────────────────────────────────────────────────────
OLD_POLLING = """    pollingRef.current.summary = setInterval(async () => {
      try {
        const stats = await fetchUserStats();
        if (stats) {
          const merged = {
            ...(lastGoodRef.current.summary || {}),
            ships: stats.ships ?? stats.weeklyShips ?? 0,
            streakDays: stats.streakDays ?? 0,
            focus: stats.focus ?? stats.completionRate ?? 0,
            efficiency: stats.efficiency ?? 0,
          };"""

NEW_POLLING = """    pollingRef.current.summary = setInterval(async () => {
      try {
        const stats = await fetchUserStats();
        if (stats) {
          const merged = {
            ...(lastGoodRef.current.summary || {}),
            ships: stats.ships ?? stats.weeklyShips ?? 0,
            streakDays: stats.streakDays ?? 0,
            focus: stats.focus ?? stats.completionRate ?? lastGoodRef.current.summary?.focus ?? 0,
            efficiency: stats.efficiency ?? lastGoodRef.current.summary?.efficiency ?? 0,
          };"""

# ─────────────────────────────────────────────────────────────────────
# PRE-EDIT SAFETY: Both anchors must match exactly once
# ─────────────────────────────────────────────────────────────────────
checks = [
    ("OLD_INITIAL", OLD_INITIAL, 1),
    ("OLD_POLLING", OLD_POLLING, 1),
]

for name, anchor, expected in checks:
    actual = src.count(anchor)
    if actual != expected:
        print(f"ERROR: {name} found {actual} times, expected {expected}.", file=sys.stderr)
        print(f"File may have changed since last diagnostic.", file=sys.stderr)
        print(f"Run: grep -n 'focus: stats.focus' {PATH}", file=sys.stderr)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# BACKUP BEFORE MUTATION
# ─────────────────────────────────────────────────────────────────────
backup = PATH.with_suffix(PATH.suffix + ".bak.before-velocity-metrics-fix")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

# ─────────────────────────────────────────────────────────────────────
# APPLY BOTH EDITS ON THE SAME IN-MEMORY STRING
# ─────────────────────────────────────────────────────────────────────
new_src = src
new_src = new_src.replace(OLD_INITIAL, NEW_INITIAL, 1)
new_src = new_src.replace(OLD_POLLING, NEW_POLLING, 1)

# ─────────────────────────────────────────────────────────────────────
# POST-EDIT VERIFICATION: New marker should appear exactly twice
# (once per merge block).
# ─────────────────────────────────────────────────────────────────────
verifications = [
    # The new fallback chain
    ("lastGoodRef.current.summary?.focus ?? 0", 2),
    ("lastGoodRef.current.summary?.efficiency ?? 0", 2),
    # The old broken pattern should be gone
    ("focus: stats.focus ?? stats.completionRate ?? 0,", 0),
    ("efficiency: stats.efficiency ?? 0,", 0),
]

for marker, expected in verifications:
    actual = new_src.count(marker)
    if actual != expected:
        print(f"ERROR: marker '{marker}' appears {actual} times after edit. Expected {expected}.", file=sys.stderr)
        print(f"NOT writing file. Backup intact at: {backup}", file=sys.stderr)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# WRITE ONCE
# ─────────────────────────────────────────────────────────────────────
PATH.write_text(new_src, encoding="utf-8")

print("✓ Velocity Metrics fix applied to useHomeRealtime.js")
print()
print("What changed:")
print("  - Both stats merge blocks (initial fetch + 30s polling)")
print("  - focus and efficiency now fall back to locally-calculated values")
print("    when /users/me/stats omits those fields, instead of zeroing out.")
print()
print("Expected behavior after fix:")
print("  - Ships and Streak: unchanged (these were already working)")
print("  - Focus: shows non-zero % based on activity types in last 7d")
print("  - Efficiency: shows +/-% based on ships this week vs last week")
print()
print("Vite HMR will auto-reload. Hard refresh the browser (Cmd+Shift+R)")
print("on http://localhost:54693/home to see updated values.")
print()
print(f"Recovery if needed:")
print(f"  cp {backup} {PATH}")

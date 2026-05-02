#!/usr/bin/env python3
"""
Hide Focus and Efficiency StatCards in Velocity Metrics until backend
activity endpoints are fixed.

Both metrics depend on activities array being populated by useHomeRealtime,
but the hook's source endpoints (/api/activities, /api/activity,
/api/user/activities) all 404 in this environment. Until the data
pipeline is fixed, showing 0% / +0% is misleading. Better to show only
the two metrics that work (Ships, Streak).

Future: when backend activity endpoint is fixed, restore via the
.bak.before-hide-broken-metrics file.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/pages/Home.jsx")

src = PATH.read_text(encoding="utf-8")

OLD = """              <div className="home-stat-grid grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Ships"
                  value={summary?.ships || 0}
                  color={
                    isFireMode
                      ? "text-orange-500"
                      : "text-violet-600 dark:text-violet-400"
                  }
                  description="Total validated deployments in the last 7 days."
                />
                <StatCard
                  label="Streak"
                  value={`${summary?.streakDays || 0}D`}
                  color="text-amber-600 dark:text-amber-500"
                  description="Current streak of active days."
                />
                <StatCard
                  label="Focus"
                  value={`${summary?.focus || 0}%`}
                  color="text-teal-600 dark:text-teal-400"
                  description="Focus estimate based on activity types."
                />
                <StatCard
                  label="Efficiency"
                  value={`${summary?.efficiency >= 0 ? "+" : ""}${summary?.efficiency || 0}%`}
                  color={
                    isFireMode
                      ? "text-orange-500"
                      : "text-violet-600 dark:text-violet-400"
                  }
                  description="Change vs previous period."
                />
              </div>"""

NEW = """              <div className="home-stat-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Ships"
                  value={summary?.ships || 0}
                  color={
                    isFireMode
                      ? "text-orange-500"
                      : "text-violet-600 dark:text-violet-400"
                  }
                  description="Total validated deployments in the last 7 days."
                />
                <StatCard
                  label="Streak"
                  value={`${summary?.streakDays || 0}D`}
                  color="text-amber-600 dark:text-amber-500"
                  description="Current streak of active days."
                />
                {/* Focus and Efficiency hidden 2026-04-30: dependent on
                    activities pipeline that's currently 404'ing in
                    useHomeRealtime. Restore when backend activity endpoint
                    is wired up. See dev journal entry of 2026-04-30. */}
              </div>"""

if src.count(OLD) != 1:
    print(f"ERROR: anchor matched {src.count(OLD)} times, expected 1.", file=sys.stderr)
    sys.exit(1)

backup = PATH.with_suffix(PATH.suffix + ".bak.before-hide-broken-metrics")
backup.write_text(src, encoding="utf-8")
print(f"Backup: {backup}")

new_src = src.replace(OLD, NEW, 1)

verifications = [
    ('label="Ships"', 1),
    ('label="Streak"', 1),
    ('label="Focus"', 0),
    ('label="Efficiency"', 0),
    ('grid-cols-1 md:grid-cols-2', 1),
]

for marker, expected in verifications:
    actual = new_src.count(marker)
    if actual != expected:
        print(f"ERROR: '{marker}' appears {actual} times, expected {expected}.", file=sys.stderr)
        sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")
print("✓ Focus and Efficiency StatCards hidden. Grid is now 2 columns.")
print()
print("Hard refresh browser (Cmd+Shift+R).")
print(f"Recovery: cp {backup} {PATH}")

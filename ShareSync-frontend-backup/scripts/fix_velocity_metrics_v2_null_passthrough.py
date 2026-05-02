#!/usr/bin/env python3
"""
Make focus/efficiency merge use null instead of 0, so the existing
computedSummary fallback to computeSummaryFromActivities can activate.

Previous fix tried to chain through lastGoodRef.current.summary?.focus
but that locks in 0 once any merge runs (?? doesn't fall through on 0).

Real fix: end the chain with null, not 0. Then summaryRaw.focus is null
when backend omits the field, which lets computedSummary's existing
`focus ?? fallback.focus` fall through to the local calculator.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/hooks/useHomeRealtime.js")

src = PATH.read_text(encoding="utf-8")

OLD_INITIAL = """          focus: stats.focus ?? stats.completionRate ?? lastGoodRef.current.summary?.focus ?? 0,
          efficiency: stats.efficiency ?? lastGoodRef.current.summary?.efficiency ?? 0,
        };
        lastGoodRef.current.summary = merged;
        safeSet(setSummaryRaw, merged);
        anySuccess = true;"""

NEW_INITIAL = """          focus: stats.focus ?? stats.completionRate ?? null,
          efficiency: stats.efficiency ?? null,
        };
        lastGoodRef.current.summary = merged;
        safeSet(setSummaryRaw, merged);
        anySuccess = true;"""

OLD_POLLING = """            focus: stats.focus ?? stats.completionRate ?? lastGoodRef.current.summary?.focus ?? 0,
            efficiency: stats.efficiency ?? lastGoodRef.current.summary?.efficiency ?? 0,
          };
          lastGoodRef.current.summary = merged;
          safeSet(setSummaryRaw, merged);
        }
        safeSet(setIsConnected, true);"""

NEW_POLLING = """            focus: stats.focus ?? stats.completionRate ?? null,
            efficiency: stats.efficiency ?? null,
          };
          lastGoodRef.current.summary = merged;
          safeSet(setSummaryRaw, merged);
        }
        safeSet(setIsConnected, true);"""

# Pre-edit safety
checks = [("OLD_INITIAL", OLD_INITIAL, 1), ("OLD_POLLING", OLD_POLLING, 1)]
for name, anchor, expected in checks:
    actual = src.count(anchor)
    if actual != expected:
        print(f"ERROR: {name} found {actual} times, expected {expected}.", file=sys.stderr)
        print(f"File state has changed — restore from .bak.before-velocity-metrics-fix and retry.", file=sys.stderr)
        sys.exit(1)

# Backup before mutation
backup = PATH.with_suffix(PATH.suffix + ".bak.before-velocity-metrics-v2")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

new_src = src
new_src = new_src.replace(OLD_INITIAL, NEW_INITIAL, 1)
new_src = new_src.replace(OLD_POLLING, NEW_POLLING, 1)

# Post-edit verification
verifications = [
    ("focus: stats.focus ?? stats.completionRate ?? null,", 2),
    ("efficiency: stats.efficiency ?? null,", 2),
    ("lastGoodRef.current.summary?.focus ?? 0", 0),
    ("lastGoodRef.current.summary?.efficiency ?? 0", 0),
]
for marker, expected in verifications:
    actual = new_src.count(marker)
    if actual != expected:
        print(f"ERROR: marker '{marker}' appears {actual} times, expected {expected}.", file=sys.stderr)
        sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")

print("✓ Velocity Metrics v2 fix applied.")
print()
print("Behavior:")
print("  When /users/me/stats omits focus/efficiency, summaryRaw stores null")
print("  (not 0). This lets computedSummary's existing fallback chain at")
print("  line 991 fall through to computeSummaryFromActivities(activities).")
print()
print("Hard refresh browser (Cmd+Shift+R) on http://localhost:54693/home.")
print()
print(f"Recovery: cp {backup} {PATH}")

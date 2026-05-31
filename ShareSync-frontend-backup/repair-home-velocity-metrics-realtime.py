from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-velocity-metrics-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# 1) Ensure useEffect is imported from React.
react_import_pattern = re.compile(
    r'import\s+React\s*,\s*\{([^}]*)\}\s*from\s*([\'"])react\2\s*;'
)

match = react_import_pattern.search(text)
if not match:
    raise RuntimeError("Could not find React named import. No changes written.")

hooks = [h.strip() for h in match.group(1).split(",") if h.strip()]
if "useEffect" not in hooks:
    hooks.append("useEffect")

ordered = []
for h in ["useState", "useCallback", "useMemo", "useEffect"]:
    if h in hooks:
        ordered.append(h)

for h in hooks:
    if h not in ordered:
        ordered.append(h)

new_import = f'import React, {{ {", ".join(ordered)} }} from "react";'
text = text[:match.start()] + new_import + text[match.end():]

# 2) Add resilient metric helper functions.
helpers = r'''
/* ───────────────────────────────────────────────────────────────────────────
   HOME VELOCITY METRIC RESOLVERS
   Keeps Ships/Streaks stable across useHomeRealtime + analytics payload shapes.
─────────────────────────────────────────────────────────────────────────── */
function unwrapHomeMetricPayload(payload) {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

function readHomeCountMetric(...candidates) {
  const numbers = candidates
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const positive = numbers.find((value) => value > 0);
  if (Number.isFinite(positive)) return positive;

  return numbers.length ? numbers[0] : 0;
}

function readHomeTrendMetric(...candidates) {
  const numbers = candidates
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const nonZero = numbers.find((value) => value !== 0);
  if (Number.isFinite(nonZero)) return nonZero;

  return numbers.length ? numbers[0] : 0;
}

'''

if "function unwrapHomeMetricPayload(payload)" not in text:
    marker = "/* ───────────────────────────────────────────────────────────────────────────\n   STAT CARD"
    if marker not in text:
        raise RuntimeError("Could not find StatCard insertion marker. No changes written.")
    text = text.replace(marker, helpers + marker, 1)

# 3) Add realtime refresh listeners and computed velocityMetrics.
insert_block = r'''
  // Keeps Velocity Metrics fresh after local task/ship events, tab focus, and browser visibility changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let refreshTimer = null;

    const requestVelocityRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);

      refreshTimer = window.setTimeout(() => {
        refreshAll?.();
      }, 250);
    };

    const events = [
      "local-ship",
      "task:completed",
      "taskCompleted",
      "taskUpdated",
      "task:update",
      "projectCompleted",
      "project.completed",
      "project:lifecycle-updated",
      "activity:created",
      "openshare:activity-created",
      "openshare:stats-refresh",
      "focus:move-completed",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, requestVelocityRefresh);
    });

    const handleVisibilityChange = () => {
      if (!document.hidden) requestVelocityRefresh();
    };

    window.addEventListener("focus", requestVelocityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollingTimer = window.setInterval(requestVelocityRefresh, 30000);

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      window.clearInterval(pollingTimer);

      events.forEach((eventName) => {
        window.removeEventListener(eventName, requestVelocityRefresh);
      });

      window.removeEventListener("focus", requestVelocityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAll]);

  const velocityMetrics = useMemo(() => {
    const summaryData = unwrapHomeMetricPayload(summary);
    const analyticsData = unwrapHomeMetricPayload(dashboardStats);
    const streakData = unwrapHomeMetricPayload(streakComparison);

    const ships = readHomeCountMetric(
      summaryData.ships,
      summaryData.totalShips,
      summaryData.shipCount,
      summaryData.shippedCount,
      summaryData.tasksCompleted,
      summaryData.completedTasks,
      summaryData.weeklyShips,
      summaryData.shipsThisWeek,
      summaryData.shippedThisWeek,
      analyticsData.ships,
      analyticsData.totalShips,
      analyticsData.shipCount,
      analyticsData.shippedCount,
      analyticsData.tasksCompleted,
      analyticsData.completedTasks,
      analyticsData.weeklyShips,
      analyticsData.shipsThisWeek,
      analyticsData.shippedThisWeek
    );

    const streakDays = readHomeCountMetric(
      summaryData.streakDays,
      summaryData.currentStreak,
      summaryData.streak,
      summaryData.streak?.current,
      summaryData.streak?.currentStreak,
      analyticsData.streakDays,
      analyticsData.currentStreak,
      analyticsData.streak,
      analyticsData.streak?.current,
      analyticsData.streak?.currentStreak,
      streakData.userStreakDays,
      streakData.currentStreak,
      streakData.streakDays
    );

    const focus = readHomeCountMetric(
      summaryData.focus,
      summaryData.focusScore,
      analyticsData.focus,
      analyticsData.focusScore
    );

    const efficiency = readHomeTrendMetric(
      summaryData.efficiency,
      summaryData.efficiencyDelta,
      summaryData.trend,
      analyticsData.efficiency,
      analyticsData.efficiencyDelta,
      analyticsData.trend
    );

    return {
      ships,
      streakDays,
      focus,
      efficiency,
    };
  }, [summary, dashboardStats, streakComparison]);

'''

if "const velocityMetrics = useMemo(() =>" not in text:
    marker = "  return (\n    <div "
    if marker not in text:
        raise RuntimeError("Could not find Home return marker. No changes written.")
    text = text.replace(marker, insert_block + "\n" + marker, 1)

# 4) Point Velocity Metrics cards at the centralized values.
replacements = {
    "value={summary?.ships || 0}": "value={velocityMetrics.ships}",
    "value={`${summary?.streakDays || 0}D`}": "value={`${velocityMetrics.streakDays}D`}",
    "value={`${summary?.focus || 0}%`}": "value={`${velocityMetrics.focus}%`}",
    "value={`${summary?.efficiency >= 0 ? \"+\" : \"\"}${summary?.efficiency || 0}%`}": "value={`${velocityMetrics.efficiency >= 0 ? \"+\" : \"\"}${velocityMetrics.efficiency}%`}",
}

for old, new in replacements.items():
    if old in text:
        text = text.replace(old, new, 1)
    else:
        print(f"Warning: could not find exact card value pattern: {old}")

# 5) Safety checks.
bad_patterns = [
    "useEffect, useEffect",
    "const velocityMetrics = useMemo(() => {\n  const velocityMetrics",
    "onClick={() =",
    "className==",
]

for bad in bad_patterns:
    if bad in text:
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe pattern detected: {bad}. Original restored.")

required = [
    "function unwrapHomeMetricPayload(payload)",
    "const velocityMetrics = useMemo(() =>",
    "value={velocityMetrics.ships}",
    "value={`${velocityMetrics.streakDays}D`}",
    "openshare:stats-refresh",
]

missing = [item for item in required if item not in text]
if missing:
    shutil.copy2(backup, path)
    raise RuntimeError(f"Patch verification failed. Missing: {missing}. Original restored.")

path.write_text(text)

print("Home Velocity Metrics realtime patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added resilient Ships/Streaks metric resolvers")
print("- Wired Velocity Metrics cards to centralized resolved values")
print("- Added refresh listeners for ship/task/activity events")
print("- Added 30-second fallback polling while Home is mounted")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No mission card, focus engine, or streak comparison logic changed.")

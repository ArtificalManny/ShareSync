from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-velocity-metrics-v2-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# 1) Add useEffect to React import.
react_import = re.search(r'import React,\s*\{([^}]*)\}\s*from\s*["\']react["\'];', text)

if not react_import:
    raise RuntimeError("Could not find React import. No changes written.")

hooks = [h.strip() for h in react_import.group(1).split(",") if h.strip()]

if "useEffect" not in hooks:
    hooks.append("useEffect")

preferred_order = ["useState", "useCallback", "useMemo", "useEffect"]
ordered_hooks = [h for h in preferred_order if h in hooks] + [
    h for h in hooks if h not in preferred_order
]

new_react_import = f'import React, {{ {", ".join(ordered_hooks)} }} from "react";'
text = text[:react_import.start()] + new_react_import + text[react_import.end():]

# 2) Add metric resolver helpers above StatCard.
helpers = r'''
/* ───────────────────────────────────────────────────────────────────────────
   HOME VELOCITY METRIC RESOLVERS
   Reads Ships/Streaks from multiple possible live payload shapes.
─────────────────────────────────────────────────────────────────────────── */
function unwrapHomeMetricPayload(payload) {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

function readHomeCountMetric(...values) {
  const numbers = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const positive = numbers.find((value) => value > 0);
  if (Number.isFinite(positive)) return positive;

  return numbers.length ? numbers[0] : 0;
}

function readHomeTrendMetric(...values) {
  const numbers = values
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
        raise RuntimeError("Could not find StatCard marker. No changes written.")
    text = text.replace(marker, helpers + marker, 1)

# 3) Insert velocityMetrics + realtime refresh after useHomeRealtime().
insert_block = r'''
  const velocityMetrics = useMemo(() => {
    const summaryData = unwrapHomeMetricPayload(summary);
    const analyticsData = unwrapHomeMetricPayload(dashboardStats);
    const streakData = unwrapHomeMetricPayload(streakComparison);
    const shippedData = unwrapHomeMetricPayload(shippedStats);

    const ships = readHomeCountMetric(
      summaryData.ships,
      summaryData.totalShips,
      summaryData.shipCount,
      summaryData.shippedCount,
      summaryData.weeklyShips,
      summaryData.shipsThisWeek,
      summaryData.shippedThisWeek,
      summaryData.tasksCompleted,
      summaryData.completedTasks,
      analyticsData.ships,
      analyticsData.totalShips,
      analyticsData.shipCount,
      analyticsData.shippedCount,
      analyticsData.weeklyShips,
      analyticsData.shipsThisWeek,
      analyticsData.shippedThisWeek,
      analyticsData.tasksCompleted,
      analyticsData.completedTasks,
      shippedData.tasksCompleted
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
  }, [summary, dashboardStats, streakComparison, shippedStats]);

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

'''

if "const velocityMetrics = useMemo(() =>" not in text:
    marker = "  // Entrance highlight"
    if marker not in text:
        raise RuntimeError("Could not find insertion point after useHomeRealtime. No changes written.")
    text = text.replace(marker, insert_block + "\n" + marker, 1)

# 4) Replace Velocity Metrics card values.
patterns = [
    (
        r'value=\{summary\?\.ships\s*\|\|\s*0\}',
        'value={velocityMetrics.ships}',
        "Ships"
    ),
    (
        r'value=\{`\$\{summary\?\.streakDays\s*\|\|\s*0\}D`\}',
        'value={`${velocityMetrics.streakDays}D`}',
        "Streak"
    ),
    (
        r'value=\{`\$\{summary\?\.focus\s*\|\|\s*0\}%`\}',
        'value={`${velocityMetrics.focus}%`}',
        "Focus"
    ),
    (
        r'value=\{`\$\{summary\?\.efficiency\s*>=\s*0\s*\?\s*"\+"\s*:\s*""\}\$\{summary\?\.efficiency\s*\|\|\s*0\}%`\}',
        'value={`${velocityMetrics.efficiency >= 0 ? "+" : ""}${velocityMetrics.efficiency}%`}',
        "Efficiency"
    ),
]

changed = []

for pattern, replacement, label in patterns:
    text, count = re.subn(pattern, replacement, text, count=1)
    if count:
        changed.append(label)

required = [
    "useEffect",
    "function unwrapHomeMetricPayload(payload)",
    "const velocityMetrics = useMemo(() =>",
    "openshare:stats-refresh",
    "value={velocityMetrics.ships}",
    "value={`${velocityMetrics.streakDays}D`}",
]

missing = [item for item in required if item not in text]

if missing:
    shutil.copy2(backup, path)
    raise RuntimeError(f"Patch verification failed. Missing: {missing}. Original restored.")

path.write_text(text)

print("Home Velocity Metrics realtime patch v2 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed cards:")
for label in changed:
    print(f"- {label}")
print("")
print("Changed only:")
print("- Added useEffect import")
print("- Added resilient Ships/Streaks metric resolvers")
print("- Wired Velocity Metrics cards to velocityMetrics")
print("- Added realtime refresh listeners and 30-second fallback polling")
print("")
print("No backend files touched.")
print("No mission card, focus engine, or streak comparison logic changed.")

from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/hooks/useHomeRealtime.js")

if not path.exists():
    raise FileNotFoundError("Could not find src/hooks/useHomeRealtime.js")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-velocity-events-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# 1) Make local-ship immediately update velocity summary, then refetch backend truth.
old_local_ship_tail = '''      safeSet(setActivitiesRaw, (prev) => [synthetic, ...(Array.isArray(prev) ? prev : [])]);
      lastGoodRef.current.activities = [synthetic, ...(Array.isArray(lastGoodRef.current.activities) ? lastGoodRef.current.activities : [])];
      safeSet(setIsConnected, true);
    };'''

new_local_ship_tail = '''      safeSet(setActivitiesRaw, (prev) => [synthetic, ...(Array.isArray(prev) ? prev : [])]);
      lastGoodRef.current.activities = [synthetic, ...(Array.isArray(lastGoodRef.current.activities) ? lastGoodRef.current.activities : [])];

      // Optimistic velocity bump so Home updates immediately.
      // Backend stats refetch below will correct the value if needed.
      safeSet(setSummaryRaw, (prev) => {
        const base = prev || lastGoodRef.current.summary || {};
        const currentShips = firstFiniteNumber(
          base.ships,
          base.totalShips,
          base.shipCount,
          base.weeklyShips,
          0
        );

        const currentWeeklyShips = firstFiniteNumber(
          base.weeklyShips,
          base.shipsThisWeek,
          base.shippedThisWeek,
          0
        );

        const next = {
          ...base,
          ships: currentShips + 1,
          totalShips: firstFiniteNumber(base.totalShips, base.ships, 0) + 1,
          shipCount: firstFiniteNumber(base.shipCount, base.ships, 0) + 1,
          weeklyShips: currentWeeklyShips + 1,
          shipsThisWeek: currentWeeklyShips + 1,
          shippedThisWeek: currentWeeklyShips + 1,
          updatedAt: new Date().toISOString(),
        };

        lastGoodRef.current.summary = next;
        return next;
      });

      scheduleVelocityRefresh(250);
      safeSet(setIsConnected, true);
    };'''

if old_local_ship_tail not in text:
    raise RuntimeError("Could not find local-ship handler tail. No changes written.")

text = text.replace(old_local_ship_tail, new_local_ship_tail, 1)

# 2) Replace narrow window listeners with broader event coverage.
old_listener_block = '''    window.addEventListener("local-ship", onLocalShip);
    window.addEventListener("task.completed", onVelocityChanged);
    window.addEventListener("project.completed", onVelocityChanged);
    window.addEventListener("project:lifecycle-updated", onVelocityChanged);
    
    return () => {
      window.removeEventListener("local-ship", onLocalShip);
      window.removeEventListener("task.completed", onVelocityChanged);
      window.removeEventListener("project.completed", onVelocityChanged);
      window.removeEventListener("project:lifecycle-updated", onVelocityChanged);
    };'''

new_listener_block = '''    const velocityEvents = [
      "task.completed",
      "task:completed",
      "taskCompleted",
      "task.updated",
      "task:updated",
      "taskUpdated",
      "activity.created",
      "activity:created",
      "activityCreated",
      "openshare:activity-created",
      "openshare:stats-refresh",
      "project.completed",
      "projectCompleted",
      "project:lifecycle-updated",
      "local-ship-refresh",
    ];

    window.addEventListener("local-ship", onLocalShip);
    velocityEvents.forEach((eventName) => {
      window.addEventListener(eventName, onVelocityChanged);
    });

    return () => {
      window.removeEventListener("local-ship", onLocalShip);
      velocityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onVelocityChanged);
      });
    };'''

if old_listener_block not in text:
    raise RuntimeError("Could not find existing velocity window listener block. No changes written.")

text = text.replace(old_listener_block, new_listener_block, 1)

# 3) Preserve backend metric fields inside computedSummary instead of returning only 4 values.
old_computed_summary_return = '''      return {
        ships: ships ?? fallback.ships,
        streakDays: streakDays ?? fallback.streakDays,
        focus: focus ?? fallback.focus,
        efficiency: efficiency ?? fallback.efficiency,
      };'''

new_computed_summary_return = '''      return {
        ...summaryRaw,
        ships: ships ?? fallback.ships,
        streakDays: streakDays ?? fallback.streakDays,
        focus: focus ?? fallback.focus,
        efficiency: efficiency ?? fallback.efficiency,
        weeklyShips: summaryRaw.weeklyShips ?? summaryRaw.shipsThisWeek ?? summaryRaw.shippedThisWeek ?? fallback.ships,
        activeDaysThisWeek: summaryRaw.activeDaysThisWeek ?? summaryRaw.daysActiveThisWeek ?? fallback.streakDays,
        lastWeekShips: summaryRaw.lastWeekShips ?? summaryRaw.shipsLastWeek ?? 0,
      };'''

if old_computed_summary_return not in text:
    raise RuntimeError("Could not find computedSummary return block. No changes written.")

text = text.replace(old_computed_summary_return, new_computed_summary_return, 1)

# 4) Add debug helpers before the hook return.
debug_block = '''  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.__debugHomeVelocity = () => {
      const payload = {
        summaryRaw,
        computedSummary,
        lastGoodSummary: lastGoodRef.current.summary,
        shippedStats,
        streakComparison,
      };

      console.table({
        ships: computedSummary?.ships,
        streakDays: computedSummary?.streakDays,
        weeklyShips: computedSummary?.weeklyShips,
        activeDaysThisWeek: computedSummary?.activeDaysThisWeek,
        lastWeekShips: computedSummary?.lastWeekShips,
      });

      console.log("[Home Velocity Debug]", payload);
      return payload;
    };

    window.__refreshHomeVelocity = () => refreshVelocitySummary();

    return () => {
      delete window.__debugHomeVelocity;
      delete window.__refreshHomeVelocity;
    };
  }, [summaryRaw, computedSummary, shippedStats, streakComparison, refreshVelocitySummary]);

'''

return_marker = '''  return {
    loadingMissions,'''

if "__debugHomeVelocity" not in text:
    if return_marker not in text:
        raise RuntimeError("Could not find final return block. No changes written.")
    text = text.replace(return_marker, debug_block + return_marker, 1)

required = [
    "scheduleVelocityRefresh(250);",
    "openshare:stats-refresh",
    "task:completed",
    "...summaryRaw",
    "window.__debugHomeVelocity",
    "window.__refreshHomeVelocity",
]

missing = [item for item in required if item not in text]

if missing:
    shutil.copy2(backup, path)
    raise RuntimeError(f"Patch verification failed. Missing: {missing}. Original restored.")

path.write_text(text)

print("useHomeRealtime velocity event repair applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- local-ship now bumps velocity metrics immediately")
print("- broader realtime window events now trigger a backend stats refresh")
print("- computedSummary now preserves backend metric fields")
print("- added __debugHomeVelocity and __refreshHomeVelocity helpers")
print("")
print("No backend files touched.")
print("No Home.jsx layout touched.")
print("No UI styling touched.")

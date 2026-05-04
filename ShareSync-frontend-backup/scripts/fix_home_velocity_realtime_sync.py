from pathlib import Path

path = Path("src/hooks/useHomeRealtime.js")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

# 1) Add normalization helpers after fetchUserStats().
anchor = """async function fetchUserStats() {
  try {
    const response = await client.get('/users/me/stats');
    const data = response.data?.data || response.data;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch (err) {
    console.warn('[useHomeRealtime] Stats fetch failed:', err?.message);
    return null;
  }
}
"""

helpers = """async function fetchUserStats() {
  try {
    const response = await client.get('/users/me/stats');
    const data = response.data?.data || response.data;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch (err) {
    console.warn('[useHomeRealtime] Stats fetch failed:', err?.message);
    return null;
  }
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function unwrapVelocityPayload(payload) {
  if (!payload || typeof payload !== "object") return {};

  return (
    payload.data ||
    payload.summary ||
    payload.stats ||
    payload.velocity ||
    payload.userStats ||
    payload
  );
}

function mergeVelocityStats(payload, previous = {}) {
  const safePrevious =
    previous && typeof previous === "object" ? previous : {};

  const stats = unwrapVelocityPayload(payload);

  if (!stats || typeof stats !== "object") {
    return safePrevious;
  }

  return {
    ...safePrevious,
    ...stats,

    // Prefer lifetime/backend total when available.
    // Fall back to weekly ships only if the backend does not expose a total yet.
    ships: firstFiniteNumber(
      stats.totalShips,
      stats.ships,
      stats.shipCount,
      stats.weeklyShips,
      safePrevious.ships
    ),

    streakDays: firstFiniteNumber(
      stats.streakDays,
      stats.currentStreak,
      stats.streak,
      safePrevious.streakDays
    ),

    focus:
      stats.focus ??
      stats.focusPercent ??
      stats.completionRate ??
      safePrevious.focus ??
      null,

    efficiency:
      stats.efficiency ??
      stats.efficiencyDelta ??
      safePrevious.efficiency ??
      null,

    weeklyShips: firstFiniteNumber(
      stats.weeklyShips,
      stats.shipsThisWeek,
      stats.shippedThisWeek,
      safePrevious.weeklyShips
    ),

    activeDaysThisWeek: firstFiniteNumber(
      stats.activeDaysThisWeek,
      stats.daysActiveThisWeek,
      safePrevious.activeDaysThisWeek
    ),

    lastWeekShips: firstFiniteNumber(
      stats.lastWeekShips,
      stats.shipsLastWeek,
      safePrevious.lastWeekShips
    ),

    updatedAt: stats.updatedAt || safePrevious.updatedAt || new Date().toISOString(),
  };
}
"""

if "function mergeVelocityStats(payload" not in text:
    if anchor not in text:
        raise SystemExit("Could not find fetchUserStats anchor.")
    text = text.replace(anchor, helpers)

# 2) Add velocity refresh ref.
old_ref = "  const pollingRef = useRef({ projects: null, activities: null, summary: null });"
new_ref = """  const pollingRef = useRef({ projects: null, activities: null, summary: null });
  const velocityRefreshTimerRef = useRef(null);"""

if "velocityRefreshTimerRef" not in text:
    if old_ref not in text:
        raise SystemExit("Could not find pollingRef line.")
    text = text.replace(old_ref, new_ref)

# 3) Replace initial stats merge block.
old_initial_merge = """        const merged = {
          ...(lastGoodRef.current.summary || {}),
          ships: stats.ships ?? stats.weeklyShips ?? 0,
          streakDays: stats.streakDays ?? 0,
          focus: stats.focus ?? stats.completionRate ?? null,
          efficiency: stats.efficiency ?? null,
        };"""

new_initial_merge = """        const merged = mergeVelocityStats(
          stats,
          lastGoodRef.current.summary || {}
        );"""

if old_initial_merge in text:
    text = text.replace(old_initial_merge, new_initial_merge, 1)

# 4) Replace polling stats merge block.
old_poll_merge = """          const merged = {
            ...(lastGoodRef.current.summary || {}),
            ships: stats.ships ?? stats.weeklyShips ?? 0,
            streakDays: stats.streakDays ?? 0,
            focus: stats.focus ?? stats.completionRate ?? null,
            efficiency: stats.efficiency ?? null,
          };"""

new_poll_merge = """          const merged = mergeVelocityStats(
            stats,
            lastGoodRef.current.summary || {}
          );"""

if old_poll_merge in text:
    text = text.replace(old_poll_merge, new_poll_merge, 1)

# 5) Add refreshVelocitySummary + scheduleVelocityRefresh after loadOnce.
load_once_end = """  }, [safeSet]);

  // Mount/unmount
"""

refresh_helpers = """  }, [safeSet]);

  const refreshVelocitySummary = useCallback(async () => {
    try {
      const stats = await fetchUserStats();

      if (!stats) {
        return;
      }

      const merged = mergeVelocityStats(
        stats,
        lastGoodRef.current.summary || {}
      );

      lastGoodRef.current.summary = merged;
      safeSet(setSummaryRaw, merged);
      safeSet(setIsConnected, true);
    } catch (err) {
      console.warn("[useHomeRealtime] Velocity refresh failed:", err?.message || err);
      safeSet(setIsConnected, false);
    }
  }, [safeSet]);

  const scheduleVelocityRefresh = useCallback(
    (delay = 300) => {
      if (velocityRefreshTimerRef.current) {
        window.clearTimeout(velocityRefreshTimerRef.current);
      }

      velocityRefreshTimerRef.current = window.setTimeout(() => {
        refreshVelocitySummary();
      }, delay);
    },
    [refreshVelocitySummary]
  );

  // Mount/unmount
"""

if "const refreshVelocitySummary = useCallback(async () =>" not in text:
    if load_once_end not in text:
        raise SystemExit("Could not find loadOnce end anchor.")
    text = text.replace(load_once_end, refresh_helpers)

# 6) Clear the velocity refresh timeout during cleanup.
old_cleanup = """      clearInterval(pollingRef.current.projects);
      clearInterval(pollingRef.current.activities);
      clearInterval(pollingRef.current.summary);
    };"""

new_cleanup = """      clearInterval(pollingRef.current.projects);
      clearInterval(pollingRef.current.activities);
      clearInterval(pollingRef.current.summary);

      if (velocityRefreshTimerRef.current) {
        window.clearTimeout(velocityRefreshTimerRef.current);
      }
    };"""

if old_cleanup in text:
    text = text.replace(old_cleanup, new_cleanup)

# 7) Make local task/project events refresh velocity summary.
old_local_handler = """    // Keep this for components that don't rely on React Query caching yet
    const onTaskCompleted = () => loadOnce();

    window.addEventListener("local-ship", onLocalShip);
    window.addEventListener("task.completed", onTaskCompleted);
    
    return () => {
      window.removeEventListener("local-ship", onLocalShip);
      window.removeEventListener("task.completed", onTaskCompleted);
    };
  }, [safeSet, loadOnce]);"""

new_local_handler = """    // Keep this for components that don't rely on React Query caching yet.
    // Local events should refresh backend-owned velocity truth quickly.
    const onVelocityChanged = () => scheduleVelocityRefresh(200);

    window.addEventListener("local-ship", onLocalShip);
    window.addEventListener("task.completed", onVelocityChanged);
    window.addEventListener("project.completed", onVelocityChanged);
    window.addEventListener("project:lifecycle-updated", onVelocityChanged);
    
    return () => {
      window.removeEventListener("local-ship", onLocalShip);
      window.removeEventListener("task.completed", onVelocityChanged);
      window.removeEventListener("project.completed", onVelocityChanged);
      window.removeEventListener("project:lifecycle-updated", onVelocityChanged);
    };
  }, [safeSet, scheduleVelocityRefresh]);"""

if old_local_handler not in text:
    raise SystemExit("Could not find local event handler block.")
text = text.replace(old_local_handler, new_local_handler)

# 8) Improve optimistic ship bump and schedule backend refresh after live activity.
old_optimistic = """    // Optimistically bump ships count locally if it's a ship event
    if (String(synthetic.type).toLowerCase().includes("ship") || String(synthetic.type).toLowerCase().includes("complete")) {
      safeSet(setSummaryRaw, (prev) => {
        if (!prev) return prev;
        return { ...prev, ships: (prev.ships || 0) + 1 };
      });
    }
  }, [safeSet]);"""

new_optimistic = """    // Optimistically bump ships count locally if it's a ship event,
    // then quickly refetch backend stats so the UI cannot drift.
    if (String(synthetic.type).toLowerCase().includes("ship") || String(synthetic.type).toLowerCase().includes("complete")) {
      safeSet(setSummaryRaw, (prev) => {
        const base = prev || lastGoodRef.current.summary || {};
        const next = {
          ...base,
          ships: Number(base.ships || 0) + 1,
        };

        lastGoodRef.current.summary = next;
        return next;
      });
    }

    scheduleVelocityRefresh(350);
  }, [safeSet, scheduleVelocityRefresh]);"""

if old_optimistic not in text:
    raise SystemExit("Could not find optimistic live activity block.")
text = text.replace(old_optimistic, new_optimistic)

# 9) Replace socket listener block with richer event coverage.
old_socket_listeners = """  useSocketEvent("activity:new", handleLiveActivity);
  useSocketEvent("team:activity_updated", handleLiveActivity);"""

new_socket_listeners = """  const handleVelocityPayload = useCallback(
    (payload) => {
      const merged = mergeVelocityStats(
        payload,
        lastGoodRef.current.summary || {}
      );

      lastGoodRef.current.summary = merged;
      safeSet(setSummaryRaw, merged);
      safeSet(setIsConnected, true);
    },
    [safeSet]
  );

  const handleVelocityRefreshSignal = useCallback(
    (payload) => {
      if (payload) {
        handleLiveActivity(payload);
      }

      scheduleVelocityRefresh(250);
    },
    [handleLiveActivity, scheduleVelocityRefresh]
  );

  useSocketEvent("user:velocity-updated", handleVelocityPayload);
  useSocketEvent("velocity:updated", handleVelocityPayload);
  useSocketEvent("stats:updated", handleVelocityPayload);
  useSocketEvent("streak:update", handleVelocityPayload);
  useSocketEvent("momentum:update", handleVelocityPayload);

  useSocketEvent("activity:new", handleVelocityRefreshSignal);
  useSocketEvent("team:activity_updated", handleVelocityRefreshSignal);
  useSocketEvent("activityCreated", handleVelocityRefreshSignal);
  useSocketEvent("activity:created", handleVelocityRefreshSignal);
  useSocketEvent("taskCompleted", handleVelocityRefreshSignal);
  useSocketEvent("task:completed", handleVelocityRefreshSignal);
  useSocketEvent("taskUpdated", handleVelocityRefreshSignal);
  useSocketEvent("task:update", handleVelocityRefreshSignal);
  useSocketEvent("projectCompleted", handleVelocityRefreshSignal);
  useSocketEvent("project.completed", handleVelocityRefreshSignal);"""

if old_socket_listeners not in text:
    raise SystemExit("Could not find socket listener block.")
text = text.replace(old_socket_listeners, new_socket_listeners)

path.write_text(text)
print(f"Patched realtime velocity sync in {path}")

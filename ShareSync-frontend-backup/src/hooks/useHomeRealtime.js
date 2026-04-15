import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchProjects, fetchActivities, fetchActivitySummary } from "../api/home";
import client from "../api/client";
// ⭐ STEP 3: Import socket event listener
import { useSocketEvent } from "../context/SocketContext";

/**
 * Convert projects -> Home "missions" shape
 * Keeps your MissionCard happy without reworking the component.
 */
function toMissions(projects) {
  const safe = Array.isArray(projects) ? projects : [];

  // Heuristic ranking: at-risk first, then most open tasks, then lowest velocity
  const ranked = [...safe].sort((a, b) => {
    const aRisk = a?.isAtRisk ? 1 : 0;
    const bRisk = b?.isAtRisk ? 1 : 0;
    if (aRisk !== bRisk) return bRisk - aRisk;

    const aOpen = a?.metrics?.openTasks?.value ?? 0;
    const bOpen = b?.metrics?.openTasks?.value ?? 0;
    if (aOpen !== bOpen) return bOpen - aOpen;

    const aVel = a?.metrics?.onTimePercent?.value ?? 0;
    const bVel = b?.metrics?.onTimePercent?.value ?? 0;
    return aVel - bVel;
  });

  return ranked.slice(0, 3).map((p) => {
    const velocity = p?.metrics?.onTimePercent?.value ?? 0;
    const openTasks = p?.metrics?.openTasks?.value ?? 0;

    return {
      id: p?._id || p?.id,
      _id: p?._id || p?.id,
      title: p?.name || p?.title || "Untitled Project",
      category: p?.season || "Core",
      eta: openTasks > 10 ? "4h" : openTasks > 5 ? "2h" : "1h",
      velocity,
      health: velocity, // keep compatibility
      emoji: p?.season === "shipping" ? "🚀" : p?.season === "exploring" ? "🌱" : "🛠",
      raw: p,
    };
  });
}

/**
 * Activities:
 * We support multiple shapes.
 * Normalize minimal fields.
 */
function normalizeActivities(items) {
  return (Array.isArray(items) ? items : [])
    .map((a) => {
      const type = a?.type || a?.action || a?.event || "ACTIVITY";
      const createdAt = a?.createdAt || a?.timestamp || a?.time || Date.now();
      const actorName =
        a?.actorName ||
        a?.actor?.name ||
        a?.user?.name ||
        (a?.userId?.firstName ? `${a.userId.firstName} ${a.userId.lastName || ""}`.trim() : null) ||
        a?.username ||
        "Someone";
      const projectName =
        a?.project?.name ||
        a?.projectName ||
        a?.project?.title ||
        a?.meta?.projectName ||
        null;

      const createdMs =
        typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();

      // Stable ID (no Date.now collisions)
      const id =
        a?._id ||
        a?.id ||
        `${String(type)}:${String(createdMs)}:${String(actorName)}:${String(projectName || "")}`;

      return {
        id,
        type,
        createdAt: createdMs,
        actorName,
        projectName,
        raw: a,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function minutesSince(ts) {
  const diff = Date.now() - ts;
  return Math.max(0, Math.floor(diff / 60000));
}

/**
 * Derive lightweight metrics if /user/activity-summary isn't available.
 */
function computeSummaryFromActivities(activities) {
  const now = Date.now();
  const last7d = activities.filter(
    (a) => now - a.createdAt <= 7 * 24 * 60 * 60 * 1000
  );

  const ships = last7d.filter((a) => {
    const t = String(a.type).toLowerCase();
    return t.includes("ship") || t.includes("completed");
  }).length;

  // Streak estimate: number of distinct calendar days with activity (max 30)
  const days = new Set(
    last7d.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
  );
  const streakDays = Math.min(days.size, 30);

  // Focus heuristic: % of activity types that look like "work" vs "noise"
  const focusLike = last7d.filter((a) => {
    const t = String(a.type).toLowerCase();
    return (
      t.includes("task") ||
      t.includes("ship") ||
      t.includes("submit") ||
      t.includes("file") ||
      t.includes("thread")
    );
  }).length;
  const focus = last7d.length ? Math.round((focusLike / last7d.length) * 100) : 0;

  // Efficiency heuristic: compare ships in last 7d vs prior 7d
  const prev7d = activities.filter(
    (a) =>
      now - a.createdAt > 7 * 24 * 60 * 60 * 1000 &&
      now - a.createdAt <= 14 * 24 * 60 * 60 * 1000
  );
  const shipsPrev = prev7d.filter((a) =>
    String(a.type).toLowerCase().includes("ship")
  ).length;

  const efficiency =
    shipsPrev === 0 ? (ships > 0 ? 12 : 0) : Math.round(((ships - shipsPrev) / shipsPrev) * 100);

  return { ships, streakDays, focus, efficiency };
}

function computeTeamPulse(activities) {
  const now = Date.now();
  const windowMs = 30 * 60 * 1000; // 30 min "active"
  const recent = activities.filter((a) => now - a.createdAt <= windowMs);

  const unique = new Map();
  for (const a of recent) unique.set(a.actorName, a);

  const shippingNow = recent.filter((a) =>
    String(a.type).toLowerCase().includes("ship")
  ).length;

  const inFocus = recent.filter((a) => {
    const t = String(a.type).toLowerCase();
    return t.includes("task") || t.includes("submit") || t.includes("thread") || t.includes("file");
  }).length;

  return {
    activeCount: unique.size,
    shippingNow,
    inFocus,
    actors: Array.from(unique.keys()).slice(0, 6),
  };
}

function computeStreakComparison(summary, activities) {
  const now = Date.now();
  const last7d = activities.filter(
    (a) => now - a.createdAt <= 7 * 24 * 60 * 60 * 1000
  );

  const userDays = new Map(); // actor -> Set(days)
  for (const a of last7d) {
    const day = new Date(a.createdAt).toISOString().slice(0, 10);
    if (!userDays.has(a.actorName)) userDays.set(a.actorName, new Set());
    userDays.get(a.actorName).add(day);
  }

  const totals = Array.from(userDays.values()).map((s) => s.size);
  const teamAvg = totals.length
    ? Number((totals.reduce((x, y) => x + y, 0) / totals.length).toFixed(1))
    : 0;

  return {
    userStreakDays: summary?.streakDays ?? 0,
    teamAvgDays: teamAvg,
    // rank is unknown without backend; safe placeholder
    rankText: "Top 3",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Fetches from GET /activities/feed with real user names
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchActivityFeed(limit = 50) {
  try {
    const response = await client.get('/activities/feed', { params: { limit } });
    const data = response.data;
    const items = data?.items || data?.data?.items || [];
    if (!items.length) return [];
    // Map to the shape normalizeActivities expects
    return items.map((item) => ({
      _id: item._id || item.id,
      type: item.type || item.action || 'ACTIVITY',
      actorName: item.actorName || item.actor?.name || 'Someone',
      username: item.actor?.username || item.username,
      projectName: item.details?.projectName || item.metadata?.projectName || item.payload?.projectName || null,
      createdAt: item.createdAt,
      timestamp: item.createdAt,
      raw: item,
      actor: item.actor || null,
    }));
  } catch (err) {
    console.warn('[useHomeRealtime] Activity feed fetch failed:', err?.message);
    return [];
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY TASKS FETCH
// Powers "Recommended for Today" with real task cards instead of projects
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchPriorityTasks(limit = 5) {
  try {
    const response = await client.get('/tasks/priorities', { params: { limit } });
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[useHomeRealtime] Priority tasks fetch failed:', err?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-PROJECT TASK FALLBACK (legacy — used only if /activities/feed fails)
// When the activities endpoint returns empty (no EventLog entries), we fetch
// real tasks across all projects and convert them into activity items.
// Same pattern as the project-level ActivityFeed fallback.
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchCrossProjectTasks(limit = 30) {
  try {
    const response = await client.get('/tasks', {
      params: {
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit,
      },
    });

    const result = response.data?.data || response.data;
    const tasks = result?.tasks || (Array.isArray(result) ? result : []);

    if (!tasks.length) return [];

    const items = [];

    for (const task of tasks) {
      // Find project name from task data
      const projectName = task?.projectId?.name || task?.project?.name || null;

      // If task is done and has completedAt, show completion event
      if (task.status === 'done' && task.completedAt) {
        items.push({
          _id: `${task._id || task.id}-completed`,
          type: 'TASK_COMPLETED',
          actorName: 'Team member',
          projectName,
          createdAt: task.completedAt,
          timestamp: task.completedAt,
          raw: { taskTitle: task.title, projectName },
        });
      }

      // If task is in progress, show it
      if (task.status === 'in_progress') {
        items.push({
          _id: `${task._id || task.id}-in-progress`,
          type: 'TASK_STARTED',
          actorName: 'Team member',
          projectName,
          createdAt: task.updatedAt || task.createdAt,
          timestamp: task.updatedAt || task.createdAt,
          raw: { taskTitle: task.title, projectName },
        });
      }

      // Always show creation event
      items.push({
        _id: `${task._id || task.id}-created`,
        type: 'TASK_CREATED',
        actorName: 'Team member',
        projectName,
        createdAt: task.createdAt,
        timestamp: task.createdAt,
        raw: { taskTitle: task.title, projectName },
      });
    }

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  } catch (err) {
    console.warn('[useHomeRealtime] Cross-project task fallback failed:', err?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE FETCH
// Fetches peak productivity window from analytics endpoint.
// Parses string times ("10:00 PM") into numeric hours for PeakWindow component.
// ═══════════════════════════════════════════════════════════════════════════════

function parseTimeStringToHour(timeStr) {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr || typeof timeStr !== 'string') return null;

  // Parse formats like "10:00 PM", "2:00 AM", "14:00"
  const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const ampm = match[3]?.toUpperCase?.();

  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  return hour;
}

async function fetchUserIntelligence() {
  try {
    const response = await client.get('/analytics/user/intelligence');
    const data = response.data?.data || response.data;

    if (!data) return null;

    // Parse string times to numeric hours
    const startHour = parseTimeStringToHour(data.peakWindowStart);
    const endHour = parseTimeStringToHour(data.peakWindowEnd);

    return {
      peakWindowStart: startHour ?? 10,
      peakWindowEnd: endHour ?? 12,
      productivity: data.productivity ?? 0,
      coWorkingMultiplier: data.coWorkingMultiplier ?? 1,
      isCoWorking: data.isCoWorking ?? false,
    };
  } catch (err) {
    console.warn('[useHomeRealtime] Intelligence fetch failed:', err?.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER STATS FETCH (Phase 4)
// Fetches real dashboard metrics from GET /users/me/stats
// Self-healing: backend recalculates if cache is >5min stale
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchUserStats() {
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useHomeRealtime() {
  const [projects, setProjects] = useState([]);
  const [activitiesRaw, setActivitiesRaw] = useState([]);
  const [summaryRaw, setSummaryRaw] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);

  const [priorityTasks, setPriorityTasks] = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Track mounted state so we never set state after unmount
  const mountedRef = useRef(false);

  // Poll timers
  const pollingRef = useRef({ projects: null, activities: null, summary: null });

  // Keep last good payloads (so we can "keep old data" if a fetch fails)
  const lastGoodRef = useRef({
    projects: [],
    activities: [],
    summary: null,
  });

  const safeSet = useCallback((setter, value) => {
    if (!mountedRef.current) return;
    setter(value);
  }, []);

  const loadOnce = useCallback(async () => {
    safeSet(setLoadingMissions, true);

    try {
      const [pRes, aRes, sRes, iRes, statsRes] = await Promise.allSettled([
        fetchProjects(),
        fetchActivities({ limit: 80 }),
        fetchActivitySummary(),
        fetchUserIntelligence(),
        fetchUserStats(),
      ]);

      let anySuccess = false;

      // Priority Tasks (for Recommended for Today)
      try {
        const pt = await fetchPriorityTasks(5);
        safeSet(setPriorityTasks, pt);
      } catch (_) {}

      // Projects
      if (pRes.status === "fulfilled") {
        const p = Array.isArray(pRes.value) ? pRes.value : [];
        lastGoodRef.current.projects = p;
        safeSet(setProjects, p);
        anySuccess = true;
      } else {
        // keep old
        safeSet(setProjects, lastGoodRef.current.projects);
      }

      // Activities
      if (aRes.status === "fulfilled") {
        let a = Array.isArray(aRes.value) ? aRes.value : [];

        // ═════════════════════════════════════════════════════════════════
        // FALLBACK: If activities endpoint returned empty, build activity
        // items from real task data across all user projects.
        // ═════════════════════════════════════════════════════════════════
        if (a.length === 0) {
          try {
            // Primary: use /activities/feed with real user names
            const feedItems = await fetchActivityFeed(50);
            if (feedItems.length > 0) {
              a = feedItems;
            } else {
              // Legacy fallback: cross-project tasks
              const taskItems = await fetchCrossProjectTasks(30);
              if (taskItems.length > 0) a = taskItems;
            }
          } catch (fallbackErr) {
            console.warn('[useHomeRealtime] Feed fallback failed:', fallbackErr?.message);
            try {
              const taskItems = await fetchCrossProjectTasks(30);
              if (taskItems.length > 0) a = taskItems;
            } catch (_) {}
          }
        }

        lastGoodRef.current.activities = a;
        safeSet(setActivitiesRaw, a);
        anySuccess = true;
      } else {
        safeSet(setActivitiesRaw, lastGoodRef.current.activities);
      }

      // Summary
      if (sRes.status === "fulfilled") {
        const s = sRes.value && typeof sRes.value === "object" ? sRes.value : null;
        lastGoodRef.current.summary = s;
        safeSet(setSummaryRaw, s);
        anySuccess = true;
      } else {
        safeSet(setSummaryRaw, lastGoodRef.current.summary);
      }

      // Intelligence
      if (iRes.status === "fulfilled" && iRes.value) {
        safeSet(setIntelligenceData, iRes.value);
      }

      // ⭐ Phase 4: Merge real stats from /users/me/stats into summary
      if (statsRes.status === "fulfilled" && statsRes.value) {
        const stats = statsRes.value;
        const merged = {
          ...(lastGoodRef.current.summary || {}),
          ships: stats.ships ?? stats.weeklyShips ?? 0,
          streakDays: stats.streakDays ?? 0,
          focus: stats.focus ?? stats.completionRate ?? 0,
          efficiency: stats.efficiency ?? 0,
        };
        lastGoodRef.current.summary = merged;
        safeSet(setSummaryRaw, merged);
        anySuccess = true;
      }

      safeSet(setIsConnected, anySuccess);
    } catch (err) {
      // Total failure: keep old data, mark offline
      safeSet(setProjects, lastGoodRef.current.projects);
      safeSet(setActivitiesRaw, lastGoodRef.current.activities);
      safeSet(setSummaryRaw, lastGoodRef.current.summary);
      safeSet(setIsConnected, false);
    } finally {
      // ✅ never stuck loading
      safeSet(setLoadingMissions, false);
    }
  }, [safeSet]);

  // Mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    loadOnce();

    // Polling (safe + simple)
    pollingRef.current.projects = setInterval(async () => {
      try {
        const p = await fetchProjects();
        const safeP = Array.isArray(p) ? p : [];
        lastGoodRef.current.projects = safeP;
        safeSet(setProjects, safeP);
        safeSet(setIsConnected, true);
      } catch (e) {
        safeSet(setIsConnected, false);
        safeSet(setProjects, lastGoodRef.current.projects);
      }
    }, 30000);

    pollingRef.current.activities = setInterval(async () => {
      try {
        let a = await fetchActivities({ limit: 80 });
        let safeA = Array.isArray(a) ? a : [];

        // ═════════════════════════════════════════════════════════════════
        // FALLBACK on poll too: if activities still empty, try tasks
        // ═════════════════════════════════════════════════════════════════
        if (safeA.length === 0) {
          try {
            const feedItems = await fetchActivityFeed(50);
            if (feedItems.length > 0) safeA = feedItems;
            else {
              const taskItems = await fetchCrossProjectTasks(30);
              if (taskItems.length > 0) safeA = taskItems;
            }
          } catch (_) {
            try {
              const taskItems = await fetchCrossProjectTasks(30);
              if (taskItems.length > 0) safeA = taskItems;
            } catch (__) {}
          }
        }

        lastGoodRef.current.activities = safeA;
        safeSet(setActivitiesRaw, safeA);
        safeSet(setIsConnected, true);
      } catch (e) {
        safeSet(setIsConnected, false);
        safeSet(setActivitiesRaw, lastGoodRef.current.activities);
      }
    }, 15000);

    pollingRef.current.summary = setInterval(async () => {
      try {
        const stats = await fetchUserStats();
        if (stats) {
          const merged = {
            ...(lastGoodRef.current.summary || {}),
            ships: stats.ships ?? stats.weeklyShips ?? 0,
            streakDays: stats.streakDays ?? 0,
            focus: stats.focus ?? stats.completionRate ?? 0,
            efficiency: stats.efficiency ?? 0,
          };
          lastGoodRef.current.summary = merged;
          safeSet(setSummaryRaw, merged);
        }
        safeSet(setIsConnected, true);
      } catch (e) {
        safeSet(setIsConnected, false);
        safeSet(setSummaryRaw, lastGoodRef.current.summary);
      }
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(pollingRef.current.projects);
      clearInterval(pollingRef.current.activities);
      clearInterval(pollingRef.current.summary);
    };
  }, [loadOnce, safeSet]);

  // Event listeners for WebSocket simulations & local state triggers
  useEffect(() => {
    const onLocalShip = (evt) => {
      const detail = evt?.detail || {};
      const projectName = detail?.project?.name || detail?.project?.title || "Project";
      const xp = detail?.xp ?? 0;

      const synthetic = {
        id: `local-ship:${Date.now()}`,
        type: "PROJECT_SHIP",
        createdAt: Date.now(),
        actorName: "You",
        projectName,
        raw: { xp, ...detail },
      };

      safeSet(setActivitiesRaw, (prev) => [synthetic, ...(Array.isArray(prev) ? prev : [])]);
      lastGoodRef.current.activities = [synthetic, ...(Array.isArray(lastGoodRef.current.activities) ? lastGoodRef.current.activities : [])];
      safeSet(setIsConnected, true);
    };

    // Keep this for components that don't rely on React Query caching yet
    const onTaskCompleted = () => loadOnce();

    window.addEventListener("local-ship", onLocalShip);
    window.addEventListener("task.completed", onTaskCompleted);
    
    return () => {
      window.removeEventListener("local-ship", onLocalShip);
      window.removeEventListener("task.completed", onTaskCompleted);
    };
  }, [safeSet, loadOnce]);

  // ⭐ STEP 3: Listen for live Socket Activity events to update without refreshing
  const handleLiveActivity = useCallback((data) => {
    if (!data) return;
    
    const synthetic = {
      id: data?.id || data?._id || `live-socket:${Date.now()}`,
      type: data?.type || data?.action || data?.event || "ACTIVITY",
      createdAt: data?.createdAt || Date.now(),
      actorName: data?.actor?.name || data?.actorName || data?.user?.name || "Teammate",
      projectName: data?.project?.name || data?.projectName || data?.project?.title || "Project",
      raw: data
    };

    // Inject into the top of the feed
    safeSet(setActivitiesRaw, (prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.some(a => a.id === synthetic.id)) return arr; // prevent UI duplicates
      return [synthetic, ...arr];
    });
    
    // Optimistically bump ships count locally if it's a ship event
    if (String(synthetic.type).toLowerCase().includes("ship") || String(synthetic.type).toLowerCase().includes("complete")) {
      safeSet(setSummaryRaw, (prev) => {
        if (!prev) return prev;
        return { ...prev, ships: (prev.ships || 0) + 1 };
      });
    }
  }, [safeSet]);

  useSocketEvent("activity:new", handleLiveActivity);
  useSocketEvent("team:activity_updated", handleLiveActivity);

  const activities = useMemo(() => normalizeActivities(activitiesRaw), [activitiesRaw]);
  const missions = useMemo(() => toMissions(projects), [projects]);

  const computedSummary = useMemo(() => {
    if (summaryRaw && typeof summaryRaw === "object") {
      const ships = summaryRaw.ships ?? summaryRaw.shipsLast7Days ?? summaryRaw.shipCount ?? null;
      const streakDays = summaryRaw.streakDays ?? summaryRaw.streak ?? summaryRaw.currentStreak ?? null;
      const focus = summaryRaw.focus ?? summaryRaw.focusPercent ?? null;
      const efficiency = summaryRaw.efficiency ?? summaryRaw.efficiencyDelta ?? null;

      const fallback = computeSummaryFromActivities(activities);
      return {
        ships: ships ?? fallback.ships,
        streakDays: streakDays ?? fallback.streakDays,
        focus: focus ?? fallback.focus,
        efficiency: efficiency ?? fallback.efficiency,
      };
    }

    return computeSummaryFromActivities(activities);
  }, [summaryRaw, activities]);

  const teamPulse = useMemo(() => computeTeamPulse(activities), [activities]);

  const streakComparison = useMemo(
    () => computeStreakComparison(computedSummary, activities),
    [computedSummary, activities]
  );

  const shippedStats = useMemo(() => {
    const last7d = activities.filter((a) => minutesSince(a.createdAt) <= 7 * 24 * 60);

    const ships = last7d.filter((a) =>
      String(a.type).toLowerCase().includes("ship")
    ).length;

    // XP from synthetic/local-ship if present
    const xpEarned = last7d.reduce((sum, a) => {
      const xp = a?.raw?.xp;
      return sum + (typeof xp === "number" ? xp : 0);
    }, 0);

    return {
      tasksCompleted: ships,
      xpEarned,
      bonusXP: 0,
    };
  }, [activities]);

  // ✅ NEW: Intelligence data with safe defaults
  const intelligence = useMemo(() => {
    if (intelligenceData) return intelligenceData;
    return {
      peakWindowStart: null,
      peakWindowEnd: null,
      productivity: 0,
      coWorkingMultiplier: 1,
      isCoWorking: false,
    };
  }, [intelligenceData]);

  return {
    loadingMissions,
    missions,
    priorityTasks,
    projects,
    activities,
    summary: computedSummary,
    teamPulse,
    streakComparison,
    shippedStats,
    // ✅ NEW: Intelligence (peak window, productivity, co-working)
    intelligence,
    refreshAll: loadOnce,
    isConnected,
  };
}

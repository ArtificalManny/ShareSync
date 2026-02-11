import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchProjects, fetchActivities, fetchActivitySummary } from "../api/home";

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
        a?.actor?.name ||
        a?.user?.name ||
        a?.username ||
        a?.actorName ||
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
 * Derive lightweight metrics if /user/activity-summary isn’t available.
 */
function computeSummaryFromActivities(activities) {
  const now = Date.now();
  const last7d = activities.filter(
    (a) => now - a.createdAt <= 7 * 24 * 60 * 60 * 1000
  );

  const ships = last7d.filter((a) =>
    String(a.type).toLowerCase().includes("ship")
  ).length;

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
  const windowMs = 30 * 60 * 1000; // 30 min “active”
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

function computeIntelligencePanel(summary, activities) {
  const hour = new Date().getHours();
  const peakWindowStart = 14; // 2pm default
  const peakWindowEnd = 16; // 4pm default

  const now = Date.now();
  const last2h = activities.filter((a) => now - a.createdAt <= 2 * 60 * 60 * 1000);
  const myShips = last2h.filter((a) =>
    String(a.type).toLowerCase().includes("ship")
  ).length;

  const productivity = summary?.focus ?? 65;
  const coWorkingMultiplier = last2h.length >= 8 ? 2.1 : 1.2;

  const inPeak = hour >= peakWindowStart && hour < peakWindowEnd;

  return {
    peakWindowStart,
    peakWindowEnd,
    productivity,
    coWorkingMultiplier,
    isCoWorking: coWorkingMultiplier > 1.5,
    inPeak,
    myShipsLast2h: myShips,
  };
}

export function useHomeRealtime() {
  const [projects, setProjects] = useState([]);
  const [activitiesRaw, setActivitiesRaw] = useState([]);
  const [summaryRaw, setSummaryRaw] = useState(null);

  const [loadingMissions, setLoadingMissions] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Track mounted state so we never set state after unmount
  const mountedRef = useRef(false);

  // Poll timers
  const pollingRef = useRef({ projects: null, activities: null, summary: null });

  // Keep last good payloads (so we can “keep old data” if a fetch fails)
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
      const [pRes, aRes, sRes] = await Promise.allSettled([
        fetchProjects(),
        fetchActivities({ limit: 80 }),
        fetchActivitySummary(),
      ]);

      let anySuccess = false;

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
        const a = Array.isArray(aRes.value) ? aRes.value : [];
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
        const a = await fetchActivities({ limit: 80 });
        const safeA = Array.isArray(a) ? a : [];
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
        const s = await fetchActivitySummary();
        const safeS = s && typeof s === "object" ? s : null;
        if (safeS) {
          lastGoodRef.current.summary = safeS;
          safeSet(setSummaryRaw, safeS);
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

  // Instant UI updates from your existing local ship event
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

      // Also update last-good so polling failures don't wipe local events
      lastGoodRef.current.activities = [synthetic, ...(Array.isArray(lastGoodRef.current.activities) ? lastGoodRef.current.activities : [])];
      safeSet(setIsConnected, true);
    };

    window.addEventListener("local-ship", onLocalShip);
    return () => window.removeEventListener("local-ship", onLocalShip);
  }, [safeSet]);

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

  const intelligence = useMemo(
    () => computeIntelligencePanel(computedSummary, activities),
    [computedSummary, activities]
  );

  // Shipped stats derived from activities (so it stays “real”)
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

  return {
    loadingMissions,
    missions,
    projects,
    activities,
    summary: computedSummary,
    teamPulse,
    streakComparison,
    intelligence,
    shippedStats,
    refreshAll: loadOnce,
    isConnected, // ✅ optional for UI if you want to show "Offline"
  };
}

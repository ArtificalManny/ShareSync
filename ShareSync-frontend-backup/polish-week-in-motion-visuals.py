from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/home/WeekInMotion.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/components/home/WeekInMotion.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-visual-polish-{stamp}")
shutil.copy2(path, backup)

content = r'''// src/components/home/WeekInMotion.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// WeekInMotion — user-scoped weekly rhythm
// Visual polish pass:
// - Keeps working /api/users/me/weekly-rhythm + /api/users/me/stats logic
// - Makes the panel more premium in light and dark mode
// - Adds stronger rhythm bars, glow, stat chips, and empty-state presentation
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Sparkles,
  Activity,
  CalendarDays,
  Radio,
  BarChart3,
} from "lucide-react";
import client from "../../api/client";

const REFRESH_EVENTS = [
  "task.completed",
  "task:completed",
  "taskUpdated",
  "task:update",
  "task.created",
  "task:created",
  "task.deleted",
  "task:deleted",
  "activity.created",
  "activity:created",
  "local-ship",
  "openshare:ship",
  "projectCompleted",
  "project.completed",
  "project:lifecycle-updated",
];

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function unwrapPayload(payload) {
  return payload?.data?.data ?? payload?.data ?? payload ?? null;
}

function getAuthHeaders() {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      }
    : {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };
}

async function apiGet(endpoint) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const explicitApiUrl = `/api${cleanEndpoint}?_t=${Date.now()}`;

  try {
    const response = await fetch(explicitApiUrl, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (response.ok) {
      const json = await response.json();
      return unwrapPayload(json);
    }

    console.warn(`[WeekInMotion] Direct fetch failed: ${explicitApiUrl}`, response.status);
  } catch (error) {
    console.warn(`[WeekInMotion] Direct fetch error: ${explicitApiUrl}`, error?.message || error);
  }

  try {
    const response = await client.get(cleanEndpoint, {
      params: { _t: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    return unwrapPayload(response);
  } catch (error) {
    console.warn(`[WeekInMotion] client.get failed: ${cleanEndpoint}`, error?.message || error);
    return null;
  }
}

function toLocalDateKey(date) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return null;

  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCurrentWeekDays() {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7;

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - todayIndex);

  return labels.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      day,
      date: toLocalDateKey(date),
      count: 0,
      isToday: index === todayIndex,
    };
  });
}

function readDayCount(day) {
  if (typeof day === "number") return Math.max(0, safeNumber(day, 0));

  return Math.max(
    0,
    firstNumber(
      day?.count,
      day?.ships,
      day?.shipCount,
      day?.value,
      day?.total,
      day?.completed,
      day?.completedTasks,
      day?.done
    )
  );
}

function normalizeIncomingDays(rawDays) {
  const days = getCurrentWeekDays();

  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    return days;
  }

  rawDays.slice(0, 7).forEach((entry, fallbackIndex) => {
    const count = readDayCount(entry);
    let targetIndex = fallbackIndex;

    if (entry && typeof entry === "object") {
      const possibleDate =
        entry.date ??
        entry.dateKey ??
        entry.dayDate ??
        entry.createdAt ??
        null;

      const parsedDate = parseDate(possibleDate);

      if (parsedDate) {
        targetIndex = (parsedDate.getDay() + 6) % 7;
      }
    }

    if (targetIndex >= 0 && targetIndex <= 6) {
      days[targetIndex] = {
        ...days[targetIndex],
        count: days[targetIndex].count + count,
      };
    }
  });

  return days;
}

function buildFallbackWeekDays({ weeklyShips = 0, activeDays = 0 } = {}) {
  const days = getCurrentWeekDays();
  const todayIndex = days.findIndex((day) => day.isToday);

  const safeWeeklyShips = Math.max(0, safeNumber(weeklyShips, 0));
  const safeActiveDays = Math.max(0, Math.min(7, safeNumber(activeDays, 0)));

  if (safeWeeklyShips <= 0 || safeActiveDays <= 0) {
    return days;
  }

  const eligibleIndexes = [];

  for (
    let index = todayIndex;
    index >= 0 && eligibleIndexes.length < safeActiveDays;
    index -= 1
  ) {
    eligibleIndexes.unshift(index);
  }

  while (eligibleIndexes.length < safeActiveDays && eligibleIndexes.length < 7) {
    const nextIndex = eligibleIndexes.length;
    if (!eligibleIndexes.includes(nextIndex)) eligibleIndexes.push(nextIndex);
    else break;
  }

  const perDay = Math.floor(safeWeeklyShips / eligibleIndexes.length);
  const remainder = safeWeeklyShips % eligibleIndexes.length;

  eligibleIndexes.forEach((dayIndex, position) => {
    days[dayIndex].count = perDay + (position < remainder ? 1 : 0);
  });

  return days;
}

function findRawDays(rhythm, stats) {
  return (
    rhythm?.days ??
    rhythm?.weekDays ??
    rhythm?.dailyCounts ??
    rhythm?.dailyShips ??
    rhythm?.weeklyRhythm?.days ??
    rhythm?.rhythm?.days ??
    stats?.days ??
    stats?.weekDays ??
    stats?.dailyCounts ??
    stats?.dailyShips ??
    stats?.weeklyRhythm?.days ??
    stats?.rhythm?.days ??
    stats?.activity?.days ??
    []
  );
}

function normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload) {
  const rhythm = rhythmPayload && typeof rhythmPayload === "object" ? rhythmPayload : {};
  const stats = statsPayload && typeof statsPayload === "object" ? statsPayload : {};

  const rawWeeklyShips = firstNumber(
    rhythm.thisWeekTotal,
    rhythm.weeklyShips,
    rhythm.shipsThisWeek,
    rhythm.shippedThisWeek,
    rhythm.currentWeekShips,
    rhythm.thisWeek?.ships,
    rhythm.thisWeek?.total,
    stats.weeklyShips,
    stats.shipsThisWeek,
    stats.shippedThisWeek,
    stats.currentWeekShips,
    stats.thisWeekShips,
    stats.thisWeek?.ships,
    stats.thisWeek?.total,
    stats.activity?.weeklyShips,
    stats.activity?.shipsThisWeek
  );

  const rawActiveDays = firstNumber(
    rhythm.activeDays,
    rhythm.activeDaysThisWeek,
    rhythm.daysActiveThisWeek,
    rhythm.thisWeek?.activeDays,
    stats.activeDays,
    stats.activeDaysThisWeek,
    stats.daysActiveThisWeek,
    stats.thisWeek?.activeDays,
    stats.activity?.activeDays,
    stats.activity?.activeDaysThisWeek
  );

  const lastWeekShips = firstNumber(
    rhythm.lastWeekTotal,
    rhythm.lastWeekShips,
    rhythm.shipsLastWeek,
    rhythm.previousWeekShips,
    rhythm.lastWeek?.ships,
    rhythm.lastWeek?.total,
    stats.lastWeekShips,
    stats.shipsLastWeek,
    stats.previousWeekShips,
    stats.lastWeek?.ships,
    stats.lastWeek?.total,
    stats.activity?.lastWeekShips
  );

  let days = normalizeIncomingDays(findRawDays(rhythm, stats));
  let daysTotal = days.reduce((sum, day) => sum + safeNumber(day.count, 0), 0);

  if (daysTotal === 0 && rawWeeklyShips > 0) {
    days = buildFallbackWeekDays({
      weeklyShips: rawWeeklyShips,
      activeDays: rawActiveDays || 1,
    });

    daysTotal = days.reduce((sum, day) => sum + safeNumber(day.count, 0), 0);
  }

  const weeklyShips = Math.max(rawWeeklyShips, daysTotal);
  const activeDaysFromBars = days.filter((day) => safeNumber(day.count, 0) > 0).length;
  const activeDays = Math.max(rawActiveDays, activeDaysFromBars);

  const momentum =
    rhythm.momentum ||
    rhythm.status ||
    (weeklyShips >= 8 && activeDays >= 3
      ? "rising"
      : weeklyShips > 0
        ? "building"
        : "idle");

  const momentumLabel =
    rhythm.momentumLabel ||
    rhythm.label ||
    (weeklyShips >= 8 && activeDays >= 3
      ? "Strong rhythm"
      : weeklyShips > 0
        ? "Building"
        : "Warming up");

  const insight =
    weeklyShips > 0
      ? `You shipped ${weeklyShips} item${weeklyShips === 1 ? "" : "s"} across ${activeDays} active day${activeDays === 1 ? "" : "s"} this week.`
      : "Your weekly rhythm will appear here once you start shipping activity this week.";

  const normalized = {
    days,
    thisWeekTotal: weeklyShips,
    weeklyShips,
    activeDays,
    totalDays: safeNumber(rhythm.totalDays ?? stats.totalDays, 7) || 7,
    lastWeekTotal: lastWeekShips,
    lastWeekShips,
    momentum,
    momentumLabel,
    insight,
    updatedAt: new Date().toISOString(),
  };

  console.info("[WeekInMotion] normalized:", normalized, {
    rhythmPayload,
    statsPayload,
  });

  return normalized;
}

async function fetchWeeklyRhythm() {
  const [rhythmPayload, statsPayload] = await Promise.all([
    apiGet("/users/me/weekly-rhythm"),
    apiGet("/users/me/stats"),
  ]);

  return normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload);
}

function getBarTone({ isEmpty, isToday, isPeak }) {
  if (isEmpty) {
    return {
      bar: "border border-dashed border-slate-300/80 bg-white/65 dark:border-white/25 dark:bg-white/[0.05]",
      count: "text-slate-400 dark:text-white/40",
      label: "text-slate-400 dark:text-white/45",
      halo: "bg-transparent",
    };
  }

  if (isPeak) {
    return {
      bar: "bg-gradient-to-t from-violet-700 via-violet-500 to-cyan-300 shadow-[0_0_24px_rgba(139,92,246,0.50)]",
      count: "text-violet-700 dark:text-violet-100",
      label: "text-violet-700 dark:text-violet-100",
      halo: "bg-violet-500/20 dark:bg-violet-400/20",
    };
  }

  if (isToday) {
    return {
      bar: "bg-gradient-to-t from-indigo-700 via-violet-500 to-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.35)] ring-2 ring-cyan-200/80 ring-offset-2 ring-offset-white dark:ring-cyan-300/40 dark:ring-offset-[#12141d]",
      count: "text-cyan-700 dark:text-cyan-100",
      label: "text-cyan-700 dark:text-cyan-100",
      halo: "bg-cyan-400/20 dark:bg-cyan-300/15",
    };
  }

  return {
    bar: "bg-gradient-to-t from-violet-700 via-violet-500 to-teal-300 shadow-[0_0_20px_rgba(139,92,246,0.25)]",
    count: "text-slate-700 dark:text-white/90",
    label: "text-slate-600 dark:text-white/70",
    halo: "bg-violet-500/10 dark:bg-violet-400/10",
  };
}

function RhythmBar({ day, count, maxCount, isToday, isPeak }) {
  const safeCount = safeNumber(count, 0);
  const fillPercent = maxCount > 0 ? Math.max(18, (safeCount / maxCount) * 100) : 0;
  const isEmpty = safeCount === 0;
  const tone = getBarTone({ isEmpty, isToday, isPeak });

  return (
    <div className="group flex min-w-0 flex-1 flex-col items-center gap-2">
      <div
        className={`
          relative flex h-[116px] w-full items-end justify-center overflow-hidden rounded-3xl
          border border-slate-200/70 bg-white/70 px-1.5 pb-3
          shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]
          transition-all duration-300
          group-hover:-translate-y-1 group-hover:border-violet-300/80
          dark:border-white/[0.09] dark:bg-white/[0.055] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        `}
      >
        <div className={`absolute inset-x-4 bottom-3 h-10 rounded-full blur-2xl ${tone.halo}`} />

        {safeCount > 0 && (
          <span
            className={`
              absolute top-2 z-10 rounded-full border border-white/60 bg-white/90 px-2 py-0.5
              text-[11px] font-black tabular-nums shadow-sm
              dark:border-white/10 dark:bg-black/35
              ${tone.count}
            `}
          >
            {safeCount}
          </span>
        )}

        <div
          className={`
            relative z-10 w-8 overflow-hidden rounded-t-2xl rounded-b-lg
            transition-all duration-700 ease-out
            ${tone.bar}
          `}
          style={{
            height: `${isEmpty ? 12 : Math.max(22, fillPercent * 0.78)}px`,
            minHeight: "12px",
            maxHeight: "84px",
          }}
          title={`${day}: ${safeCount} shipped`}
        >
          {!isEmpty && (
            <>
              <div className="absolute inset-x-1 top-1 h-3 rounded-full bg-white/35 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-70" />
            </>
          )}

          {isToday && !isEmpty && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-t from-transparent via-white/30 to-transparent"
              style={{ animationDuration: "2.4s" }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span
          className={`text-[11px] font-black tracking-wide ${tone.label}`}
          aria-label={`${day}${isToday ? ", today" : ""}`}
        >
          {day}
        </span>

        {isToday ? (
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.90)]" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
        )}
      </div>
    </div>
  );
}

function MomentumIndicator({ momentum, label }) {
  const configs = {
    rising: {
      Icon: TrendingUp,
      text: "text-teal-700 dark:text-teal-100",
      shell: "border-teal-200 bg-teal-50 dark:border-teal-300/25 dark:bg-teal-400/10",
      glow: "shadow-[0_0_24px_rgba(45,212,191,0.18)]",
    },
    building: {
      Icon: Sparkles,
      text: "text-violet-700 dark:text-violet-100",
      shell: "border-violet-200 bg-violet-50 dark:border-violet-300/25 dark:bg-violet-400/10",
      glow: "shadow-[0_0_24px_rgba(139,92,246,0.22)]",
    },
    steady: {
      Icon: Minus,
      text: "text-violet-700 dark:text-violet-100",
      shell: "border-violet-200 bg-violet-50 dark:border-violet-300/25 dark:bg-violet-400/10",
      glow: "shadow-[0_0_24px_rgba(139,92,246,0.18)]",
    },
    cooling: {
      Icon: TrendingDown,
      text: "text-amber-700 dark:text-amber-100",
      shell: "border-amber-200 bg-amber-50 dark:border-amber-300/25 dark:bg-amber-400/10",
      glow: "shadow-[0_0_24px_rgba(251,191,36,0.16)]",
    },
    recharging: {
      Icon: TrendingDown,
      text: "text-amber-700 dark:text-amber-100",
      shell: "border-amber-200 bg-amber-50 dark:border-amber-300/25 dark:bg-amber-400/10",
      glow: "shadow-[0_0_24px_rgba(251,191,36,0.16)]",
    },
    idle: {
      Icon: Sparkles,
      text: "text-slate-600 dark:text-white/75",
      shell: "border-slate-200 bg-white/75 dark:border-white/15 dark:bg-white/[0.07]",
      glow: "",
    },
  };

  const config = configs[momentum] || configs.idle;
  const { Icon } = config;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5
        text-xs font-black shadow-sm backdrop-blur-xl
        ${config.shell} ${config.text} ${config.glow}
      `}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label || "Warming up"}</span>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, tone = "violet" }) {
  const tones = {
    violet:
      "from-violet-500/14 via-violet-500/7 to-transparent border-violet-200/80 dark:border-violet-300/20 dark:from-violet-400/14",
    cyan:
      "from-cyan-500/14 via-cyan-500/7 to-transparent border-cyan-200/80 dark:border-cyan-300/20 dark:from-cyan-400/14",
    amber:
      "from-amber-500/14 via-amber-500/7 to-transparent border-amber-200/80 dark:border-amber-300/20 dark:from-amber-400/14",
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-3
        shadow-[0_10px_26px_rgba(15,23,42,0.06)]
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]
        dark:bg-white/[0.045] dark:shadow-[0_18px_42px_rgba(0,0,0,0.22)]
        ${tones[tone] || tones.violet}
      `}
    >
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/50 blur-2xl dark:bg-white/10" />

      <div className="relative flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-200" />
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/55">
          {label}
        </span>
      </div>

      <div className="relative mt-1 text-base font-black text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default function WeekInMotion({ className = "", onShipNow }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async ({ showLoading = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (showLoading) setLoading(true);

    try {
      const result = await fetchWeeklyRhythm();

      if (requestId !== requestIdRef.current) return;

      setData(result);
    } catch (error) {
      console.warn("[WeekInMotion] Fetch failed:", error?.message || error);

      if (requestId === requestIdRef.current) {
        setData(normalizeWeeklyRhythmPayload(null, null));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    const refreshSafely = () => {
      if (!disposed) refetch({ showLoading: false });
    };

    refetch({ showLoading: true });

    REFRESH_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, refreshSafely);
    });

    const onFocus = () => refreshSafely();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshSafely();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const poll = setInterval(refreshSafely, 15000);

    return () => {
      disposed = true;

      REFRESH_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, refreshSafely);
      });

      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(poll);
    };
  }, [refetch]);

  const displayData = data || normalizeWeeklyRhythmPayload(null, null);

  const maxCount = useMemo(() => {
    if (!displayData?.days) return 0;
    return Math.max(...displayData.days.map((day) => safeNumber(day.count, 0)), 0);
  }, [displayData]);

  const peakDate = displayData?.peakDay?.date || displayData?.peakDate || null;
  const normalizedPeakDate = peakDate ? toLocalDateKey(parseDate(peakDate)) : null;

  const showCTA =
    displayData &&
    (displayData.momentum === "recharging" ||
      displayData.momentum === "idle" ||
      displayData.momentum === "warming" ||
      displayData.momentum === "steady" ||
      displayData.momentum === "cooling");

  if (loading) {
    return (
      <div
        className={`
          relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6
          shadow-[0_18px_60px_rgba(139,92,246,0.10)]
          dark:border-white/12 dark:bg-[#11131c]
          ${className}
        `}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="animate-pulse">
          <div className="mb-6 h-4 w-44 rounded-full bg-slate-100 dark:bg-white/10" />
          <div className="mb-6 flex h-28 items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-1 justify-center">
                <div
                  className="w-8 rounded-t-2xl rounded-b-lg bg-slate-100 dark:bg-white/10"
                  style={{ height: `${24 + index * 6}px` }}
                />
              </div>
            ))}
          </div>
          <div className="h-3 w-3/4 rounded-full bg-slate-100 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        weekly-motion-panel relative overflow-hidden rounded-[2rem] border border-slate-200/80
        bg-white p-6 shadow-[0_18px_60px_rgba(139,92,246,0.10)]
        transition-all duration-300
        hover:border-violet-200 hover:shadow-[0_24px_72px_rgba(139,92,246,0.16)]
        dark:border-white/[0.12] dark:bg-[#11131c]
        dark:shadow-[0_24px_80px_rgba(0,0,0,0.40)]
        dark:hover:border-violet-300/30
        ${className}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/12 blur-3xl dark:bg-violet-500/18" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl dark:bg-cyan-400/14" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-50 dark:opacity-25" />

      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-white to-cyan-100 text-violet-700 shadow-[0_12px_30px_rgba(139,92,246,0.18)] ring-1 ring-white/70 dark:from-violet-500/20 dark:via-white/8 dark:to-cyan-400/15 dark:text-violet-100 dark:ring-white/10">
            <Zap className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Your Week in Motion
              </h3>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                <Radio className="h-3 w-3" />
                Live rhythm
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-white/50">
              Weekly shipping rhythm, active days, and execution trend.
            </p>
          </div>
        </div>

        <MomentumIndicator
          momentum={displayData.momentum}
          label={displayData.momentumLabel}
        />
      </div>

      <div className="relative rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white/90 via-slate-50/80 to-cyan-50/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/[0.14] dark:from-white/[0.07] dark:via-white/[0.045] dark:to-cyan-400/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-200" />
            <span className="text-[11px] font-black uppercase tracking-[0.20em] text-slate-500 dark:text-white/55">
              7-day rhythm map
            </span>
          </div>

          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 shadow-sm ring-1 ring-slate-200/80 dark:bg-black/25 dark:text-white/55 dark:ring-white/10">
            {displayData.activeDays || 0}/{displayData.totalDays || 7} active
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          {displayData.days.map((day, index) => (
            <RhythmBar
              key={day.date || index}
              day={day.day}
              count={day.count}
              maxCount={maxCount}
              isToday={day.isToday}
              isPeak={normalizedPeakDate && day.date === normalizedPeakDate}
            />
          ))}
        </div>
      </div>

      <div className="relative my-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/12" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.10] dark:bg-white/[0.045]">
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-white/75">
              {displayData.insight}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatChip
              icon={Zap}
              label="This week"
              value={`${displayData.thisWeekTotal || 0} shipped`}
              tone="violet"
            />

            <StatChip
              icon={CalendarDays}
              label="Active days"
              value={`${displayData.activeDays || 0}/${displayData.totalDays || 7}`}
              tone="cyan"
            />

            <StatChip
              icon={Activity}
              label="Last week"
              value={`${displayData.lastWeekTotal || 0} shipped`}
              tone="amber"
            />
          </div>
        </div>

        {showCTA && onShipNow && (
          <button
            type="button"
            onClick={onShipNow}
            className="flex-shrink-0 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-violet-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 hover:shadow-[0_14px_30px_rgba(139,92,246,0.16)] active:scale-95 dark:border-violet-300/20 dark:bg-violet-400/10 dark:text-violet-100 dark:hover:bg-violet-400/18"
          >
            Ship something
          </button>
        )}
      </div>
    </div>
  );
}
'''

path.write_text(content)

print("WeekInMotion visual polish applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Preserved the working weekly-rhythm API bridge")
print("- Upgraded the visual shell, header, rhythm map, bars, stat chips, and CTA")
print("- Kept realtime refresh events and polling")
print("")
print("No backend files touched.")
print("No Home.jsx layout files touched.")

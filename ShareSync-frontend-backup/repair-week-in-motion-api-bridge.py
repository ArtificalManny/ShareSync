from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/home/WeekInMotion.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/components/home/WeekInMotion.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-api-bridge-{stamp}")
shutil.copy2(path, backup)

content = r'''// src/components/home/WeekInMotion.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// WeekInMotion — user-scoped weekly rhythm
// API bridge repair:
// - Uses the confirmed working /api/users/me/weekly-rhythm endpoint first
// - Uses /api/users/me/stats as fallback support
// - Falls back to axios client only after direct API fetch fails
// - Always renders a 7-day week panel instead of dropping into a misleading empty state
// - Re-fetches on task/project/activity events, focus, visibility, and polling
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
      bar: "border border-dashed border-slate-300 bg-white/80 dark:border-white/15 dark:bg-white/[0.04]",
      glow: "",
      count: "text-slate-400 dark:text-white/35",
      label: "text-slate-400 dark:text-white/40",
    };
  }

  if (isPeak) {
    return {
      bar: "bg-gradient-to-t from-violet-700 via-violet-500 to-cyan-300 shadow-lg shadow-violet-500/25",
      glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/35 after:blur-sm",
      count: "text-violet-700 dark:text-violet-100",
      label: "text-violet-700 dark:text-violet-100",
    };
  }

  if (isToday) {
    return {
      bar: "bg-gradient-to-t from-indigo-600 via-violet-500 to-cyan-300 shadow-md shadow-violet-500/20 ring-2 ring-violet-300/70 ring-offset-2 ring-offset-white dark:ring-violet-300/50 dark:ring-offset-[#1f1f23]",
      glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/30 after:blur-sm",
      count: "text-indigo-700 dark:text-indigo-100",
      label: "text-indigo-700 dark:text-indigo-100",
    };
  }

  return {
    bar: "bg-gradient-to-t from-violet-600 via-violet-400 to-teal-300 shadow-sm shadow-violet-500/15",
    glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/25 after:blur-sm",
    count: "text-slate-700 dark:text-white/85",
    label: "text-slate-600 dark:text-white/65",
  };
}

function RhythmBar({ day, count, maxCount, isToday, isPeak }) {
  const safeCount = safeNumber(count, 0);
  const fillPercent = maxCount > 0 ? Math.max(14, (safeCount / maxCount) * 100) : 0;
  const isEmpty = safeCount === 0;
  const tone = getBarTone({ isEmpty, isToday, isPeak });

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative flex h-[104px] w-full items-end justify-center rounded-2xl bg-slate-50/80 px-1.5 pb-2 ring-1 ring-slate-100 dark:bg-white/[0.05] dark:ring-white/[0.08]">
        {safeCount > 0 && (
          <span
            className={`absolute top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold tabular-nums shadow-sm ring-1 ring-slate-100 dark:bg-black/30 dark:ring-white/[0.10] ${tone.count}`}
          >
            {safeCount}
          </span>
        )}

        <div
          className={`
            relative w-7 overflow-hidden rounded-t-xl rounded-b-md
            transition-all duration-700 ease-out
            ${tone.bar}
            ${tone.glow}
          `}
          style={{
            height: `${isEmpty ? 12 : Math.max(18, fillPercent * 0.74)}px`,
            minHeight: "12px",
            maxHeight: "76px",
          }}
          title={`${day}: ${safeCount} shipped`}
        >
          {isToday && !isEmpty && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-transparent animate-pulse"
              style={{ animationDuration: "2.5s" }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span
          className={`text-[11px] font-bold tracking-wide ${tone.label}`}
          aria-label={`${day}${isToday ? ", today" : ""}`}
        >
          {day}
        </span>

        {isToday ? (
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/40 dark:bg-violet-300" />
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
      color: "text-teal-700 dark:text-teal-100",
      bg: "bg-teal-50 dark:bg-teal-500/15",
      border: "border-teal-200 dark:border-teal-400/25",
    },
    building: {
      Icon: Sparkles,
      color: "text-violet-700 dark:text-violet-100",
      bg: "bg-violet-50 dark:bg-violet-500/15",
      border: "border-violet-200 dark:border-violet-400/25",
    },
    steady: {
      Icon: Minus,
      color: "text-violet-700 dark:text-violet-100",
      bg: "bg-violet-50 dark:bg-violet-500/15",
      border: "border-violet-200 dark:border-violet-400/25",
    },
    cooling: {
      Icon: TrendingDown,
      color: "text-amber-700 dark:text-amber-100",
      bg: "bg-amber-50 dark:bg-amber-500/15",
      border: "border-amber-200 dark:border-amber-400/25",
    },
    recharging: {
      Icon: TrendingDown,
      color: "text-amber-700 dark:text-amber-100",
      bg: "bg-amber-50 dark:bg-amber-500/15",
      border: "border-amber-200 dark:border-amber-400/25",
    },
    idle: {
      Icon: Sparkles,
      color: "text-slate-600 dark:text-white/70",
      bg: "bg-slate-50 dark:bg-white/[0.07]",
      border: "border-slate-200 dark:border-white/10",
    },
  };

  const config = configs[momentum] || configs.idle;
  const { Icon } = config;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label || "Warming up"}</span>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm dark:border-white/[0.14] dark:bg-white/[0.06]">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-200" />
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-white/55">
          {label}
        </span>
      </div>
      <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">
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
        className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(139,92,246,0.08)] dark:border-white/10 dark:bg-[#1f1f23] ${className}`}
      >
        <div className="animate-pulse">
          <div className="mb-6 h-4 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="mb-6 flex h-28 items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-1 justify-center">
                <div
                  className="w-7 rounded-t-xl rounded-b-md bg-slate-100 dark:bg-zinc-800"
                  style={{ height: `${24 + index * 6}px` }}
                />
              </div>
            ))}
          </div>
          <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(139,92,246,0.08)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_12px_38px_rgba(139,92,246,0.12)] dark:border-white/10 dark:bg-[#1f1f23] dark:hover:border-violet-500/30 ${className}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
              Your Week in Motion
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/45">
              Weekly shipping rhythm
            </p>
          </div>
        </div>

        <MomentumIndicator
          momentum={displayData.momentum}
          label={displayData.momentumLabel}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-4 dark:border-white/[0.12] dark:from-white/[0.06] dark:to-white/[0.03]">
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

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-white/75">
            {displayData.insight}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatChip
              icon={Zap}
              label="This week"
              value={`${displayData.thisWeekTotal || 0} shipped`}
            />

            <StatChip
              icon={CalendarDays}
              label="Active days"
              value={`${displayData.activeDays || 0}/${displayData.totalDays || 7}`}
            />

            <StatChip
              icon={Activity}
              label="Last week"
              value={`${displayData.lastWeekTotal || 0} shipped`}
            />
          </div>
        </div>

        {showCTA && onShipNow && (
          <button
            type="button"
            onClick={onShipNow}
            className="flex-shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-100 active:scale-95 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
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

print("WeekInMotion API bridge repair applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Replaced WeekInMotion.jsx with an API-bridge version")
print("- Directly fetches /api/users/me/weekly-rhythm and /api/users/me/stats first")
print("- Keeps axios client fallback")
print("- Always renders weekly bars and stat chips")
print("- Adds console.info('[WeekInMotion] normalized:', ...) for verification")
print("")
print("No backend files touched.")
print("No Home.jsx layout files touched.")

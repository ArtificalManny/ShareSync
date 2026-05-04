// src/components/home/WeekInMotion.jsx
import React, { useEffect, useState, useMemo } from "react";
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

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildFallbackWeekDays({ weeklyShips = 0, activeDays = 0 } = {}) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = (new Date().getDay() + 6) % 7;

  const days = labels.map((day, index) => ({
    day,
    date: null,
    count: 0,
    isToday: index === todayIndex,
  }));

  const safeActiveDays = Math.max(0, Math.min(7, safeNumber(activeDays, 0)));
  const safeWeeklyShips = Math.max(0, safeNumber(weeklyShips, 0));

  if (safeWeeklyShips <= 0 || safeActiveDays <= 0) {
    return days;
  }

  const eligibleIndexes = [];
  for (let index = 0; index <= todayIndex && eligibleIndexes.length < safeActiveDays; index += 1) {
    eligibleIndexes.push(index);
  }

  while (eligibleIndexes.length < safeActiveDays && eligibleIndexes.length < 7) {
    const next = eligibleIndexes.length;
    if (!eligibleIndexes.includes(next)) eligibleIndexes.push(next);
    else break;
  }

  const perDay = Math.floor(safeWeeklyShips / eligibleIndexes.length);
  const remainder = safeWeeklyShips % eligibleIndexes.length;

  eligibleIndexes.forEach((dayIndex, position) => {
    days[dayIndex].count = perDay + (position < remainder ? 1 : 0);
  });

  return days;
}

function normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload) {
  const rhythm = rhythmPayload && typeof rhythmPayload === "object" ? rhythmPayload : {};
  const stats = statsPayload && typeof statsPayload === "object" ? statsPayload : {};

  const weeklyShips = safeNumber(
    stats.weeklyShips ??
      stats.shipsThisWeek ??
      stats.shippedThisWeek ??
      rhythm.thisWeekTotal ??
      rhythm.weeklyShips,
    0
  );

  const activeDays = safeNumber(
    stats.activeDaysThisWeek ??
      stats.daysActiveThisWeek ??
      rhythm.activeDays,
    0
  );

  const lastWeekShips = safeNumber(
    stats.lastWeekShips ??
      stats.shipsLastWeek ??
      rhythm.lastWeekTotal,
    0
  );

  const rhythmDays = Array.isArray(rhythm.days) ? rhythm.days : [];
  const rhythmDayTotal = rhythmDays.reduce(
    (sum, day) => sum + safeNumber(day?.count, 0),
    0
  );

  const days =
    rhythmDays.length > 0 && (rhythmDayTotal > 0 || weeklyShips === 0)
      ? rhythmDays
      : buildFallbackWeekDays({
          weeklyShips,
          activeDays,
        });

  const momentum =
    weeklyShips >= 8 ? "strong" : weeklyShips > 0 ? "building" : "idle";

  const momentumLabel =
    rhythm.momentumLabel ||
    (weeklyShips >= 8 ? "Shipping" : weeklyShips > 0 ? "Building" : "Warming up");

  const insight =
    weeklyShips > 0
      ? `You shipped ${weeklyShips} item${weeklyShips === 1 ? "" : "s"} across ${activeDays} active day${activeDays === 1 ? "" : "s"} this week.`
      : rhythm.insight ||
        "Your weekly rhythm will appear here once you start shipping activity this week.";

  return {
    ...rhythm,
    days,
    thisWeekTotal: weeklyShips,
    weeklyShips,
    activeDays,
    totalDays: safeNumber(rhythm.totalDays, 7) || 7,
    lastWeekTotal: lastWeekShips,
    lastWeekShips,
    momentum,
    momentumLabel,
    insight,
  };
}

async function fetchWeeklyRhythm() {
  try {
    const [rhythmRes, statsRes] = await Promise.allSettled([
      client.get("/users/me/weekly-rhythm"),
      client.get("/users/me/stats"),
    ]);

    const rhythmPayload =
      rhythmRes.status === "fulfilled"
        ? rhythmRes.value?.data?.data || rhythmRes.value?.data || null
        : null;

    const statsPayload =
      statsRes.status === "fulfilled"
        ? statsRes.value?.data?.data || statsRes.value?.data || null
        : null;

    if (!rhythmPayload && !statsPayload) {
      return null;
    }

    return normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload);
  } catch (err) {
    console.warn("[WeekInMotion] Fetch failed:", err?.message);
    return null;
  }
}

function getBarTone({ isEmpty, isToday, isPeak }) {
  if (isEmpty) {
    return {
      bar: "border border-dashed border-slate-300 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]",
      glow: "",
      count: "text-slate-400 dark:text-white/30",
      label: "text-slate-400 dark:text-white/30",
    };
  }

  if (isPeak) {
    return {
      bar: "bg-gradient-to-t from-violet-700 via-violet-500 to-cyan-300 shadow-lg shadow-violet-500/25",
      glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/35 after:blur-sm",
      count: "text-violet-700 dark:text-violet-200",
      label: "text-violet-700 dark:text-violet-200",
    };
  }

  if (isToday) {
    return {
      bar: "bg-gradient-to-t from-indigo-600 via-violet-500 to-cyan-300 shadow-md shadow-violet-500/20 ring-2 ring-violet-300/70 ring-offset-2 ring-offset-white dark:ring-violet-400/40 dark:ring-offset-[#1f1f23]",
      glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/30 after:blur-sm",
      count: "text-indigo-700 dark:text-indigo-200",
      label: "text-indigo-700 dark:text-indigo-200",
    };
  }

  return {
    bar: "bg-gradient-to-t from-violet-600 via-violet-400 to-teal-300 shadow-sm shadow-violet-500/15",
    glow: "after:absolute after:inset-x-1 after:top-1 after:h-3 after:rounded-full after:bg-white/25 after:blur-sm",
    count: "text-slate-700 dark:text-white/75",
    label: "text-slate-600 dark:text-white/55",
  };
}

function RhythmBar({ day, count, maxCount, isToday, isPeak }) {
  const fillPercent = maxCount > 0 ? Math.max(14, (count / maxCount) * 100) : 0;
  const isEmpty = count === 0;
  const tone = getBarTone({ isEmpty, isToday, isPeak });

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative flex h-[104px] w-full items-end justify-center rounded-2xl bg-slate-50/80 px-1.5 pb-2 ring-1 ring-slate-100 dark:bg-white/[0.03] dark:ring-white/[0.05]">
        {count > 0 && (
          <span
            className={`absolute top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold tabular-nums shadow-sm ring-1 ring-slate-100 dark:bg-white/[0.08] dark:ring-white/[0.08] ${tone.count}`}
          >
            {count}
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
          title={`${day}: ${count} shipped`}
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
      color: "text-teal-700 dark:text-teal-200",
      bg: "bg-teal-50 dark:bg-teal-500/10",
      border: "border-teal-200 dark:border-teal-500/20",
    },
    steady: {
      Icon: Minus,
      color: "text-violet-700 dark:text-violet-200",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      border: "border-violet-200 dark:border-violet-500/20",
    },
    cooling: {
      Icon: TrendingDown,
      color: "text-amber-700 dark:text-amber-200",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
    },
    recharging: {
      Icon: TrendingDown,
      color: "text-amber-700 dark:text-amber-200",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
    },
    warming: {
      Icon: Sparkles,
      color: "text-slate-600 dark:text-white/60",
      bg: "bg-slate-50 dark:bg-white/[0.05]",
      border: "border-slate-200 dark:border-white/10",
    },
    idle: {
      Icon: Sparkles,
      color: "text-slate-600 dark:text-white/60",
      bg: "bg-slate-50 dark:bg-white/[0.05]",
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
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-white/35">
          {label}
        </span>
      </div>
      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default function WeekInMotion({ className = "", onShipNow }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch + re-fetch on task completions + gentle poll every 60s
  const refetch = React.useCallback(() => {
    fetchWeeklyRhythm().then((result) => {
      if (result) setData(result);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchWeeklyRhythm().then((result) => {
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    });

    // Re-fetch when a task is completed or shipped
    const onTaskDone = () => refetch();
    window.addEventListener("task.completed", onTaskDone);
    window.addEventListener("local-ship", onTaskDone);

    // Gentle poll every 60s to stay fresh
    const poll = setInterval(refetch, 60000);

    return () => {
      mounted = false;
      window.removeEventListener("task.completed", onTaskDone);
      window.removeEventListener("local-ship", onTaskDone);
      clearInterval(poll);
    };
  }, [refetch]);

  const maxCount = useMemo(() => {
    if (!data?.days) return 0;
    return Math.max(...data.days.map((d) => d.count), 0);
  }, [data]);

  const peakDate = data?.peakDay?.date || null;
  const showCTA =
    data &&
    (data.momentum === "recharging" ||
      data.momentum === "idle" ||
      data.momentum === "warming" ||
      data.momentum === "steady" ||
      data.momentum === "cooling");

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(139,92,246,0.08)] dark:border-white/10 dark:bg-[#1f1f23] ${className}`}
      >
        <div className="animate-pulse">
          <div className="mb-6 h-4 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="mb-6 flex h-28 items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-1 justify-center">
                <div
                  className="w-7 rounded-t-xl rounded-b-md bg-slate-100 dark:bg-zinc-800"
                  style={{ height: `${24 + i * 6}px` }}
                />
              </div>
            ))}
          </div>
          <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!data || !data.days?.length) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(139,92,246,0.08)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_12px_38px_rgba(139,92,246,0.12)] dark:border-white/10 dark:bg-[#1f1f23] dark:hover:border-violet-500/30 ${className}`}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
              Your Week in Motion
            </h3>
          </div>

          <MomentumIndicator momentum="idle" label="Warming up" />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-250 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-white/75">
            Your weekly rhythm will appear here once you start shipping activity this week.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-white/45">
            Complete or ship a task to begin building your motion pattern.
          </p>

          {onShipNow && (
            <button
              onClick={onShipNow}
              className="mt-4 inline-flex items-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-100 active:scale-95 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
            >
              Ship something
            </button>
          )}
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
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/35">
              Weekly shipping rhythm
            </p>
          </div>
        </div>

        <MomentumIndicator
          momentum={data.momentum}
          label={data.momentumLabel}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-4 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-white/[0.02]">
        <div className="flex items-end justify-between gap-2">
          {data.days.map((d, i) => (
            <RhythmBar
              key={d.date || i}
              day={d.day}
              count={d.count}
              maxCount={maxCount}
              isToday={d.isToday}
              isPeak={peakDate && d.date === peakDate}
            />
          ))}
        </div>
      </div>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-white/75">
            {data.insight}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatChip
              icon={Zap}
              label="This week"
              value={`${data.thisWeekTotal || 0} shipped`}
            />

            <StatChip
              icon={CalendarDays}
              label="Active days"
              value={`${data.activeDays || 0}/${data.totalDays || 7}`}
            />

            <StatChip
              icon={Activity}
              label="Last week"
              value={`${data.lastWeekTotal || 0} shipped`}
            />
          </div>
        </div>

        {showCTA && onShipNow && (
          <button
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

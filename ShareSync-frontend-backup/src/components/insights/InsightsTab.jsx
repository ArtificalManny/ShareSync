// src/components/insights/InsightsTab.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS TAB — Project analytics dashboard with real metrics + Activity Feed
// ✅ Uses /activities/stats for real computed metrics
// ✅ Includes WeeklyMomentumReport ("Spotify Wrapped" card)
// ✅ Includes ActivityFeed showing all project member activity
// ✅ Resilient: Weekly Report + Activity Feed always render even if metrics fail
// ✅ Proper light/dark mode
// ✅ Preserves MetricCard, SprintHealth, Signal Breakdown, and Activity Feed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Gauge, Clock3, Target, Users2, Activity, BarChart3, AlertTriangle, CalendarClock } from 'lucide-react';
import { getProjectInsights } from '../../api/insights';
import MetricCard from './MetricCard';
import SprintHealth from './SprintHealth';
import ActivityFeed from './ActivityFeed';
import WeeklyMomentumReport from './WeeklyMomentumReport';

function SignalBreakdown({ sources }) {
  const total = sources.reduce((sum, source) => sum + Number(source.count || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-300">
          <BarChart3 className="h-4 w-4" strokeWidth={2.15} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Signal Breakdown</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Where this project's movement is coming from.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sources.map((source) => {
          const percent = total ? Math.round((Number(source.count || 0) / total) * 100) : 0;

          return (
            <div key={source.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                  {source.label}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{source.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.08]">
                <div
                  className={`h-full rounded-full ${source.barClass}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-zinc-400">{source.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const InsightsTab = ({
  projectId,
  refreshKey = 0,
  project = null,
  tasks = [],
  activity = [],
  roadmapItems = [],
  scheduleEvents = [],
  announcements = [],
  scheduleCount = 0,
  announcementCount = 0,
}) => {
  const [range, setRange] = useState('7d');

  const signalsTasks = Array.isArray(tasks)
    ? tasks
    : Array.isArray(tasks?.items)
      ? tasks.items
      : [];

  const signalsActivity = Array.isArray(activity)
    ? activity
    : Array.isArray(activity?.items)
      ? activity.items
      : [];

  const signalsMembers = Array.isArray(project?.members) ? project.members : [];

  const signalsRoadmapItems = Array.isArray(roadmapItems)
    ? roadmapItems
    : Array.isArray(roadmapItems?.items)
      ? roadmapItems.items
      : [];

  const signalsScheduleEvents = Array.isArray(scheduleEvents)
    ? scheduleEvents
    : Array.isArray(scheduleEvents?.items)
      ? scheduleEvents.items
      : [];

  const signalsAnnouncements = Array.isArray(announcements)
    ? announcements
    : Array.isArray(announcements?.items)
      ? announcements.items
      : [];

  const getTaskStatus = (task) =>
    String(task?.status || task?.state || task?.stage || "").toLowerCase();

  const getTaskCompletedAt = (task) =>
    task?.completedAt || task?.completed_at || task?.finishedAt || task?.shippedAt || null;

  const getTaskDueAt = (task) =>
    task?.dueDate || task?.dueAt || task?.deadline || task?.targetDate || task?.endDate || null;

  const isTaskCompleted = (task) => {
    const status = getTaskStatus(task);
    return Boolean(getTaskCompletedAt(task)) ||
      status.includes("complete") ||
      status.includes("done") ||
      status.includes("shipped");
  };

  const isTaskBlocked = (task) => {
    const status = getTaskStatus(task);
    return status.includes("block") ||
      status.includes("risk") ||
      status.includes("stuck") ||
      Boolean(task?.blocked || task?.isBlocked);
  };

  const now = new Date();
  const rangeDays = Number.parseInt(range, 10) || 7;
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - rangeDays);

  const previousRangeStart = new Date(rangeStart);
  previousRangeStart.setDate(rangeStart.getDate() - rangeDays);

  const isOpenOverdue = (item) => {
    if (isTaskCompleted(item)) return false;
    const dueAt = getTaskDueAt(item);
    if (!dueAt) return false;
    const dueDate = new Date(dueAt);
    return !Number.isNaN(dueDate.getTime()) && dueDate < now;
  };

  const getScheduleDate = (event) =>
    event?.start ||
    event?.startDate ||
    event?.startsAt ||
    event?.date ||
    event?.scheduledAt ||
    event?.dueDate ||
    null;

  const isPastScheduleEvent = (event) => {
    const status = getTaskStatus(event);
    if (
      status.includes("cancel") ||
      status.includes("complete") ||
      status.includes("done")
    ) {
      return false;
    }

    const scheduledAt = getScheduleDate(event);
    if (!scheduledAt) return false;
    const scheduledDate = new Date(scheduledAt);
    return !Number.isNaN(scheduledDate.getTime()) && scheduledDate < now;
  };

  const completedTasks = signalsTasks.filter(isTaskCompleted);
  const completedRoadmapItems = signalsRoadmapItems.filter(isTaskCompleted);

  const openTasks = signalsTasks.filter((task) => !isTaskCompleted(task));
  const blockedTasks = openTasks.filter(isTaskBlocked);
  const blockedRoadmapItems = signalsRoadmapItems
    .filter((item) => !isTaskCompleted(item))
    .filter(isTaskBlocked);

  const overdueTasks = openTasks.filter(isOpenOverdue);
  const overdueRoadmapItems = signalsRoadmapItems.filter(isOpenOverdue);
  const overdueScheduleEvents = signalsScheduleEvents.filter(isPastScheduleEvent);

  const completedSignalItems = [...completedTasks, ...completedRoadmapItems];

  const completedInRange = completedSignalItems.filter((item) => {
    const completedAt = getTaskCompletedAt(item);
    if (!completedAt) return false;
    const completedDate = new Date(completedAt);
    return !Number.isNaN(completedDate.getTime()) && completedDate >= rangeStart;
  });

  const completedPreviousRange = completedSignalItems.filter((item) => {
    const completedAt = getTaskCompletedAt(item);
    if (!completedAt) return false;
    const completedDate = new Date(completedAt);
    return !Number.isNaN(completedDate.getTime()) &&
      completedDate >= previousRangeStart &&
      completedDate < rangeStart;
  });

  const activeMemberNames = new Set(
    signalsActivity
      .filter((item) => {
        const createdAt = item?.createdAt || item?.updatedAt || item?.timestamp || item?.time;
        if (!createdAt) return false;
        const date = new Date(createdAt);
        return !Number.isNaN(date.getTime()) && date >= rangeStart;
      })
      .map((item) =>
        item?.actorName ||
        item?.userName ||
        item?.createdByName ||
        item?.actor?.name ||
        item?.user?.name ||
        item?.createdBy?.name
      )
      .filter(Boolean)
  );

  const completedTrend = completedPreviousRange.length
    ? Math.round(((completedInRange.length - completedPreviousRange.length) / completedPreviousRange.length) * 100)
    : completedInRange.length > 0
      ? 100
      : 0;

  const completableSignalsTotal = signalsTasks.length + signalsRoadmapItems.length;
  const completionRate = completableSignalsTotal
    ? Math.round((completedSignalItems.length / completableSignalsTotal) * 100)
    : 0;

  const signalsSnapshot = {
    completedInRange: completedInRange.length,
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length + overdueRoadmapItems.length + overdueScheduleEvents.length,
    blockedTasks: blockedTasks.length + blockedRoadmapItems.length,
    activeMembers: activeMemberNames.size || signalsMembers.length,
    completionRate,
    completedTrend,
  };

  const signalBreakdownSources = [
    {
      label: "Tasks",
      count: signalsTasks.length,
      caption: `${openTasks.length} open, ${completedTasks.length} complete`,
      barClass: "bg-violet-500",
    },
    {
      label: "Roadmap",
      count: signalsRoadmapItems.length,
      caption: `${completedRoadmapItems.length} complete, ${blockedRoadmapItems.length} blocked`,
      barClass: "bg-cyan-500",
    },
    {
      label: "Schedule",
      count: signalsScheduleEvents.length || scheduleCount,
      caption: `${overdueScheduleEvents.length} past due`,
      barClass: "bg-amber-500",
    },
    {
      label: "Updates",
      count: signalsAnnouncements.length || announcementCount,
      caption: "announcements posted",
      barClass: "bg-emerald-500",
    },
  ];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const payload = await getProjectInsights(projectId, range);
        if (isMounted) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load insights.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInsights();
    return () => { isMounted = false; };
  }, [projectId, range]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RESILIENT LAYOUT: Weekly Report + Activity Feed always render.
  // Metrics section shows loading/error/data states independently.
  // ═════════════════════════════════════════════════════════════════════════════

  const metrics = {
    completed: {
      value: signalsSnapshot.completedInRange,
      trend: signalsSnapshot.completedTrend,
      unit: `${range.toUpperCase()} done`,
    },
    open: {
      value: signalsSnapshot.openTasks,
      trend: null,
      unit: "open",
    },
    overdue: {
      value: signalsSnapshot.overdueTasks,
      trend: null,
      unit: "past due",
    },
    blocked: {
      value: signalsSnapshot.blockedTasks,
      trend: null,
      unit: "blocked",
    },
  };

  const aiInsights = data?.aiInsights;

  return (
    <div className="insights-tab-shell space-y-6 pb-20">
      <style>
        {`
          .insights-tab-shell {
            position: relative;
          }

          .insights-tab-shell::before {
            content: "";
            position: absolute;
            inset: -24px -18px auto -18px;
            height: 320px;
            pointer-events: none;
            background:
              radial-gradient(circle at 8% 12%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.13), transparent 34%);
            opacity: 0.85;
            z-index: -1;
          }

          .insights-tab-header {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.18);
            border-radius: 2.25rem;
            padding: 1.6rem 1.75rem;
            background:
              radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.16), transparent 34%),
              radial-gradient(circle at 55% 105%, rgba(16, 185, 129, 0.12), transparent 36%),
              linear-gradient(135deg, rgba(255,255,255,0.97), rgba(248,250,252,0.84));
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.82);
            backdrop-filter: blur(20px);
          }

          .insights-tab-header::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
          }

          .insights-tab-header::after {
            content: "";
            position: absolute;
            right: -80px;
            top: -90px;
            width: 260px;
            height: 260px;
            border-radius: 999px;
            background: rgba(139, 92, 246, 0.14);
            filter: blur(42px);
            pointer-events: none;
          }

          .dark .insights-tab-header {
            border-color: rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.12), transparent 34%),
              radial-gradient(circle at 55% 105%, rgba(16, 185, 129, 0.10), transparent 36%),
              linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88));
            box-shadow:
              0 34px 110px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }

          .insights-header-icon {
            box-shadow:
              0 18px 42px rgba(139, 92, 246, 0.18),
              inset 0 1px 0 rgba(255,255,255,0.72);
          }

          .dark .insights-header-icon {
            box-shadow:
              0 20px 54px rgba(139, 92, 246, 0.20),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }

          .insights-range-selector {
            border-radius: 999px !important;
            background: rgba(255,255,255,0.74) !important;
            box-shadow:
              0 12px 32px rgba(15,23,42,0.08),
              inset 0 1px 0 rgba(255,255,255,0.72);
          }

          .dark .insights-range-selector {
            background: rgba(15,23,42,0.70) !important;
            box-shadow:
              0 14px 40px rgba(0,0,0,0.32),
              inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .insights-momentum-banner {
            background:
              radial-gradient(circle at 3% 35%, rgba(16,185,129,0.22), transparent 28%),
              linear-gradient(135deg, rgba(236,253,245,0.96), rgba(240,253,250,0.78)) !important;
            border-color: rgba(16,185,129,0.28) !important;
            box-shadow:
              0 18px 52px rgba(16,185,129,0.10),
              inset 0 1px 0 rgba(255,255,255,0.70) !important;
          }

          .dark .insights-momentum-banner {
            background:
              radial-gradient(circle at 3% 35%, rgba(16,185,129,0.18), transparent 28%),
              linear-gradient(135deg, rgba(6,78,59,0.30), rgba(2,6,23,0.72)) !important;
            border-color: rgba(16,185,129,0.22) !important;
          }

          .insights-metrics-grid > *,
          .insights-charts-grid > div > * {
            position: relative;
            overflow: hidden;
            border-color: rgba(148,163,184,0.36) !important;
            background:
              radial-gradient(circle at 12% 0%, rgba(139,92,246,0.10), transparent 32%),
              radial-gradient(circle at 88% 0%, rgba(34,211,238,0.08), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.88)) !important;
            box-shadow:
              0 20px 58px rgba(15,23,42,0.10),
              inset 0 1px 0 rgba(255,255,255,0.72) !important;
            backdrop-filter: blur(16px);
            transition:
              transform 220ms ease,
              box-shadow 220ms ease,
              border-color 220ms ease;
          }

          .insights-metrics-grid > *:hover,
          .insights-charts-grid > div > *:hover {
            transform: translateY(-2px);
            border-color: rgba(124,58,237,0.36) !important;
            box-shadow:
              0 30px 78px rgba(124,58,237,0.16),
              inset 0 1px 0 rgba(255,255,255,0.80) !important;
          }

          .dark .insights-metrics-grid > *,
          .dark .insights-charts-grid > div > * {
            border-color: rgba(255,255,255,0.10) !important;
            background:
              radial-gradient(circle at 12% 0%, rgba(139,92,246,0.16), transparent 32%),
              radial-gradient(circle at 88% 0%, rgba(34,211,238,0.10), transparent 30%),
              linear-gradient(180deg, rgba(15,23,42,0.86), rgba(2,6,23,0.78)) !important;
            box-shadow:
              0 28px 90px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.07) !important;
          }

          .insights-metrics-grid > *::before,
          .insights-charts-grid > div > *::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.82;
          }
        `}
      </style>

      {/* Header & Controls */}
      <div className="insights-tab-header flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative z-10 flex min-w-0 items-start gap-4">
          <div className="insights-header-icon relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
            <BarChart3 className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Signals
              </h2>

              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                Signals
              </span>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                Live Metrics
              </span>
            </div>

            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
              Track velocity, cycle time, completion health, and team activity from one live signal board.
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="insights-range-selector relative z-10 flex w-fit border border-slate-200 p-1 dark:border-white/[0.08]">
          {['7d', '14d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition-colors ${
                range === r
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Weekly Momentum Report — always renders, fetches its own data */}
      <WeeklyMomentumReport projectId={projectId} embedded />

      {/* Metrics Section — degrades gracefully */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-500 dark:text-zinc-500">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading metrics...</p>
          </div>
        </div>
      ) : error || !metrics ? (
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            {error || 'Metrics will appear after more project activity.'}
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* AI Insights Banner (Optional but awesome) */}
          {aiInsights && aiInsights.length > 0 && (
            <div className="insights-momentum-banner bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">
              <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <div>
                <h4 className="text-slate-800 dark:text-zinc-100 font-semibold text-sm">{aiInsights[0].title}</h4>
                <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{aiInsights[0].description}</p>
              </div>
            </div>
          )}

          {/* Top Metrics Grid */}
          <div className="insights-metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Completed"
              icon={Gauge}
              iconTone="violet"
              value={metrics.completed.value}
              trend={metrics.completed.trend}
              unit={metrics.completed.unit}
            />
            <MetricCard
              title="Open Tasks"
              icon={Clock3}
              iconTone="blue"
              value={metrics.open.value}
                unit={metrics.open.unit}
              
            />
            <MetricCard
              title="Overdue"
              icon={CalendarClock}
              iconTone="emerald"
              value={metrics.overdue.value}
                unit={metrics.overdue.unit}
            />
            <MetricCard
              title="Blocked"
              icon={Users2}
              iconTone="cyan"
              value={metrics.blocked.value}
                unit={metrics.blocked.unit}
            />
          </div>

          {/* Main Charts Grid */}
          <div className="insights-charts-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <SprintHealth
                icon={Activity}
                completionRate={signalsSnapshot.completionRate}
              />
            </div>
            <div className="lg:col-span-2">
              <SignalBreakdown sources={signalBreakdownSources} />
            </div>
          </div>
        </>
      )}

      {/* ✅ Activity Feed — always renders, fetches its own data with task fallback */}
      <ActivityFeed projectId={projectId} limit={100} refreshKey={refreshKey} />
    </div>
  );
};

export default InsightsTab;

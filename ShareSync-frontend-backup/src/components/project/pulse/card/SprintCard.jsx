import React from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Play,
  Rocket,
  Timer,
} from "lucide-react";

function readNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, readNumber(value, 0)));
}

function getSprintName(sprint, overview) {
  return (
    sprint?.name ||
    sprint?.title ||
    overview?.sprint?.name ||
    overview?.sprint?.title ||
    ""
  );
}

function getSprintStatus(sprint, overview) {
  return String(
    sprint?.status ||
      overview?.sprint?.status ||
      ""
  ).trim();
}

function getDaysLeft(sprint, overview) {
  return (
    sprint?.daysLeft ??
    sprint?.daysRemaining ??
    overview?.sprint?.daysLeft ??
    overview?.sprint?.daysRemaining ??
    null
  );
}

function getSprintProgress(sprint, overview) {
  return clampPercent(
    sprint?.progress ??
      sprint?.completionRate ??
      overview?.sprint?.progress ??
      overview?.sprint?.completionRate ??
      0
  );
}

function getStatusLabel(status, isEmpty) {
  if (isEmpty) return "Ready to launch";

  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("complete")) return "Complete";
  if (normalized.includes("active")) return "Active sprint";
  if (normalized.includes("paused")) return "Paused";
  if (normalized.includes("planned")) return "Planned";

  return status || "Live";
}

export default function SprintCard({
  sprint,
  onAction,
  project,
  overview,
  loading,
  isStarting = false,
}) {
  const name = getSprintName(sprint, overview);
  const status = getSprintStatus(sprint, overview);
  const daysLeft = getDaysLeft(sprint, overview);
  const progress = getSprintProgress(sprint, overview);
  const isEmpty = !name;

  const statusLabel = getStatusLabel(status, isEmpty);
  const ringProgress = isEmpty ? 12 : progress;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-violet-500 to-cyan-400" />
      <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

      <header className="relative mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-400/10 dark:bg-blue-500/10 dark:text-blue-300">
            <Timer className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Sprint
              </h3>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                Rhythm
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Two-week execution cycle for pace, focus, and delivery.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-400">
          {loading ? "Loading…" : statusLabel}
        </span>
      </header>

      {isEmpty ? (
        <div className="relative rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/70 p-5 dark:border-blue-400/10 dark:from-blue-500/10 dark:via-white/[0.03] dark:to-violet-500/10">
          <div className="mb-5 flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90">
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-slate-200 dark:text-zinc-800"
                />
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-blue-500 transition-all duration-700"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Ready
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Launch your first execution cycle.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                Set a 2-week goal to track velocity, build rhythm, and turn scattered work into a measurable push.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <CalendarDays className="mb-2 h-4 w-4 text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Window
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                14d
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <CheckCircle2 className="mb-2 h-4 w-4 text-teal-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Progress
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                0%
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <Timer className="mb-2 h-4 w-4 text-violet-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                State
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                Open
              </p>
            </div>
          </div>

          {onAction ? (
            <button
              onClick={() => onAction("start")}
              type="button"
              disabled={isStarting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isStarting ? "Starting Sprint…" : "Start Your First Sprint"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/70 p-5 dark:border-blue-400/10 dark:from-blue-500/10 dark:via-white/[0.03] dark:to-cyan-500/10">
          <div className="mb-5 flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90">
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-slate-200 dark:text-zinc-800"
                />
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-blue-500 transition-all duration-700"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-950 dark:text-white">
                  {progress}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Done
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-slate-950 dark:text-white">
                {name}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                Sprint is active. Keep the execution cycle moving until the current push is closed.
              </p>
            </div>
          </div>

          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Progress
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {progress}%
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Days Left
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {daysLeft != null ? `${daysLeft}d` : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Status
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {statusLabel}
              </p>
            </div>
          </div>

          {onAction ? (
            <button
              onClick={() => onAction(progress >= 100 ? "review" : "continue")}
              type="button"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50 dark:border-blue-400/10 dark:bg-white/[0.04] dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              {progress >= 100 ? "Review Sprint" : "View Sprint"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}

          <p className="mt-3 text-xs text-slate-400 dark:text-zinc-500">
            Project: {project?.name || project?.title || "this project"}
          </p>
        </div>
      )}
    </section>
  );
}

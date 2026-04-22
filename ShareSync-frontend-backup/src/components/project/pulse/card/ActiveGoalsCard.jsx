import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Link2,
  User2,
  Loader2,
  ArrowRight,
} from "lucide-react";

function formatDueDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusMeta(status, blocked) {
  if (blocked || status === "blocked") {
    return {
      label: "Blocked",
      pill:
        "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    };
  }

  switch (status) {
    case "completed":
      return {
        label: "Completed",
        pill:
          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      };
    case "at_risk":
      return {
        label: "At risk",
        pill:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      };
    case "in_progress":
      return {
        label: "In progress",
        pill:
          "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
      };
    default:
      return {
        label: "Planned",
        pill:
          "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:border-white/[0.08]",
      };
  }
}

function normalizeProgress(progress) {
  const num = Number(progress);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export default function ActiveGoalsCard({
  goals = [],
  loading = false,
  onGoalClick,
}) {
  const items = Array.isArray(goals) ? goals : [];
  const visibleGoals = items.slice(0, 4);

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              Active Goals
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Focus
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {items.length} active
          </span>
        ) : null}
      </header>

      {loading && items.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 mx-auto mb-3 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            Syncing active goals…
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Pulling the latest objective snapshot.
          </p>
        </div>
      ) : visibleGoals.length > 0 ? (
        <div className="space-y-3">
          {visibleGoals.map((goal, index) => {
            const status = getStatusMeta(goal?.status, goal?.blocked);
            const progress = normalizeProgress(goal?.progress);
            const linkedTaskCount = Number(goal?.linkedTaskCount || 0);
            const completedTaskCount = Number(goal?.completedTaskCount || 0);
            const ownerName = goal?.ownerName || "Owner not set";
            const dueLabel = formatDueDate(goal?.dueDate);
            const summary = goal?.summary || "";
            const clickable = typeof onGoalClick === "function";

            return (
              <button
                key={goal?.id || goal?._id || `goal-${index}`}
                type="button"
                onClick={() => clickable && onGoalClick(goal)}
                className={[
                  "w-full text-left rounded-2xl border border-slate-200 dark:border-white/[0.06]",
                  "bg-slate-50/70 dark:bg-zinc-900/40 px-4 py-4 transition-all",
                  clickable
                    ? "hover:bg-white dark:hover:bg-zinc-900/60 hover:border-teal-200 dark:hover:border-teal-500/20"
                    : "cursor-default",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                        {goal?.title || "Untitled goal"}
                      </h4>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${status.pill}`}
                      >
                        {status.label}
                      </span>

                      {goal?.blocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Needs attention
                        </span>
                      ) : null}
                    </div>

                    {summary ? (
                      <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {summary}
                      </p>
                    ) : null}
                  </div>

                  {clickable ? (
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  ) : null}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                      Progress
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal?.blocked
                          ? "bg-red-400"
                          : progress >= 100
                            ? "bg-emerald-500"
                            : progress >= 60
                              ? "bg-teal-500"
                              : "bg-violet-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <User2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ownerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dueLabel}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {completedTaskCount} / {linkedTaskCount} tasks done
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {items.length > visibleGoals.length ? (
            <div className="pt-1 text-xs text-slate-400 dark:text-zinc-500">
              Showing {visibleGoals.length} of {items.length} active goals.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 mx-auto mb-3 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            No active goals yet
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Promote a priority task or define a sprint goal to focus the team.
          </p>
        </div>
      )}
    </section>
  );
}

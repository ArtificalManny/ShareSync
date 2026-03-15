import React from "react";
import { Play, Timer, ArrowRight } from "lucide-react";

export default function SprintCard({ sprint, onAction, project, overview, loading }) {
  const name = sprint?.name || sprint?.title || overview?.sprint?.name;
  const status = sprint?.status || overview?.sprint?.status;
  const daysLeft = sprint?.daysLeft ?? overview?.sprint?.daysLeft;
  const progress = sprint?.progress ?? overview?.sprint?.progress ?? 0;

  const isEmpty = !name;

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Sprint</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">
          {loading ? "Loading…" : status || "Live"}
        </span>
      </header>

      {isEmpty ? (
        <div className="text-center py-3">
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3">
            Set a 2-week goal to track velocity and build rhythm.
          </p>
          {onAction && (
            <button
              onClick={() => onAction("start")}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/15 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start Your First Sprint
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-sm font-medium text-slate-700 dark:text-zinc-200 mb-2">{name}</div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>{progress}% complete</span>
            {daysLeft != null && <span>{daysLeft}d left</span>}
          </div>

          {onAction && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onAction("continue")}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                View Sprint
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
            Project: {project?.name || project?.title || "—"}
          </div>
        </div>
      )}
    </section>
  );
}

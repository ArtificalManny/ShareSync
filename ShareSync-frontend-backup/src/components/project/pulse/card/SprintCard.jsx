import React from "react";

export default function SprintCard({ sprint, onAction, project, overview, loading }) {
  const name = sprint?.name || sprint?.title || overview?.sprint?.name;
  const status = sprint?.status || overview?.sprint?.status;

  return (
    <section className="glass-card p-4">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-90">Sprint</h3>
        <span className="text-xs opacity-60">{loading ? "Loading…" : status || "Live"}</span>
      </header>

      <div className="text-sm opacity-80">
        {name ? (
          <div className="opacity-90">{name}</div>
        ) : (
          <div className="opacity-70">Ready to sprint? Set a 2-week goal to track velocity.</div>
        )}

        {onAction && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onAction("start")}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs"
              type="button"
            >
              Start
            </button>
            <button
              onClick={() => onAction("continue")}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs"
              type="button"
            >
              Continue
            </button>
          </div>
        )}

        <div className="mt-2 text-xs opacity-60">
          Project: {project?.name || project?.title || project?._id || "—"}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Activity, Rocket } from "lucide-react";

export default function LiveActivityCard({ activities, overview, loading }) {
  const items =
    activities?.items ||
    activities ||
    overview?.activity?.items ||
    overview?.recentActivity ||
    [];

  const list = Array.isArray(items) ? items : [];

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Live Activity</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">
          {loading ? "Loading…" : "Now"}
        </span>
      </header>

      {list.length > 0 ? (
        <ul className="space-y-2.5">
          {list.slice(0, 4).map((it, i) => (
            <li
              key={it?._id || it?.id || i}
              className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span>{it?.text || it?.message || it?.title || it?.type || "Activity"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            No activity yet
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Ship your first update to see the feed come alive.
          </p>
        </div>
      )}
    </section>
  );
}

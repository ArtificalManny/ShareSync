import React from "react";

export default function LiveActivityCard({ activities, overview, loading }) {
  const items =
    activities?.items ||
    activities ||
    overview?.activity?.items ||
    overview?.recentActivity ||
    [];

  const list = Array.isArray(items) ? items : [];

  return (
    <section className="glass-card p-4">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-90">Live Activity</h3>
        <span className="text-xs opacity-60">{loading ? "Loading…" : "Now"}</span>
      </header>

      <div className="text-sm opacity-80">
        {list.length > 0 ? (
          <ul className="space-y-2">
            {list.slice(0, 4).map((it, i) => (
              <li key={it?._id || it?.id || i} className="text-xs opacity-80">
                {it?.text || it?.message || it?.title || it?.type || "Activity"}
              </li>
            ))}
          </ul>
        ) : (
          <div className="opacity-70">No activity yet (placeholder)</div>
        )}
      </div>
    </section>
  );
}

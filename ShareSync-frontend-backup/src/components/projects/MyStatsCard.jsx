import React, { memo, useMemo } from "react";

/**
 * Props (optional):
 *  - stats: { labels: string[]; values: number[] }
 * If not provided, we render a stable placeholder (also memoized).
 */
function Chart({ labels, values }) {
  // Derived props (memoized) to avoid recalcs and re-renders
  const max = useMemo(() => Math.max(1, ...values), [values]);
  return (
    <div
      role="img"
      aria-label="Weekly activity mini chart"
      className="grid grid-cols-7 gap-2 items-end h-20"
    >
      {values.map((v, i) => {
        const h = Math.round((v / max) * 100);
        return (
          <div key={labels[i]} className="flex flex-col items-center">
            <div
              className="w-6 rounded-md bg-indigo-600/80"
              style={{ height: `${Math.max(6, h)}%` }}
              aria-hidden="true"
            />
            <span className="mt-1 text-[10px] text-slate-500">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

const MemoChart = memo(Chart);

function MyStatsCardBase({ stats }) {
  // Provide stable defaults (so parent rerenders don’t change identity)
  const data = useMemo(
    () =>
      stats || {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        values: [3, 4, 6, 5, 7, 2, 1],
      },
    [stats]
  );

  return (
    <section
      className="card p-4 rounded-2xl"
      aria-labelledby="mystats-title"
      role="region"
    >
      <h3 id="mystats-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        My Stats
      </h3>
      <MemoChart labels={data.labels} values={data.values} />
    </section>
  );
}

export default memo(MyStatsCardBase);

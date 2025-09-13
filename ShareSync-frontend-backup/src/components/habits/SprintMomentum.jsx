import React, { useMemo } from "react";
import SectionHeader from "../ui/SectionHeader";
import TraceOutline from "../ui/TraceOutline";

/**
 * SprintMomentum
 * props:
 *  - data: Array<{ date: string|Date, count: number }>
 *  - range: number (days) – default 7
 */
export default function SprintMomentum({ data = [], range = 7 }) {
  const days = useMemo(() => {
    // normalize to exactly `range` bars (oldest -> newest)
    const map = new Map((data || []).map((d) => [new Date(d.date).toDateString(), Number(d.count) || 0]));
    const out = [];
    for (let i = range - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000);
      out.push({
        key: day.toDateString(),
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        v: map.get(day.toDateString()) || 0,
      });
    }
    const max = Math.max(1, ...out.map((d) => d.v));
    return out.map((d) => ({ ...d, h: Math.round((d.v / max) * 100) }));
  }, [data, range]);

  return (
    <TraceOutline color="var(--info)" stroke={1.5} radius={16} speedMs={4600}>
      <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="p-4">
          <SectionHeader icon="Timer" subtitle="Daily completed sprints">
            Sprint Momentum
          </SectionHeader>

          <div className="mt-3 grid grid-cols-7 gap-2 min-h-[86px] items-end">
            {days.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md transition-[height] motion-quick"
                  style={{
                    height: `${Math.max(6, d.h)}%`,
                    background:
                      "linear-gradient(180deg, var(--info) 0%, color-mix(in srgb, var(--accent) 60%, var(--info)) 100%)",
                  }}
                  title={`${d.label}: ${d.v}`}
                  aria-label={`${d.label} ${d.v} sprints`}
                />
                <div className="text-[10px] text-muted">{d.label.slice(0, 1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TraceOutline>
  );
}
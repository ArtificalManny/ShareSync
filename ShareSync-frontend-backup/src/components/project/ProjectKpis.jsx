// src/components/project/ProjectKpis.jsx
import React, { useMemo, useState, useEffect } from "react";
import KpiDrilldownModal from "../modals/KpiDrilldownModal.jsx";

const RANGE_KEY = "ss.kpi.range";

function KpiCard({ title, value, sub, onClick, tooltip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`${title} details`}
      title={tooltip}
    >
      <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{sub}</div>
    </button>
  );
}

export default function ProjectKpis({ project }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [series, setSeries] = useState([]);
  const [savedRange, setSavedRange] = useState("14d");

  useEffect(() => {
    try {
      setSavedRange(localStorage.getItem(RANGE_KEY) || "14d");
    } catch {}
  }, [modalOpen]);

  // Build sparkline series (fallback if BE doesn’t provide)
  useEffect(() => {
    const src = project?.stats?.activitySeries || project?.activitySeries || [];
    if (Array.isArray(src) && src.length) {
      setSeries(src.map((d) => ({ date: d.date || d.ts || d.day, value: d.value ?? d.count ?? 0 })));
    } else {
      const today = new Date();
      const arr = Array.from({ length: 28 }, (_, i) => {
        const dt = new Date(today.getTime() - (27 - i) * 86400000);
        return { date: dt.toISOString().slice(0, 10), value: Math.round(50 + Math.random() * 50) };
      });
      setSeries(arr);
    }
  }, [project]);

  const cadence = project?.stats?.cadence14d ?? project?.cadence14d ?? 0;
  const onTime = project?.stats?.onTimePct ?? project?.onTimePct ?? 0;
  const throughput = project?.stats?.velocity7d ?? project?.velocity7d ?? 0;

  const sub = useMemo(() => {
    const map = { "14d": "Last 14 days", "30d": "Last 30 days", "90d": "Last 90 days", all: "All time" };
    return map[savedRange] || "Last 14 days";
  }, [savedRange]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Cadence"
          value={`${Math.round(cadence)}`}
          sub={sub}
          onClick={() => setModalOpen(true)}
          tooltip="Cadence: recent activity score (recency-weighted over time)."
        />
        <KpiCard
          title="On-time Completion"
          value={`${Math.round(onTime)}%`}
          sub="Last 30 days"
          onClick={() => setModalOpen(true)}
          tooltip="On-time Completion: % of tasks completed by or before due date in the last 30 days."
        />
        <KpiCard
          title="Throughput"
          value={`${Math.round(throughput)}/wk`}
          sub="Tasks per week"
          onClick={() => setModalOpen(true)}
          tooltip="Throughput: average completed tasks per week (rolling)."
        />
      </div>

      <KpiDrilldownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cadence"
        subtitle="Activity over time"
        series={series}
        unit=""
      />
    </>
  );
}

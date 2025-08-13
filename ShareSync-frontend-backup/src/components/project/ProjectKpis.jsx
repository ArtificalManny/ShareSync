// /src/components/project/ProjectKpis.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Card({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function ProjectKpis() {
  const { id } = useParams();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch(`/api/projects/${id}/kpis`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setKpis(data);
      } catch (e) {
        if (!ignore) setErr('Failed to load KPIs');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (id) run();
    return () => { ignore = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl p-4 border border-rose-200/60 dark:border-rose-400/20 bg-white dark:bg-slate-900">
        <div className="text-rose-600 dark:text-rose-400 text-sm">{err}</div>
      </div>
    );
  }

  const onTime = `${kpis?.onTimePct ?? 0}%`;
  const cadence = `${kpis?.updateCadenceDays ?? 0} d`;
  const resp = `${kpis?.responsivenessHrs ?? 0} h`;
  const velocity = `${kpis?.velocityPer7d ?? 0}/7d`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card label="On-time" value={onTime} sub="Completed by due date" />
      <Card label="Update cadence" value={cadence} sub="Avg days between updates" />
      <Card label="Responsiveness" value={resp} sub="Median h to first reply" />
      <Card label="Velocity" value={velocity} sub="Tasks per 7 days" />
    </div>
  );
}

// src/components/pulse/PulsePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PULSE PANEL (Phase 2): Lightweight heartbeat widget (Gebbia-Grade Polish)
// - Upgraded to Card Surfaces with tactile hover states.
// - Standardized typography scales and grid spacing.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Flame, Zap, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { fetchPulseMetrics } from "../../api/taskApi";

export default function PulsePanel({ projectId, refreshKey = 0, className = "" }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPulseMetrics({ projectId });
        if (!cancelled) setPulse(data);
      } catch (e) {
        if (!cancelled) setPulse(null);
        console.warn("[PulsePanel] fetch failed:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  if (!projectId) return null;

  const doneToday = pulse?.doneToday ?? 0;
  const inMotion = pulse?.inMotion ?? 0;
  const blocked = pulse?.blocked ?? 0;
  const doneLast7Days = pulse?.doneLast7Days ?? 0;
  const createdToday = pulse?.createdToday ?? 0;
  const movedToReviewToday = pulse?.movedToReviewToday ?? 0;

  return (
    <div
      className={`
        card-surface p-6
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-warning" />
          <h3 className="text-[15px] font-bold text-text-primary tracking-tight">
            Pulse Activity
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Syncing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-success-subtle text-success px-2 py-0.5 rounded-full border border-success-200">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Flame className="w-4 h-4 text-warning" />}
          label="Today Shipped"
          value={doneToday}
          hint="Completed today"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-brand" />}
          label="In Motion"
          value={inMotion}
          hint="Todo + In Progress"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-error" />}
          label="Blocked"
          value={blocked}
          hint="Needs attention"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-border-default grid grid-cols-3 gap-4">
        <MiniStat label="7-Day Ships" value={doneLast7Days} icon={<TrendingUp className="w-4 h-4" />} />
        <MiniStat label="Created Today" value={createdToday} />
        <MiniStat label="To Review" value={movedToReviewToday} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="p-4 rounded-xl bg-surface-secondary border border-border-default hover:bg-white hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md cursor-default group">
      <div className="flex items-center gap-2 text-text-secondary text-[13px] font-semibold mb-3">
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span>{label}</span>
      </div>
      <div className="text-3xl font-black text-text-primary tabular-nums tracking-tight">{value}</div>
      {hint && <div className="text-[11px] font-medium text-text-tertiary mt-2 tracking-wide uppercase">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="p-3.5 rounded-xl bg-surface-primary border border-border-default hover:border-brand-100 transition-colors duration-200">
      <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
        {icon && <span className="text-text-tertiary">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-xl font-black text-text-primary tabular-nums">{value}</div>
    </div>
  );
}

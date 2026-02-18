// src/components/pulse/PulsePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PULSE PANEL (Phase 2): Lightweight heartbeat widget (task timestamp-based)
// - Safe: read-only
// - Updates: re-fetch when refreshKey changes (ProjectHome bumps this on taskUpdated)
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
        // intentionally silent (avoid toast spam on socket bursts)
        console.warn("[PulsePanel] fetch failed:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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
      className={[
        "p-6 rounded-2xl bg-surface-1 border border-white/[0.06]",
        "shadow-lg shadow-black/10",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-warning-400" />
          <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">
            Pulse
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              syncing
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-400" />
              live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Flame className="w-4 h-4 text-warning-400" />}
          label="Today shipped"
          value={doneToday}
          hint="done today"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-brand-400" />}
          label="In motion"
          value={inMotion}
          hint="todo + in progress"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-error-400" />}
          label="Blocked"
          value={blocked}
          hint="waiting on dependencies"
        />
      </div>

      <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-4">
        <MiniStat label="7-day ships" value={doneLast7Days} icon={<TrendingUp className="w-4 h-4" />} />
        <MiniStat label="Created today" value={createdToday} />
        <MiniStat label="To review today" value={movedToReviewToday} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
      <div className="flex items-center gap-2 text-text-tertiary text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold text-text-primary">{value}</div>
      {hint ? <div className="text-[11px] text-text-tertiary mt-1">{hint}</div> : null}
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="p-3 rounded-xl bg-surface-0/40 border border-white/[0.04]">
      <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
        {icon ? <span className="text-text-tertiary">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-text-primary">{value}</div>
    </div>
  );
}

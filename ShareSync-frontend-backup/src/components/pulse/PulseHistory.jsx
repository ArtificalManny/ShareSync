// src/components/pulse/PulseHistory.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Personal Pulse History
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows mood/energy over time chart + blocker log.
// Uses data from usePulseCheck.fetchHistory() or accepts pulses as prop.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { getEnergyConfig, detectBurnout } from '../../hooks/usePulseCheck';

// ─────────────────────────────────────────────────────────────────────────
// ENERGY BAR (single day)
// ─────────────────────────────────────────────────────────────────────────
const EnergyBar = ({ pulse, maxHeight = 48 }) => {
  const config = getEnergyConfig(pulse.energy);
  const height = Math.max(8, (pulse.energy / 5) * maxHeight);
  const dateLabel = new Date(pulse.date || pulse.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center gap-1" title={`${dateLabel}: ${config.label} (${config.emoji})`}>
      <span className="text-xs">{config.emoji}</span>
      <div
        className="w-6 rounded-t-md transition-all duration-300"
        style={{
          height: `${height}px`,
          backgroundColor: config.color,
          opacity: 0.8,
        }}
      />
      <span className="text-[9px] text-slate-400 dark:text-zinc-500">{dateLabel.split(' ')[1]}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// BLOCKER LOG ITEM
// ─────────────────────────────────────────────────────────────────────────
const BlockerLogItem = ({ pulse }) => {
  if (!pulse?.blocker?.hasBlocker) return null;

  const dateLabel = new Date(pulse.date || pulse.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-start gap-3 py-2">
      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-600 dark:text-zinc-300">
          {pulse.blocker.description || 'Blocker reported (no details)'}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{dateLabel}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function PulseHistory({
  pulses = [],
  onFetchHistory,
  days = 14,
  className = '',
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && onFetchHistory) {
      onFetchHistory(days).then(() => setLoaded(true)).catch(() => setLoaded(true));
    }
  }, [loaded, onFetchHistory, days]);

  // Sort by date, newest last (for chart)
  const sorted = useMemo(() => {
    return [...pulses]
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt))
      .slice(-days);
  }, [pulses, days]);

  // Stats
  const stats = useMemo(() => {
    if (sorted.length === 0) return { avg: 0, trend: 0, blockerCount: 0 };

    const energies = sorted.map((p) => p.energy ?? 3);
    const avg = energies.reduce((s, e) => s + e, 0) / energies.length;

    // Trend: compare last 3 to first 3
    const first3 = energies.slice(0, 3);
    const last3 = energies.slice(-3);
    const avgFirst = first3.reduce((s, e) => s + e, 0) / first3.length;
    const avgLast = last3.reduce((s, e) => s + e, 0) / last3.length;
    const trend = avgLast - avgFirst;

    const blockerCount = sorted.filter((p) => p.blocker?.hasBlocker).length;

    return { avg: Math.round(avg * 10) / 10, trend: Math.round(trend * 10) / 10, blockerCount };
  }, [sorted]);

  const burnout = useMemo(() => detectBurnout(sorted), [sorted]);

  const blockers = useMemo(() => {
    return sorted.filter((p) => p.blocker?.hasBlocker).reverse();
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <div className={`p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] text-center ${className}`}>
        <Calendar className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-zinc-400">No pulse history yet</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Complete your first daily pulse to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-200">Pulse History</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Last {sorted.length} days</span>
      </div>

      {/* Burnout warning */}
      {burnout.isBurnout && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">
            {burnout.streak} consecutive low-energy days detected. Consider taking a break or reaching out for support.
          </p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-[#09090B]">
          <div className="text-lg font-bold text-slate-800 dark:text-zinc-200">{stats.avg}</div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500">Avg Energy</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-[#09090B]">
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
            stats.trend > 0 ? 'text-teal-600' : stats.trend < 0 ? 'text-red-500' : 'text-slate-500'
          }`}>
            {stats.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : stats.trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
            {stats.trend > 0 ? '+' : ''}{stats.trend}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500">Trend</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-[#09090B]">
          <div className={`text-lg font-bold ${stats.blockerCount > 0 ? 'text-red-500' : 'text-teal-600'}`}>
            {stats.blockerCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500">Blockers</div>
        </div>
      </div>

      {/* Energy chart (bar chart) */}
      <div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Energy over time</p>
        <div className="flex items-end gap-1 overflow-x-auto pb-1">
          {sorted.map((pulse, idx) => (
            <EnergyBar key={pulse._id || idx} pulse={pulse} />
          ))}
        </div>
      </div>

      {/* Blocker log */}
      {blockers.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Recent Blockers</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {blockers.slice(0, 5).map((p, idx) => (
              <BlockerLogItem key={p._id || idx} pulse={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/navbar/MomentumPulse.jsx
import React from 'react';
import { Flame, Zap, Target, Loader2 } from 'lucide-react';
import useMomentumStats from '../../hooks/useMomentumStats';

/**
 * MomentumPulse - Shows real-time momentum metrics in navbar
 * 
 * Displays:
 * - 🔥 Ships today
 * - ⚡ Active teammates
 * - 🎯 Week progress %
 */
export default function MomentumPulse() {
  const { stats, loading, error } = useMomentumStats();

  if (loading) {
    return (
      <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400">Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - don't show error in navbar
  }

  return (
    <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
      {/* 🔥 SHIPS TODAY */}
      <Stat
        icon={<Flame className="w-3.5 h-3.5" />}
        value={stats.shipsToday}
        color="text-orange-500"
        tooltip="Ships today"
      />

      <Divider />

      {/* ⚡ ACTIVE TEAMMATES */}
      <Stat
        icon={<Zap className="w-3.5 h-3.5" />}
        value={stats.activeTeammates}
        color="text-yellow-500"
        tooltip="Active teammates"
      />

      <Divider />

      {/* 🎯 WEEK PROGRESS */}
      <Stat
        icon={<Target className="w-3.5 h-3.5" />}
        value={`${stats.weekProgress}%`}
        color="text-blue-500"
        tooltip="Week progress"
      />
    </div>
  );
}

/**
 * Stat - Individual metric display
 */
function Stat({ icon, value, color, tooltip }) {
  return (
    <div
      className="flex items-center gap-1.5 group cursor-help"
      title={tooltip}
    >
      <div className={color}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-200 tabular-nums">
        {value}
      </span>
    </div>
  );
}

/**
 * Divider - Separator between stats
 */
function Divider() {
  return (
    <div className="w-px h-4 bg-slate-700/50" />
  );
}

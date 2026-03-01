// src/components/pulse/TeamEnergyHeatmap.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Team Energy Heatmap (Manager View)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Grid: rows = team members, columns = days
// Color-coded cells by energy level (1-5).
//
// Data shape expected (from GET /api/pulse/team/:projectId):
// {
//   members: [
//     { name: "Sarah", pulses: [{ date: "...", energy: 4 }, ...] },
//     ...
//   ],
//   days: ["2025-02-20", "2025-02-21", ...],
// }
//
// ZERO BACKEND CHANGES (designed to work with future endpoint)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { getEnergyConfig } from '../../hooks/usePulseCheck';

// ─────────────────────────────────────────────────────────────────────────
// ENERGY CELL
// ─────────────────────────────────────────────────────────────────────────
const EnergyCell = ({ energy }) => {
  if (energy === null || energy === undefined) {
    return (
      <div
        className="w-8 h-8 rounded-md border border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-[#09090B]"
        title="No data"
      />
    );
  }

  const config = getEnergyConfig(energy);

  return (
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center text-xs cursor-default transition-transform hover:scale-110"
      style={{ backgroundColor: config.color + '20', border: `1px solid ${config.color}40` }}
      title={`${config.label} (${energy}/5)`}
    >
      <span className="text-[11px]">{config.emoji}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function TeamEnergyHeatmap({
  members = [],
  days = [],
  className = '',
}) {
  // Format day labels
  const dayLabels = useMemo(() => {
    return days.map((d) => {
      const date = new Date(d);
      return {
        full: d,
        short: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: date.getDate(),
      };
    });
  }, [days]);

  // Detect any burnout (3+ consecutive ≤2 for any member)
  const burnoutMembers = useMemo(() => {
    const flagged = [];
    for (const member of members) {
      if (!Array.isArray(member.pulses)) continue;
      const sorted = [...member.pulses].sort((a, b) => new Date(b.date) - new Date(a.date));
      let lowStreak = 0;
      for (const p of sorted) {
        if ((p.energy ?? 3) <= 2) lowStreak++;
        else break;
      }
      if (lowStreak >= 3) flagged.push({ name: member.name, streak: lowStreak });
    }
    return flagged;
  }, [members]);

  if (members.length === 0 || days.length === 0) {
    return (
      <div className={`p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] text-center ${className}`}>
        <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-zinc-400">No team pulse data yet</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Team members need to submit pulses first
        </p>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-200">Team Energy</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">{days.length} days</span>
      </div>

      {/* Burnout alerts */}
      {burnoutMembers.length > 0 && (
        <div className="space-y-1.5">
          {burnoutMembers.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">{m.name}</span> — {m.streak} consecutive low-energy days
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10px] text-slate-400 dark:text-zinc-500 font-normal pb-2 pr-3 min-w-[100px]">
                Member
              </th>
              {dayLabels.map((d) => (
                <th key={d.full} className="text-center pb-2 px-0.5">
                  <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">{d.short}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{d.day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              // Build a map of date -> energy for quick lookup
              const energyMap = {};
              (member.pulses || []).forEach((p) => {
                const key = new Date(p.date).toISOString().split('T')[0];
                energyMap[key] = p.energy;
              });

              return (
                <tr key={member.name}>
                  <td className="text-xs text-slate-600 dark:text-zinc-300 font-medium pr-3 py-1 truncate max-w-[120px]">
                    {member.name}
                  </td>
                  {days.map((d) => {
                    const dayKey = new Date(d).toISOString().split('T')[0];
                    const energy = energyMap[dayKey] ?? null;
                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        <EnergyCell energy={energy} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
        {[1, 2, 3, 4, 5].map((val) => {
          const config = getEnergyConfig(val);
          return (
            <div key={val} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: config.color + '40', border: `1px solid ${config.color}60` }}
              />
              <span className="text-[9px] text-slate-400 dark:text-zinc-500">{config.emoji}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// src/components/retro/WeeklyStats.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Stats Summary
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  Zap, 
  Clock, 
  Target, 
  Flame, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Minus,
} from 'lucide-react';

/**
 * WeeklyStats - Summary statistics display
 */
export default function WeeklyStats({ stats, comparison }) {
  if (!stats) return null;

  const {
    totalTasks,
    totalFocusHours,
    focusSessions,
    currentStreak,
    collaborationCount,
    avgTasksPerDay,
  } = stats;

  const statItems = [
    {
      icon: Zap,
      label: 'Tasks Shipped',
      value: totalTasks,
      color: 'text-brand',
      bgColor: 'bg-brand/10',
    },
    {
      icon: Target,
      label: 'Focus Sessions',
      value: focusSessions,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Clock,
      label: 'Deep Work Hours',
      value: `${totalFocusHours}h`,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${currentStreak}d`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Users,
      label: 'Collaborations',
      value: collaborationCount,
      color: 'text-accent-500',
      bgColor: 'bg-accent-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Avg/Day',
      value: avgTasksPerDay,
      color: 'text-text-secondary',
      bgColor: 'bg-surface-2',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className={`
                p-4 rounded-xl ${item.bgColor}
                flex flex-col items-center text-center
              `}
            >
              <Icon className={`w-5 h-5 ${item.color} mb-2`} />
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week over week comparison */}
      {comparison && (
        <WeekComparison comparison={comparison} />
      )}
    </div>
  );
}

/**
 * Week over week comparison
 */
function WeekComparison({ comparison }) {
  const { tasksDiff, tasksPercent, improved } = comparison;

  const TrendIcon = tasksDiff > 0 ? TrendingUp : tasksDiff < 0 ? TrendingDown : Minus;
  const trendColor = tasksDiff > 0 ? 'text-success' : tasksDiff < 0 ? 'text-error' : 'text-text-tertiary';
  const bgColor = tasksDiff > 0 ? 'bg-success/10' : tasksDiff < 0 ? 'bg-error/10' : 'bg-surface-2';

  return (
    <div className={`
      flex items-center justify-between
      p-4 rounded-xl ${bgColor}
    `}>
      <div className="flex items-center gap-3">
        <TrendIcon className={`w-5 h-5 ${trendColor}`} />
        <div>
          <span className="text-sm text-text-secondary">vs last week</span>
          <div className={`text-lg font-semibold ${trendColor}`}>
            {tasksDiff > 0 ? '+' : ''}{tasksDiff} tasks ({tasksPercent > 0 ? '+' : ''}{tasksPercent}%)
          </div>
        </div>
      </div>
      
      {improved && (
        <div className="text-2xl">🎉</div>
      )}
    </div>
  );
}

/**
 * StatCard - Individual stat with more detail
 */
export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend, 
  color = 'brand' 
}) {
  const colorClasses = {
    brand: { text: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/20' },
    success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    info: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  };

  const c = colorClasses[color] || colorClasses.brand;

  return (
    <div className={`
      p-5 rounded-xl border
      ${c.bg} ${c.border}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <div className={`
            flex items-center gap-1 text-xs font-medium
            ${trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-text-tertiary'}
          `}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : 
             trend < 0 ? <TrendingDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className={`text-3xl font-bold ${c.text} mb-1`}>
        {value}
      </div>
      <div className="text-sm text-text-secondary">{label}</div>
      {subValue && (
        <div className="text-xs text-text-tertiary mt-1">{subValue}</div>
      )}
    </div>
  );
}

/**
 * MiniStat - Compact inline stat
 */
export function MiniStat({ icon: Icon, value, label, color = 'brand' }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 text-${color}`} />
      <span className="font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </div>
  );
}

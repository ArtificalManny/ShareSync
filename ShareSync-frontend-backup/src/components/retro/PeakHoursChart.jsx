// src/components/retro/PeakHoursChart.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Peak Hours Visualization
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset } from 'lucide-react';

/**
 * PeakHoursChart - Visualize productive hours
 */
export default function PeakHoursChart({ hourlyDistribution = [] }) {
  const maxValue = Math.max(...hourlyDistribution, 1);
  
  // Find peak hours
  const peakHours = useMemo(() => {
    return hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);
  }, [hourlyDistribution]);

  // Group hours into periods
  const periods = [
    { name: 'Morning', hours: [6, 7, 8, 9, 10, 11], icon: Sunrise, color: 'warning' },
    { name: 'Afternoon', hours: [12, 13, 14, 15, 16, 17], icon: Sun, color: 'brand' },
    { name: 'Evening', hours: [18, 19, 20, 21], icon: Sunset, color: 'accent-500' },
    { name: 'Night', hours: [22, 23, 0, 1, 2, 3, 4, 5], icon: Moon, color: 'info' },
  ];

  const periodTotals = periods.map(period => ({
    ...period,
    total: period.hours.reduce((sum, h) => sum + (hourlyDistribution[h] || 0), 0),
  }));

  const topPeriod = periodTotals.sort((a, b) => b.total - a.total)[0];

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand" />
          Peak Hours
        </h3>
        {topPeriod && topPeriod.total > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <topPeriod.icon className={`w-3.5 h-3.5 text-${topPeriod.color}`} />
            <span className="text-text-secondary">{topPeriod.name} person</span>
          </div>
        )}
      </div>

      {/* 24-hour chart */}
      <div className="mb-4">
        <div className="flex items-end gap-0.5 h-24">
          {hourlyDistribution.map((count, hour) => {
            const height = maxValue > 0 ? (count / maxValue) * 100 : 0;
            const isPeak = peakHours.includes(hour);
            
            return (
              <div
                key={hour}
                className="flex-1 relative group"
                title={`${hour}:00 - ${count} tasks`}
              >
                <div
                  className={`
                    w-full rounded-t transition-all duration-300
                    ${isPeak 
                      ? 'bg-brand shadow-sm shadow-brand/30' 
                      : count > 0 
                        ? 'bg-brand/30' 
                        : 'bg-surface-2'
                    }
                    group-hover:bg-brand/50
                  `}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                
                {/* Tooltip */}
                <div className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  px-2 py-1 rounded bg-surface-3 text-xs text-text-primary
                  opacity-0 group-hover:opacity-100 transition-opacity
                  whitespace-nowrap z-10 pointer-events-none
                ">
                  {formatHour(hour)}: {count} task{count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Hour labels */}
        <div className="flex justify-between mt-2 text-[10px] text-text-tertiary">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>12am</span>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {periodTotals.map(period => {
          const Icon = period.icon;
          const isTop = period.name === topPeriod?.name && topPeriod.total > 0;
          
          return (
            <div
              key={period.name}
              className={`
                p-2 rounded-lg text-center
                ${isTop ? `bg-${period.color}/10 border border-${period.color}/20` : 'bg-surface-2'}
              `}
            >
              <Icon className={`w-4 h-4 mx-auto mb-1 text-${period.color}`} />
              <div className={`text-lg font-bold ${isTop ? `text-${period.color}` : 'text-text-primary'}`}>
                {period.total}
              </div>
              <div className="text-[10px] text-text-tertiary">{period.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format hour for display
 */
function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${period}`;
}

/**
 * DayOfWeekChart - Show productivity by day
 */
export function DayOfWeekChart({ dailyDistribution = [] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxValue = Math.max(...dailyDistribution, 1);
  const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <h3 className="font-semibold text-text-primary mb-4">
        Daily Distribution
      </h3>
      
      <div className="space-y-2">
        {days.map((day, i) => {
          const count = dailyDistribution[i] || 0;
          const width = maxValue > 0 ? (count / maxValue) * 100 : 0;
          const isPeak = i === peakDay && count > 0;
          
          return (
            <div key={day} className="flex items-center gap-3">
              <span className={`
                w-8 text-xs font-medium
                ${isPeak ? 'text-brand' : 'text-text-tertiary'}
              `}>
                {day}
              </span>
              <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
                <div
                  className={`
                    h-full rounded transition-all duration-500
                    ${isPeak ? 'bg-brand' : 'bg-brand/40'}
                  `}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className={`
                w-6 text-xs text-right
                ${isPeak ? 'text-brand font-bold' : 'text-text-tertiary'}
              `}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

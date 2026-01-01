import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export default function ReliabilityLens({ data }) {
  if (!data) return null;

  const { streakDaysShownUp, totalDays, missedDays, mostCommonReason, insight } = data;
  const showUpRate = Math.round((streakDaysShownUp / totalDays) * 100);

  return (
    <div className="modern-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="heading-3">Reliability</h3>
      </div>

      {/* Show-up rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="caption-text">Show-up rate</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {showUpRate}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${showUpRate}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="caption-text">
            {streakDaysShownUp}/{totalDays} days
          </span>
          {missedDays > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {missedDays} missed
            </span>
          )}
        </div>
      </div>

      <div className="divider-modern" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card-modern">
          <div className="stat-label">Shown up</div>
          <div className="stat-value text-xl">{streakDaysShownUp}</div>
        </div>
        <div className="stat-card-modern">
          <div className="stat-label">Missed</div>
          <div className="stat-value text-xl">{missedDays}</div>
        </div>
      </div>

      {/* Most common reason */}
      {mostCommonReason && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="caption-text mb-1">Most common skip reason</div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {mostCommonReason}
          </p>
        </div>
      )}

      {/* Insight */}
      {insight && (
        <>
          <div className="divider-modern" />
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-500/10">
            <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {insight}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

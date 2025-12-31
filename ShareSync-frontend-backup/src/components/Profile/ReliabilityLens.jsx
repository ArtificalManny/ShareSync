import React from 'react';
import { Target, Calendar, TrendingUp, Lightbulb } from 'lucide-react';

export default function ReliabilityLens({ data }) {
  if (!data) return null;

  const {
    streakDays,
    daysShowedUp,
    totalDays,
    missedDays,
    showUpRate,
    missedReason,
    insight
  } = data;

  // Color based on show-up rate
  const getColor = () => {
    if (showUpRate >= 90) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
    if (showUpRate >= 70) return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' };
    if (showUpRate >= 50) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' };
    return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' };
  };

  const colors = getColor();

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold">Reliability</h3>
      </div>

      {/* Show-up Rate */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-400">{daysShowedUp}/{totalDays}</div>
          <div className="text-xs text-slate-400">Days shown up</div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold ${colors.text}`}>{showUpRate}%</div>
          <div className="text-xs text-slate-400">Show-up rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-400">{missedDays}</div>
          <div className="text-xs text-slate-400">Missed this month</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full bg-gradient-to-r ${colors.bg.replace('/10', '')} ${colors.border.replace('/20', '')} transition-all duration-500`}
          style={{ width: `${showUpRate}%` }}
        />
      </div>

      {/* Most Common Reason */}
      {missedReason && (
        <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Most common reason for missed days:</span>
          </div>
          <p className="text-sm text-slate-400">{missedReason}</p>
        </div>
      )}

      {/* Self-Knowledge Insight */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-300 mb-1">💡 Self-knowledge, not guilt:</p>
            <p className="text-sm text-slate-300">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

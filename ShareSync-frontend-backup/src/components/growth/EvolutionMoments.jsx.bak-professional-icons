// src/components/growth/EvolutionMoments.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Evolution Moments - Role Transitions (High Contrast Responsive)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  ArrowRight, Sparkles, Trophy, ChevronDown, ChevronUp,
  Star, Target
} from 'lucide-react';

const ROLE_CONFIG = {
  Beginner: { color: 'text-slate-500 dark:text-zinc-400', bg: 'bg-slate-100 dark:bg-white/5', icon: '🌱' },
  Contributor: { color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10', icon: '✅' },
  Builder: { color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', icon: '🔨' },
  Architect: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: '🏗️' },
  Leader: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: '👑' },
  Visionary: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: '🚀' },
};

function EvolutionCard({ moment, isLatest = false }) {
  const [isExpanded, setIsExpanded] = useState(isLatest);

  const fromConfig = ROLE_CONFIG[moment.from] || ROLE_CONFIG.Beginner;
  const toConfig = ROLE_CONFIG[moment.to] || ROLE_CONFIG.Builder;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className={`
      rounded-xl border overflow-hidden transition-all
      ${isLatest 
        ? 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-200 dark:border-violet-500/30 shadow-sm' 
        : 'bg-white dark:bg-[#1a1a1c] border-slate-200/80 dark:border-white/5'
      }
    `}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        {/* Badge */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-white/50 dark:border-white/5
          ${toConfig.bg}
        `}>
          {moment.badge || toConfig.icon}
        </div>

        {/* Transition */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${fromConfig.color}`}>{moment.from}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <span className={`text-sm font-black tracking-wide ${toConfig.color}`}>{moment.to}</span>
            {isLatest && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                Current
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-500">{formatDate(moment.date)}</p>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          {/* Explanation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-4 shadow-inner">
            <div className="flex items-start gap-2.5 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed">
                {moment.explanation}
              </p>
            </div>
          </div>

          {/* Achievements */}
          {moment.achievements?.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                Key Achievements
              </h5>
              <div className="space-y-2.5">
                {moment.achievements.map((achievement, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Trophy className="w-4 h-4 text-amber-500 drop-shadow-sm" />
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {moment.metrics && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(moment.metrics).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center shadow-sm">
                  <div className="text-xl font-black text-slate-900 dark:text-white mb-0.5">{value}</div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvolutionMoments({
  moments = [],
  loading,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2].map(i => (
          <div key={i} className="p-4 rounded-xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-100 dark:bg-zinc-800 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Star className="w-6 h-6 text-amber-500 drop-shadow-sm" />
        <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">Evolution Journey</h3>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {moments.map((moment, i) => (
          <EvolutionCard
            key={moment.id}
            moment={moment}
            isLatest={i === 0}
          />
        ))}
      </div>

      {/* Next Evolution Hint */}
      {moments.length > 0 && (
        <div className="mt-5 p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-white/10 shadow-inner">
              <Target className="w-5 h-5 text-slate-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide mb-0.5">Next Evolution</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                Continue growing to unlock <span className="text-slate-700 dark:text-zinc-300">{moments[0]?.to === 'Architect' ? 'Leader' : 'Architect'}</span> status
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

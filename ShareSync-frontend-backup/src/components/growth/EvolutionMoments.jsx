// src/components/growth/EvolutionMoments.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Evolution Moments - Role Transitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  ArrowRight, Sparkles, Trophy, ChevronDown, ChevronUp,
  Star, Zap, Target
} from 'lucide-react';

const ROLE_CONFIG = {
  Beginner: { color: 'text-text-tertiary', bg: 'bg-surface-2', icon: '🌱' },
  Contributor: { color: 'text-success', bg: 'bg-success/10', icon: '✅' },
  Builder: { color: 'text-brand', bg: 'bg-brand/10', icon: '🔨' },
  Architect: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: '🏗️' },
  Leader: { color: 'text-warning', bg: 'bg-warning/10', icon: '👑' },
  Visionary: { color: 'text-energy-500', bg: 'bg-energy-500/10', icon: '🚀' },
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
      rounded-xl border overflow-hidden
      ${isLatest 
        ? 'bg-brand/5 border-brand/20' 
        : 'bg-surface-1 border-white/[0.06]'
      }
    `}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface-2/50 transition-colors"
      >
        {/* Badge */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          ${toConfig.bg}
        `}>
          {moment.badge || toConfig.icon}
        </div>

        {/* Transition */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${fromConfig.color}`}>{moment.from}</span>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <span className={`text-sm font-semibold ${toConfig.color}`}>{moment.to}</span>
            {isLatest && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary">{formatDate(moment.date)}</p>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-tertiary" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          {/* Explanation */}
          <div className="p-4 rounded-lg bg-surface-2/50 border border-white/[0.04] mb-4">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary leading-relaxed">
                {moment.explanation}
              </p>
            </div>
          </div>

          {/* Achievements */}
          {moment.achievements?.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                Key Achievements
              </h5>
              <div className="space-y-2">
                {moment.achievements.map((achievement, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Trophy className="w-3.5 h-3.5 text-warning" />
                    <span className="text-text-secondary">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {moment.metrics && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(moment.metrics).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-surface-2/50 text-center">
                  <div className="text-lg font-bold text-text-primary">{value}</div>
                  <div className="text-[10px] text-text-tertiary capitalize">
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
          <div key={i} className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-2" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-surface-2 rounded mb-2" />
                <div className="h-3 w-20 bg-surface-2 rounded" />
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
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-text-primary">Evolution Journey</h3>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
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
        <div className="mt-4 p-4 rounded-xl bg-surface-2/50 border border-dashed border-white/[0.1]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-3">
              <Target className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Next Evolution</p>
              <p className="text-xs text-text-tertiary">
                Continue growing to unlock {moments[0]?.to === 'Architect' ? 'Leader' : 'Architect'} status
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/story/WeeklySummary.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: AI-Generated Weekly Summary
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  Sparkles, Rocket, Bug, GitBranch, Zap, TrendingUp, TrendingDown, 
  Minus, AlertCircle, Trophy, RefreshCw, ChevronRight
} from 'lucide-react';

const SENTIMENT_CONFIG = {
  positive: { color: 'text-success', bg: 'bg-success/10', icon: TrendingUp },
  neutral: { color: 'text-text-secondary', bg: 'bg-surface-2', icon: Minus },
  negative: { color: 'text-error-500', bg: 'bg-error-500/10', icon: TrendingDown },
};

const HIGHLIGHT_ICONS = {
  achievement: Trophy,
  recovery: Bug,
  strategic: GitBranch,
};

export default function WeeklySummary({
  summary,
  loading,
  onRefresh,
  onViewDetails,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`p-6 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse ${className}`}>
        <div className="h-6 w-48 bg-surface-2 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-surface-2 rounded" />
          <div className="h-4 w-3/4 bg-surface-2 rounded" />
          <div className="h-4 w-1/2 bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const sentimentConfig = SENTIMENT_CONFIG[summary.summary?.sentiment] || SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentimentConfig.icon;

  return (
    <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand/10">
              <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Weekly Summary</h3>
              <p className="text-xs text-text-tertiary">AI-generated overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
              ${sentimentConfig.bg} ${sentimentConfig.color}
            `}>
              <SentimentIcon className="w-3 h-3" />
              {summary.summary?.momentumTrend || 'stable'}
            </span>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                title="Regenerate summary"
              >
                <RefreshCw className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
          </div>
        </div>

        {/* Headline */}
        <h4 className="text-lg font-medium text-text-primary mb-3">
          {summary.summary?.headline}
        </h4>

        {/* Narrative */}
        <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
          {summary.summary?.narrative}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 border-b border-white/[0.06]">
        {[
          { label: 'Ships', value: summary.stats?.ships, icon: Rocket, color: 'text-brand' },
          { label: 'Tasks', value: summary.stats?.tasksCompleted, icon: null, color: 'text-success' },
          { label: 'Blockers', value: summary.stats?.blockersResolved, icon: Bug, color: 'text-error-500' },
          { label: 'Decisions', value: summary.stats?.decisionsLogged, icon: GitBranch, color: 'text-warning' },
          { label: 'XP Earned', value: summary.stats?.xpEarned, icon: Zap, color: 'text-brand' },
        ].map((stat, i) => (
          <div key={i} className="p-4 text-center border-r border-white/[0.06] last:border-0">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value || 0}</div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Highlights & Concerns */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highlights */}
        {summary.highlights?.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Highlights
            </h5>
            <div className="space-y-2">
              {summary.highlights.map((item, i) => {
                const Icon = HIGHLIGHT_ICONS[item.type] || Trophy;
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Icon className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Concerns */}
        {summary.concerns?.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Watch Items
            </h5>
            <div className="space-y-2">
              {summary.concerns.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span className="text-text-secondary">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Contributors */}
      {summary.contributors?.length > 0 && (
        <div className="px-6 pb-6">
          <h5 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
            Top Contributors
          </h5>
          <div className="flex gap-4">
            {summary.contributors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-medium text-text-tertiary">
                  {c.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.name}</p>
                  <p className="text-xs text-text-tertiary">{c.ships} ships · +{c.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="
            w-full p-4 border-t border-white/[0.06]
            flex items-center justify-center gap-2
            text-sm text-text-tertiary hover:text-text-secondary
            hover:bg-surface-2 transition-colors
          "
        >
          View full timeline
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

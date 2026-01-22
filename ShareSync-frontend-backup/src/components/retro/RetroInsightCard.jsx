// src/components/retro/RetroInsightCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Insight Card
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Lightbulb, TrendingUp, Clock, Users, Flame, Award, ChevronRight } from 'lucide-react';
import { INSIGHT_TYPES, INSIGHT_PRIORITY } from '../../utils/insightGenerator';

/**
 * RetroInsightCard - Individual insight display
 */
export default function RetroInsightCard({ insight, onAction }) {
  const {
    emoji,
    title,
    message,
    tip,
    metric,
    type,
    priority,
  } = insight;

  const getTypeIcon = () => {
    switch (type) {
      case INSIGHT_TYPES.PRODUCTIVITY: return TrendingUp;
      case INSIGHT_TYPES.TIME: return Clock;
      case INSIGHT_TYPES.COLLABORATION: return Users;
      case INSIGHT_TYPES.STREAK: return Flame;
      case INSIGHT_TYPES.CELEBRATION: return Award;
      default: return Lightbulb;
    }
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case INSIGHT_PRIORITY.HIGH:
        return 'border-brand/30 bg-gradient-to-br from-brand/5 to-accent-500/5';
      case INSIGHT_PRIORITY.MEDIUM:
        return 'border-white/[0.08] bg-surface-1';
      default:
        return 'border-white/[0.06] bg-surface-1/50';
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className={`
      p-5 rounded-xl border
      ${getPriorityStyles()}
      hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5
      transition-all duration-300
    `}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text-primary flex items-center gap-2">
            {title}
            {priority === INSIGHT_PRIORITY.HIGH && (
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            )}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TypeIcon className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-xs text-text-tertiary capitalize">{type} insight</span>
          </div>
        </div>
        
        {/* Metric */}
        {metric && (
          <div className="text-right">
            <div className="text-xl font-bold text-brand">{metric.value}</div>
            <div className="text-[10px] text-text-tertiary">{metric.label}</div>
          </div>
        )}
      </div>

      {/* Message */}
      <p className="text-sm text-text-secondary mb-3 leading-relaxed">
        {message}
      </p>

      {/* Tip */}
      {tip && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-2">
          <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">{tip}</p>
        </div>
      )}

      {/* Action */}
      {onAction && (
        <button
          onClick={() => onAction(insight)}
          className="
            mt-3 w-full flex items-center justify-center gap-2
            py-2 rounded-lg
            bg-brand/10 hover:bg-brand/20
            text-brand text-sm font-medium
            transition-colors
          "
        >
          Take Action
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * InsightList - Grid of insights
 */
export function InsightList({ insights, onInsightAction }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-tertiary">No insights generated yet.</p>
        <p className="text-xs text-text-tertiary mt-1">Complete more tasks to unlock insights!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {insights.map(insight => (
        <RetroInsightCard
          key={insight.id}
          insight={insight}
          onAction={onInsightAction}
        />
      ))}
    </div>
  );
}

/**
 * TopInsight - Featured insight card
 */
export function TopInsight({ insight }) {
  if (!insight) return null;

  return (
    <div className="
      p-6 rounded-2xl
      bg-gradient-to-br from-brand/10 via-surface-1 to-accent-500/10
      border border-brand/20
    ">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-brand" />
        <span className="text-sm font-medium text-brand">Top Insight This Week</span>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="text-5xl">{insight.emoji}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-text-primary mb-2">{insight.title}</h3>
          <p className="text-text-secondary">{insight.message}</p>
          {insight.tip && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-2/50">
              <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">{insight.tip}</p>
            </div>
          )}
        </div>
        {insight.metric && (
          <div className="text-right">
            <div className="text-3xl font-bold text-brand">{insight.metric.value}</div>
            <div className="text-xs text-text-tertiary">{insight.metric.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

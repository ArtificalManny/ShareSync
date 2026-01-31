// src/components/fairness/ContributionScore.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Individual Contribution Score Display
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Zap, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { formatScore, getContributionTier, calculateContributionBreakdown } from '../../utils/contributionScore';

const TIER_STYLES = {
  'heavy-lifter': { bg: 'bg-warning/10', text: 'text-warning', icon: '🏋️' },
  'core-contributor': { bg: 'bg-brand/10', text: 'text-brand', icon: '⭐' },
  'active': { bg: 'bg-success/10', text: 'text-success', icon: '✓' },
  'participating': { bg: 'bg-surface-2', text: 'text-text-secondary', icon: '→' },
  'minimal': { bg: 'bg-surface-2', text: 'text-text-tertiary', icon: '○' },
};

export default function ContributionScore({
  score,
  percentage,
  trend = 0,
  metrics,
  showBreakdown = false,
  showTier = true,
  variant = 'default', // 'default' | 'compact' | 'expanded'
  className = '',
}) {
  const tier = getContributionTier(percentage);
  const tierStyle = TIER_STYLES[tier.tier] || TIER_STYLES.participating;
  const breakdown = metrics ? calculateContributionBreakdown(metrics) : null;

  const isCompact = variant === 'compact';
  const isExpanded = variant === 'expanded';

  return (
    <div className={`
      ${isCompact ? 'inline-flex items-center gap-2' : 'space-y-2'}
      ${className}
    `}>
      {/* Main Score */}
      <div className={`
        flex items-center gap-2
        ${isCompact ? '' : 'mb-1'}
      `}>
        <span className={`
          flex items-center gap-1
          ${isCompact ? 'text-sm' : 'text-lg'} font-semibold text-brand
        `}>
          <Zap className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
          {formatScore(score)}
        </span>

        {/* Percentage */}
        <span className={`
          px-1.5 py-0.5 rounded text-xs font-medium
          ${percentage >= 40 ? 'bg-warning/10 text-warning' : 'bg-surface-2 text-text-secondary'}
        `}>
          {percentage}%
        </span>

        {/* Trend */}
        {trend !== 0 && (
          <span className={`
            flex items-center gap-0.5 text-xs
            ${trend > 0 ? 'text-success' : 'text-error-500'}
          `}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {/* Tier Badge */}
      {showTier && !isCompact && (
        <div className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-md
          ${tierStyle.bg}
        `}>
          <span>{tierStyle.icon}</span>
          <span className={`text-xs font-medium ${tierStyle.text}`}>
            {tier.label}
          </span>
        </div>
      )}

      {/* Breakdown (for expanded variant) */}
      {showBreakdown && breakdown && isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
          <BreakdownRow label="Tasks" value={breakdown.tasks} icon="✓" />
          <BreakdownRow label="Ships" value={breakdown.ships} icon="🚀" />
          <BreakdownRow label="Unblocking" value={breakdown.unblocking} icon="🔓" />
          <BreakdownRow label="Focus Time" value={breakdown.fireMode} icon="🔥" />
          <BreakdownRow label="Reviews" value={breakdown.codeReviews} icon="👁" />
        </div>
      )}
    </div>
  );
}

function BreakdownRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-text-tertiary">
        <span>{icon}</span>
        {label}
      </span>
      <span className="font-medium text-text-secondary">
        {formatScore(value)} pts
      </span>
    </div>
  );
}

/**
 * Compact inline score badge
 */
export function ScoreBadge({ score, percentage, className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      bg-brand/10 text-brand text-xs font-medium
      ${className}
    `}>
      <Zap className="w-3 h-3" />
      {formatScore(score)}
      {percentage !== undefined && (
        <span className="text-text-tertiary">({percentage}%)</span>
      )}
    </span>
  );
}

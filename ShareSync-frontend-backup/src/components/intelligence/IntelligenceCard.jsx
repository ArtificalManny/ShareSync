// src/components/intelligence/IntelligenceCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - Intelligence/AI Card Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// A special living card for AI-generated insights and recommendations.
// Uses the cyan→brand gradient to feel like an intelligent assistant.
//
// VISUAL TREATMENT:
// • Gradient background (brand → cyan subtle)
// • Cyan left accent bar
// • "Live" badge when actively processing
// • Breathing animation when generating
// • Subtle shimmer effect on hover
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Target,
  Zap,
  Radio,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

/**
 * IntelligenceCard - AI assistant card with special treatment
 */
const IntelligenceCard = ({
  title = "Intelligence",
  subtitle,
  insight,
  recommendations = [],
  isLive = false,
  isGenerating = false,
  lastUpdated,
  confidence,
  onRefresh,
  onAccept,
  onDismiss,
  onClick,
  className = '',
  variant = 'default', // 'default' | 'compact' | 'featured'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Icon based on insight type
  const getInsightIcon = () => {
    if (isGenerating) return RefreshCw;
    if (isLive) return Radio;
    return Sparkles;
  };

  const InsightIcon = getInsightIcon();

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group living-card living-card--intelligence
        relative overflow-hidden rounded-xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${variant === 'compact' ? 'p-4' : 'p-5'}
        ${className}
      `}
      data-living-state="intelligence"
      data-generating={isGenerating}
    >
      {/* Shimmer effect on hover */}
      <div className={`
        absolute inset-0 pointer-events-none
        bg-gradient-to-r from-transparent via-white/[0.03] to-transparent
        translate-x-[-100%] transition-transform duration-700
        ${isHovered ? 'translate-x-[100%]' : ''}
      `} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Icon box */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-gradient-to-br from-brand/20 to-cyan-500/20
            ${isGenerating ? 'animate-pulse' : ''}
          `}>
            <InsightIcon className={`
              w-5 h-5 text-cyan-400
              ${isGenerating ? 'animate-spin' : ''}
              ${isLive ? 'live-indicator' : ''}
            `} />
          </div>

          {/* Title */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              {title}
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-500">
                  <Radio className="w-3 h-3 live-indicator" />
                  Live
                </span>
              )}
            </h3>
            {subtitle && (
              <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className={`
              p-2 rounded-lg transition-all duration-200
              hover:bg-surface-2 text-text-tertiary hover:text-text-secondary
              ${isGenerating ? 'animate-spin' : ''}
            `}
            disabled={isGenerating}
            aria-label="Refresh insights"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Insight */}
      {insight && (
        <div className="mb-4 relative z-10">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary leading-relaxed">
              {insight}
            </p>
          </div>
          
          {/* Confidence indicator */}
          {confidence && (
            <div className="flex items-center gap-2 mt-2 ml-6">
              <div className="flex-1 max-w-[100px] h-1 bg-surface-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary">
                {confidence}% confidence
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && variant !== 'compact' && (
        <div className="space-y-2 mb-4 relative z-10">
          <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            Recommended actions
          </span>
          {recommendations.slice(0, 3).map((rec, i) => (
            <RecommendationItem 
              key={i} 
              recommendation={rec} 
              index={i}
            />
          ))}
          {recommendations.length > 3 && (
            <p className="text-xs text-text-tertiary pl-6">
              +{recommendations.length - 3} more suggestions
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {(onAccept || onDismiss) && (
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-white/[0.06] relative z-10">
          {onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="
                flex items-center gap-1 px-3 py-1.5 rounded-lg
                text-xs font-medium
                bg-brand/10 text-brand hover:bg-brand/20
                transition-colors
              "
            >
              <ThumbsUp className="w-3 h-3" />
              Helpful
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="
                flex items-center gap-1 px-3 py-1.5 rounded-lg
                text-xs font-medium
                text-text-tertiary hover:bg-surface-2
                transition-colors
              "
            >
              <ThumbsDown className="w-3 h-3" />
              Not now
            </button>
          )}
          
          <div className="flex-1" />
          
          {lastUpdated && (
            <span className="text-[10px] text-text-tertiary">
              Updated {lastUpdated}
            </span>
          )}
        </div>
      )}

      {/* Click indicator */}
      {onClick && (
        <ChevronRight className="
          absolute right-4 top-1/2 -translate-y-1/2
          w-4 h-4 text-text-tertiary
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        " />
      )}
    </div>
  );
};

/**
 * RecommendationItem - Individual recommendation
 */
function RecommendationItem({ recommendation, index }) {
  const { text, type = 'default', action } = typeof recommendation === 'string' 
    ? { text: recommendation } 
    : recommendation;

  const icons = {
    default: Target,
    trend: TrendingUp,
    action: Zap,
    insight: Brain,
  };

  const Icon = icons[type] || icons.default;

  return (
    <div className="flex items-start gap-2 group/rec">
      <Icon className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
      <span className="text-xs text-text-secondary flex-1">
        {text}
      </span>
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action();
          }}
          className="
            text-[10px] font-medium text-brand
            opacity-0 group-hover/rec:opacity-100
            transition-opacity
          "
        >
          Apply
        </button>
      )}
    </div>
  );
}

export default IntelligenceCard;

/**
 * IntelligenceCardCompact - Smaller version for sidebars
 */
export function IntelligenceCardCompact({
  title = "Quick insight",
  insight,
  icon: CustomIcon,
  onClick,
  className = '',
}) {
  const Icon = CustomIcon || Sparkles;

  return (
    <div 
      onClick={onClick}
      className={`
        group living-card living-card--intelligence
        flex items-center gap-3 p-3 rounded-xl
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="
        w-8 h-8 rounded-lg flex items-center justify-center
        bg-gradient-to-br from-brand/15 to-cyan-500/15
      ">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">
          {title}
        </p>
        {insight && (
          <p className="text-[10px] text-text-tertiary truncate mt-0.5">
            {insight}
          </p>
        )}
      </div>
      {onClick && (
        <ChevronRight className="
          w-4 h-4 text-text-tertiary
          opacity-0 group-hover:opacity-100
          transition-opacity
        " />
      )}
    </div>
  );
}

/**
 * IntelligenceBanner - Full-width insight banner
 */
export function IntelligenceBanner({
  insight,
  action,
  actionLabel = "View details",
  onDismiss,
  className = '',
}) {
  return (
    <div className={`
      living-card living-card--intelligence
      flex items-center gap-4 p-4 rounded-xl
      ${className}
    `}>
      <div className="
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        bg-gradient-to-br from-brand/20 to-cyan-500/20
      ">
        <Sparkles className="w-5 h-5 text-cyan-400" />
      </div>
      
      <p className="flex-1 text-sm text-text-primary">
        {insight}
      </p>
      
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            onClick={action}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-brand text-white hover:bg-brand-700
              transition-colors
            "
          >
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              p-2 rounded-lg text-text-tertiary
              hover:bg-surface-2 hover:text-text-secondary
              transition-colors
            "
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * IntelligenceCardSkeleton - Loading state
 */
export function IntelligenceCardSkeleton() {
  return (
    <div className="
      living-card living-card--intelligence
      p-5 rounded-xl animate-pulse
    ">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-surface-2" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-3 w-16 rounded bg-surface-2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-4/5 rounded bg-surface-2" />
      </div>
    </div>
  );
}

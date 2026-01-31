// src/components/focus/MoveCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Move Card Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// Displays a single focus move with:
// - Title and impact
// - Project badge (for cross-project view)
// - Momentum value
// - Unblock count
// - Urgency indicator
// - Action buttons
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Target, 
  Rocket, 
  Bug, 
  GitPullRequest, 
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  MoreHorizontal,
  Play,
  Pause,
} from 'lucide-react';
import UnblockIndicator from './UnblockIndicator';
import { getTimeUntilDeadline, getUrgencyLevel } from '../../utils/focusRanking';

// Type icons
const TYPE_CONFIG = {
  ship: { icon: Rocket, color: 'text-brand', bg: 'bg-brand/10' },
  fix: { icon: Bug, color: 'text-warning', bg: 'bg-warning/10' },
  review: { icon: GitPullRequest, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  doc: { icon: FileText, color: 'text-success', bg: 'bg-success/10' },
  default: { icon: Target, color: 'text-text-secondary', bg: 'bg-surface-2' },
};

// Urgency styles
const URGENCY_STYLES = {
  critical: { border: 'border-l-error-500', bg: 'bg-error-500/5', badge: 'bg-error-500/10 text-error-500' },
  high: { border: 'border-l-warning', bg: 'bg-warning/5', badge: 'bg-warning/10 text-warning' },
  medium: { border: 'border-l-brand/50', bg: '', badge: '' },
  low: { border: '', bg: '', badge: '' },
  none: { border: '', bg: '', badge: '' },
};

export default function MoveCard({
  move,
  onClick,
  onComplete,
  onSnooze,
  showProject = true,
  showActions = true,
  variant = 'default', // 'default' | 'compact' | 'expanded'
  rank, // Optional rank number (1, 2, 3)
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const typeConfig = TYPE_CONFIG[move.type] || TYPE_CONFIG.default;
  const TypeIcon = typeConfig.icon;
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);

  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      await onComplete?.(move.id);
    } finally {
      setIsCompleting(false);
    }
  }, [move.id, onComplete, isCompleting]);

  const handleSnooze = useCallback((e) => {
    e.stopPropagation();
    onSnooze?.(move.id, 4);
    setShowMenu(false);
  }, [move.id, onSnooze]);

  const isCompact = variant === 'compact';

  return (
    <div
      onClick={() => onClick?.(move)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      className={`
        relative group cursor-pointer
        ${isCompact ? 'p-3' : 'p-4'} rounded-xl
        bg-surface-2/50 border border-white/[0.04]
        ${urgencyStyles.border ? `border-l-2 ${urgencyStyles.border}` : ''}
        ${urgencyStyles.bg}
        hover:bg-surface-2 hover:border-white/[0.08]
        transition-all duration-200
        ${isHovered ? 'transform -translate-y-0.5' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Rank Badge (optional) */}
        {rank && (
          <div className={`
            shrink-0 w-7 h-7 rounded-lg
            ${typeConfig.bg}
            flex items-center justify-center
          `}>
            <span className={`text-xs font-bold ${typeConfig.color}`}>
              {rank}
            </span>
          </div>
        )}

        {/* Type Icon (if no rank) */}
        {!rank && (
          <div className={`shrink-0 p-2 rounded-lg ${typeConfig.bg}`}>
            <TypeIcon className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${typeConfig.color}`} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project Badge (if showing cross-project) */}
          {showProject && move.project && (
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ 
                  backgroundColor: `${move.project.color}15`,
                  color: move.project.color,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: move.project.color }}
                />
                {move.project.name}
              </span>
              
              {/* Urgency Badge */}
              {(urgencyLevel === 'critical' || urgencyLevel === 'high') && (
                <span className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium
                  ${urgencyStyles.badge}
                `}>
                  {urgencyLevel === 'critical' ? '🔴 Critical' : '🟠 Urgent'}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h4 className={`
            ${isCompact ? 'text-sm' : 'text-sm'} font-medium text-text-primary
            group-hover:text-brand transition-colors
            ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}
          `}>
            {move.title}
          </h4>

          {/* Impact */}
          {move.impact && !isCompact && (
            <p className="text-xs text-text-tertiary mt-1 line-clamp-1">
              {move.impact}
            </p>
          )}

          {/* Meta Row */}
          <div className={`flex items-center gap-3 ${isCompact ? 'mt-1.5' : 'mt-2'}`}>
            {/* Unblocks */}
            {move.unblocks > 0 && (
              <UnblockIndicator 
                count={move.unblocks} 
                variant={isCompact ? 'compact' : 'default'}
              />
            )}

            {/* Deadline */}
            {timeLeft && (
              <span className={`
                flex items-center gap-1 text-xs
                ${urgencyLevel === 'critical' ? 'text-error-500' : 
                  urgencyLevel === 'high' ? 'text-warning' : 'text-text-tertiary'}
              `}>
                <Clock className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Momentum + Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {/* Momentum */}
          <span className="flex items-center gap-1 text-xs font-medium text-brand">
            <Zap className="w-3 h-3" />
            +{move.momentum}
          </span>

          {/* Actions */}
          {showActions && (
            <div className={`
              flex items-center gap-1
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              {/* Complete Button */}
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="
                  p-1.5 rounded-lg
                  bg-success/10 text-success
                  hover:bg-success/20
                  transition-colors
                  disabled:opacity-50
                "
                title="Mark complete"
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleting ? 'animate-spin' : ''}`} />
              </button>

              {/* More Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="
                    p-1.5 rounded-lg
                    bg-surface-3 text-text-tertiary
                    hover:bg-surface-3 hover:text-text-secondary
                    transition-colors
                  "
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Dropdown */}
                {showMenu && (
                  <div className="
                    absolute right-0 top-full mt-1 z-50
                    w-36 py-1 rounded-lg
                    bg-surface-2 border border-white/[0.08]
                    shadow-xl
                    animate-in fade-in slide-in-from-top-2 duration-150
                  ">
                    <button
                      onClick={handleSnooze}
                      className="
                        w-full px-3 py-2 text-left text-xs text-text-secondary
                        hover:bg-surface-3 hover:text-text-primary
                        flex items-center gap-2
                      "
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Snooze 4h
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClick?.(move); }}
                      className="
                        w-full px-3 py-2 text-left text-xs text-text-secondary
                        hover:bg-surface-3 hover:text-text-primary
                        flex items-center gap-2
                      "
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start working
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for MoveCard
 */
export function MoveCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04] animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-3" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-surface-3 rounded mb-2" />
              <div className="h-4 w-3/4 bg-surface-3 rounded mb-2" />
              <div className="h-3 w-1/2 bg-surface-3 rounded" />
            </div>
            <div className="h-5 w-12 bg-surface-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

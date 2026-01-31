// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Your 3 Moves Today - Cross-Project Focus View
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows the user's top 3 highest-leverage moves across ALL their projects.
// Core differentiator: "No one opens ShareSync and wonders what to do next."
//
// Features:
// - Project badges on each move
// - Real-time refresh on ships/changes
// - Impact summary footer
// - Urgency indicators
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Target, 
  Zap, 
  RefreshCw, 
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { useFocusEngine } from '../../contexts/FocusEngineContext';
import { useUserFocusMoves } from '../../hooks/useFocusMoves';

export default function YourMovesToday({
  variant = 'default', // 'default' | 'compact' | 'sidebar'
  maxMoves = 3,
  showHeader = true,
  showFooter = true,
  showRefresh = true,
  onMoveClick,
  onViewAll,
  className = '',
}) {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Try context first, fall back to hook
  let focusData;
  try {
    focusData = useFocusEngine();
  } catch {
    // Context not available, use hook directly
    focusData = useUserFocusMoves({ count: maxMoves });
  }

  const {
    topMoves = [],
    moves = [],
    impactSummary = {},
    loading,
    error,
    isRefreshing,
    refresh,
    completeMove,
    snoozeMove,
    hasUrgentMoves,
  } = focusData;

  const displayMoves = (topMoves.length > 0 ? topMoves : moves).slice(0, maxMoves);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    await refresh?.();
    setTimeout(() => setIsManualRefreshing(false), 500);
  }, [refresh]);

  const handleComplete = useCallback(async (moveId) => {
    if (completeMove) {
      await completeMove(moveId);
    }
  }, [completeMove]);

  const handleSnooze = useCallback(async (moveId, hours) => {
    if (snoozeMove) {
      await snoozeMove(moveId, hours);
    }
  }, [snoozeMove]);

  const isCompact = variant === 'compact' || variant === 'sidebar';

  return (
    <div className={`
      ${isCompact ? 'p-4' : 'p-6'} rounded-xl
      bg-surface-1 border border-white/[0.06]
      ${hasUrgentMoves ? 'border-l-2 border-l-warning' : ''}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${hasUrgentMoves ? 'bg-warning/10' : 'bg-brand/10'}`}>
              {hasUrgentMoves ? (
                <AlertCircle className="w-4 h-4 text-warning" />
              ) : (
                <Target className="w-4 h-4 text-brand" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">
                Your 3 Moves Today
              </h3>
              {hasUrgentMoves && (
                <p className="text-[10px] text-warning">Action needed</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh indicator */}
            {(isRefreshing || isManualRefreshing) && (
              <span className="text-[10px] text-text-tertiary">Updating...</span>
            )}
            
            {/* Refresh button */}
            {showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing}
                className="
                  p-1.5 rounded-lg
                  text-text-tertiary hover:text-text-secondary
                  hover:bg-surface-2
                  transition-colors
                  disabled:opacity-50
                "
                title="Refresh moves"
              >
                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isManualRefreshing) ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* View all */}
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="
                  text-xs text-text-tertiary hover:text-brand
                  transition-colors flex items-center gap-1
                "
              >
                View all
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <MoveCardSkeleton count={maxMoves} />
      ) : error ? (
        <div className="py-8 text-center">
          <AlertCircle className="w-8 h-8 text-error-500 mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-2">Failed to load moves</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-brand hover:text-brand-400"
          >
            Try again
          </button>
        </div>
      ) : displayMoves.length > 0 ? (
        <div className="space-y-2">
          {displayMoves.map((move, index) => (
            <MoveCard
              key={move.id}
              move={move}
              rank={index + 1}
              onClick={onMoveClick}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              showProject={true}
              showActions={!isCompact}
              variant={isCompact ? 'compact' : 'default'}
            />
          ))}
        </div>
      ) : (
        <EmptyState onRefresh={handleRefresh} />
      )}

      {/* Footer - Impact Summary */}
      {showFooter && displayMoves.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              Complete all {displayMoves.length} to unlock
            </span>
            <div className="flex items-center gap-3">
              {impactSummary.totalUnblocks > 0 && (
                <span className="text-xs text-cyan-400">
                  Unblock {impactSummary.totalUnblocks} teammates
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-brand">
                <Zap className="w-3.5 h-3.5" />
                +{impactSummary.totalMomentum || displayMoves.reduce((s, m) => s + m.momentum, 0)} momentum
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no moves
 */
function EmptyState({ onRefresh }) {
  return (
    <div className="py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
        <Flame className="w-8 h-8 text-success" />
      </div>
      <h4 className="text-lg font-semibold text-text-primary mb-1">
        All caught up! 🎉
      </h4>
      <p className="text-sm text-text-tertiary mb-4">
        No critical moves right now. Great job staying on top of things.
      </p>
      <button
        onClick={onRefresh}
        className="text-xs text-brand hover:text-brand-400 transition-colors"
      >
        Check again
      </button>
    </div>
  );
}

/**
 * Compact widget version for sidebars
 */
export function YourMovesWidget({ onMoveClick, onViewAll }) {
  return (
    <YourMovesToday
      variant="sidebar"
      maxMoves={3}
      showHeader={true}
      showFooter={false}
      showRefresh={false}
      onMoveClick={onMoveClick}
      onViewAll={onViewAll}
    />
  );
}

/**
 * Inline banner version for quick glance
 */
export function FocusBanner({ className = '' }) {
  const { topMoves, hasUrgentMoves, impactSummary } = useFocusEngine();
  
  if (!topMoves.length) return null;
  
  const topMove = topMoves[0];
  
  return (
    <div className={`
      px-4 py-3 rounded-xl
      ${hasUrgentMoves ? 'bg-warning/10 border border-warning/20' : 'bg-brand/10 border border-brand/20'}
      flex items-center justify-between
      ${className}
    `}>
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 ${hasUrgentMoves ? 'text-warning' : 'text-brand'}`} />
        <div>
          <p className="text-xs text-text-tertiary">Top priority</p>
          <p className="text-sm font-medium text-text-primary">{topMove.title}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {topMove.project && (
          <span 
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ 
              backgroundColor: `${topMove.project.color}15`,
              color: topMove.project.color,
            }}
          >
            {topMove.project.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-brand">
          <Zap className="w-3 h-3" />
          +{topMove.momentum}
        </span>
      </div>
    </div>
  );
}

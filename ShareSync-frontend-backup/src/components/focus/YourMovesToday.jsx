// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Your 3 Moves Today - Cross-Project Focus View
// ⭐ PHASE 4: Optimistic UI Implementation
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
// - ⭐ INSTANT Optimistic UI via React Query Mutate
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  moves = null, // From React Query hook in Home.jsx
  isLoading = false,
  onRefresh,
  onMoveClick,
  onViewAll,
  className = '',
}) {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Try context first, fall back to hook, fall back to props
  let focusData = { moves: [], topMoves: [], impactSummary: {}, hasUrgentMoves: false };
  try {
    const contextData = useFocusEngine();
    if (contextData && Object.keys(contextData).length > 0) {
      focusData = contextData;
    }
  } catch {
    // Context not available, use hook directly
    focusData = useUserFocusMoves({ count: maxMoves });
  }

  // Use props (React Query data) if provided, otherwise use focus engine hooks
  const displayMovesSource = moves || (focusData.topMoves?.length > 0 ? focusData.topMoves : focusData.moves);
  const displayMoves = displayMovesSource?.slice(0, maxMoves) || [];
  
  const loading = isLoading || focusData.loading;
  const isRefreshing = focusData.isRefreshing || isManualRefreshing;
  const error = focusData.error;

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    if (onRefresh) await onRefresh();
    else if (focusData.refresh) await focusData.refresh();
    setTimeout(() => setIsManualRefreshing(false), 500);
  }, [onRefresh, focusData]);

  // ⭐ PHASE 4: Optimistic Completion
  const handleComplete = useCallback(async (moveId) => {
    // 1. Snapshot the previous value
    const previousMoves = queryClient.getQueryData(['movesToday', maxMoves, null]);
    
    // 2. Optimistically update to the new value (Remove the task instantly)
    queryClient.setQueryData(['movesToday', maxMoves, null], (old) => {
      if (!old) return [];
      return old.filter(move => (move.id || move._id) !== moveId);
    });

    try {
      // 3. Fire the actual server request
      if (focusData.completeMove) {
        await focusData.completeMove(moveId);
      }
      // Note: If you have a REST endpoint directly mapped here, you would call `axios.patch(...)` instead.
    } catch (err) {
      // 4. If the mutation fails, roll back to the previous value
      queryClient.setQueryData(['movesToday', maxMoves, null], previousMoves);
      console.error("Optimistic update failed, rolled back UI.", err);
    }
  }, [focusData, queryClient, maxMoves]);

  const handleSnooze = useCallback(async (moveId, hours) => {
    if (focusData.snoozeMove) {
      await focusData.snoozeMove(moveId, hours);
    }
  }, [focusData]);

  const isCompact = variant === 'compact' || variant === 'sidebar';

  return (
    <div className={`
      ${isCompact ? 'p-4' : 'p-6'} rounded-xl
      bg-surface-1 border border-white/[0.06]
      ${focusData.hasUrgentMoves ? 'border-l-2 border-l-warning' : ''}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${focusData.hasUrgentMoves ? 'bg-warning/10' : 'bg-brand/10'}`}>
              {focusData.hasUrgentMoves ? (
                <AlertCircle className="w-4 h-4 text-warning" />
              ) : (
                <Target className="w-4 h-4 text-brand" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">
                Your 3 Moves Today
              </h3>
              {focusData.hasUrgentMoves && (
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
              key={move.id || move._id}
              move={move}
              rank={index + 1}
              onClick={onMoveClick}
              onComplete={() => handleComplete(move.id || move._id)}
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
              {focusData.impactSummary?.totalUnblocks > 0 && (
                <span className="text-xs text-cyan-400">
                  Unblock {focusData.impactSummary.totalUnblocks} teammates
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-brand">
                <Zap className="w-3.5 h-3.5" />
                +{(focusData.impactSummary?.totalMomentum || 0) || displayMoves.reduce((s, m) => s + (m.momentum || 10), 0)} momentum
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

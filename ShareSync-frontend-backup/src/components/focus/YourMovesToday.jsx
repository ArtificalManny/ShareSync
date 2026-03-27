// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Your Top Moves Today - Cross-Project Focus View
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows the user's highest-leverage moves across ALL their projects.
// Core differentiator: "No one opens ShareSync and wonders what to do next."
//
// Features:
// - Customizable move count (1, 3, 5, 10)
// - Project badges on each move
// - Real-time refresh on ships/changes
// - Impact summary footer
// - Urgency indicators
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Target, 
  Zap, 
  RefreshCw, 
  ChevronRight,
  Flame,
  AlertCircle,
  Settings,
  Check
} from 'lucide-react';
import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { getStatusColor } from '../../utils/statusColor';
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
  const [customLimit, setCustomLimit] = useState(maxMoves);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // 🚨 CRITICAL FIX: Bypass the Context Trap. 
  // We strictly use the hook so our Data Adapter translation layer executes.
  const focusData = useUserFocusMoves({ count: customLimit });

  const {
    moves = [],
    impactSummary = {},
    loading,
    error,
    isRefreshing,
    refresh,
    completeMove,
    snoozeMove,
    hasUrgentMoves,
  } = focusData || {};

  // We only rely on 'moves' now, which the hook has already sliced and ranked
  const displayMoves = moves || [];

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
      card-action relative
      ${isCompact ? 'p-4' : 'p-6'} rounded-xl
      bg-surface-1 border border-white/[0.06]
      ${hasUrgentMoves ? 'border-l-2 border-l-warning shadow-lg shadow-warning/5' : 'shadow-lg shadow-black/20'}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${hasUrgentMoves ? 'bg-warning/10 text-warning' : 'bg-brand/10 text-brand'}`}>
              {hasUrgentMoves ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Target className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 relative" ref={settingsRef}>
                <h3 
                  className="text-sm font-semibold text-text-primary flex items-center gap-1.5 cursor-pointer hover:text-brand transition-colors"
                  onClick={() => setShowSettings(!showSettings)}
                  title="Customize number of moves"
                >
                  Your {customLimit} Moves Today
                  <Settings className="w-3.5 h-3.5 text-text-tertiary opacity-50 hover:opacity-100 transition-opacity" />
                </h3>
                
                {/* Custom Limit Dropdown */}
                {showSettings && (
                  <div className="absolute top-full left-0 mt-2 w-40 py-1.5 rounded-xl bg-surface-2 border border-white/[0.10] shadow-xl z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
                      Show Moves
                    </div>
                    {[1, 3, 5, 10].map(num => (
                      <button
                        key={num}
                        onClick={() => { setCustomLimit(num); setShowSettings(false); }}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
                      >
                        {num} {num === 1 ? 'Move (Laser Focus)' : 'Moves'}
                        {customLimit === num && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hasUrgentMoves && (
                <p className="text-[11px] font-medium text-warning mt-0.5">Action needed</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh indicator */}
            {(isRefreshing || isManualRefreshing) && (
              <span className="text-[10px] font-medium text-text-tertiary animate-pulse">Syncing...</span>
            )}
            
            {/* Refresh button */}
            {showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing}
                className="
                  p-1.5 rounded-lg
                  text-text-tertiary hover:text-text-primary
                  hover:bg-surface-2
                  transition-all active:scale-95
                  disabled:opacity-50
                "
                title="Refresh moves"
              >
                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isManualRefreshing) ? 'animate-spin text-brand' : ''}`} />
              </button>
            )}

            {/* View all */}
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="
                  text-xs font-medium text-text-tertiary hover:text-brand
                  transition-colors flex items-center gap-0.5 ml-1
                "
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <MoveCardSkeleton count={customLimit} />
      ) : error ? (
        <div className="py-10 text-center bg-surface-2/30 rounded-xl border border-white/[0.04]">
          <AlertCircle className="w-8 h-8 text-error-500 mx-auto mb-3 opacity-80" />
          <p className="text-sm font-medium text-text-primary mb-1">Unable to load focus moves</p>
          <p className="text-xs text-text-tertiary mb-4">Please check your connection and try again.</p>
          <button
            onClick={handleRefresh}
            className="text-xs font-semibold px-4 py-2 bg-surface-3 rounded-lg text-brand hover:text-brand-400 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : displayMoves.length > 0 ? (
        <div className="space-y-3">
          {displayMoves.map((move, index) => (
            <MoveCard
              key={move.id || move._id || index}
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
        <div className="mt-5 pt-4 border-t border-white/[0.06] bg-surface-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-text-tertiary">
              Complete all {displayMoves.length} to unlock:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {impactSummary.totalUnblocks > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-400/10 text-xs font-medium text-cyan-400">
                  <Target className="w-3.5 h-3.5" />
                  Unblock {impactSummary.totalUnblocks} teammates
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand/10 text-xs font-bold text-brand shadow-sm shadow-brand/10">
                <Zap className="w-3.5 h-3.5" />
                +{impactSummary.totalMomentum || displayMoves.reduce((s, m) => s + (m.momentum || 0), 0)} Momentum
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
    <div className="py-12 text-center bg-surface-2/20 rounded-xl border border-white/[0.02]">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success/20 to-success/5 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-success/10">
        <Flame className="w-8 h-8 text-success" />
      </div>
      <h4 className="text-lg font-bold text-text-primary mb-2">
        You're completely clear! 🎉
      </h4>
      <p className="text-sm text-text-tertiary mb-6 max-w-xs mx-auto">
        No critical moves demand your attention right now. Great job managing the workload.
      </p>
      <button
        onClick={onRefresh}
        className="text-xs font-semibold text-text-secondary bg-surface-3 px-4 py-2 rounded-lg hover:text-brand hover:bg-surface-3/80 transition-all active:scale-95"
      >
        Refresh Radar
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
  // Using hook directly here too to maintain consistency
  const { moves, hasUrgentMoves } = useUserFocusMoves({ count: 1 });
  
  if (!moves?.length) return null;
  
  const topMove = moves[0];
  
  return (
    <div className={`
      px-4 py-3 rounded-xl
      ${hasUrgentMoves ? 'bg-warning/10 border border-warning/20' : 'bg-brand/10 border border-brand/20'}
      flex items-center justify-between shadow-sm
      ${className}
    `}>
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 ${hasUrgentMoves ? 'text-warning' : 'text-brand'}`} />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-0.5">Top priority</p>
          <p className="text-sm font-semibold text-text-primary line-clamp-1">{topMove.title}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {topMove.project && (
          <span 
            className="hidden sm:inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
            style={{ 
              backgroundColor: `${topMove.project?.color || '#3b82f6'}15`,
              color: topMove.project?.color || '#3b82f6',
            }}
          >
            {topMove.project?.name || 'Project'}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-md">
          <Zap className="w-3.5 h-3.5" />
          +{topMove.momentum || 0}
        </span>
      </div>
    </div>
  );
}

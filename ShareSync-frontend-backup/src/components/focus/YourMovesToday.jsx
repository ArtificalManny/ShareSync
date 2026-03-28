// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: Your 3 Moves Today - Cross-Project Focus View
// UPGRADED: "Progress Should Be Visible" & Gallery Walk Light/Dark Integration
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle } from 'lucide-react';
import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { getStatusColor } from '../../utils/statusColor';
import { useFocusEngine } from '../../contexts/FocusEngineContext';
import { useUserFocusMoves } from '../../hooks/useFocusMoves';

export default function YourMovesToday({
  variant = 'default',
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
    if (completeMove) await completeMove(moveId);
  }, [completeMove]);

  const handleSnooze = useCallback(async (moveId, hours) => {
    if (snoozeMove) await snoozeMove(moveId, hours);
  }, [snoozeMove]);

  const isCompact = variant === 'compact' || variant === 'sidebar';

  return (
    <div className={`
      card-action
      ${isCompact ? 'p-5' : 'p-6'} rounded-xl
      bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
      shadow-[0_4px_24px_rgba(139,92,246,0.04)]
      ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : ''}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-sm ${hasUrgentMoves ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-white/5'}`}>
              {hasUrgentMoves ? (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              ) : (
                <Target className="w-5 h-5 text-[var(--theme-accent-primary)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Your 3 Moves Today
              </h3>
              {hasUrgentMoves && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-0.5">Action needed</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isRefreshing || isManualRefreshing) && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Updating...</span>
            )}
            
            {showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing}
                className="p-2 rounded-lg text-slate-400 hover:text-[var(--theme-accent-primary)] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh moves"
              >
                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isManualRefreshing) ? 'animate-spin' : ''}`} />
              </button>
            )}

            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--theme-accent-primary)] transition-colors flex items-center gap-1 ml-2"
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
        <MoveCardSkeleton count={maxMoves} />
      ) : error ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Failed to load moves</p>
          <button onClick={handleRefresh} className="text-xs font-black uppercase tracking-widest text-[var(--theme-accent-primary)] hover:brightness-110">
            Try again
          </button>
        </div>
      ) : displayMoves.length > 0 ? (
        <div className="space-y-3">
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
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              Complete all <strong className="text-slate-800 dark:text-zinc-200">{displayMoves.length}</strong> to unlock
            </span>
            <div className="flex items-center gap-4">
              {impactSummary.totalUnblocks > 0 && (
                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 rounded-md uppercase tracking-wider">
                  Unblock {impactSummary.totalUnblocks} teammates
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[12px] font-black text-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)] px-2.5 py-1 rounded-md">
                <Zap className="w-3.5 h-3.5 fill-[var(--theme-accent-primary)]/20" />
                +{impactSummary.totalMomentum || displayMoves.reduce((s, m) => s + m.momentum, 0)} Momentum
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <div className="py-10 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm">
        <Flame className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      </div>
      <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
        All caught up! 🎉
      </h4>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-5">
        No critical moves right now. Great job staying on top of things.
      </p>
      <button
        onClick={onRefresh}
        className="text-xs font-black uppercase tracking-widest bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
      >
        Check again
      </button>
    </div>
  );
}

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

export function FocusBanner({ className = '' }) {
  const { topMoves, hasUrgentMoves, impactSummary } = useFocusEngine();
  
  if (!topMoves.length) return null;
  const topMove = topMoves[0];
  
  return (
    <div className={`
      px-5 py-3.5 rounded-xl shadow-sm
      ${hasUrgentMoves ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10'}
      flex flex-col sm:flex-row sm:items-center justify-between gap-3
      ${className}
    `}>
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 flex-shrink-0 ${hasUrgentMoves ? 'text-amber-600 dark:text-amber-500' : 'text-[var(--theme-accent-primary)]'}`} />
        <div>
          <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">Top priority</p>
          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{topMove.title}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {topMove.project && (
          <span 
            className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm"
            style={{ 
              backgroundColor: `${topMove.project.color}15`,
              color: topMove.project.color,
              border: `1px solid ${topMove.project.color}30`
            }}
          >
            {topMove.project.name}
          </span>
        )}
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black text-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)]">
          <Zap className="w-3.5 h-3.5" />
          +{topMove.momentum}
        </span>
      </div>
    </div>
  );
}

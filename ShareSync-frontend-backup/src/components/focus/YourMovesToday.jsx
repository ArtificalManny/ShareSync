// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: Your 3 Moves Today - Daily Focus View
// UPGRADED: "What should we work on today?" command-card language
// DAILY FOCUS WIRING:
// - Reads from GET /daily-focus/today
// - Preserves existing user-scoped FocusEngine fallback
// - Preserves MoveCard rendering
// - Adds accept/add/edit/delete/complete controls for Daily Focus plans
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Flame,
  AlertCircle,
  FolderPlus,
  LayoutDashboard,
  Sparkles,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react';

import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { getStatusColor } from '../../utils/statusColor';
import { useFocusEngine } from '../../contexts/FocusEngineContext';
import { useUserFocusMoves } from '../../hooks/useFocusMoves';

import {
  getTodayDailyFocus,
  acceptTodayDailyFocus,
  addDailyFocusMove,
  updateDailyFocusMove,
  deleteDailyFocusMove,
  completeDailyFocusMove,
} from '../../api/focusEngine';

const DEFAULT_PROJECT_COLOR = '#7C3AED';

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getMoveIdentity(moveOrId) {
  if (!moveOrId) return '';

  if (typeof moveOrId === 'string') return moveOrId;

  return String(
    moveOrId.id ||
      moveOrId._id ||
      moveOrId.taskId ||
      moveOrId.sourceId ||
      ''
  );
}

function isMoveDone(move) {
  const status = String(move?.status || '').toLowerCase();
  return status === 'done' || status === 'completed' || status === 'complete';
}

function normalizeDailyFocusMove(move) {
  if (!move) return null;

  const id = getMoveIdentity(move);
  const projectName =
    move.projectName ||
    move.projectTitle ||
    move.project?.name ||
    move.project?.title ||
    '';

  return {
    ...move,
    id,
    _id: move._id || id,
    taskId: move.taskId || (move.sourceType === 'task' ? move.sourceId : undefined),
    title: move.title || 'Untitled move',
    description: move.reason || move.description || '',
    reason: move.reason || '',
    projectId: move.projectId || move.project?._id || move.project?.id || '',
    projectName,
    projectTitle: projectName,
    project:
      move.project ||
      (projectName
        ? {
            name: projectName,
            title: projectName,
            color: DEFAULT_PROJECT_COLOR,
          }
        : null),
    priority: move.priority || 'normal',
    momentum: toFiniteNumber(move.estimatedMomentum ?? move.momentum, 0),
    estimatedMomentum: toFiniteNumber(move.estimatedMomentum ?? move.momentum, 0),
    status: move.status || 'todo',
    sourceType: move.sourceType || 'task',
    isDailyFocusMove: true,
  };
}

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

  const [dailyFocusPlan, setDailyFocusPlan] = useState(null);
  const [dailyFocusLoading, setDailyFocusLoading] = useState(false);
  const [dailyFocusError, setDailyFocusError] = useState(null);
  const [isPlanningAction, setIsPlanningAction] = useState(false);

  const [customMoveTitle, setCustomMoveTitle] = useState('');
  const [editingMoveId, setEditingMoveId] = useState('');
  const [editingTitle, setEditingTitle] = useState('');

  // Try context first, fall back to hook.
  // This preserves your existing user-scoped FocusEngine behavior.
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

  const loadDailyFocusPlan = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setDailyFocusLoading(true);
    setDailyFocusError(null);

    try {
      const plan = await getTodayDailyFocus();
      setDailyFocusPlan(plan);
      return plan;
    } catch (dailyFocusLoadError) {
      console.warn(
        '[YourMovesToday] Daily Focus load failed:',
        dailyFocusLoadError?.message || dailyFocusLoadError
      );

      setDailyFocusError(dailyFocusLoadError);
      return null;
    } finally {
      if (!silent) setDailyFocusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyFocusPlan();
  }, [loadDailyFocusPlan]);

  const dailySelectedMoves = useMemo(() => {
    return Array.isArray(dailyFocusPlan?.selectedMoves)
      ? dailyFocusPlan.selectedMoves
      : [];
  }, [dailyFocusPlan?.selectedMoves]);

  const dailySuggestions = useMemo(() => {
    return Array.isArray(dailyFocusPlan?.suggestions)
      ? dailyFocusPlan.suggestions
      : [];
  }, [dailyFocusPlan?.suggestions]);

  const hasAcceptedDailyPlan = useMemo(() => {
    const status = String(dailyFocusPlan?.status || '').toLowerCase();

    return (
      status === 'accepted' ||
      status === 'completed' ||
      dailySelectedMoves.length > 0
    );
  }, [dailyFocusPlan?.status, dailySelectedMoves.length]);

  const dailyFocusMoves = useMemo(() => {
    const sourceMoves =
      dailySelectedMoves.length > 0 ? dailySelectedMoves : dailySuggestions;

    return sourceMoves
      .slice(0, maxMoves)
      .map(normalizeDailyFocusMove)
      .filter(Boolean);
  }, [dailySelectedMoves, dailySuggestions, maxMoves]);

  const dailyFocusMoveIds = useMemo(() => {
    return new Set(dailyFocusMoves.map((move) => getMoveIdentity(move)).filter(Boolean));
  }, [dailyFocusMoves]);

  const legacyMoves = useMemo(() => {
    return (topMoves.length > 0 ? topMoves : moves).slice(0, maxMoves);
  }, [topMoves, moves, maxMoves]);

  const isUsingDailyFocus = dailyFocusMoves.length > 0;
  const displayMoves = isUsingDailyFocus ? dailyFocusMoves : legacyMoves;

  const computedMomentumTotal = useMemo(() => {
    return displayMoves.reduce((sum, move) => {
      return sum + toFiniteNumber(move?.momentum ?? move?.estimatedMomentum, 0);
    }, 0);
  }, [displayMoves]);

  const resolvedTotalMomentum = useMemo(() => {
    const impactMomentum = toFiniteNumber(impactSummary?.totalMomentum, NaN);
    return Number.isFinite(impactMomentum) && impactMomentum > 0
      ? impactMomentum
      : computedMomentumTotal;
  }, [impactSummary?.totalMomentum, computedMomentumTotal]);

  const resolvedTotalUnblocks = useMemo(() => {
    return toFiniteNumber(impactSummary?.totalUnblocks, 0);
  }, [impactSummary?.totalUnblocks]);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);

    await Promise.allSettled([
      loadDailyFocusPlan({ silent: true }),
      refresh?.(),
    ]);

    setTimeout(() => setIsManualRefreshing(false), 500);
  }, [loadDailyFocusPlan, refresh]);

  const handleAcceptDailyFocus = useCallback(async () => {
    const moveIds = dailyFocusMoves
      .map((move) => getMoveIdentity(move))
      .filter(Boolean)
      .slice(0, maxMoves);

    if (!moveIds.length) return;

    setIsPlanningAction(true);

    try {
      const updatedPlan = await acceptTodayDailyFocus(moveIds);
      setDailyFocusPlan(updatedPlan);
    } finally {
      setIsPlanningAction(false);
    }
  }, [dailyFocusMoves, maxMoves]);

  const handleAddCustomMove = useCallback(async (event) => {
    event?.preventDefault?.();

    const title = customMoveTitle.trim();
    if (!title) return;

    setIsPlanningAction(true);

    try {
      const updatedPlan = await addDailyFocusMove({ title });
      setDailyFocusPlan(updatedPlan);
      setCustomMoveTitle('');
    } finally {
      setIsPlanningAction(false);
    }
  }, [customMoveTitle]);

  const handleStartEdit = useCallback((move) => {
    const moveId = getMoveIdentity(move);
    setEditingMoveId(moveId);
    setEditingTitle(move?.title || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMoveId('');
    setEditingTitle('');
  }, []);

  const handleSaveEdit = useCallback(async (moveId) => {
    const title = editingTitle.trim();
    if (!moveId || !title) return;

    setIsPlanningAction(true);

    try {
      const updatedPlan = await updateDailyFocusMove(moveId, { title });
      setDailyFocusPlan(updatedPlan);
      setEditingMoveId('');
      setEditingTitle('');
    } finally {
      setIsPlanningAction(false);
    }
  }, [editingTitle]);

  const handleDeleteDailyMove = useCallback(async (moveId) => {
    if (!moveId) return;

    setIsPlanningAction(true);

    try {
      const updatedPlan = await deleteDailyFocusMove(moveId);
      setDailyFocusPlan(updatedPlan);
    } finally {
      setIsPlanningAction(false);
    }
  }, []);

  const handleComplete = useCallback(async (moveOrId) => {
    const moveId = getMoveIdentity(moveOrId);

    if (!moveId) return;

    if (dailyFocusMoveIds.has(moveId)) {
      const updatedPlan = await completeDailyFocusMove(moveId);
      setDailyFocusPlan(updatedPlan);
      return;
    }

    if (completeMove) await completeMove(moveId);
  }, [completeMove, dailyFocusMoveIds]);

  const handleSnooze = useCallback(async (moveId, hours) => {
    if (snoozeMove) await snoozeMove(moveId, hours);
  }, [snoozeMove]);

  const isCompact = variant === 'compact' || variant === 'sidebar';
  const displayLoading = (loading || dailyFocusLoading) && displayMoves.length === 0;
  const displayError = error && !isUsingDailyFocus;

  return (
    <div
      className={`
        card-action
        ${isCompact ? 'p-5' : 'p-6'} rounded-xl
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        shadow-[0_4px_24px_rgba(139,92,246,0.04)]
        ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : ''}
        ${className}
      `}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shadow-sm ${
                hasUrgentMoves
                  ? 'bg-amber-50 dark:bg-amber-500/10'
                  : 'bg-slate-50 dark:bg-white/5'
              }`}
            >
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

              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1 normal-case tracking-normal">
                What should we work on today?
              </p>

              {hasUrgentMoves && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">
                  Action needed
                </p>
              )}

              {dailyFocusError && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">
                  Daily Focus fallback active
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isRefreshing || isManualRefreshing || dailyFocusLoading || isPlanningAction) && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Updating...
              </span>
            )}

            {showRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing || dailyFocusLoading || isPlanningAction}
                className="p-2 rounded-lg text-slate-400 hover:text-[var(--theme-accent-primary)] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh moves"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing || isManualRefreshing || dailyFocusLoading || isPlanningAction
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              </button>
            )}

            {onViewAll && (
              <button
                type="button"
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
      {displayLoading ? (
        <MoveCardSkeleton count={maxMoves} />
      ) : displayError ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />

          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">
            Failed to load moves
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-black uppercase tracking-widest text-[var(--theme-accent-primary)] hover:brightness-110"
          >
            Try again
          </button>
        </div>
      ) : displayMoves.length > 0 ? (
        <div className="space-y-4">
          {!isCompact && (
            <DailyFocusIntroPanel
              isUsingDailyFocus={isUsingDailyFocus}
              hasAcceptedDailyPlan={hasAcceptedDailyPlan}
              dailyFocusPlan={dailyFocusPlan}
              dailyFocusMoves={dailyFocusMoves}
              isPlanningAction={isPlanningAction}
              customMoveTitle={customMoveTitle}
              setCustomMoveTitle={setCustomMoveTitle}
              onAcceptDailyFocus={handleAcceptDailyFocus}
              onAddCustomMove={handleAddCustomMove}
            />
          )}

          <div className="space-y-3">
            {displayMoves.map((move, index) => {
              const moveId = getMoveIdentity(move);
              const isEditing = editingMoveId === moveId;

              return (
                <div key={moveId || `move-${index}`} className="space-y-2">
                  <MoveCard
                    move={move}
                    rank={index + 1}
                    onClick={onMoveClick}
                    onComplete={handleComplete}
                    onSnooze={handleSnooze}
                    showProject={true}
                    showActions={!isCompact}
                    variant={isCompact ? 'compact' : 'default'}
                  />

                  {isUsingDailyFocus && !isCompact && (
                    <DailyFocusMoveControls
                      move={move}
                      moveId={moveId}
                      isEditing={isEditing}
                      editingTitle={editingTitle}
                      setEditingTitle={setEditingTitle}
                      isPlanningAction={isPlanningAction}
                      hasAcceptedDailyPlan={hasAcceptedDailyPlan}
                      onStartEdit={handleStartEdit}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onDelete={handleDeleteDailyMove}
                      onComplete={handleComplete}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState onRefresh={handleRefresh} />
      )}

      {/* Footer - Impact Summary */}
      {showFooter && displayMoves.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              Complete all{' '}
              <strong className="text-slate-800 dark:text-zinc-200">
                {displayMoves.length}
              </strong>{' '}
              to unlock
            </span>

            <div className="flex items-center gap-4">
              {resolvedTotalUnblocks > 0 && (
                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 rounded-md uppercase tracking-wider">
                  Unblock {resolvedTotalUnblocks} teammates
                </span>
              )}

              <span className="flex items-center gap-1.5 text-[12px] font-black text-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)] px-2.5 py-1 rounded-md">
                <Zap className="w-3.5 h-3.5 fill-[var(--theme-accent-primary)]/20" />
                +{resolvedTotalMomentum} Momentum
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyFocusIntroPanel({
  isUsingDailyFocus,
  hasAcceptedDailyPlan,
  dailyFocusPlan,
  dailyFocusMoves,
  isPlanningAction,
  customMoveTitle,
  setCustomMoveTitle,
  onAcceptDailyFocus,
  onAddCustomMove,
}) {
  if (!isUsingDailyFocus) {
    return (
      <div className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-accent-primary)]">
              Recommended from your active projects
            </p>

            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1">
              OpenShare found the highest-leverage moves for this account right now.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-zinc-900 border border-violet-100 dark:border-violet-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
            Daily focus
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/50 dark:from-violet-500/10 dark:via-zinc-900 dark:to-cyan-500/5 px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-accent-primary)] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            {hasAcceptedDailyPlan ? "Today's plan locked" : 'Recommended from your active projects'}
          </p>

          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl">
            {hasAcceptedDailyPlan
              ? 'These are the moves you chose for today. Complete them to turn the day into momentum.'
              : 'OpenShare found the highest-leverage moves for this account right now. Accept them or add your own move.'}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-zinc-950 border border-violet-100 dark:border-violet-500/20 px-3 py-1 text-[11px] font-black text-slate-600 dark:text-zinc-300">
              <Target className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
              {dailyFocusMoves.length} moves
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-zinc-950 border border-violet-100 dark:border-violet-500/20 px-3 py-1 text-[11px] font-black text-slate-600 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
              {dailyFocusPlan?.status || 'suggested'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[260px]">
          {!hasAcceptedDailyPlan && (
            <button
              type="button"
              onClick={onAcceptDailyFocus}
              disabled={isPlanningAction || dailyFocusMoves.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Today's Moves
            </button>
          )}

          <form onSubmit={onAddCustomMove} className="flex items-center gap-2">
            <input
              value={customMoveTitle}
              onChange={(event) => setCustomMoveTitle(event.target.value)}
              placeholder="Add your own move..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-zinc-100 outline-none focus:border-[var(--theme-accent-primary)]"
            />

            <button
              type="submit"
              disabled={isPlanningAction || !customMoveTitle.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all disabled:opacity-50"
              title="Add custom move"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DailyFocusMoveControls({
  move,
  moveId,
  isEditing,
  editingTitle,
  setEditingTitle,
  isPlanningAction,
  hasAcceptedDailyPlan,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onComplete,
}) {
  if (!moveId) return null;

  if (isEditing) {
    return (
      <div className="ml-2 rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-white dark:bg-zinc-950 px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-zinc-100 outline-none focus:border-[var(--theme-accent-primary)]"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSaveEdit(moveId)}
              disabled={isPlanningAction || !editingTitle.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>

            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isPlanningAction}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-2 flex flex-wrap items-center gap-2">
      {!isMoveDone(move) && (
        <button
          type="button"
          onClick={() => onComplete(moveId)}
          disabled={isPlanningAction}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 hover:brightness-105 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Complete
        </button>
      )}

      <button
        type="button"
        onClick={() => onStartEdit(move)}
        disabled={isPlanningAction}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all disabled:opacity-50"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(moveId)}
        disabled={isPlanningAction}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 transition-all disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {hasAcceptedDailyPlan ? 'Delete' : 'Dismiss'}
      </button>
    </div>
  );
}

function EmptyState({ onRefresh }) {
  const goToProjects = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm">
        <Flame className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      </div>

      <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
        All caught up! 🎉
      </h4>

      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6 max-w-xl mx-auto">
        No critical moves right now. Create a project or add tasks inside one of your projects to start building momentum.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          Create Project
        </button>

        <button
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          View Projects
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
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
  const { topMoves, hasUrgentMoves } = useFocusEngine();

  if (!topMoves.length) return null;

  const topMove = topMoves[0];
  const topMoveMomentum = toFiniteNumber(topMove?.momentum, 0);

  return (
    <div
      className={`
        px-5 py-3.5 rounded-xl shadow-sm
        ${
          hasUrgentMoves
            ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
            : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10'
        }
        flex flex-col sm:flex-row sm:items-center justify-between gap-3
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <Target
          className={`w-5 h-5 flex-shrink-0 ${
            hasUrgentMoves
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-[var(--theme-accent-primary)]'
          }`}
        />

        <div>
          <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">
            Top priority
          </p>

          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            {topMove.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {topMove.project && (
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm"
            style={{
              backgroundColor: `${topMove.project.color}15`,
              color: topMove.project.color,
              border: `1px solid ${topMove.project.color}30`,
            }}
          >
            {topMove.project.name}
          </span>
        )}

        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black text-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)]">
          <Zap className="w-3.5 h-3.5" />
          +{topMoveMomentum}
        </span>
      </div>
    </div>
  );
}

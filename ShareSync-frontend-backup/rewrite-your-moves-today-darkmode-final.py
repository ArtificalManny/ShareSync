from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/components/focus/YourMovesToday.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-rewrite-your-moves-final-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-rewrite-your-moves-final-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx_new = r'''// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: Your 3 Moves Today - Daily Focus View
// UPGRADED: "What should we work on today?" command-card language
// SURGICAL PASS:
// - Preserve existing API/data flow
// - Preserve MoveCard rendering and actions
// - Preserve user-scoped focus behavior
// - Prepare component for future accept/edit/delete daily-plan persistence
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle, FolderPlus, LayoutDashboard } from 'lucide-react';
import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { useFocusEngine } from '../../contexts/FocusEngineContext';
import { useUserFocusMoves } from '../../hooks/useFocusMoves';

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
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

  const computedMomentumTotal = useMemo(() => {
    return displayMoves.reduce((sum, move) => {
      return sum + toFiniteNumber(move?.momentum, 0);
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
    <div
      className={`
        your-moves-today-panel card-action
        ${isCompact ? 'p-5' : 'p-6'} rounded-xl
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        shadow-[0_4px_24px_rgba(139,92,246,0.04)]
        ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : ''}
        ${className}
      `}
    >
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isRefreshing || isManualRefreshing) && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Updating...
              </span>
            )}

            {showRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing}
                className="p-2 rounded-lg text-slate-400 hover:text-[var(--theme-accent-primary)] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh moves"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing || isManualRefreshing ? 'animate-spin' : ''
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

      {loading ? (
        <MoveCardSkeleton count={maxMoves} />
      ) : error ? (
        <div className="your-moves-error-card py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
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
            <div className="your-moves-recommendation-card rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">
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
          )}

          <div className="your-moves-list space-y-3">
            {displayMoves.map((move, index) => (
              <div
                key={move.id || move._id || move.taskId || `move-${index}`}
                className="your-moves-move-card-wrap"
              >
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
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState onRefresh={handleRefresh} />
      )}

      {showFooter && displayMoves.length > 0 && (
        <div className="your-moves-footer mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
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

function EmptyState({ onRefresh }) {
  const goToProjects = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="your-moves-empty-card py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
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
'''

css = css_path.read_text()

def remove_block(text, title):
    start_marker = f"/* =========================================================\n   {title}"
    end_marker = f"/* END {title} */"

    start = text.find(start_marker)
    if start == -1:
        return text

    end = text.find(end_marker, start)
    if end == -1:
        return text

    end += len(end_marker)
    return text[:start].rstrip() + "\n\n" + text[end:].lstrip()

for title in [
    "YOUR MOVES TODAY DARKMODE STRIKE v1",
    "YOUR MOVES TODAY DARKMODE REPAIR v2",
    "YOUR MOVES TODAY MOVE CARDS DARKMODE v3",
    "YOUR MOVES TODAY MOVE CARDS DARKMODE v4",
    "YOUR MOVES TODAY FINAL DARKMODE v5",
]:
    css = remove_block(css, title)

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY FINAL DARKMODE v5
   Home > Your 3 Moves Today.
   Direct classes now exist in YourMovesToday.jsx.
   ========================================================= */

.your-moves-today-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
body.dark .your-moves-today-panel {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.24), transparent 36%),
    radial-gradient(circle at 96% 18%, rgba(45, 212, 191, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(167, 139, 250, 0.30) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(167, 139, 250, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .your-moves-recommendation-card,
html[data-theme="dark"] .your-moves-recommendation-card,
body.dark .your-moves-recommendation-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    radial-gradient(circle at 94% 0%, rgba(45, 212, 191, 0.12), transparent 38%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(196, 181, 253, 0.30) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 18px 38px rgba(0, 0, 0, 0.24) !important;
}

html.dark .your-moves-move-card-wrap,
html[data-theme="dark"] .your-moves-move-card-wrap,
body.dark .your-moves-move-card-wrap {
  border-radius: 2rem !important;
  overflow: hidden !important;
  border: 1px solid rgba(167, 139, 250, 0.36) !important;
  background:
    radial-gradient(circle at 7% 0%, rgba(139, 92, 246, 0.32), transparent 42%),
    radial-gradient(circle at 96% 20%, rgba(45, 212, 191, 0.18), transparent 40%),
    linear-gradient(135deg, rgba(20, 24, 38, 0.98), rgba(9, 14, 26, 0.98)) !important;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.11) !important;
}

html.dark .your-moves-move-card-wrap > *,
html[data-theme="dark"] .your-moves-move-card-wrap > *,
body.dark .your-moves-move-card-wrap > * {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 42%),
    radial-gradient(circle at 94% 18%, rgba(45, 212, 191, 0.12), transparent 38%),
    rgba(15, 23, 42, 0.92) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #f8fafc !important;
  box-shadow: none !important;
}

html.dark .your-moves-move-card-wrap [class*="bg-white"],
html.dark .your-moves-move-card-wrap [class*="bg-slate-50"],
html.dark .your-moves-move-card-wrap [class*="bg-gray-50"],
html.dark .your-moves-move-card-wrap [class*="bg-zinc-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-white"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-slate-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-gray-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-zinc-50"],
body.dark .your-moves-move-card-wrap [class*="bg-white"],
body.dark .your-moves-move-card-wrap [class*="bg-slate-50"],
body.dark .your-moves-move-card-wrap [class*="bg-gray-50"],
body.dark .your-moves-move-card-wrap [class*="bg-zinc-50"] {
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

html.dark .your-moves-move-card-wrap h1,
html.dark .your-moves-move-card-wrap h2,
html.dark .your-moves-move-card-wrap h3,
html.dark .your-moves-move-card-wrap h4,
html.dark .your-moves-move-card-wrap strong,
html.dark .your-moves-move-card-wrap .font-bold,
html.dark .your-moves-move-card-wrap .font-black,
html[data-theme="dark"] .your-moves-move-card-wrap h1,
html[data-theme="dark"] .your-moves-move-card-wrap h2,
html[data-theme="dark"] .your-moves-move-card-wrap h3,
html[data-theme="dark"] .your-moves-move-card-wrap h4,
html[data-theme="dark"] .your-moves-move-card-wrap strong,
html[data-theme="dark"] .your-moves-move-card-wrap .font-bold,
html[data-theme="dark"] .your-moves-move-card-wrap .font-black,
body.dark .your-moves-move-card-wrap h1,
body.dark .your-moves-move-card-wrap h2,
body.dark .your-moves-move-card-wrap h3,
body.dark .your-moves-move-card-wrap h4,
body.dark .your-moves-move-card-wrap strong,
body.dark .your-moves-move-card-wrap .font-bold,
body.dark .your-moves-move-card-wrap .font-black {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
}

html.dark .your-moves-move-card-wrap p,
html.dark .your-moves-move-card-wrap span,
html.dark .your-moves-move-card-wrap div,
html.dark .your-moves-move-card-wrap button,
html.dark .your-moves-move-card-wrap [class*="text-slate-"],
html.dark .your-moves-move-card-wrap [class*="text-zinc-"],
html.dark .your-moves-move-card-wrap [class*="text-gray-"],
html[data-theme="dark"] .your-moves-move-card-wrap p,
html[data-theme="dark"] .your-moves-move-card-wrap span,
html[data-theme="dark"] .your-moves-move-card-wrap div,
html[data-theme="dark"] .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-slate-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-zinc-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-gray-"],
body.dark .your-moves-move-card-wrap p,
body.dark .your-moves-move-card-wrap span,
body.dark .your-moves-move-card-wrap div,
body.dark .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap [class*="text-slate-"],
body.dark .your-moves-move-card-wrap [class*="text-zinc-"],
body.dark .your-moves-move-card-wrap [class*="text-gray-"] {
  color: rgba(226, 232, 240, 0.90) !important;
  opacity: 1 !important;
}

html.dark .your-moves-move-card-wrap [class*="text-violet-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-violet-"],
body.dark .your-moves-move-card-wrap [class*="text-violet-"] {
  color: #c4b5fd !important;
}

html.dark .your-moves-move-card-wrap [class*="text-red-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-red-"],
body.dark .your-moves-move-card-wrap [class*="text-red-"] {
  color: #fb7185 !important;
}

html.dark .your-moves-move-card-wrap [class*="text-teal-"],
html.dark .your-moves-move-card-wrap [class*="text-emerald-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-teal-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-emerald-"],
body.dark .your-moves-move-card-wrap [class*="text-teal-"],
body.dark .your-moves-move-card-wrap [class*="text-emerald-"] {
  color: #5eead4 !important;
}

html.dark .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap button {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
}

html.dark .your-moves-footer,
html[data-theme="dark"] .your-moves-footer,
body.dark .your-moves-footer {
  border-top-color: rgba(255, 255, 255, 0.12) !important;
}

/* END YOUR MOVES TODAY FINAL DARKMODE v5 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

jsx_path.write_text(jsx_new)
css_path.write_text(css)

print("YourMovesToday final dark-mode rewrite applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Rewrote YourMovesToday.jsx from the current pasted structure")
print("- Added direct wrapper classes around each MoveCard row")
print("- Added final scoped dark-mode CSS")
print("- Fixed the missing EmptyState closing brace if your local file had it")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")

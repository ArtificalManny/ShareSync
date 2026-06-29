// src/components/focus/MoveCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Move Card Component (Behavioral UI / High Contrast)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Target, Rocket, Bug, GitPullRequest, FileText, CheckCircle2,
  Clock, Zap, MoreHorizontal, Play, ArrowUpRight, SkipForward,
} from 'lucide-react';
import UnblockIndicator from './UnblockIndicator';
import { getTimeUntilDeadline, getUrgencyLevel } from '../../utils/focusRanking';

const TYPE_CONFIG = {
  ship: { icon: Rocket, color: 'text-brand', bg: 'bg-brand/10' },
  fix: { icon: Bug, color: 'text-warning', bg: 'bg-warning/10' },
  review: { icon: GitPullRequest, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  doc: { icon: FileText, color: 'text-success', bg: 'bg-success/10' },
  default: { icon: Target, color: 'text-text-secondary', bg: 'bg-surface-2' },
};

const URGENCY_STYLES = {
  critical: { border: 'border-l-error-500', bg: 'bg-error-500/5', badge: 'bg-error-500/10 text-error-500' },
  high: { border: 'border-l-warning', bg: 'bg-warning/5', badge: 'bg-warning/10 text-warning' },
  medium: { border: 'border-l-brand/50', bg: '', badge: '' },
  low: { border: '', bg: '', badge: '' },
  none: { border: '', bg: '', badge: '' },
};

const RANK_STYLES = {
  1: { cardBg: 'bg-surface-2', borderAccent: 'border-brand/30', glow: 'shadow-md shadow-brand/5', rankBg: 'bg-gradient-to-br from-brand/20 to-brand/5', rankText: 'text-brand font-black', titleSize: 'text-base font-semibold' },
  2: { cardBg: 'bg-surface-2/60', borderAccent: 'border-white/[0.08]', glow: '', rankBg: 'bg-surface-3', rankText: 'text-text-primary font-bold', titleSize: 'text-[15px] font-medium' },
  3: { cardBg: 'bg-surface-2/30', borderAccent: 'border-white/[0.04]', glow: '', rankBg: 'bg-surface-3/60', rankText: 'text-text-tertiary font-bold', titleSize: 'text-sm font-medium' },
};

const getRankStyle = (rank) => RANK_STYLES[rank] || RANK_STYLES[3];

function isMoveDone(move) {
  const status = String(move?.status || '').toLowerCase();
  return status === 'done' || status === 'completed' || status === 'complete';
}

function isDailyFocusMove(move) {
  const id = String(move?.id || '');
  return Boolean(
    move?.isDailyFocusMove ||
      id.startsWith('task_') ||
      id.startsWith('milestone_') ||
      id.startsWith('project_') ||
      id.startsWith('custom_')
  );
}

function getMoveTargetId(move) {
  if (String(move?.sourceType || '').toLowerCase() === 'milestone') {
    return move?.sourceId || move?._id || move?.id || '';
  }
  return move?.taskId || move?.sourceId || move?._id || move?.id || '';
}

function getMomentumValue(move) {
  const value = Number(move?.momentum ?? move?.estimatedMomentum ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export default function MoveCard({
  move, onClick, onComplete, onSnooze, showProject = true, showActions = true, variant = 'default', rank, 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState(null);
  
  // 🚨 UI STATE: Controls the disappear animation
  const [isExiting, setIsExiting] = useState(false);
  const menuRef = useRef(null);

  const typeConfig = TYPE_CONFIG[move.type] || TYPE_CONFIG.default;
  const TypeIcon = typeConfig.icon;
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);
  const rankStyle = rank ? getRankStyle(rank) : getRankStyle(3);
  const isCompact = variant === 'compact';
  const moveDone = isMoveDone(move);
  const dailyFocusMove = isDailyFocusMove(move);
  const shouldVisuallyExit = isExiting && !dailyFocusMove;
  const doneVisual = moveDone || shouldVisuallyExit;
  const momentumValue = getMomentumValue(move);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    if (showMenu) {
      setShowMenu(false);
    } else if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuCoords({ top: rect.bottom + 8, left: rect.right - 192 });
      setShowMenu(true);
    }
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClose = () => setShowMenu(false);
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [showMenu]);

  // Daily Focus moves should stay visible after completion.
  // Legacy task moves can still use the old exit animation.
  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isExiting || moveDone) return;

    const targetId = getMoveTargetId(move);

    if (!targetId || !onComplete) return;

    if (dailyFocusMove) {
      await onComplete(targetId, move);
      return;
    }

    setIsExiting(true);

    setTimeout(async () => {
      await onComplete(targetId, move);
    }, 300);
  }, [move, onComplete, isExiting, moveDone, dailyFocusMove]);

  const handleSnooze = useCallback((e) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      const targetId = getMoveTargetId(move);
      if (targetId && onSnooze) onSnooze(targetId, 4, move);
    }, 300);
    setShowMenu(false);
  }, [move, onSnooze]);

  const handleFallbackClick = useCallback((e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(move);
    } else {
      console.log("Task details requested:", move.title);
      // Fallback behavior if no onClick handler is mapped
    }
    setShowMenu(false);
  }, [move, onClick]);

  return (
    <div
      onClick={() => onClick?.(move)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group cursor-pointer
        ${isCompact ? 'p-3' : 'p-4'} rounded-xl
        ${
          moveDone
            ? 'border border-emerald-200/80 bg-emerald-50/70 shadow-sm shadow-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            : `${rankStyle.cardBg} border ${rankStyle.borderAccent}`
        }
        ${urgencyStyles.border && !moveDone ? `border-l-2 ${urgencyStyles.border}` : ''}
        ${!moveDone ? urgencyStyles.bg : ''}
        
        /* Smooth Daily Focus completion behavior */
        transition-all duration-300 ease-in-out
        ${shouldVisuallyExit ? 'opacity-0 scale-95 -translate-x-4 pointer-events-none' : 'opacity-100 scale-100'}
        ${isHovered && !shouldVisuallyExit && !moveDone ? 'transform -translate-y-[2px] shadow-lg shadow-black/20' : ''}
        ${moveDone ? 'cursor-default' : ''}
        relative z-10 hover:z-20
      `}
    >
      <div className="flex items-start gap-4">
        {rank ? (
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
              moveDone
                ? 'bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-500/15 dark:text-emerald-300'
                : `${rankStyle.rankBg} shadow-inner`
            }`}
          >
            {moveDone ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <span className={`text-sm tracking-tighter ${rankStyle.rankText}`}>#{rank}</span>
            )}
          </div>
        ) : (
          <div className={`shrink-0 p-2.5 rounded-xl ${moveDone ? 'bg-emerald-100 dark:bg-emerald-500/15' : typeConfig.bg} mt-0.5`}>
            {moveDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
            )}
          </div>
        )}

        <div className={`flex-1 min-w-0 pr-2 transition-all duration-300 ${doneVisual ? 'opacity-75 grayscale-[0.15]' : ''}`}>
          {showProject && move.project && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border" style={{ backgroundColor: `${move.project.color || '#3b82f6'}10`, color: move.project.color || '#3b82f6', borderColor: `${move.project.color || '#3b82f6'}20` }}>
                <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: move.project.color || '#3b82f6' }} />
                {move.project.name || 'Project'}
              </span>
              {(urgencyLevel === 'critical' || urgencyLevel === 'high') && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${urgencyStyles.badge}`}>
                  {urgencyLevel === 'critical' ? '🔴 Critical' : '🟠 Urgent'}
                </span>
              )}
            </div>
          )}

          <h4
            className={`${rankStyle.titleSize} transition-colors ${
              moveDone
                ? 'text-slate-500 line-through decoration-emerald-500/50 decoration-2 group-hover:text-slate-500 dark:text-zinc-400'
                : 'text-text-primary group-hover:text-brand'
            } ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}
          >
            {move.title}
          </h4>

          {move.impact && !isCompact && (
            <p className="text-[13px] text-text-tertiary mt-1.5 line-clamp-1">{move.impact}</p>
          )}

          <div className={`flex flex-wrap items-center gap-3.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            {moveDone && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-black text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}

            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold shadow-sm ${
              moveDone
                ? 'border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400'
                : 'bg-brand/10 border-brand/20 text-brand shadow-brand/5'
            }`}>
              <Zap className="w-3 h-3" />+{momentumValue}
            </span>
            {move.unblocks > 0 && <UnblockIndicator count={move.unblocks} variant={isCompact ? 'compact' : 'default'} />}
            {timeLeft && (
              <span className={`flex items-center gap-1.5 text-[11px] font-medium ${urgencyLevel === 'critical' ? 'text-error-500 bg-error-500/10 px-2 py-0.5 rounded-md' : urgencyLevel === 'high' ? 'text-warning' : 'text-text-tertiary'}`}>
                <Clock className="w-3 h-3" />{timeLeft}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {showActions && (
            <>
              <button
                onClick={handleComplete}
                disabled={isExiting || moveDone}
                className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-90 ${
                  moveDone
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-default'
                    : isExiting
                      ? 'bg-success border-success text-white shadow-lg shadow-success/20'
                      : 'bg-surface-2 border-white/[0.08] text-success/70 hover:bg-success hover:border-success hover:text-white hover:shadow-lg hover:shadow-success/20'
                } disabled:opacity-100`}
                title={moveDone ? 'Completed' : 'Mark complete'}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div className="relative" ref={menuRef}>
                <button 
                  onClick={toggleMenu} 
                  className={`p-2.5 rounded-xl border transition-all duration-200 ${showMenu ? 'bg-surface-3 border-white/[0.15] text-text-primary shadow-inner' : 'bg-surface-2 border-white/[0.04] text-text-tertiary hover:bg-surface-3 hover:border-white/[0.10] hover:text-text-secondary'}`} 
                  title="More actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* 🚨 COLOR THEORY FIX: Hardcoded deep solid background (bg-gray-900) and explicitly white text so it CANNOT bleed into light backgrounds */}
                {showMenu && createPortal(
                  <div 
                    className="fixed z-[9999] w-48 py-1.5 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: menuCoords?.top, left: menuCoords?.left }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button onClick={handleFallbackClick} className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                      <Play className="w-4 h-4 text-brand" /> Start working
                    </button>
                    <button onClick={handleSnooze} className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                      <SkipForward className="w-4 h-4 text-warning" /> {dailyFocusMove ? 'Hide for today' : 'Snooze 4 hours'}
                    </button>
                    <div className="mx-3 my-1.5 border-t border-gray-700/50" />
                    <button onClick={handleFallbackClick} className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                      <ArrowUpRight className="w-4 h-4 text-cyan-400" /> {move?.sourceType === 'milestone' ? 'View milestone' : 'View task details'}
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MoveCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-surface-2 border border-white/[0.04] animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-surface-3" />
            <div className="flex-1 mt-1">
              <div className="flex gap-2 mb-3"><div className="h-4 w-16 bg-surface-3 rounded-md" /><div className="h-4 w-12 bg-surface-3 rounded-md" /></div>
              <div className="h-5 w-3/4 bg-surface-3 rounded mb-2.5" />
              <div className="h-4 w-1/2 bg-surface-3 rounded mb-4" />
              <div className="h-4 w-1/3 bg-surface-3 rounded" />
            </div>
            <div className="flex gap-2"><div className="h-10 w-10 bg-surface-3 rounded-xl" /><div className="h-10 w-10 bg-surface-3 rounded-xl" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

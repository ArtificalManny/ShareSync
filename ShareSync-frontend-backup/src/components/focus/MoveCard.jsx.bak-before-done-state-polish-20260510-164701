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
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);
  const rankStyle = rank ? getRankStyle(rank) : getRankStyle(3);
  const isCompact = variant === 'compact';

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

  // 🚨 BEHAVIORAL FIX: Instant animation, then propagate up
  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isExiting) return;
    
    // Trigger visual exit instantly
    setIsExiting(true);
    
    // Give the animation 300ms to play before destroying the component from state
    setTimeout(async () => {
      const targetId = move.taskId || move._id || move.id;
      if (targetId && onComplete) {
        await onComplete(targetId);
      }
    }, 300);
  }, [move, onComplete, isExiting]);

  const handleSnooze = useCallback((e) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      const targetId = move.taskId || move._id || move.id;
      if (targetId && onSnooze) onSnooze(targetId, 4);
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
        ${rankStyle.cardBg} border ${rankStyle.borderAccent}
        ${urgencyStyles.border ? `border-l-2 ${urgencyStyles.border}` : ''}
        ${urgencyStyles.bg}
        
        /* 🚨 SMOOTH EXIT ANIMATION */
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 scale-95 -translate-x-4 pointer-events-none' : 'opacity-100 scale-100'}
        ${isHovered && !isExiting ? 'transform -translate-y-[2px] shadow-lg shadow-black/20' : ''}
        relative z-10 hover:z-20
      `}
    >
      <div className="flex items-start gap-4">
        {rank ? (
          <div className={`shrink-0 w-8 h-8 rounded-xl ${rankStyle.rankBg} shadow-inner flex items-center justify-center mt-0.5`}>
            <span className={`text-sm tracking-tighter ${rankStyle.rankText}`}>#{rank}</span>
          </div>
        ) : (
          <div className={`shrink-0 p-2.5 rounded-xl ${typeConfig.bg} mt-0.5`}>
            <TypeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />
          </div>
        )}

        <div className={`flex-1 min-w-0 pr-2 transition-all duration-300 ${isExiting ? 'opacity-50 line-through grayscale' : ''}`}>
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

          <h4 className={`${rankStyle.titleSize} text-text-primary group-hover:text-brand transition-colors ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {move.title}
          </h4>

          {move.impact && !isCompact && (
            <p className="text-[13px] text-text-tertiary mt-1.5 line-clamp-1">{move.impact}</p>
          )}

          <div className={`flex flex-wrap items-center gap-3.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md text-[11px] font-bold text-brand shadow-sm shadow-brand/5">
              <Zap className="w-3 h-3" />+{move.momentum || 0}
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
                disabled={isExiting} 
                className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-90 ${isExiting ? 'bg-success border-success text-white shadow-lg shadow-success/20' : 'bg-surface-2 border-white/[0.08] text-success/70 hover:bg-success hover:border-success hover:text-white hover:shadow-lg hover:shadow-success/20'} disabled:opacity-50`} 
                title="Mark complete"
              >
                <CheckCircle2 className={`w-5 h-5`} />
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
                      <SkipForward className="w-4 h-4 text-warning" /> Snooze 4 hours
                    </button>
                    <div className="mx-3 my-1.5 border-t border-gray-700/50" />
                    <button onClick={handleFallbackClick} className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                      <ArrowUpRight className="w-4 h-4 text-cyan-400" /> View task details
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

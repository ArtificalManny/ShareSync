// src/components/focus/MoveCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Move Card Component (World-Class Redesign)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Displays a single focus move with:
// - Title and impact
// - Project badge (for cross-project view)
// - Momentum value shifted to meta-row to prevent UI overlapping
// - Unblock count & Urgency indicator
// - Action buttons with dedicated breathing room
// - Rank-based visual hierarchy (#1 pops, #3 recedes gracefully)
// - Resilient absolute positioning for the Dropdown menu
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  ArrowUpRight,
  SkipForward,
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

// Rank-based visual intensity (Von Restorff effect: #1 stands out, #3 recedes)
const RANK_STYLES = {
  1: {
    cardBg: 'bg-surface-2',
    borderAccent: 'border-brand/30',
    glow: 'shadow-md shadow-brand/5',
    rankBg: 'bg-gradient-to-br from-brand/20 to-brand/5',
    rankText: 'text-brand font-black',
    titleSize: 'text-base font-semibold',
  },
  2: {
    cardBg: 'bg-surface-2/60',
    borderAccent: 'border-white/[0.08]',
    glow: '',
    rankBg: 'bg-surface-3',
    rankText: 'text-text-primary font-bold',
    titleSize: 'text-[15px] font-medium',
  },
  3: {
    cardBg: 'bg-surface-2/30',
    borderAccent: 'border-white/[0.04]',
    glow: '',
    rankBg: 'bg-surface-3/60',
    rankText: 'text-text-tertiary font-bold',
    titleSize: 'text-sm font-medium',
  },
};

// Fallback logic up to 10 moves
const getRankStyle = (rank) => RANK_STYLES[rank] || RANK_STYLES[3];

export default function MoveCard({
  move,
  onClick,
  onComplete,
  onSnooze,
  showProject = true,
  showActions = true,
  variant = 'default', // 'default' | 'compact' | 'expanded'
  rank, 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const menuRef = useRef(null);

  const typeConfig = TYPE_CONFIG[move.type] || TYPE_CONFIG.default;
  const TypeIcon = typeConfig.icon;
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);
  const rankStyle = rank ? getRankStyle(rank) : getRankStyle(3);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      // 🚨 CRITICAL FIX: Ensure we extract the exact Task ID from the wrapper
      // If it's a focus move object, it likely has `taskId`. If not, fallback to _id or id.
      const targetId = move.taskId || move._id || move.id;
      
      if (!targetId) {
        console.error("MoveCard Error: Cannot complete task, ID is missing.", move);
        return;
      }
      
      await onComplete?.(targetId);
    } catch (error) {
      console.error("MoveCard completion failed:", error);
    } finally {
      setIsCompleting(false);
    }
  }, [move, onComplete, isCompleting]);

  const handleSnooze = useCallback((e) => {
    e.stopPropagation();
    const targetId = move.taskId || move._id || move.id;
    onSnooze?.(targetId, 4);
    setShowMenu(false);
  }, [move, onSnooze]);

  const handleStartWorking = useCallback((e) => {
    e.stopPropagation();
    onClick?.(move);
    setShowMenu(false);
  }, [move, onClick]);

  const isCompact = variant === 'compact';

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
        ${rankStyle.glow}
        hover:bg-surface-3 hover:border-white/[0.15]
        transition-all duration-300 ease-out
        ${isHovered ? 'transform -translate-y-[2px] shadow-lg shadow-black/20' : ''}
        
        /* 🚨 CRITICAL FIX: Elevate z-index when menu is open so it renders above the next card */
        relative ${showMenu ? 'z-50' : 'z-10 hover:z-20'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Left Col: Rank or Icon */}
        {rank ? (
          <div className={`
            shrink-0 w-8 h-8 rounded-xl
            ${rankStyle.rankBg} shadow-inner
            flex items-center justify-center mt-0.5
          `}>
            <span className={`text-sm tracking-tighter ${rankStyle.rankText}`}>
              #{rank}
            </span>
          </div>
        ) : (
          <div className={`shrink-0 p-2.5 rounded-xl ${typeConfig.bg} mt-0.5`}>
            <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
          </div>
        )}

        {/* Center Col: Content */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Project & Urgency Badges */}
          {showProject && move.project && (
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                style={{ 
                  backgroundColor: `${move.project.color}10`,
                  color: move.project.color,
                  borderColor: `${move.project.color}20`
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full shadow-sm"
                  style={{ backgroundColor: move.project.color }}
                />
                {move.project.name}
              </span>
              
              {(urgencyLevel === 'critical' || urgencyLevel === 'high') && (
                <span className={`
                  px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide
                  ${urgencyStyles.badge}
                `}>
                  {urgencyLevel === 'critical' ? '🔴 Critical' : '🟠 Urgent'}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h4 className={`
            ${rankStyle.titleSize} text-text-primary
            group-hover:text-brand transition-colors
            ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}
          `}>
            {move.title}
          </h4>

          {/* Impact Text */}
          {move.impact && !isCompact && (
            <p className="text-[13px] text-text-tertiary mt-1.5 line-clamp-1">
              {move.impact}
            </p>
          )}

          {/* Meta Row: Unblocks + Deadline + Momentum (Moved here to fix layout squish) */}
          <div className={`flex flex-wrap items-center gap-3.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            
            {/* Momentum (Visually distinguished) */}
            <span className="flex items-center gap-1 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md text-[11px] font-bold text-brand shadow-sm shadow-brand/5">
              <Zap className="w-3 h-3" />
              +{move.momentum || 0}
            </span>

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
                flex items-center gap-1.5 text-[11px] font-medium
                ${urgencyLevel === 'critical' ? 'text-error-500 bg-error-500/10 px-2 py-0.5 rounded-md' : 
                  urgencyLevel === 'high' ? 'text-warning' : 'text-text-tertiary'}
              `}>
                <Clock className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Right Col: Actions (Now highly visible and not cramped) */}
        <div className="shrink-0 flex items-center gap-1.5">
          {showActions && (
            <>
              {/* Complete Action */}
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className={`
                  p-2.5 rounded-xl border
                  transition-all duration-200 active:scale-90
                  ${isCompleting
                    ? 'bg-success border-success text-white shadow-lg shadow-success/20'
                    : 'bg-surface-2 border-white/[0.08] text-success/70 hover:bg-success hover:border-success hover:text-white hover:shadow-lg hover:shadow-success/20'
                  }
                  disabled:opacity-50
                `}
                title="Mark complete"
              >
                <CheckCircle2 className={`w-5 h-5 ${isCompleting ? 'animate-spin' : ''}`} />
              </button>

              {/* ... Menu Action */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className={`
                    p-2.5 rounded-xl border transition-all duration-200
                    ${showMenu
                      ? 'bg-surface-3 border-white/[0.15] text-text-primary shadow-inner'
                      : 'bg-surface-2 border-white/[0.04] text-text-tertiary hover:bg-surface-3 hover:border-white/[0.10] hover:text-text-secondary'
                    }
                  `}
                  title="More actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* 🚨 CRITICAL FIX: Robust Dropdown Positioning */}
                {/* Uses absolute relative to the wrapper, top-full to push it exactly below the button */}
                {showMenu && (
                  <div
                    className="
                      absolute right-0 top-[calc(100%+8px)]
                      w-48 py-1.5 rounded-xl
                      bg-surface-1 border border-white/[0.15]
                      shadow-2xl shadow-black/50
                      backdrop-blur-xl
                      origin-top-right animate-in fade-in zoom-in-95 duration-100
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleStartWorking}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary flex items-center gap-3 transition-colors"
                    >
                      <Play className="w-4 h-4 text-brand" />
                      Start working
                    </button>
                    <button
                      onClick={handleSnooze}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary flex items-center gap-3 transition-colors"
                    >
                      <SkipForward className="w-4 h-4 text-warning" />
                      Snooze 4 hours
                    </button>
                    
                    <div className="mx-3 my-1.5 border-t border-white/[0.08]" />
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); onClick?.(move); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary flex items-center gap-3 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                      View task details
                    </button>
                  </div>
                )}
              </div>
            </>
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
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-surface-2 border border-white/[0.04] animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-surface-3" />
            <div className="flex-1 mt-1">
              <div className="flex gap-2 mb-3">
                <div className="h-4 w-16 bg-surface-3 rounded-md" />
                <div className="h-4 w-12 bg-surface-3 rounded-md" />
              </div>
              <div className="h-5 w-3/4 bg-surface-3 rounded mb-2.5" />
              <div className="h-4 w-1/2 bg-surface-3 rounded mb-4" />
              <div className="h-4 w-1/3 bg-surface-3 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-surface-3 rounded-xl" />
              <div className="h-10 w-10 bg-surface-3 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

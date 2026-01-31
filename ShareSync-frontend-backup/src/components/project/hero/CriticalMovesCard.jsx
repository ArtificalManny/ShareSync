// src/components/project/hero/CriticalMovesCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Critical Moves Card - Today's 3 Focus Actions
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows the top 3 highest-leverage moves for the project today.
// Each move displays:
// - Title
// - Impact reason
// - Momentum value
// - Unblock count (teammates waiting)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  Target, 
  Rocket, 
  Bug, 
  GitPullRequest, 
  CheckCircle2,
  Users,
  Zap,
  ArrowRight,
  Clock,
} from 'lucide-react';

const MOVE_TYPE_CONFIG = {
  ship: {
    icon: Rocket,
    color: 'text-brand',
    bg: 'bg-brand/10',
  },
  fix: {
    icon: Bug,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  review: {
    icon: GitPullRequest,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  default: {
    icon: Target,
    color: 'text-text-secondary',
    bg: 'bg-surface-2',
  },
};

function MoveItem({ move, index, onClick }) {
  const config = MOVE_TYPE_CONFIG[move.type] || MOVE_TYPE_CONFIG.default;
  const Icon = config.icon;

  const isUrgent = move.deadline && new Date(move.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <button
      onClick={() => onClick?.(move)}
      className={`
        w-full p-4 rounded-xl
        bg-surface-2/50 border border-white/[0.04]
        hover:bg-surface-2 hover:border-white/[0.08]
        transition-all duration-200
        text-left group
        ${isUrgent ? 'border-l-2 border-l-warning' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Rank Badge */}
        <div className={`
          shrink-0 w-7 h-7 rounded-lg
          ${config.bg}
          flex items-center justify-center
        `}>
          <span className={`text-xs font-bold ${config.color}`}>
            {index + 1}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
              {move.title}
            </h4>
          </div>

          {/* Impact & Meta */}
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            {move.impact && (
              <span className="truncate max-w-[150px]">{move.impact}</span>
            )}
            
            {move.unblocks > 0 && (
              <span className="flex items-center gap-1 text-cyan-400 shrink-0">
                <Users className="w-3 h-3" />
                Unblocks {move.unblocks}
              </span>
            )}
          </div>
        </div>

        {/* Momentum Badge */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-brand">
            <Zap className="w-3 h-3" />
            +{move.momentum}
          </span>
          
          {isUrgent && (
            <span className="flex items-center gap-1 text-[10px] text-warning">
              <Clock className="w-3 h-3" />
              Today
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function CriticalMovesCard({ moves = [], onMoveClick }) {
  const topMoves = moves.slice(0, 3);

  return (
    <div className="
      p-6 rounded-2xl
      bg-surface-1 border border-white/[0.06]
      hover:border-white/[0.1]
      transition-all duration-300
    ">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-medium text-text-secondary">Today's 3 Critical Moves</h3>
        </div>
        
        <button className="
          text-xs text-text-tertiary hover:text-text-primary
          transition-colors flex items-center gap-1
        ">
          View all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Moves List */}
      {topMoves.length > 0 ? (
        <div className="space-y-2">
          {topMoves.map((move, index) => (
            <MoveItem
              key={move.id}
              move={move}
              index={index}
              onClick={onMoveClick}
            />
          ))}
        </div>
      ) : (
        <div className="
          py-8 text-center rounded-xl
          bg-surface-2/30 border border-dashed border-white/[0.06]
        ">
          <Target className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">No critical moves today</p>
          <p className="text-xs text-text-tertiary mt-1">Great job keeping up!</p>
        </div>
      )}

      {/* Summary Footer */}
      {topMoves.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">
              Complete all 3 to unlock
            </span>
            <span className="flex items-center gap-1 font-medium text-brand">
              <Zap className="w-3.5 h-3.5" />
              +{topMoves.reduce((sum, m) => sum + m.momentum, 0)} momentum
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

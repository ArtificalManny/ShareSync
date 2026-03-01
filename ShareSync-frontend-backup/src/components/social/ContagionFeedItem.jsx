// src/components/social/ContagionFeedItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.2: Single feed item for Momentum Contagion
// ═══════════════════════════════════════════════════════════════════════════════
//
// Renders one activity: avatar + "Sarah just completed 'API refactor' (2m ago)"
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Rocket, CheckCircle, Zap, MessageSquare, Eye } from 'lucide-react';
import { timeAgo, getActionLabel } from '../../hooks/useMomentumContagion';

// ─────────────────────────────────────────────────────────────────────────
// ACTION ICON MAP
// ─────────────────────────────────────────────────────────────────────────
const ACTION_ICONS = {
  'project-ship': { icon: Rocket, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  'ship': { icon: Rocket, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  'task-complete': { icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
  'task-completed': { icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
  'complete': { icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
  'task-start': { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  'task-started': { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  'start': { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  'focus-start': { icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  'focus-complete': { icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  'comment': { icon: MessageSquare, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10' },
  'review': { icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
};

function getActionConfig(actionType) {
  return ACTION_ICONS[actionType] || ACTION_ICONS['task-complete'];
}

// ─────────────────────────────────────────────────────────────────────────
// AVATAR (deterministic color from name)
// ─────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400',
  'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
];

function avatarColorFromName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function ContagionFeedItem({
  item,
  variant = 'default', // 'default' | 'compact' | 'inline'
  className = '',
}) {
  if (!item) return null;

  const { userName, userAvatar, actionType, taskName, projectName, timestamp, xp, isLocal } = item;
  const actionConfig = useMemo(() => getActionConfig(actionType), [actionType]);
  const actionLabel = useMemo(() => getActionLabel(actionType), [actionType]);
  const relativeTime = useMemo(() => timeAgo(timestamp), [timestamp]);
  const avatarColor = useMemo(() => avatarColorFromName(userName), [userName]);
  const Icon = actionConfig.icon;

  // ── Inline variant (single line, for tickers) ──
  if (variant === 'inline') {
    return (
      <span className={`text-xs text-slate-600 dark:text-zinc-400 ${className}`}>
        <span className="font-medium text-slate-800 dark:text-zinc-200">{userName}</span>
        {' '}{actionLabel}{' '}
        {taskName && (
          <span className="font-medium text-slate-700 dark:text-zinc-300">"{taskName}"</span>
        )}
        {relativeTime && (
          <span className="text-slate-400 dark:text-zinc-500"> ({relativeTime})</span>
        )}
      </span>
    );
  }

  // ── Compact variant (small, for sidebar) ──
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 py-1.5 ${className}`}>
        {/* Tiny avatar */}
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColor}`}>
          {userName?.charAt(0) || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate">
            <span className="font-medium text-slate-700 dark:text-zinc-300">{userName}</span>
            {' '}{actionLabel}{' '}
            {taskName && <span className="text-slate-500 dark:text-zinc-400">"{taskName}"</span>}
          </p>
        </div>

        <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex-shrink-0">{relativeTime}</span>
      </div>
    );
  }

  // ── Default variant ──
  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-xl
        bg-white dark:bg-[#1f1f23] border border-slate-100 dark:border-white/[0.06]
        hover:border-violet-200 dark:hover:border-violet-500/20
        transition-colors duration-150
        ${isLocal ? 'ring-1 ring-violet-200 dark:ring-violet-500/20' : ''}
        ${className}
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}>
            {userName?.charAt(0) || 'U'}
          </div>
        )}

        {/* Action icon badge */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${actionConfig.bg} border border-white dark:border-[#1f1f23]`}>
          <Icon className={`w-2.5 h-2.5 ${actionConfig.color}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-zinc-300">
          <span className="font-medium text-slate-800 dark:text-zinc-200">{userName}</span>
          {' '}{actionLabel}{' '}
          {taskName && (
            <span className="font-medium text-slate-700 dark:text-zinc-200">"{taskName}"</span>
          )}
          {projectName && !taskName && (
            <span className="text-slate-500 dark:text-zinc-400">in {projectName}</span>
          )}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">{relativeTime}</span>
          {projectName && taskName && (
            <>
              <span className="text-slate-300 dark:text-zinc-600">·</span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">{projectName}</span>
            </>
          )}
          {xp > 0 && (
            <>
              <span className="text-slate-300 dark:text-zinc-600">·</span>
              <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400">+{xp} XP</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// "YOU'RE NEXT" CTA — shown at bottom of feed
// ─────────────────────────────────────────────────────────────────────────
export function YoureNextCTA({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl
        bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20
        hover:bg-violet-100 dark:hover:bg-violet-500/15
        transition-colors duration-150
        group
        ${className}
      `}
    >
      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
        <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
          You're next — pick your move ↓
        </p>
        <p className="text-[11px] text-violet-500 dark:text-violet-400">
          Join your team and start shipping
        </p>
      </div>
    </button>
  );
}

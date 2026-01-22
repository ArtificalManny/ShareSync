// src/components/arena/TeamMemberCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Team Member Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Card showing a team member's presence and current activity.
// Features:
// - Avatar with presence glow
// - Current task (if sharing)
// - Quick actions (co-work, message)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { MessageCircle, Users, MoreHorizontal } from 'lucide-react';
import PresenceIndicator, { PresenceBadge } from './PresenceIndicator';
import ActiveTaskBadge from './ActiveTaskBadge';
import { PRESENCE_STATUS } from '../../contexts/PresenceContext';

/**
 * TeamMemberCard - Full card for team member
 */
export default function TeamMemberCard({ 
  member,
  onCowork,
  onMessage,
  compact = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    name,
    avatar,
    status,
    currentTask,
    currentProject,
    activityType,
    focusSessionActive,
    lastActivity,
  } = member;

  // Format last activity
  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const last = new Date(timestamp);
    const diffMins = Math.floor((now - last) / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const isActive = status === PRESENCE_STATUS.ACTIVE || status === PRESENCE_STATUS.FOCUS;
  const isFocused = status === PRESENCE_STATUS.FOCUS;

  if (compact) {
    return (
      <div className={`
        flex items-center gap-3 p-3 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200 cursor-pointer
        ${isFocused ? 'ring-1 ring-brand/30' : ''}
      `}>
        {/* Avatar with presence */}
        <div className="relative">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-xl
            ${isActive ? 'bg-gradient-to-br from-brand/20 to-accent-500/20' : 'bg-surface-2'}
            ${isFocused ? 'ring-2 ring-brand/50 animate-pulse' : ''}
          `}>
            {avatar}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator status={status} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{name}</span>
            {isFocused && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/20 text-brand font-medium">
                Focus
              </span>
            )}
          </div>
          {currentTask ? (
            <ActiveTaskBadge 
              taskName={currentTask}
              activityType={activityType}
              compact
            />
          ) : (
            <span className="text-xs text-text-tertiary">
              {formatLastSeen(lastActivity)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        p-4 rounded-2xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-300
        ${isFocused ? 'ring-1 ring-brand/30 shadow-lg shadow-brand/5' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar with glow */}
        <div className="relative">
          {/* Active glow */}
          {isActive && (
            <div className={`
              absolute -inset-1 rounded-2xl blur-md
              ${isFocused ? 'bg-brand/30 animate-pulse' : 'bg-success/20'}
            `} />
          )}
          <div className={`
            relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl
            ${isActive 
              ? 'bg-gradient-to-br from-brand/20 to-accent-500/20 border border-brand/20' 
              : 'bg-surface-2 border border-white/[0.06]'
            }
          `}>
            {avatar}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <PresenceIndicator status={status} size="md" />
          </div>
        </div>

        {/* Name & Status */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">
            {name}
          </h3>
          <PresenceBadge status={status} />
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <ActiveTaskBadge 
          taskName={currentTask}
          projectName={currentProject}
          activityType={activityType}
        />
      )}

      {/* No task - show last seen */}
      {!currentTask && (
        <div className="p-3 rounded-xl bg-surface-2">
          <p className="text-xs text-text-tertiary">
            Last active {formatLastSeen(lastActivity)}
          </p>
        </div>
      )}

      {/* Actions (show on hover or always on mobile) */}
      <div className={`
        mt-4 flex items-center gap-2
        transition-opacity duration-200
        ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-100'}
      `}>
        {!isFocused && onCowork && (
          <button
            onClick={() => onCowork(member)}
            className="
              flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
              bg-brand/10 hover:bg-brand/20 text-brand text-sm font-medium
              transition-colors
            "
          >
            <Users className="w-4 h-4" />
            Co-work
          </button>
        )}
        {isFocused && (
          <div className="flex-1 py-2 text-center text-xs text-brand">
            🎯 In deep focus - please don't disturb
          </div>
        )}
        {onMessage && (
          <button
            onClick={() => onMessage(member)}
            className="
              p-2 rounded-lg
              bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary
              transition-colors
            "
            title="Send message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * TeamMemberRow - Compact row version for lists
 */
export function TeamMemberRow({ member, onClick }) {
  const { name, avatar, status, currentTask } = member;
  const isActive = status === PRESENCE_STATUS.ACTIVE || status === PRESENCE_STATUS.FOCUS;

  return (
    <button
      onClick={() => onClick?.(member)}
      className="
        w-full flex items-center gap-3 p-2 rounded-lg
        hover:bg-surface-2 transition-colors text-left
      "
    >
      <div className="relative">
        <span className="text-xl">{avatar}</span>
        <div className="absolute -bottom-0.5 -right-0.5">
          <PresenceIndicator status={status} size="sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-primary truncate block">{name}</span>
        {currentTask && (
          <span className="text-xs text-text-tertiary truncate block">
            {currentTask}
          </span>
        )}
      </div>
    </button>
  );
}

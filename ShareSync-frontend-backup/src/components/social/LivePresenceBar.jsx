// src/components/social/LivePresenceBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Live Presence Bar
// Shows real-time team activity - who's doing what right now
// Beyond simple "online" dots - shows context and actions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Eye, Edit3, Coffee, Zap, Clock, MessageCircle,
  CheckCircle2, Rocket, Moon, Focus, Bell, BellOff,
  ChevronRight, ChevronDown, Users, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const PRESENCE_STATES = {
  ACTIVE: 'active',           // Currently working
  VIEWING: 'viewing',         // Viewing something specific
  EDITING: 'editing',         // Editing/typing
  FOCUS: 'focus',             // In focus session (DND)
  IDLE: 'idle',               // Away/idle
  BREAK: 'break',             // On break
  OFFLINE: 'offline',         // Not online
};

export const ACTIVITY_TYPES = {
  VIEWING_TASK: 'viewing_task',
  EDITING_TASK: 'editing_task',
  TYPING_COMMENT: 'typing_comment',
  IN_FOCUS: 'in_focus',
  JUST_SHIPPED: 'just_shipped',
  ON_BREAK: 'on_break',
  IDLE: 'idle',
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PRESENCE_CONFIG = {
  [PRESENCE_STATES.ACTIVE]: {
    color: 'bg-success-500',
    ringColor: 'ring-success-500/30',
    label: 'Active',
    icon: Zap,
  },
  [PRESENCE_STATES.VIEWING]: {
    color: 'bg-brand-500',
    ringColor: 'ring-brand-500/30',
    label: 'Viewing',
    icon: Eye,
  },
  [PRESENCE_STATES.EDITING]: {
    color: 'bg-warning-500',
    ringColor: 'ring-warning-500/30',
    label: 'Editing',
    icon: Edit3,
  },
  [PRESENCE_STATES.FOCUS]: {
    color: 'bg-purple-500',
    ringColor: 'ring-purple-500/30',
    label: 'Focus Mode',
    icon: Focus,
  },
  [PRESENCE_STATES.IDLE]: {
    color: 'bg-text-tertiary',
    ringColor: 'ring-text-tertiary/30',
    label: 'Away',
    icon: Moon,
  },
  [PRESENCE_STATES.BREAK]: {
    color: 'bg-cyan-500',
    ringColor: 'ring-cyan-500/30',
    label: 'On Break',
    icon: Coffee,
  },
  [PRESENCE_STATES.OFFLINE]: {
    color: 'bg-surface-3',
    ringColor: 'ring-surface-3/30',
    label: 'Offline',
    icon: null,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

function PresenceAvatar({ 
  user, 
  size = 'md',
  showStatus = true,
  onClick,
}) {
  const config = PRESENCE_CONFIG[user.presence] || PRESENCE_CONFIG[PRESENCE_STATES.OFFLINE];
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  
  const statusSizes = {
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full flex items-center justify-center
        ${sizeClasses[size]}
        ${user.avatar ? '' : 'bg-surface-2'}
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-500/30' : 'cursor-default'}
        transition-all duration-200
      `}
    >
      {user.avatar ? (
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="font-medium text-text-secondary">
          {user.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
      
      {/* Status indicator */}
      {showStatus && user.presence !== PRESENCE_STATES.OFFLINE && (
        <span className={`
          absolute ${statusSizes[size]} rounded-full
          ${config.color}
          ring-2 ring-surface-0
          ${user.presence === PRESENCE_STATES.EDITING ? 'animate-pulse' : ''}
        `} />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE ACTIVITY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityText({ user, activity }) {
  const getActivityText = () => {
    switch (activity?.type) {
      case ACTIVITY_TYPES.VIEWING_TASK:
        return (
          <>
            <span className="text-text-tertiary">viewing</span>
            <span className="text-text-secondary font-medium truncate max-w-[150px]">
              "{activity.target}"
            </span>
          </>
        );
      case ACTIVITY_TYPES.EDITING_TASK:
        return (
          <>
            <span className="text-text-tertiary">editing</span>
            <span className="text-text-secondary font-medium truncate max-w-[150px]">
              "{activity.target}"
            </span>
          </>
        );
      case ACTIVITY_TYPES.TYPING_COMMENT:
        return (
          <>
            <span className="text-warning-400">typing a comment</span>
            <span className="animate-pulse">...</span>
          </>
        );
      case ACTIVITY_TYPES.IN_FOCUS:
        return (
          <>
            <span className="text-purple-400">in focus session</span>
            {activity.remainingTime && (
              <span className="text-text-tertiary">
                ({activity.remainingTime} min left)
              </span>
            )}
          </>
        );
      case ACTIVITY_TYPES.JUST_SHIPPED:
        return (
          <>
            <span className="text-success-400">just shipped</span>
            <span className="text-text-secondary font-medium truncate max-w-[150px]">
              "{activity.target}"
            </span>
            {activity.timeAgo && (
              <span className="text-text-tertiary">{activity.timeAgo}</span>
            )}
          </>
        );
      case ACTIVITY_TYPES.ON_BREAK:
        return (
          <span className="text-cyan-400">taking a break</span>
        );
      case ACTIVITY_TYPES.IDLE:
        return (
          <span className="text-text-tertiary">away</span>
        );
      default:
        return (
          <span className="text-text-tertiary">online</span>
        );
    }
  };
  
  return (
    <div className="flex items-center gap-1.5 text-xs overflow-hidden">
      {getActivityText()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE PRESENCE ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function PresenceItem({ 
  user, 
  activity, 
  showActivity = true,
  compact = false,
  onClick,
}) {
  const config = PRESENCE_CONFIG[user.presence] || PRESENCE_CONFIG[PRESENCE_STATES.OFFLINE];
  const isDND = user.presence === PRESENCE_STATES.FOCUS;
  
  if (compact) {
    return (
      <PresenceAvatar 
        user={user} 
        size="sm" 
        onClick={onClick}
      />
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 p-2 rounded-lg w-full
        hover:bg-surface-1 transition-colors
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <PresenceAvatar user={user} size="md" />
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {user.name}
          </span>
          {isDND && (
            <BellOff className="w-3 h-3 text-purple-400" title="Do not disturb" />
          )}
        </div>
        
        {showActivity && activity && (
          <ActivityText user={user} activity={activity} />
        )}
      </div>
      
      {/* Quick action hint */}
      {activity?.type === ACTIVITY_TYPES.JUST_SHIPPED && (
        <span className="text-lg" title="Celebrate!">🎉</span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LIVE PRESENCE BAR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LivePresenceBar - Shows real-time team presence and activity
 */
export function LivePresenceBar({
  teamMembers = [],
  currentUserId,
  onMemberClick,
  variant = 'full', // 'full' | 'compact' | 'avatars'
  maxVisible = 5,
  showOffline = false,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter and sort members
  const visibleMembers = useMemo(() => {
    let members = teamMembers.filter(m => m.id !== currentUserId);
    
    if (!showOffline) {
      members = members.filter(m => m.presence !== PRESENCE_STATES.OFFLINE);
    }
    
    // Sort: active > editing > viewing > focus > idle > offline
    const presenceOrder = {
      [PRESENCE_STATES.EDITING]: 0,
      [PRESENCE_STATES.ACTIVE]: 1,
      [PRESENCE_STATES.VIEWING]: 2,
      [PRESENCE_STATES.FOCUS]: 3,
      [PRESENCE_STATES.BREAK]: 4,
      [PRESENCE_STATES.IDLE]: 5,
      [PRESENCE_STATES.OFFLINE]: 6,
    };
    
    return members.sort((a, b) => 
      (presenceOrder[a.presence] || 6) - (presenceOrder[b.presence] || 6)
    );
  }, [teamMembers, currentUserId, showOffline]);
  
  const displayMembers = isExpanded ? visibleMembers : visibleMembers.slice(0, maxVisible);
  const hiddenCount = visibleMembers.length - maxVisible;
  const activeCount = visibleMembers.filter(m => 
    [PRESENCE_STATES.ACTIVE, PRESENCE_STATES.VIEWING, PRESENCE_STATES.EDITING].includes(m.presence)
  ).length;
  
  // Avatars only variant
  if (variant === 'avatars') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex -space-x-2">
          {displayMembers.slice(0, maxVisible).map(member => (
            <PresenceAvatar
              key={member.id}
              user={member}
              size="sm"
              onClick={() => onMemberClick?.(member)}
            />
          ))}
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-xs text-text-tertiary hover:text-text-secondary"
          >
            +{hiddenCount}
          </button>
        )}
      </div>
    );
  }
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Users className="w-3 h-3" />
          <span>{activeCount} active</span>
        </div>
        <div className="flex -space-x-1.5">
          {displayMembers.slice(0, 4).map(member => (
            <PresenceAvatar
              key={member.id}
              user={member}
              size="sm"
              onClick={() => onMemberClick?.(member)}
            />
          ))}
        </div>
        {hiddenCount > 0 && (
          <span className="text-xs text-text-tertiary">+{hiddenCount}</span>
        )}
      </div>
    );
  }
  
  // Full variant
  return (
    <div className={`
      rounded-xl bg-surface-1 border border-white/[0.06]
      overflow-hidden
      ${className}
    `}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-sm font-medium text-text-primary">
            Team Activity
          </span>
          <span className="text-xs text-text-tertiary">
            {activeCount} active
          </span>
        </div>
        {visibleMembers.length > maxVisible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1"
          >
            {isExpanded ? 'Show less' : `+${hiddenCount} more`}
            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Members list */}
      <div className="p-2 space-y-0.5 max-h-[300px] overflow-y-auto">
        {displayMembers.length > 0 ? (
          displayMembers.map(member => (
            <PresenceItem
              key={member.id}
              user={member}
              activity={member.activity}
              onClick={() => onMemberClick?.(member)}
            />
          ))
        ) : (
          <div className="py-6 text-center text-sm text-text-tertiary">
            No team members online
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI PRESENCE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniPresenceIndicator - Small inline presence for task cards
 */
export function MiniPresenceIndicator({
  viewers = [],
  maxShow = 3,
  className = '',
}) {
  if (viewers.length === 0) return null;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Eye className="w-3 h-3 text-text-tertiary" />
      <div className="flex -space-x-1">
        {viewers.slice(0, maxShow).map(viewer => (
          <div
            key={viewer.id}
            className="w-5 h-5 rounded-full bg-surface-2 border border-surface-1 flex items-center justify-center"
            title={`${viewer.name} is viewing`}
          >
            {viewer.avatar ? (
              <img src={viewer.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-[10px] text-text-tertiary">
                {viewer.name?.charAt(0)}
              </span>
            )}
          </div>
        ))}
      </div>
      {viewers.length > maxShow && (
        <span className="text-[10px] text-text-tertiary">
          +{viewers.length - maxShow}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TypingIndicator - Shows when someone is typing
 */
export function TypingIndicator({
  users = [],
  className = '',
}) {
  if (users.length === 0) return null;
  
  const text = users.length === 1
    ? `${users[0].name} is typing`
    : users.length === 2
    ? `${users[0].name} and ${users[1].name} are typing`
    : `${users[0].name} and ${users.length - 1} others are typing`;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-text-tertiary">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIP NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShipNotification - Toast-like notification when someone ships
 */
export function ShipNotification({
  user,
  taskTitle,
  onCelebrate,
  onDismiss,
  className = '',
}) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl
      bg-success-500/10 border border-success-500/30
      animate-in slide-in-from-right duration-300
      ${className}
    `}>
      <PresenceAvatar user={user} size="md" showStatus={false} />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium text-text-primary">{user.name}</span>
          <span className="text-success-400"> shipped</span>
        </div>
        <div className="text-xs text-text-secondary truncate">
          "{taskTitle}"
        </div>
      </div>
      
      <button
        onClick={onCelebrate}
        className="px-3 py-1.5 rounded-lg bg-success-500/20 text-success-400 text-sm hover:bg-success-500/30 transition-colors"
      >
        🎉 Celebrate
      </button>
    </div>
  );
}

export default LivePresenceBar;

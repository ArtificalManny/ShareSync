// src/components/social/OnlineIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Online Indicator
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows who's active and what they're working on.
// Creates FOMO by showing others are being productive.
//
// Key Features:
// - Avatar stack with status indicators
// - Expandable list with activity details
// - Flow state highlighting
// - "X people in flow state" message
// - Real-time status updates
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Circle,
  Zap,
  Rocket,
  Coffee,
  Moon,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Flame,
  Headphones,
  MessageSquare,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  online: {
    icon: Circle,
    color: 'bg-success',
    textColor: 'text-success',
    label: 'Online',
    priority: 1,
  },
  flow: {
    icon: Zap,
    color: 'bg-brand-500',
    textColor: 'text-brand-400',
    label: 'In Flow',
    priority: 0, // Highest priority
    pulse: true,
  },
  shipping: {
    icon: Rocket,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-400',
    label: 'Shipping',
    priority: 0,
    pulse: true,
  },
  focus: {
    icon: Headphones,
    color: 'bg-brand-400',
    textColor: 'text-brand-400',
    label: 'Focus Mode',
    priority: 1,
  },
  meeting: {
    icon: MessageSquare,
    color: 'bg-warning-500',
    textColor: 'text-warning-500',
    label: 'In Meeting',
    priority: 2,
  },
  break: {
    icon: Coffee,
    color: 'bg-warning-500',
    textColor: 'text-warning-500',
    label: 'On Break',
    priority: 3,
  },
  away: {
    icon: Clock,
    color: 'bg-text-tertiary',
    textColor: 'text-text-tertiary',
    label: 'Away',
    priority: 4,
  },
  offline: {
    icon: Moon,
    color: 'bg-surface-3',
    textColor: 'text-text-tertiary',
    label: 'Offline',
    priority: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  { id: '1', name: 'Sarah Chen', avatar: null, status: 'flow', activity: 'Deep work on API integration', duration: '45m' },
  { id: '2', name: 'Alex Rivera', avatar: null, status: 'shipping', activity: 'Deploying v2.3.1', duration: '12m' },
  { id: '3', name: 'Jordan Park', avatar: null, status: 'focus', activity: 'Code review', duration: '28m' },
  { id: '4', name: 'Morgan Lee', avatar: null, status: 'online', activity: 'Planning sprint', duration: null },
  { id: '5', name: 'Taylor Kim', avatar: null, status: 'meeting', activity: 'Team standup', duration: '8m' },
  { id: '6', name: 'Casey Zhang', avatar: null, status: 'break', activity: 'Back in 10m', duration: null },
  { id: '7', name: 'Riley Johnson', avatar: null, status: 'away', activity: 'Last seen 2h ago', duration: null },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════════════════════════════════════════
const StatusDot = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };
  
  return (
    <span className={`
      relative inline-block ${sizes[size]} rounded-full ${config.color}
      ${config.pulse ? 'animate-pulse' : ''}
    `}>
      {config.pulse && (
        <span className={`
          absolute inset-0 rounded-full ${config.color} 
          animate-ping opacity-75
        `} />
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR WITH STATUS
// ═══════════════════════════════════════════════════════════════════════════════
const AvatarWithStatus = ({ user, size = 'md', showStatus = true }) => {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  const statusSizes = {
    sm: 'w-2 h-2 -bottom-0 -right-0',
    md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
  };
  
  const getColorFromName = (name) => {
    const colors = [
      'bg-brand-500/30 text-brand-300',
      'bg-cyan-500/30 text-cyan-300',
      'bg-success-500/30 text-success-300',
      'bg-warning-500/30 text-warning-300',
      'bg-energy-500/30 text-energy-300',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };
  
  const config = STATUS_CONFIG[user.status] || STATUS_CONFIG.offline;
  
  return (
    <div className="relative">
      {user.avatar ? (
        <img 
          src={user.avatar} 
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`
          ${sizes[size]} rounded-full 
          ${getColorFromName(user.name)}
          flex items-center justify-center font-medium
        `}>
          {user.name.charAt(0)}
        </div>
      )}
      
      {showStatus && (
        <div className={`
          absolute ${statusSizes[size]} rounded-full
          ${config.color} border-2 border-surface-0
          ${config.pulse ? 'animate-pulse' : ''}
        `} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR STACK
// ═══════════════════════════════════════════════════════════════════════════════
const AvatarStack = ({ users, max = 4, size = 'md' }) => {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;
  
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user, i) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <AvatarWithStatus user={user} size={size} />
        </motion.div>
      ))}
      
      {remaining > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            ${sizes[size]} rounded-full border-2 border-surface-0
            bg-surface-2 text-text-secondary
            flex items-center justify-center font-medium
          `}
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER ROW (expanded view)
// ═══════════════════════════════════════════════════════════════════════════════
const UserRow = ({ user, onClick }) => {
  const config = STATUS_CONFIG[user.status] || STATUS_CONFIG.offline;
  const Icon = config.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick?.(user)}
      className="
        w-full flex items-center gap-3 p-2 rounded-lg
        hover:bg-surface-2 transition-colors text-left
      "
    >
      <AvatarWithStatus user={user} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {user.name}
          </span>
          {(user.status === 'flow' || user.status === 'shipping') && (
            <Flame className="w-3 h-3 text-warning-500" />
          )}
        </div>
        
        {user.activity && (
          <p className="text-xs text-text-tertiary truncate">
            {user.activity}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs">
        {user.duration && (
          <span className="text-text-tertiary">{user.duration}</span>
        )}
        <span className={`flex items-center gap-1 ${config.textColor}`}>
          <Icon className="w-3 h-3" />
        </span>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function OnlineIndicator({
  // Data
  users = MOCK_USERS,
  
  // Options
  variant = 'default', // 'default' | 'compact' | 'minimal' | 'expanded'
  showCount = true,
  showAvatars = true,
  maxAvatars = 4,
  expandable = true,
  defaultExpanded = false,
  
  // Actions
  onUserClick,
  
  // Styling
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Sort and categorize users
  const { onlineUsers, flowUsers, summary } = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      const aPriority = STATUS_CONFIG[a.status]?.priority ?? 5;
      const bPriority = STATUS_CONFIG[b.status]?.priority ?? 5;
      return aPriority - bPriority;
    });
    
    const online = sorted.filter(u => 
      ['online', 'flow', 'shipping', 'focus', 'meeting'].includes(u.status)
    );
    
    const flow = sorted.filter(u => 
      ['flow', 'shipping'].includes(u.status)
    );
    
    return {
      onlineUsers: online,
      flowUsers: flow,
      summary: {
        total: online.length,
        flow: flow.length,
        away: users.filter(u => u.status === 'away').length,
        offline: users.filter(u => u.status === 'offline').length,
      },
    };
  }, [users]);

  // Minimal variant (just a dot and count)
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusDot status={flowUsers.length > 0 ? 'flow' : 'online'} size="sm" />
        <span className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">{onlineUsers.length}</span> online
        </span>
      </div>
    );
  }

  // Compact variant (avatar stack + count)
  if (variant === 'compact') {
    return (
      <button
        onClick={() => expandable && setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-3 p-2 rounded-lg
          hover:bg-surface-1 transition-colors
          ${className}
        `}
      >
        {showAvatars && onlineUsers.length > 0 && (
          <AvatarStack users={onlineUsers} max={3} size="sm" />
        )}
        
        <div className="flex items-center gap-2 text-xs">
          <StatusDot status={flowUsers.length > 0 ? 'flow' : 'online'} />
          <span className="text-text-secondary">
            <span className="font-medium text-text-primary">{onlineUsers.length}</span> online
            {flowUsers.length > 0 && (
              <span className="text-brand-400 ml-1">
                ({flowUsers.length} in flow)
              </span>
            )}
          </span>
        </div>
      </button>
    );
  }

  // Expanded variant (full list)
  if (variant === 'expanded') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-tertiary" />
              <h3 className="text-sm font-medium text-text-primary">Team Status</h3>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-success">
                <StatusDot status="online" size="sm" />
                {summary.total} online
              </span>
              {summary.flow > 0 && (
                <span className="flex items-center gap-1 text-brand-400">
                  <Zap className="w-3 h-3" />
                  {summary.flow} in flow
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* User list */}
        <div className="p-2 max-h-[300px] overflow-y-auto space-y-1">
          {users.map(user => (
            <UserRow key={user.id} user={user} onClick={onUserClick} />
          ))}
        </div>
      </div>
    );
  }

  // Default variant (collapsible)
  return (
    <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header / Toggle */}
      <button
        onClick={() => expandable && setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          {showAvatars && onlineUsers.length > 0 && (
            <AvatarStack users={onlineUsers} max={maxAvatars} size="sm" />
          )}
          
          {showCount && (
            <div className="text-left">
              <p className="text-sm text-text-primary">
                <span className="font-medium">{onlineUsers.length}</span> online
              </p>
              {flowUsers.length > 0 && (
                <p className="text-xs text-brand-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {flowUsers.length} in flow state
                </p>
              )}
            </div>
          )}
        </div>
        
        {expandable && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-text-tertiary"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </button>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-0 border-t border-white/[0.06] space-y-1">
              {onlineUsers.map(user => (
                <UserRow key={user.id} user={user} onClick={onUserClick} />
              ))}
              
              {summary.away > 0 && (
                <p className="text-xs text-text-tertiary text-center py-2">
                  +{summary.away} away, {summary.offline} offline
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE ONLINE DOT (for navbars, headers)
// ═══════════════════════════════════════════════════════════════════════════════
export function InlineOnlineIndicator({ users = MOCK_USERS, className = '' }) {
  const onlineCount = users.filter(u => 
    ['online', 'flow', 'shipping', 'focus', 'meeting'].includes(u.status)
  ).length;
  
  const flowCount = users.filter(u => 
    ['flow', 'shipping'].includes(u.status)
  ).length;
  
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <StatusDot status={flowCount > 0 ? 'flow' : 'online'} size="sm" />
      <span className="text-xs text-text-tertiary">
        {onlineCount} online
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE (for user profiles)
// ═══════════════════════════════════════════════════════════════════════════════
export function StatusBadge({ status, showLabel = true, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const Icon = config.icon;
  
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5',
  };
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full
      ${sizes[size]}
      ${config.color}/20 ${config.textColor}
    `}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// src/components/ui/OnlineAvatar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ONLINE AVATAR
// Avatar component with presence indicator overlay
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import PresenceIndicator from './PresenceIndicator';
import { PresenceStatus } from '../../hooks/usePresence';

/**
 * Get initials from user object
 */
const getInitials = (user) => {
  if (!user) return '?';
  
  const first = user.firstName?.[0] || user.username?.[0] || user.email?.[0] || '';
  const last = user.lastName?.[0] || '';
  
  return (first + last).toUpperCase() || '?';
};

/**
 * Size configurations
 */
const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
    indicator: 'xs',
    indicatorPosition: '-bottom-0.5 -right-0.5',
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    indicator: 'sm',
    indicatorPosition: '-bottom-0.5 -right-0.5',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    indicator: 'sm',
    indicatorPosition: '-bottom-0.5 -right-0.5',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-base',
    indicator: 'md',
    indicatorPosition: '-bottom-1 -right-1',
  },
  xl: {
    container: 'w-16 h-16',
    text: 'text-lg',
    indicator: 'lg',
    indicatorPosition: '-bottom-1 -right-1',
  },
};

/**
 * Avatar with presence indicator
 * @param {Object} user - User object with firstName, lastName, avatar, etc.
 * @param {string} status - Presence status
 * @param {string} size - xs, sm, md, lg, xl
 * @param {boolean} showStatus - Whether to show presence indicator
 * @param {string} className - Additional CSS classes
 */
export default function OnlineAvatar({ 
  user, 
  status = PresenceStatus.OFFLINE,
  size = 'md',
  showStatus = true,
  className = '',
}) {
  const config = sizeConfig[size] || sizeConfig.md;
  const initials = getInitials(user);
  
  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Avatar */}
      {user?.avatar ? (
        <img 
          src={user.avatar} 
          alt={`${user.firstName || 'User'}'s avatar`}
          className={`${config.container} rounded-full object-cover ring-2 ring-surface-1`}
        />
      ) : (
        <div 
          className={`
            ${config.container} rounded-full 
            bg-brand-500/20 
            flex items-center justify-center 
            ring-2 ring-surface-1
          `}
        >
          <span className={`font-medium text-brand-400 ${config.text}`}>
            {initials}
          </span>
        </div>
      )}
      
      {/* Presence indicator */}
      {showStatus && (
        <div className={`absolute ${config.indicatorPosition}`}>
          <PresenceIndicator 
            status={status} 
            size={config.indicator}
            showPulse={status === PresenceStatus.ONLINE || status === PresenceStatus.FOCUS}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Stack of avatars with presence (for showing team members)
 */
export function OnlineAvatarStack({ 
  users = [], 
  maxDisplay = 4,
  size = 'sm',
  className = '',
}) {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;
  
  const overlapClass = {
    xs: '-ml-2',
    sm: '-ml-2.5',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {displayUsers.map((user, index) => (
        <OnlineAvatar
          key={user._id || user.id || index}
          user={user.user || user}
          status={user.status || PresenceStatus.ONLINE}
          size={size}
          showStatus={true}
          className={index > 0 ? overlapClass[size] : ''}
        />
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={`
            ${sizeConfig[size]?.container || 'w-8 h-8'}
            ${overlapClass[size]}
            rounded-full bg-surface-2 border-2 border-surface-1
            flex items-center justify-center
          `}
        >
          <span className={`${sizeConfig[size]?.text || 'text-xs'} font-medium text-text-secondary`}>
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar with name and status
 */
export function OnlineAvatarWithName({ 
  user, 
  status = PresenceStatus.OFFLINE,
  size = 'md',
  showStatusLabel = false,
  className = '',
}) {
  const statusLabels = {
    [PresenceStatus.ONLINE]: 'Online',
    [PresenceStatus.IDLE]: 'Idle',
    [PresenceStatus.AWAY]: 'Away',
    [PresenceStatus.BUSY]: 'Busy',
    [PresenceStatus.FOCUS]: 'Focusing',
    [PresenceStatus.OFFLINE]: 'Offline',
  };
  
  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username || user?.email || 'Unknown';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <OnlineAvatar user={user} status={status} size={size} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-text-primary truncate">
          {displayName}
        </span>
        {showStatusLabel && (
          <span className="text-xs text-text-tertiary">
            {statusLabels[status] || 'Offline'}
          </span>
        )}
      </div>
    </div>
  );
}

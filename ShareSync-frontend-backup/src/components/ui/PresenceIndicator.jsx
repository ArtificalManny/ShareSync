// src/components/ui/PresenceIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE INDICATOR
// Visual indicator for user presence status (online, away, busy, focus, offline)
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { PresenceStatus } from '../../hooks/usePresence';

/**
 * Status colors and styles
 */
const statusStyles = {
  [PresenceStatus.ONLINE]: {
    color: 'bg-green-500',
    ring: 'ring-green-500/30',
    label: 'Online',
    pulse: true,
  },
  [PresenceStatus.IDLE]: {
    color: 'bg-amber-500',
    ring: 'ring-amber-500/30',
    label: 'Idle',
    pulse: false,
  },
  [PresenceStatus.AWAY]: {
    color: 'bg-amber-500',
    ring: 'ring-amber-500/30',
    label: 'Away',
    pulse: false,
  },
  [PresenceStatus.BUSY]: {
    color: 'bg-red-500',
    ring: 'ring-red-500/30',
    label: 'Busy',
    pulse: false,
  },
  [PresenceStatus.FOCUS]: {
    color: 'bg-purple-500',
    ring: 'ring-purple-500/30',
    label: 'Focus Mode',
    pulse: true,
  },
  [PresenceStatus.OFFLINE]: {
    color: 'bg-gray-500',
    ring: 'ring-gray-500/30',
    label: 'Offline',
    pulse: false,
  },
};

// Size variants
const sizeClasses = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

/**
 * Presence indicator dot
 * @param {string} status - One of PresenceStatus values
 * @param {string} size - xs, sm, md, lg
 * @param {boolean} showPulse - Whether to show pulse animation
 * @param {string} className - Additional CSS classes
 */
export default function PresenceIndicator({ 
  status = PresenceStatus.OFFLINE, 
  size = 'sm',
  showPulse = true,
  className = '',
}) {
  const style = statusStyles[status] || statusStyles[PresenceStatus.OFFLINE];
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  
  return (
    <span className={`relative inline-flex ${className}`}>
      {/* Pulse ring */}
      {showPulse && style.pulse && (
        <span 
          className={`
            absolute inline-flex rounded-full opacity-75 animate-ping
            ${sizeClass} ${style.color}
          `}
        />
      )}
      
      {/* Solid dot */}
      <span 
        className={`
          relative inline-flex rounded-full ring-2 ring-surface-1
          ${sizeClass} ${style.color}
        `}
        title={style.label}
      />
    </span>
  );
}

/**
 * Presence indicator with label
 */
export function PresenceIndicatorWithLabel({ 
  status = PresenceStatus.OFFLINE,
  size = 'sm',
  className = '',
}) {
  const style = statusStyles[status] || statusStyles[PresenceStatus.OFFLINE];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PresenceIndicator status={status} size={size} />
      <span className="text-xs text-text-secondary">{style.label}</span>
    </div>
  );
}

/**
 * Presence badge (pill style)
 */
export function PresenceBadge({ 
  status = PresenceStatus.OFFLINE,
  className = '',
}) {
  const style = statusStyles[status] || statusStyles[PresenceStatus.OFFLINE];
  
  const badgeColors = {
    [PresenceStatus.ONLINE]: 'bg-green-500/10 text-green-400 border-green-500/20',
    [PresenceStatus.IDLE]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [PresenceStatus.AWAY]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [PresenceStatus.BUSY]: 'bg-red-500/10 text-red-400 border-red-500/20',
    [PresenceStatus.FOCUS]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    [PresenceStatus.OFFLINE]: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 
        rounded-full text-xs font-medium border
        ${badgeColors[status] || badgeColors[PresenceStatus.OFFLINE]}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.color}`} />
      {style.label}
    </span>
  );
}

/**
 * Status selector dropdown
 */
export function PresenceSelector({ 
  currentStatus, 
  onStatusChange,
  className = '',
}) {
  const statuses = [
    PresenceStatus.ONLINE,
    PresenceStatus.AWAY,
    PresenceStatus.BUSY,
    PresenceStatus.FOCUS,
  ];
  
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {statuses.map((status) => {
        const style = statusStyles[status];
        const isActive = currentStatus === status;
        
        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              transition-colors duration-150
              ${isActive 
                ? 'bg-white/10 text-text-primary' 
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }
            `}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${style.color}`} />
            <span>{style.label}</span>
            {isActive && (
              <span className="ml-auto text-brand-400">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

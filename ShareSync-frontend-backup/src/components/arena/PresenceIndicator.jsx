// src/components/arena/PresenceIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Presence Indicator
// ═══════════════════════════════════════════════════════════════════════════════
//
// Visual indicator showing someone's presence status.
// Features:
// - Subtle glow for active users
// - Pulsing ring for focus mode
// - Color coding for different states
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { PRESENCE_STATUS } from '../../contexts/PresenceContext';

/**
 * PresenceIndicator - Shows presence status with visual effects
 * 
 * @param {string} status - PRESENCE_STATUS value
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showGlow - Show glow effect for active
 * @param {boolean} animate - Enable animations
 */
export default function PresenceIndicator({ 
  status = PRESENCE_STATUS.OFFLINE,
  size = 'md',
  showGlow = true,
  animate = true,
}) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const glowSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const statusConfig = {
    [PRESENCE_STATUS.ACTIVE]: {
      color: 'bg-success',
      glow: 'bg-success/30',
      ring: 'ring-success/50',
      animate: 'animate-pulse',
    },
    [PRESENCE_STATUS.ONLINE]: {
      color: 'bg-success',
      glow: 'bg-success/20',
      ring: 'ring-success/30',
      animate: '',
    },
    [PRESENCE_STATUS.FOCUS]: {
      color: 'bg-brand',
      glow: 'bg-brand/40',
      ring: 'ring-brand/50',
      animate: 'animate-ping',
    },
    [PRESENCE_STATUS.IDLE]: {
      color: 'bg-warning',
      glow: 'bg-warning/20',
      ring: 'ring-warning/30',
      animate: '',
    },
    [PRESENCE_STATUS.AWAY]: {
      color: 'bg-text-tertiary',
      glow: '',
      ring: '',
      animate: '',
    },
    [PRESENCE_STATUS.OFFLINE]: {
      color: 'bg-text-tertiary/50',
      glow: '',
      ring: '',
      animate: '',
    },
  };

  const config = statusConfig[status] || statusConfig[PRESENCE_STATUS.OFFLINE];

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect */}
      {showGlow && config.glow && (
        <div className={`
          absolute ${glowSizes[size]} rounded-full
          ${config.glow}
          ${animate && config.animate ? config.animate : ''}
        `} />
      )}
      
      {/* Main dot */}
      <div className={`
        relative ${sizes[size]} rounded-full
        ${config.color}
        ${config.ring ? `ring-2 ${config.ring}` : ''}
      `} />
    </div>
  );
}

/**
 * PresenceBadge - Larger badge with status text
 */
export function PresenceBadge({ status, showText = true }) {
  const statusText = {
    [PRESENCE_STATUS.ACTIVE]: 'Active',
    [PRESENCE_STATUS.ONLINE]: 'Online',
    [PRESENCE_STATUS.FOCUS]: 'In Focus',
    [PRESENCE_STATUS.IDLE]: 'Idle',
    [PRESENCE_STATUS.AWAY]: 'Away',
    [PRESENCE_STATUS.OFFLINE]: 'Offline',
  };

  const statusColors = {
    [PRESENCE_STATUS.ACTIVE]: 'bg-success/10 text-success border-success/20',
    [PRESENCE_STATUS.ONLINE]: 'bg-success/10 text-success border-success/20',
    [PRESENCE_STATUS.FOCUS]: 'bg-brand/10 text-brand border-brand/20',
    [PRESENCE_STATUS.IDLE]: 'bg-warning/10 text-warning border-warning/20',
    [PRESENCE_STATUS.AWAY]: 'bg-surface-2 text-text-tertiary border-white/[0.06]',
    [PRESENCE_STATUS.OFFLINE]: 'bg-surface-2 text-text-tertiary border-white/[0.06]',
  };

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2 py-1 rounded-full border
      ${statusColors[status] || statusColors[PRESENCE_STATUS.OFFLINE]}
    `}>
      <PresenceIndicator status={status} size="sm" showGlow={false} />
      {showText && (
        <span className="text-xs font-medium">
          {statusText[status] || 'Unknown'}
        </span>
      )}
    </div>
  );
}

/**
 * FocusModeIndicator - Special indicator for focus mode
 */
export function FocusModeIndicator({ userName }) {
  return (
    <div className="
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full
      bg-brand/10 border border-brand/20
    ">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-brand" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-brand animate-ping" />
      </div>
      <span className="text-xs font-medium text-brand">
        {userName ? `${userName} is in focus mode` : 'Focus Mode'}
      </span>
    </div>
  );
}

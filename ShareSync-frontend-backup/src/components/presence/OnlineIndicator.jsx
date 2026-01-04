// src/components/presence/OnlineIndicator.jsx - Week 8 Day 1-2
import React from 'react';
import { Circle } from 'lucide-react';

/**
 * OnlineIndicator - Shows user's online/offline status
 * @param {boolean} isOnline - Whether user is online
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showPulse - Whether to show pulse animation
 * @param {string} status - Status: 'online', 'away', 'busy', 'offline'
 */
const OnlineIndicator = ({ 
  isOnline = false, 
  size = 'md',
  showPulse = true,
  status = 'online'
}) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-emerald-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-slate-600'
  };

  const statusText = {
    online: 'Online',
    away: 'Away',
    busy: 'Busy',
    offline: 'Offline'
  };

  const color = isOnline ? statusColors[status] : statusColors.offline;

  return (
    <div className="relative inline-flex items-center">
      <div className={`${sizeClasses[size]} ${color} rounded-full ${showPulse && isOnline ? 'animate-pulse' : ''}`} />
      {showPulse && isOnline && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 animate-ping`} />
      )}
    </div>
  );
};

export default OnlineIndicator;

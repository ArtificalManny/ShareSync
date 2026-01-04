// src/components/presence/UserPresenceCard.jsx - Week 8 Day 1-2
import React from 'react';
import OnlineIndicator from './OnlineIndicator';
import { Clock } from 'lucide-react';

/**
 * UserPresenceCard - Shows user with online status and activity
 * @param {object} user - User object with name, avatar, status
 * @param {boolean} showActivity - Whether to show current activity
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 */
const UserPresenceCard = ({ 
  user = {}, 
  showActivity = true,
  size = 'md',
  onClick
}) => {
  const { name = 'User', avatar = '👤', status = 'offline', currentActivity = null, lastSeen = null } = user;
  
  const isOnline = status === 'online' || status === 'away' || status === 'busy';

  const sizeClasses = {
    sm: {
      container: 'p-2',
      avatar: 'w-8 h-8 text-lg',
      text: 'text-xs',
      name: 'text-sm'
    },
    md: {
      container: 'p-3',
      avatar: 'w-10 h-10 text-xl',
      text: 'text-xs',
      name: 'text-sm'
    },
    lg: {
      container: 'p-4',
      avatar: 'w-12 h-12 text-2xl',
      text: 'text-sm',
      name: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div 
      className={`
        flex items-center gap-3 bg-slate-800/50 rounded-xl border border-slate-700/50 
        hover:border-purple-500/50 transition-all ${classes.container}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <div className={`${classes.avatar} bg-purple-500/20 rounded-full flex items-center justify-center`}>
          <span>{avatar}</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator 
            isOnline={isOnline} 
            status={status}
            size="sm"
            showPulse={status === 'online'}
          />
        </div>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-white ${classes.name} truncate`}>
          {name}
        </div>
        
        {showActivity && (
          <div className={`${classes.text} text-slate-400 truncate`}>
            {isOnline ? (
              currentActivity ? (
                <span>Working on: {currentActivity}</span>
              ) : (
                <span className="text-emerald-400">● Online</span>
              )
            ) : (
              lastSeen ? (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Last seen {lastSeen}</span>
                </div>
              ) : (
                <span className="text-slate-500">Offline</span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPresenceCard;

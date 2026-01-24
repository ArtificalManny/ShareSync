// src/components/social/ActivityFeedItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Activity Feed Item
// ═══════════════════════════════════════════════════════════════════════════════
//
// Individual activity item showing what teammates are accomplishing.
// Designed to trigger FOMO and inspire action.
//
// Activity Types:
// - ship: Project/task shipped
// - streak: Streak milestone reached
// - level_up: New level achieved
// - achievement: Badge/achievement unlocked
// - join: New teammate joined
// - focus: Started focus session
// - milestone: Project milestone hit
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Flame, 
  TrendingUp, 
  Trophy, 
  UserPlus, 
  Zap,
  Target,
  Star,
  Sparkles,
  Clock,
  Heart,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TYPE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const ACTIVITY_CONFIGS = {
  ship: {
    icon: Rocket,
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    glow: 'shadow-glow-brand',
    verb: 'shipped',
    emoji: '🚀',
  },
  streak: {
    icon: Flame,
    color: 'text-warning-500',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
    glow: 'shadow-glow-warning',
    verb: 'hit a',
    emoji: '🔥',
  },
  level_up: {
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-glow-cyan',
    verb: 'reached',
    emoji: '⬆️',
  },
  achievement: {
    icon: Trophy,
    color: 'text-warning-500',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
    glow: 'shadow-glow-warning',
    verb: 'unlocked',
    emoji: '🏆',
  },
  join: {
    icon: UserPlus,
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    glow: 'shadow-glow-success',
    verb: 'joined',
    emoji: '👋',
  },
  focus: {
    icon: Zap,
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    glow: 'shadow-glow-brand',
    verb: 'started',
    emoji: '⚡',
  },
  milestone: {
    icon: Target,
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    glow: 'shadow-glow-success',
    verb: 'completed',
    emoji: '🎯',
  },
  task_complete: {
    icon: Star,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-glow-cyan',
    verb: 'completed',
    emoji: '✅',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Avatar = ({ user, size = 'md', showOnline = false }) => {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };
  
  const getColorFromName = (name) => {
    if (!name) return 'bg-brand-500/20 text-brand-400';
    const colors = [
      'bg-brand-500/20 text-brand-400',
      'bg-cyan-500/20 text-cyan-400',
      'bg-success-500/20 text-success-400',
      'bg-warning-500/20 text-warning-400',
      'bg-energy-500/20 text-energy-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
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
          {getInitials(user.name)}
        </div>
      )}
      
      {/* Online indicator */}
      {showOnline && user.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface-0" />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIME AGO FORMATTER
// ═══════════════════════════════════════════════════════════════════════════════
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// REACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════
const ReactionButton = ({ icon: Icon, count = 0, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-lg text-xs
        transition-all duration-200
        ${active 
          ? 'bg-brand-500/20 text-brand-400' 
          : 'hover:bg-surface-2 text-text-tertiary hover:text-text-secondary'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {count > 0 && <span>{count}</span>}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ActivityFeedItem({
  // Activity data
  activity,
  
  // Display options
  variant = 'default', // 'default' | 'compact' | 'highlight' | 'minimal'
  showReactions = true,
  showTimestamp = true,
  showAvatar = true,
  animate = true,
  isNew = false,
  
  // Actions
  onReact,
  onComment,
  onClick,
  
  // Styling
  className = '',
}) {
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(activity.reactions || 0);
  
  const config = ACTIVITY_CONFIGS[activity.type] || ACTIVITY_CONFIGS.ship;
  const Icon = config.icon;
  
  // Handle reaction
  const handleReact = (e) => {
    e.stopPropagation();
    setHasReacted(!hasReacted);
    setReactionCount(prev => hasReacted ? prev - 1 : prev + 1);
    if (onReact) onReact(activity.id, !hasReacted);
  };
  
  // Generate activity message
  const getMessage = () => {
    const { user, type, target, value } = activity;
    
    switch (type) {
      case 'ship':
        return <><strong>{user.name}</strong> {config.verb} <strong>{target}</strong></>;
      case 'streak':
        return <><strong>{user.name}</strong> {config.verb} <strong>{value}-day streak</strong></>;
      case 'level_up':
        return <><strong>{user.name}</strong> {config.verb} <strong>Level {value}</strong></>;
      case 'achievement':
        return <><strong>{user.name}</strong> {config.verb} <strong>{target}</strong></>;
      case 'join':
        return <><strong>{user.name}</strong> {config.verb} the team</>;
      case 'focus':
        return <><strong>{user.name}</strong> {config.verb} a focus session</>;
      case 'milestone':
        return <><strong>{user.name}</strong> {config.verb} <strong>{target}</strong></>;
      case 'task_complete':
        return <><strong>{user.name}</strong> {config.verb} <strong>{target}</strong></>;
      default:
        return <><strong>{user.name}</strong> did something awesome</>;
    }
  };
  
  // Minimal variant (single line)
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <span className={config.color}>{config.emoji}</span>
        <span className="text-text-secondary">{getMessage()}</span>
        {showTimestamp && (
          <span className="text-text-tertiary text-xs">
            {formatTimeAgo(activity.timestamp)}
          </span>
        )}
      </div>
    );
  }
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        initial={animate ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        className={`
          flex items-center gap-3 p-2 rounded-lg
          hover:bg-surface-1 transition-colors cursor-pointer
          ${isNew ? 'bg-brand-500/5' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {showAvatar && <Avatar user={activity.user} size="sm" showOnline />}
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-secondary truncate">
            {getMessage()}
          </p>
        </div>
        
        <div className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`}>
          <Icon className={`w-3 h-3 ${config.color}`} />
        </div>
      </motion.div>
    );
  }
  
  // Highlight variant (for important activities)
  if (variant === 'highlight') {
    return (
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          relative p-4 rounded-xl overflow-hidden
          ${config.bg} border ${config.border}
          ${isNew ? config.glow : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        
        <div className="relative flex items-start gap-3">
          {showAvatar && <Avatar user={activity.user} size="lg" showOnline />}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary mb-1">
              {getMessage()} {config.emoji}
            </p>
            
            {activity.description && (
              <p className="text-xs text-text-secondary mb-2">
                {activity.description}
              </p>
            )}
            
            <div className="flex items-center gap-3">
              {showTimestamp && (
                <span className="text-[10px] text-text-tertiary">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              )}
              
              {showReactions && (
                <div className="flex items-center gap-1">
                  <ReactionButton 
                    icon={Heart}
                    count={reactionCount}
                    active={hasReacted}
                    onClick={handleReact}
                  />
                  {onComment && (
                    <ReactionButton 
                      icon={MessageSquare}
                      count={activity.comments || 0}
                      onClick={(e) => { e.stopPropagation(); onComment(activity.id); }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Default variant
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-start gap-3 p-3 rounded-xl
        hover:bg-surface-1 transition-all duration-200
        cursor-pointer group
        ${isNew ? 'bg-brand-500/5 border border-brand-500/10' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Avatar */}
      {showAvatar && <Avatar user={activity.user} size="md" showOnline />}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-secondary">
            {getMessage()}
          </p>
          
          {/* Activity icon */}
          <div className={`
            flex-shrink-0 w-6 h-6 rounded-lg ${config.bg}
            flex items-center justify-center
            group-hover:scale-110 transition-transform
          `}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
        </div>
        
        {/* Description if any */}
        {activity.description && (
          <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
            {activity.description}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          {showTimestamp && (
            <span className="text-[10px] text-text-tertiary">
              {formatTimeAgo(activity.timestamp)}
            </span>
          )}
          
          {showReactions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ReactionButton 
                icon={Heart}
                count={reactionCount}
                active={hasReacted}
                onClick={handleReact}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export function ActivityFeedItemSkeleton({ variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-surface-2" />
        <div className="flex-1 h-3 bg-surface-2 rounded" />
        <div className="w-5 h-5 rounded bg-surface-2" />
      </div>
    );
  }
  
  return (
    <div className="flex items-start gap-3 p-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-2 rounded w-3/4" />
        <div className="h-3 bg-surface-2 rounded w-1/4" />
      </div>
    </div>
  );
}

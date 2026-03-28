// src/components/social/ActivityFeedItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Activity Feed Item (Gebbia-Grade Polish)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, Flame, TrendingUp, Trophy, UserPlus, Zap,
  Target, Star, Sparkles, Clock, Heart, MessageSquare, ChevronRight,
} from 'lucide-react';

const ACTIVITY_CONFIGS = {
  ship: { icon: Rocket, color: 'text-brand', bg: 'bg-brand-subtle', border: 'border-brand-200', verb: 'shipped', emoji: '🚀' },
  streak: { icon: Flame, color: 'text-warning', bg: 'bg-warning-subtle', border: 'border-warning-200', verb: 'hit a', emoji: '🔥' },
  level_up: { icon: TrendingUp, color: 'text-info-500', bg: 'bg-info-subtle', border: 'border-info-200', verb: 'reached', emoji: '⬆️' },
  achievement: { icon: Trophy, color: 'text-warning', bg: 'bg-warning-subtle', border: 'border-warning-200', verb: 'unlocked', emoji: '🏆' },
  join: { icon: UserPlus, color: 'text-success', bg: 'bg-success-subtle', border: 'border-success-200', verb: 'joined', emoji: '👋' },
  focus: { icon: Zap, color: 'text-brand', bg: 'bg-brand-subtle', border: 'border-brand-200', verb: 'started', emoji: '⚡' },
  milestone: { icon: Target, color: 'text-success', bg: 'bg-success-subtle', border: 'border-success-200', verb: 'completed', emoji: '🎯' },
  task_complete: { icon: Star, color: 'text-info-500', bg: 'bg-info-subtle', border: 'border-info-200', verb: 'completed', emoji: '✅' },
};

const Avatar = ({ user, size = 'md', showOnline = false }) => {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-[11px]', lg: 'w-12 h-12 text-[14px]' };
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const getColorFromName = (name) => {
    const colors = ['bg-brand-subtle text-brand', 'bg-info-subtle text-info-600', 'bg-success-subtle text-success', 'bg-warning-subtle text-warning'];
    return colors[(name || '').charCodeAt(0) % colors.length || 0];
  };
  
  return (
    <div className="relative flex-shrink-0">
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className={`${sizes[size]} rounded-full object-cover shadow-sm border border-border-default`} />
      ) : (
        <div className={`${sizes[size]} rounded-full ${getColorFromName(user.name)} flex items-center justify-center font-bold shadow-sm border border-border-default/50`}>
          {getInitials(user.name)}
        </div>
      )}
      {showOnline && user.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface-primary shadow-sm" />
      )}
    </div>
  );
};

const formatTimeAgo = (timestamp) => {
  const diff = new Date() - new Date(timestamp);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ReactionButton = ({ icon: Icon, count = 0, active = false, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${active ? 'bg-brand-subtle text-brand' : 'hover:bg-surface-secondary text-text-tertiary hover:text-text-secondary'}`}>
    <Icon className="w-3.5 h-3.5" />
    {count > 0 && <span>{count}</span>}
  </button>
);

export default function ActivityFeedItem({ activity, variant = 'default', showReactions = true, showTimestamp = true, showAvatar = true, animate = true, isNew = false, onReact, onComment, onClick, className = '' }) {
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(activity.reactions || 0);
  
  const config = ACTIVITY_CONFIGS[activity.type] || ACTIVITY_CONFIGS.ship;
  const Icon = config.icon;
  
  const handleReact = (e) => {
    e.stopPropagation();
    setHasReacted(!hasReacted);
    setReactionCount(prev => hasReacted ? prev - 1 : prev + 1);
    if (onReact) onReact(activity.id, !hasReacted);
  };
  
  const getMessage = () => {
    const { user, type, target, value } = activity;
    const name = <span className="font-bold text-text-primary">{user.name}</span>;
    const tgt = <span className="font-bold text-text-primary">{target}</span>;
    switch (type) {
      case 'ship': return <>{name} {config.verb} {tgt}</>;
      case 'streak': return <>{name} {config.verb} <span className="font-black text-warning">{value}-day streak</span></>;
      case 'level_up': return <>{name} {config.verb} <span className="font-black text-info-600">Level {value}</span></>;
      case 'achievement': return <>{name} {config.verb} {tgt}</>;
      case 'join': return <>{name} {config.verb} the team</>;
      case 'focus': return <>{name} {config.verb} a focus session</>;
      case 'milestone': return <>{name} {config.verb} {tgt}</>;
      case 'task_complete': return <>{name} {config.verb} {tgt}</>;
      default: return <>{name} did something awesome</>;
    }
  };
  
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-[13px] ${className}`}>
        <span className={config.color}>{config.emoji}</span>
        <span className="text-text-secondary">{getMessage()}</span>
        {showTimestamp && <span className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider ml-auto">{formatTimeAgo(activity.timestamp)}</span>}
      </div>
    );
  }
  
  if (variant === 'compact') {
    return (
      <motion.div initial={animate ? { opacity: 0, x: -10 } : false} animate={{ opacity: 1, x: 0 }} onClick={onClick}
        className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer ${isNew ? 'bg-brand-subtle/50' : ''} ${className}`}>
        {showAvatar && <Avatar user={activity.user} size="sm" showOnline />}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-text-secondary truncate">{getMessage()}</p>
        </div>
        <div className={`w-6 h-6 rounded-md ${config.bg} border ${config.border} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
      </motion.div>
    );
  }
  
  if (variant === 'highlight') {
    return (
      <motion.div initial={animate ? { opacity: 0, scale: 0.95 } : false} animate={{ opacity: 1, scale: 1 }} onClick={onClick}
        className={`relative p-5 rounded-2xl overflow-hidden card-surface ${config.bg} border ${config.border} ${isNew ? 'shadow-md shadow-brand-500/10' : ''} ${className}`}>
        <div className="absolute -top-4 -right-4 w-32 h-32 opacity-[0.05] pointer-events-none"><Icon className="w-full h-full" /></div>
        <div className="relative flex items-start gap-4">
          {showAvatar && <Avatar user={activity.user} size="lg" showOnline />}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-text-secondary mb-1.5 leading-snug">{getMessage()} {config.emoji}</p>
            {activity.description && <p className="text-[13px] font-medium text-text-tertiary mb-3">{activity.description}</p>}
            <div className="flex items-center gap-4">
              {showTimestamp && <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{formatTimeAgo(activity.timestamp)}</span>}
              {showReactions && (
                <div className="flex items-center gap-1">
                  <ReactionButton icon={Heart} count={reactionCount} active={hasReacted} onClick={handleReact} />
                  {onComment && <ReactionButton icon={MessageSquare} count={activity.comments || 0} onClick={(e) => { e.stopPropagation(); onComment(activity.id); }} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div initial={animate ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} onClick={onClick}
      className={`flex items-start gap-3.5 p-4 rounded-xl hover:bg-surface-secondary transition-all duration-200 cursor-pointer group ${isNew ? 'bg-brand-subtle/30 border border-brand-200' : 'border border-transparent'} ${className}`}>
      {showAvatar && <Avatar user={activity.user} size="md" showOnline />}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] text-text-secondary leading-snug">{getMessage()}</p>
          <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
        </div>
        {activity.description && <p className="text-[12px] font-medium text-text-tertiary mt-1.5 line-clamp-2">{activity.description}</p>}
        <div className="flex items-center justify-between mt-3">
          {showTimestamp && <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{formatTimeAgo(activity.timestamp)}</span>}
          {showReactions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ReactionButton icon={Heart} count={reactionCount} active={hasReacted} onClick={handleReact} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityFeedItemSkeleton({ variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2.5 animate-pulse">
        <div className="w-7 h-7 rounded-full bg-surface-tertiary" />
        <div className="flex-1 h-3 bg-surface-tertiary rounded" />
        <div className="w-6 h-6 rounded bg-surface-tertiary" />
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3.5 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-surface-tertiary" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 bg-surface-tertiary rounded w-3/4" />
        <div className="h-3 bg-surface-tertiary rounded w-1/4" />
      </div>
    </div>
  );
}

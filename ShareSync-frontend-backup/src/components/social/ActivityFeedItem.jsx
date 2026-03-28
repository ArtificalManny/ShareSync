// src/components/social/ActivityFeedItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Social Proof - Activity Feed Item (Shipping Cards)
// - High contrast typography for usernames and targets.
// - Clean, distinct avatar and badge combinations.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Flame, TrendingUp, Trophy, UserPlus, Zap, Target, Star, Sparkles, Clock, Heart, MessageSquare, ChevronRight } from 'lucide-react';

const ACTIVITY_CONFIGS = {
  ship: { icon: Rocket, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/20', border: 'border-violet-200 dark:border-violet-500/30', verb: 'shipped', emoji: '🚀' },
  streak: { icon: Flame, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/30', verb: 'hit a', emoji: '🔥' },
  level_up: { icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-500/20', border: 'border-teal-200 dark:border-teal-500/30', verb: 'reached', emoji: '⬆️' },
  achievement: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/30', verb: 'unlocked', emoji: '🏆' },
  join: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/30', verb: 'joined', emoji: '👋' },
  focus: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/30', verb: 'started', emoji: '⚡' },
  milestone: { icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/30', verb: 'completed', emoji: '🎯' },
  task_complete: { icon: Star, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-500/20', border: 'border-cyan-200 dark:border-cyan-500/30', verb: 'completed', emoji: '✅' },
};

const Avatar = ({ user, size = 'md', showOnline = false }) => {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-[13px]', lg: 'w-12 h-12 text-[15px]' };
  const getInitials = (n) => n ? n.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() : '?';
  const getColor = (n) => {
    const c = ['bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700'];
    return c[(n?.charCodeAt(0) || 0) % c.length];
  };
  
  return (
    <div className="relative shrink-0">
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className={`${sizes[size]} rounded-full object-cover shadow-sm border border-slate-200 dark:border-white/10`} />
      ) : (
        <div className={`${sizes[size]} rounded-full ${getColor(user.name)} flex items-center justify-center font-black shadow-sm border border-black/5`}>
          {getInitials(user.name)}
        </div>
      )}
      {showOnline && user.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1f1f23] shadow-sm" />
      )}
    </div>
  );
};

const formatTimeAgo = (ts) => {
  const diff = new Date() - new Date(ts);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ReactionButton = ({ icon: Icon, count = 0, active = false, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 ${active ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}>
    <Icon className={`w-3.5 h-3.5 ${active ? 'fill-current' : ''}`} />
    {count > 0 && <span>{count}</span>}
  </button>
);

export default function ActivityFeedItem({ activity, variant = 'default', showReactions = true, showTimestamp = true, showAvatar = true, animate = true, isNew = false, onReact, onComment, onClick, className = '' }) {
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(activity.reactions || 0);
  const config = ACTIVITY_CONFIGS[activity.type] || ACTIVITY_CONFIGS.ship;
  const Icon = config.icon;
  
  const handleReact = (e) => {
    e.stopPropagation(); setHasReacted(!hasReacted); setReactionCount(p => hasReacted ? p - 1 : p + 1); if (onReact) onReact(activity.id, !hasReacted);
  };
  
  const getMessage = () => {
    const { user, type, target, value } = activity;
    const nameStr = <strong className="font-black text-slate-900 dark:text-white">{user.name}</strong>;
    const targetStr = <strong className="font-black text-slate-900 dark:text-white">{target}</strong>;
    switch (type) {
      case 'ship': return <>{nameStr} {config.verb} {targetStr}</>;
      case 'streak': return <>{nameStr} {config.verb} <strong className="font-black text-amber-600 dark:text-amber-500">{value}-day streak</strong></>;
      case 'level_up': return <>{nameStr} {config.verb} <strong className="font-black text-teal-600 dark:text-teal-400">Level {value}</strong></>;
      case 'achievement': return <>{nameStr} {config.verb} {targetStr}</>;
      default: return <>{nameStr} {config.verb} {targetStr || 'something awesome'}</>;
    }
  };
  
  if (variant === 'compact') {
    return (
      <motion.div initial={animate ? { opacity: 0, x: -10 } : false} animate={{ opacity: 1, x: 0 }} onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10 ${isNew ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''} ${className}`}>
        {showAvatar && <Avatar user={activity.user} size="sm" showOnline />}
        <div className="flex-1 min-w-0"><p className="text-[13px] text-slate-600 dark:text-slate-300 truncate">{getMessage()}</p></div>
        <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5`}><Icon className={`w-3.5 h-3.5 ${config.color}`} /></div>
      </motion.div>
    );
  }
  
  if (variant === 'highlight') {
    return (
      <motion.div initial={animate ? { opacity: 0, scale: 0.95 } : false} animate={{ opacity: 1, scale: 1 }} onClick={onClick}
        className={`relative p-5 rounded-2xl overflow-hidden bg-white dark:bg-[#1f1f23] border ${isNew ? 'border-violet-300 dark:border-violet-500/50 shadow-md' : 'border-slate-200 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'} ${className} cursor-pointer group hover:-translate-y-0.5 transition-all duration-300`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 -translate-y-1/4 translate-x-1/4 ${config.color}`}><Icon className="w-full h-full" /></div>
        <div className="relative flex items-start gap-4">
          {showAvatar && <Avatar user={activity.user} size="lg" showOnline />}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] leading-snug mb-1.5">{getMessage()} <span className="ml-1">{config.emoji}</span></p>
            {activity.description && <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-3">{activity.description}</p>}
            <div className="flex items-center gap-4">
              {showTimestamp && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{formatTimeAgo(activity.timestamp)}</span>}
              {showReactions && (
                <div className="flex items-center gap-2">
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
      className={`flex items-start gap-3.5 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-white/10 ${isNew ? 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-100 dark:border-violet-500/10' : ''} ${className}`}>
      {showAvatar && <Avatar user={activity.user} size="md" showOnline />}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-snug">{getMessage()}</p>
          <div className={`shrink-0 w-8 h-8 rounded-xl ${config.bg} border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}><Icon className={`w-4 h-4 ${config.color}`} /></div>
        </div>
        {activity.description && <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">{activity.description}</p>}
        <div className="flex items-center justify-between mt-3">
          {showTimestamp && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatTimeAgo(activity.timestamp)}</span>}
          {showReactions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="flex items-center gap-3 p-3 animate-pulse">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="flex-1 h-3.5 bg-slate-200 dark:bg-white/10 rounded-md" />
        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10" />
      </div>
    );
  }
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
        <div className="h-3.5 bg-slate-200 dark:bg-white/10 rounded-md w-1/4" />
      </div>
    </div>
  );
}

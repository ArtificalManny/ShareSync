// src/components/social/LeaderboardRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Leaderboard Row
// ═══════════════════════════════════════════════════════════════════════════════
//
// Individual leaderboard entry showing:
// - Rank with special styling for top 3
// - User avatar and name
// - Key stats (XP, ships, streak)
// - Trend indicator (up/down/same)
// - "You" indicator for current user
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Flame,
  Rocket,
  Zap,
  Crown,
  Medal,
  Award,
  Star,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// RANK BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const RankBadge = ({ rank, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  
  // Special styling for top 3
  if (rank === 1) {
    return (
      <div className={`
        ${sizes[size]} rounded-xl
        bg-gradient-to-br from-yellow-400 to-yellow-600
        flex items-center justify-center
        shadow-lg shadow-yellow-500/30
      `}>
        <Crown className="w-4 h-4 text-white" />
      </div>
    );
  }
  
  if (rank === 2) {
    return (
      <div className={`
        ${sizes[size]} rounded-xl
        bg-gradient-to-br from-slate-300 to-slate-500
        flex items-center justify-center
        shadow-lg shadow-slate-400/30
      `}>
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  
  if (rank === 3) {
    return (
      <div className={`
        ${sizes[size]} rounded-xl
        bg-gradient-to-br from-amber-600 to-amber-800
        flex items-center justify-center
        shadow-lg shadow-amber-600/30
      `}>
        <Award className="w-4 h-4 text-white" />
      </div>
    );
  }
  
  // Regular rank
  return (
    <div className={`
      ${sizes[size]} rounded-xl
      bg-surface-2 border border-white/[0.06]
      flex items-center justify-center
      font-semibold text-text-secondary
    `}>
      {rank}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Avatar = ({ user, size = 'md', showOnline = false, isYou = false }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
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
          className={`${sizes[size]} rounded-full object-cover ${isYou ? 'ring-2 ring-brand-500' : ''}`}
        />
      ) : (
        <div className={`
          ${sizes[size]} rounded-full 
          ${isYou ? 'bg-brand-500/30 text-brand-300 ring-2 ring-brand-500' : getColorFromName(user.name)}
          flex items-center justify-center font-medium
        `}>
          {getInitials(user.name)}
        </div>
      )}
      
      {/* Online indicator */}
      {showOnline && user.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface-0" />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TREND INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
const TrendIndicator = ({ change }) => {
  if (change > 0) {
    return (
      <div className="flex items-center gap-0.5 text-success text-xs">
        <TrendingUp className="w-3 h-3" />
        <span>+{change}</span>
      </div>
    );
  }
  
  if (change < 0) {
    return (
      <div className="flex items-center gap-0.5 text-energy-500 text-xs">
        <TrendingDown className="w-3 h-3" />
        <span>{change}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-0.5 text-text-tertiary text-xs">
      <Minus className="w-3 h-3" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT PILL
// ═══════════════════════════════════════════════════════════════════════════════
const StatPill = ({ icon: Icon, value, label, color = 'text-text-secondary', highlight = false }) => {
  return (
    <div className={`
      flex items-center gap-1.5 px-2 py-1 rounded-lg
      ${highlight ? 'bg-brand-500/10' : 'bg-surface-2'}
    `}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-xs font-medium ${highlight ? 'text-brand-400' : 'text-text-primary'}`}>
        {value}
      </span>
      {label && (
        <span className="text-[10px] text-text-tertiary hidden sm:inline">
          {label}
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LeaderboardRow({
  // Data
  rank,
  user,
  stats = {},
  change = 0,
  
  // Options
  isYou = false,
  showTrend = true,
  showStats = true,
  variant = 'default', // 'default' | 'compact' | 'highlight'
  animate = true,
  index = 0,
  
  // Actions
  onClick,
  
  // Styling
  className = '',
}) {
  const isTopThree = rank <= 3;
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        initial={animate ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
        className={`
          flex items-center gap-3 p-2 rounded-lg
          ${isYou ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-surface-1'}
          ${onClick ? 'cursor-pointer' : ''}
          transition-colors
          ${className}
        `}
      >
        <span className={`w-5 text-xs font-medium ${isTopThree ? 'text-warning-500' : 'text-text-tertiary'}`}>
          #{rank}
        </span>
        <Avatar user={user} size="sm" showOnline isYou={isYou} />
        <span className={`flex-1 text-sm truncate ${isYou ? 'font-medium text-brand-400' : 'text-text-primary'}`}>
          {user.name}
          {isYou && <span className="text-xs text-brand-300 ml-1">(You)</span>}
        </span>
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {stats.xp?.toLocaleString() || 0}
        </span>
      </motion.div>
    );
  }
  
  // Highlight variant (for top 3 or current user)
  if (variant === 'highlight' || isTopThree) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={onClick}
        className={`
          relative p-4 rounded-xl overflow-hidden
          ${isYou 
            ? 'bg-brand-500/10 border-2 border-brand-500/30' 
            : isTopThree 
              ? 'bg-surface-1 border border-white/[0.08]' 
              : 'bg-surface-1 border border-white/[0.06]'
          }
          ${onClick ? 'cursor-pointer hover:border-brand-500/30' : ''}
          transition-all duration-200
          ${className}
        `}
      >
        {/* Background decoration for top 3 */}
        {isTopThree && (
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            {rank === 1 && <Crown className="w-full h-full" />}
            {rank === 2 && <Medal className="w-full h-full" />}
            {rank === 3 && <Award className="w-full h-full" />}
          </div>
        )}
        
        <div className="relative flex items-center gap-4">
          {/* Rank */}
          <RankBadge rank={rank} size="md" />
          
          {/* Avatar */}
          <Avatar user={user} size="md" showOnline isYou={isYou} />
          
          {/* Name + Level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${isYou ? 'text-brand-400' : 'text-text-primary'}`}>
                {user.name}
              </span>
              {isYou && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-500/20 text-brand-400">
                  You
                </span>
              )}
            </div>
            
            {user.title && (
              <p className="text-xs text-text-tertiary truncate">
                {user.title}
              </p>
            )}
          </div>
          
          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-2">
              <StatPill 
                icon={Zap} 
                value={stats.xp?.toLocaleString() || 0} 
                label="XP"
                color="text-brand-400"
                highlight={isYou}
              />
              
              {stats.ships !== undefined && (
                <StatPill 
                  icon={Rocket} 
                  value={stats.ships} 
                  color="text-cyan-400"
                />
              )}
              
              {stats.streak !== undefined && stats.streak > 0 && (
                <StatPill 
                  icon={Flame} 
                  value={`${stats.streak}d`} 
                  color="text-warning-500"
                />
              )}
            </div>
          )}
          
          {/* Trend */}
          {showTrend && <TrendIndicator change={change} />}
        </div>
      </motion.div>
    );
  }
  
  // Default variant
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        flex items-center gap-4 p-3 rounded-xl
        ${isYou 
          ? 'bg-brand-500/10 border border-brand-500/20' 
          : 'hover:bg-surface-1 border border-transparent'
        }
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {/* Rank */}
      <RankBadge rank={rank} size="sm" />
      
      {/* Avatar */}
      <Avatar user={user} size="sm" showOnline isYou={isYou} />
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate ${isYou ? 'font-medium text-brand-400' : 'text-text-primary'}`}>
          {user.name}
          {isYou && <span className="text-xs text-brand-300 ml-1">(You)</span>}
        </span>
      </div>
      
      {/* Stats */}
      {showStats && (
        <div className="flex items-center gap-3">
          {stats.xp !== undefined && (
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-sm font-medium text-text-primary tabular-nums">
                {stats.xp?.toLocaleString()}
              </span>
            </div>
          )}
          
          {stats.ships !== undefined && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs tabular-nums">{stats.ships}</span>
            </div>
          )}
          
          {stats.streak !== undefined && stats.streak > 0 && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Flame className="w-3.5 h-3.5 text-warning-500" />
              <span className="text-xs tabular-nums">{stats.streak}d</span>
            </div>
          )}
        </div>
      )}
      
      {/* Trend */}
      {showTrend && <TrendIndicator change={change} />}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════
export function LeaderboardRowSkeleton({ variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse">
        <div className="w-5 h-4 bg-surface-2 rounded" />
        <div className="w-8 h-8 rounded-full bg-surface-2" />
        <div className="flex-1 h-4 bg-surface-2 rounded" />
        <div className="w-12 h-4 bg-surface-2 rounded" />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-surface-2" />
      <div className="w-10 h-10 rounded-full bg-surface-2" />
      <div className="flex-1 h-4 bg-surface-2 rounded" />
      <div className="flex gap-2">
        <div className="w-16 h-6 bg-surface-2 rounded-lg" />
        <div className="w-12 h-6 bg-surface-2 rounded-lg" />
      </div>
    </div>
  );
}

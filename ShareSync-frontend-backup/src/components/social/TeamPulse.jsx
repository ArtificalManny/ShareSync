// src/components/social/TeamPulse.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Team Pulse
// ═══════════════════════════════════════════════════════════════════════════════
//
// Live indicator showing team activity in real-time.
// Creates FOMO by showing others are actively working.
//
// Key Features:
// - "X people shipping right now" counter
// - Pulsing animation when activity is high
// - Avatar stack of active users
// - Focus mode indicators
// - Recent ship notifications
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Zap,
  Flame,
  Rocket,
  Activity,
  Circle,
  Sparkles,
  Timer,
  Coffee,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE MOMENTUM CONTEXT - Import with fallback
// ═══════════════════════════════════════════════════════════════════════════════
import * as MomentumModule from '../../contexts/MomentumContext';

const useMomentumContext = MomentumModule.useMomentumContext || (() => ({
  glowLevel: 2,
  isFireMode: false,
}));

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_ACTIVE_USERS = [
  { id: '1', name: 'Sarah Chen', avatar: null, status: 'shipping', activity: 'Deploying API update' },
  { id: '2', name: 'Alex Rivera', avatar: null, status: 'focus', activity: 'Focus session: 18m left' },
  { id: '3', name: 'Jordan Park', avatar: null, status: 'active', activity: 'Reviewing PR #142' },
  { id: '4', name: 'Morgan Lee', avatar: null, status: 'shipping', activity: 'Writing tests' },
  { id: '5', name: 'Taylor Kim', avatar: null, status: 'active', activity: 'In standup meeting' },
  { id: '6', name: 'Casey Zhang', avatar: null, status: 'focus', activity: 'Focus session: 5m left' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  shipping: { 
    icon: Rocket, 
    color: 'text-brand-400', 
    bg: 'bg-brand-500', 
    label: 'Shipping',
    pulse: true,
  },
  focus: { 
    icon: Zap, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500', 
    label: 'In Focus',
    pulse: true,
  },
  active: { 
    icon: Activity, 
    color: 'text-success', 
    bg: 'bg-success', 
    label: 'Active',
    pulse: false,
  },
  break: { 
    icon: Coffee, 
    color: 'text-warning-500', 
    bg: 'bg-warning-500', 
    label: 'On Break',
    pulse: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR STACK
// ═══════════════════════════════════════════════════════════════════════════════
const AvatarStack = ({ users, max = 4, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;
  
  const getColorFromName = (name) => {
    if (!name) return 'bg-brand-500/30 text-brand-300';
    const colors = [
      'bg-brand-500/30 text-brand-300',
      'bg-cyan-500/30 text-cyan-300',
      'bg-success-500/30 text-success-300',
      'bg-warning-500/30 text-warning-300',
      'bg-energy-500/30 text-energy-300',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };
  
  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user, i) => {
        const status = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
        
        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
            title={`${user.name} - ${status.label}`}
          >
            {/* Avatar */}
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className={`${sizes[size]} rounded-full border-2 border-surface-0 object-cover`}
              />
            ) : (
              <div className={`
                ${sizes[size]} rounded-full border-2 border-surface-0
                ${getColorFromName(user.name)}
                flex items-center justify-center font-medium
              `}>
                {user.name.charAt(0)}
              </div>
            )}
            
            {/* Status indicator */}
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
              ${status.bg} border-2 border-surface-0
              ${status.pulse ? 'animate-pulse' : ''}
            `} />
          </motion.div>
        );
      })}
      
      {/* Remaining count */}
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
// PULSE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
const PulseIndicator = ({ intensity = 'normal', color = 'brand' }) => {
  const colors = {
    brand: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning-500',
    energy: 'bg-energy-500',
  };
  
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`
        animate-ping absolute inline-flex h-full w-full rounded-full 
        ${colors[color]} opacity-75
        ${intensity === 'high' ? 'animation-duration-500' : ''}
      `} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const ActivitySummary = ({ users }) => {
  const summary = useMemo(() => {
    const shipping = users.filter(u => u.status === 'shipping').length;
    const focus = users.filter(u => u.status === 'focus').length;
    const active = users.filter(u => u.status === 'active').length;
    return { shipping, focus, active, total: users.length };
  }, [users]);
  
  return (
    <div className="flex items-center gap-3 text-xs">
      {summary.shipping > 0 && (
        <span className="flex items-center gap-1 text-brand-400">
          <Rocket className="w-3 h-3" />
          {summary.shipping} shipping
        </span>
      )}
      {summary.focus > 0 && (
        <span className="flex items-center gap-1 text-cyan-400">
          <Zap className="w-3 h-3" />
          {summary.focus} in focus
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT ACTIVITY TICKER
// ═══════════════════════════════════════════════════════════════════════════════
const ActivityTicker = ({ activities }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (activities.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activities.length]);
  
  if (activities.length === 0) return null;
  
  return (
    <div className="h-5 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xs text-text-tertiary truncate"
        >
          {activities[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE HOOK WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════
const useSafeMomentumContext = () => {
  try {
    return useMomentumContext();
  } catch (e) {
    return { glowLevel: 2, isFireMode: false };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function TeamPulse({
  // Data
  users = MOCK_ACTIVE_USERS,
  
  // Options
  variant = 'default', // 'default' | 'compact' | 'minimal' | 'banner'
  showAvatars = true,
  showSummary = true,
  showTicker = true,
  maxAvatars = 4,
  
  // Actions
  onClick,
  
  // Styling
  className = '',
}) {
  // Get momentum context safely
  const { glowLevel, isFireMode } = useSafeMomentumContext();

  // Filter active users
  const activeUsers = users.filter(u => ['shipping', 'focus', 'active'].includes(u.status));
  const shippingCount = activeUsers.filter(u => u.status === 'shipping').length;
  
  // Generate ticker activities
  const tickerActivities = activeUsers
    .filter(u => u.activity)
    .map(u => `${u.name}: ${u.activity}`);

  // Determine intensity based on activity level
  const intensity = activeUsers.length >= 5 ? 'high' : 'normal';

  // Minimal variant (just the count)
  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 transition-colors
          ${className}
        `}
      >
        <PulseIndicator intensity={intensity} color={isFireMode ? 'energy' : 'brand'} />
        <span className="text-sm text-text-secondary">
          <span className={`font-medium ${isFireMode ? 'text-energy-500' : 'text-text-primary'}`}>
            {activeUsers.length}
          </span>
          {' '}active
        </span>
      </button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 p-3 rounded-xl
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 transition-colors
          ${isFireMode ? 'border-energy-500/10' : ''}
          ${className}
        `}
      >
        <div className="relative">
          <Users className={`w-5 h-5 ${isFireMode ? 'text-energy-500' : 'text-brand-400'}`} />
          <PulseIndicator intensity={intensity} color={isFireMode ? 'energy' : 'brand'} />
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{activeUsers.length}</span> people active
          </p>
          {shippingCount > 0 && (
            <p className="text-xs text-text-tertiary">
              {shippingCount} shipping right now
            </p>
          )}
        </div>
        
        {showAvatars && activeUsers.length > 0 && (
          <AvatarStack users={activeUsers} max={3} size="sm" />
        )}
      </button>
    );
  }

  // Banner variant (full-width)
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className={`
          flex items-center justify-between p-4 rounded-xl
          ${activeUsers.length >= 5 
            ? 'bg-gradient-to-r from-brand-500/10 to-cyan-500/10 border border-brand-500/20' 
            : 'bg-surface-1 border border-white/[0.06]'
          }
          ${isFireMode ? 'border-energy-500/20' : ''}
          ${onClick ? 'cursor-pointer hover:border-brand-500/30' : ''}
          transition-all duration-200
          ${className}
        `}
      >
        <div className="flex items-center gap-4">
          {/* Pulse */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isFireMode ? 'bg-energy-500/10' : 'bg-brand-500/10'}
          `}>
            <PulseIndicator intensity={intensity} color={isFireMode ? 'energy' : 'brand'} />
          </div>
          
          {/* Info */}
          <div>
            <p className="text-sm font-medium text-text-primary flex items-center gap-2">
              <span className={`text-lg font-bold ${isFireMode ? 'text-energy-500' : 'text-brand-400'}`}>
                {activeUsers.length}
              </span>
              teammates shipping right now
              {activeUsers.length >= 5 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-500/20 text-brand-400">
                  🔥 High Activity
                </span>
              )}
            </p>
            
            {showSummary && <ActivitySummary users={activeUsers} />}
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-4">
          {showTicker && (
            <div className="hidden md:block max-w-[200px]">
              <ActivityTicker activities={tickerActivities} />
            </div>
          )}
          
          {showAvatars && activeUsers.length > 0 && (
            <AvatarStack users={activeUsers} max={maxAvatars} />
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <div 
      onClick={onClick}
      className={`
        p-4 rounded-xl bg-surface-1 border border-white/[0.06]
        ${isFireMode ? 'border-energy-500/10' : ''}
        ${onClick ? 'cursor-pointer hover:bg-surface-2' : ''}
        transition-colors
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PulseIndicator intensity={intensity} color={isFireMode ? 'energy' : 'brand'} />
          <h3 className="text-sm font-medium text-text-primary">Team Pulse</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-2 text-[10px] text-text-tertiary">
            LIVE
          </span>
        </div>
        
        {activeUsers.length >= 5 && (
          <Sparkles className="w-4 h-4 text-warning-500 animate-pulse" />
        )}
      </div>
      
      {/* Main stat */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`
          text-3xl font-bold tabular-nums
          ${isFireMode ? 'text-energy-500' : 'text-brand-400'}
        `}>
          {activeUsers.length}
        </div>
        <div>
          <p className="text-sm text-text-primary">people active</p>
          <p className="text-xs text-text-tertiary">
            {shippingCount} shipping, {activeUsers.length - shippingCount} working
          </p>
        </div>
      </div>
      
      {/* Avatar stack */}
      {showAvatars && activeUsers.length > 0 && (
        <div className="flex items-center justify-between">
          <AvatarStack users={activeUsers} max={maxAvatars} />
          
          {showSummary && <ActivitySummary users={activeUsers} />}
        </div>
      )}
      
      {/* Activity ticker */}
      {showTicker && tickerActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <ActivityTicker activities={tickerActivities} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE PULSE (for headers/navbars)
// ═══════════════════════════════════════════════════════════════════════════════
export function InlineTeamPulse({ users = MOCK_ACTIVE_USERS, onClick, className = '' }) {
  const activeCount = users.filter(u => ['shipping', 'focus', 'active'].includes(u.status)).length;
  
  return (
    <TeamPulse
      users={users}
      variant="minimal"
      onClick={onClick}
      className={className}
    />
  );
}

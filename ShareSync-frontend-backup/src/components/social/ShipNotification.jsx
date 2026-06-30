// src/components/social/ShipNotification.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Ship Notification
// ═══════════════════════════════════════════════════════════════════════════════
//
// Real-time toast notification when teammates ship projects.
// Creates FOMO by showing continuous shipping activity.
//
// Key Features:
// - Animated entrance with rocket animation
// - Project preview with stats
// - Celebration effects for milestones
// - Quick congrats action
// - Stack multiple notifications
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  X, 
  Heart,
  MessageSquare,
  ExternalLink,
  Zap,
  Flame,
  PartyPopper,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ROCKET ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════
const RocketAnimation = () => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: [-5, 5, -5],
        opacity: 1,
      }}
      transition={{
        y: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
        opacity: { duration: 0.3 },
      }}
      className="relative"
    >
      <Rocket className="w-6 h-6 text-brand-400" />
      
      {/* Flame trail */}
      <motion.div
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [0.8, 1, 0.8],
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2"
      >
        <div className="w-2 h-4 bg-gradient-to-t from-warning-500 to-energy-500 rounded-full blur-sm" />
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION BURST
// ═══════════════════════════════════════════════════════════════════════════════
const CelebrationBurst = ({ variant = 'default' }) => {
  const emojis = variant === 'milestone' 
    ? ['🎉', '🚀', '⭐', '🔥', '💯', '🎊']
    : ['🚀', '✨', '⭐', '💫'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {emojis.map((emoji, i) => (
        <motion.span
          key={i}
          initial={{ 
            opacity: 1, 
            scale: 0,
            x: '50%',
            y: '50%',
          }}
          animate={{ 
            opacity: 0,
            scale: 1.5,
            x: `${50 + (Math.random() - 0.5) * 150}%`,
            y: `${50 + (Math.random() - 0.5) * 150}%`,
          }}
          transition={{ 
            duration: 0.8,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
          className="absolute text-lg"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR (auto-dismiss)
// ═══════════════════════════════════════════════════════════════════════════════
const DismissProgress = ({ duration, onComplete, paused = false }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-2 overflow-hidden rounded-b-xl">
      <motion.div
        initial={{ width: 'Available' }}
        animate={{ width: paused ? undefined : '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        onAnimationComplete={onComplete}
        className="h-full bg-brand-500/50"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE NOTIFICATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ShipNotificationItem = ({
  user,
  project,
  stats = {},
  onDismiss,
  onCongrats,
  onView,
  autoDismiss = 6000,
  isMilestone = false,
  isYou = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);
  const [hasCongratulated, setHasCongratulated] = useState(false);
  
  // Hide celebration after animation
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);
  
  const handleCongrats = () => {
    setHasCongratulated(true);
    onCongrats?.();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        relative w-80 rounded-xl overflow-hidden
        ${isMilestone 
          ? 'bg-gradient-to-br from-brand-500/20 to-cyan-500/10 border border-brand-500/30' 
          : 'bg-surface-1 border border-white/[0.08]'
        }
        backdrop-blur-sm shadow-lg
      `}
    >
      {/* Celebration effect */}
      {showCelebration && <CelebrationBurst variant={isMilestone ? 'milestone' : 'default'} />}
      
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Rocket animation */}
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isMilestone ? 'bg-brand-500/20' : 'bg-surface-2'}
            `}>
              <RocketAnimation />
            </div>
            
            {/* Ship label */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">
                  Shipped!
                </span>
                {isMilestone && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-500/20 text-warning-500 text-[10px] font-medium">
                    <PartyPopper className="w-3 h-3" />
                    Milestone
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {isYou ? 'You shipped' : `${user.name} shipped`}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
        
        {/* Project info */}
        <div className={`
          p-3 rounded-lg mb-3
          ${isMilestone ? 'bg-surface-0/50' : 'bg-surface-2'}
        `}>
          <div className="flex items-center gap-2 mb-1">
            {project.emoji && (
              <span className="text-lg">{project.emoji}</span>
            )}
            <h4 className="text-sm font-semibold text-text-primary">
              {project.name}
            </h4>
          </div>
          
          {project.description && (
            <p className="text-xs text-text-tertiary mb-2 line-clamp-2">
              {project.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            {stats.tasks !== undefined && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" />
                {stats.tasks} tasks
              </span>
            )}
            {stats.xp !== undefined && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-brand-400" />
                +{stats.xp} XP
              </span>
            )}
            {stats.streak !== undefined && stats.streak > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-warning-500" />
                {stats.streak}d streak
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isYou && (
            <button
              onClick={handleCongrats}
              disabled={hasCongratulated}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                text-xs font-medium transition-all
                ${hasCongratulated
                  ? 'bg-success/20 text-success'
                  : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20'
                }
              `}
            >
              {hasCongratulated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sent!
                </>
              ) : (
                <>
                  <Heart className="w-3.5 h-3.5" />
                  Congrats!
                </>
              )}
            </button>
          )}
          
          {onView && (
            <button
              onClick={onView}
              className="
                flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                text-xs text-text-tertiary hover:text-text-secondary
                hover:bg-surface-2 transition-colors
              "
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </button>
          )}
        </div>
      </div>
      
      {/* Auto-dismiss progress */}
      {autoDismiss > 0 && (
        <DismissProgress 
          duration={autoDismiss} 
          onComplete={onDismiss}
          paused={isPaused}
        />
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CONTAINER (manages stack)
// ═══════════════════════════════════════════════════════════════════════════════
export default function ShipNotification({
  // Single notification mode
  user,
  project,
  stats,
  onDismiss,
  onCongrats,
  onView,
  isMilestone = false,
  isYou = false,
  
  // Or use notifications array for multiple
  notifications = [],
  onDismissNotification,
  onCongratsNotification,
  onViewNotification,
  
  // Options
  position = 'top-right', // 'top-right' | 'top-center' | 'bottom-right'
  maxVisible = 3,
  autoDismiss = 6000,
  
  // Styling
  className = '',
}) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };
  
  // Single notification mode
  if (user && project) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <ShipNotificationItem
          user={user}
          project={project}
          stats={stats}
          onDismiss={onDismiss}
          onCongrats={onCongrats}
          onView={onView}
          autoDismiss={autoDismiss}
          isMilestone={isMilestone}
          isYou={isYou}
        />
      </div>
    );
  }
  
  // Multiple notifications mode
  const visibleNotifications = notifications.slice(0, maxVisible);
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 ${className}`}>
      <AnimatePresence>
        {visibleNotifications.map((notif) => (
          <ShipNotificationItem
            key={notif.id}
            user={notif.user}
            project={notif.project}
            stats={notif.stats}
            isMilestone={notif.isMilestone}
            isYou={notif.isYou}
            onDismiss={() => onDismissNotification?.(notif.id)}
            onCongrats={() => onCongratsNotification?.(notif.id)}
            onView={() => onViewNotification?.(notif.id)}
            autoDismiss={autoDismiss}
          />
        ))}
      </AnimatePresence>
      
      {/* "More" indicator */}
      {notifications.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-text-tertiary text-center py-2"
        >
          +{notifications.length - maxVisible} more ships
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR MANAGING SHIP NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export function useShipNotifications() {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((user, project, stats = {}, options = {}) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { 
      id, 
      user, 
      project, 
      stats,
      isMilestone: options.isMilestone || false,
      isYou: options.isYou || false,
    }]);
    return id;
  }, []);
  
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return { notifications, addNotification, dismissNotification, clearAll };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE SHIP BADGE (for use in activity feeds)
// ═══════════════════════════════════════════════════════════════════════════════
export function ShipBadge({ project, user, compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs">
        <Rocket className="w-3 h-3" />
        Shipped
      </span>
    );
  }
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
      <Rocket className="w-4 h-4 text-brand-400" />
      <span className="text-sm text-text-primary">
        <strong>{user?.name || 'Someone'}</strong> shipped <strong>{project?.name || 'a project'}</strong>
      </span>
    </div>
  );
}

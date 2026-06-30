// src/components/social/AchievementToast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Achievement Toast
// ═══════════════════════════════════════════════════════════════════════════════
//
// Toast notification when teammates unlock achievements.
// Creates FOMO by celebrating others' accomplishments.
//
// Key Features:
// - Animated entrance with confetti burst
// - Achievement badge with rarity indicator
// - Auto-dismiss with progress bar
// - Stack multiple toasts
// - Sound effect option
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Zap, 
  Flame,
  Target,
  Crown,
  Rocket,
  Award,
  X,
  Sparkles,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const ACHIEVEMENT_CONFIG = {
  // Streak achievements
  streak_7: { 
    name: 'Week Warrior', 
    description: '7-day streak', 
    icon: Flame, 
    rarity: 'common',
    color: 'warning',
  },
  streak_14: { 
    name: 'Fortnight Force', 
    description: '14-day streak', 
    icon: Flame, 
    rarity: 'uncommon',
    color: 'warning',
  },
  streak_30: { 
    name: 'Monthly Master', 
    description: '30-day streak', 
    icon: Flame, 
    rarity: 'rare',
    color: 'warning',
  },
  streak_100: { 
    name: 'Century Legend', 
    description: '100-day streak', 
    icon: Crown, 
    rarity: 'legendary',
    color: 'warning',
  },
  
  // Ship achievements
  first_ship: { 
    name: 'First Launch', 
    description: 'Shipped first project', 
    icon: Rocket, 
    rarity: 'common',
    color: 'brand',
  },
  ship_10: { 
    name: 'Ship Captain', 
    description: 'Shipped 10 projects', 
    icon: Rocket, 
    rarity: 'uncommon',
    color: 'brand',
  },
  ship_50: { 
    name: 'Fleet Admiral', 
    description: 'Shipped 50 projects', 
    icon: Rocket, 
    rarity: 'rare',
    color: 'brand',
  },
  
  // Speed achievements
  speed_demon: { 
    name: 'Speed Demon', 
    description: '5 tasks in 1 hour', 
    icon: Zap, 
    rarity: 'uncommon',
    color: 'cyan',
  },
  early_bird: { 
    name: 'Early Bird', 
    description: 'Completed task before 7am', 
    icon: Star, 
    rarity: 'common',
    color: 'cyan',
  },
  night_owl: { 
    name: 'Night Owl', 
    description: 'Completed task after midnight', 
    icon: Star, 
    rarity: 'common',
    color: 'brand',
  },
  
  // Team achievements
  team_player: { 
    name: 'Team Player', 
    description: 'Helped 5 teammates', 
    icon: Trophy, 
    rarity: 'uncommon',
    color: 'success',
  },
  mentor: { 
    name: 'Mentor', 
    description: 'Onboarded a new team member', 
    icon: Award, 
    rarity: 'rare',
    color: 'success',
  },
  
  // Special
  perfectionist: { 
    name: 'Perfectionist', 
    description: 'Available completion rate this week', 
    icon: Target, 
    rarity: 'rare',
    color: 'success',
  },
  overachiever: { 
    name: 'Overachiever', 
    description: 'Exceeded weekly goal by 50%', 
    icon: Crown, 
    rarity: 'legendary',
    color: 'warning',
  },
};

const RARITY_CONFIG = {
  common: { 
    label: 'Common', 
    bg: 'bg-surface-2', 
    border: 'border-white/[0.1]',
    glow: '',
    textColor: 'text-text-secondary',
  },
  uncommon: { 
    label: 'Uncommon', 
    bg: 'bg-brand-500/10', 
    border: 'border-brand-500/20',
    glow: 'shadow-glow-brand-sm',
    textColor: 'text-brand-400',
  },
  rare: { 
    label: 'Rare', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/20',
    glow: 'shadow-glow-cyan-sm',
    textColor: 'text-cyan-400',
  },
  legendary: { 
    label: 'Legendary', 
    bg: 'bg-warning-500/10', 
    border: 'border-warning-500/20',
    glow: 'shadow-glow-warning',
    textColor: 'text-warning-500',
  },
};

const COLOR_CONFIG = {
  brand: { icon: 'text-brand-400', bg: 'bg-brand-500/20' },
  cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  success: { icon: 'text-success', bg: 'bg-success/20' },
  warning: { icon: 'text-warning-500', bg: 'bg-warning-500/20' },
  energy: { icon: 'text-energy-500', bg: 'bg-energy-500/20' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI BURST
// ═══════════════════════════════════════════════════════════════════════════════
const ConfettiBurst = ({ colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'] }) => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: Math.random() * 0.2,
    color: colors[i % colors.length],
  }));
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          initial={{ 
            opacity: 1, 
            scale: 0,
            x: '50%',
            y: '50%',
          }}
          animate={{ 
            opacity: 0,
            scale: 1,
            x: `${50 + Math.cos(particle.angle * Math.PI / 180) * 100}%`,
            y: `${50 + Math.sin(particle.angle * Math.PI / 180) * 100}%`,
          }}
          transition={{ 
            duration: 0.6,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
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
// SINGLE TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const AchievementToastItem = ({
  achievement,
  user,
  onDismiss,
  autoDismiss = 5000,
  showConfetti = true,
  isYou = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showConfettiEffect, setShowConfettiEffect] = useState(showConfetti);
  
  const config = ACHIEVEMENT_CONFIG[achievement.id] || {
    name: achievement.name || 'Achievement',
    description: achievement.description || '',
    icon: Trophy,
    rarity: 'common',
    color: 'brand',
  };
  
  const rarityConfig = RARITY_CONFIG[config.rarity];
  const colorConfig = COLOR_CONFIG[config.color];
  const Icon = config.icon;
  
  // Hide confetti after animation
  useEffect(() => {
    if (showConfettiEffect) {
      const timer = setTimeout(() => setShowConfettiEffect(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showConfettiEffect]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        relative w-80 rounded-xl overflow-hidden
        ${rarityConfig.bg} border ${rarityConfig.border}
        ${config.rarity === 'legendary' ? rarityConfig.glow : ''}
        backdrop-blur-sm
      `}
    >
      {/* Confetti effect */}
      {showConfettiEffect && <ConfettiBurst />}
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Achievement icon */}
          <div className={`
            w-12 h-12 rounded-xl ${colorConfig.bg}
            flex items-center justify-center flex-shrink-0
            ${config.rarity === 'legendary' ? 'animate-pulse' : ''}
          `}>
            <Icon className={`w-6 h-6 ${colorConfig.icon}`} />
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium uppercase ${rarityConfig.textColor}`}>
                {rarityConfig.label}
              </span>
              {config.rarity === 'legendary' && (
                <Sparkles className="w-3 h-3 text-warning-500 animate-pulse" />
              )}
            </div>
            
            <p className="text-sm font-semibold text-text-primary mb-0.5">
              {isYou ? 'You unlocked' : `${user.name} unlocked`}
            </p>
            
            <p className={`text-sm font-medium ${colorConfig.icon}`}>
              {config.name}
            </p>
            
            <p className="text-xs text-text-tertiary mt-1">
              {config.description}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
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
// TOAST CONTAINER (manages stack)
// ═══════════════════════════════════════════════════════════════════════════════
export default function AchievementToast({
  // Single toast mode
  achievement,
  user,
  onDismiss,
  
  // Or use toasts array for multiple
  toasts = [],
  onDismissToast,
  
  // Options
  position = 'top-right', // 'top-right' | 'top-center' | 'bottom-right'
  maxVisible = 3,
  autoDismiss = 5000,
  showConfetti = true,
  
  // Styling
  className = '',
}) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };
  
  // Single toast mode
  if (achievement && user) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <AchievementToastItem
          achievement={achievement}
          user={user}
          onDismiss={onDismiss}
          autoDismiss={autoDismiss}
          showConfetti={showConfetti}
        />
      </div>
    );
  }
  
  // Multiple toasts mode
  const visibleToasts = toasts.slice(0, maxVisible);
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 ${className}`}>
      <AnimatePresence>
        {visibleToasts.map((toast, index) => (
          <AchievementToastItem
            key={toast.id}
            achievement={toast.achievement}
            user={toast.user}
            isYou={toast.isYou}
            onDismiss={() => onDismissToast?.(toast.id)}
            autoDismiss={autoDismiss}
            showConfetti={showConfetti && index === 0}
          />
        ))}
      </AnimatePresence>
      
      {/* "More" indicator */}
      {toasts.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-text-tertiary text-center py-2"
        >
          +{toasts.length - maxVisible} more
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR MANAGING TOASTS
// ═══════════════════════════════════════════════════════════════════════════════
export function useAchievementToasts() {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((achievement, user, isYou = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, achievement, user, isYou }]);
    return id;
  }, []);
  
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);
  
  return { toasts, addToast, dismissToast, clearAll };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE ACHIEVEMENT BADGE (for use in other components)
// ═══════════════════════════════════════════════════════════════════════════════
export function AchievementBadge({ achievementId, size = 'md', showLabel = true }) {
  const config = ACHIEVEMENT_CONFIG[achievementId];
  if (!config) return null;
  
  const rarityConfig = RARITY_CONFIG[config.rarity];
  const colorConfig = COLOR_CONFIG[config.color];
  const Icon = config.icon;
  
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <div className="flex items-center gap-2" title={`${config.name}: ${config.description}`}>
      <div className={`
        ${sizes[size]} rounded-lg ${colorConfig.bg}
        flex items-center justify-center
        ${config.rarity === 'legendary' ? 'ring-2 ring-warning-500/30' : ''}
      `}>
        <Icon className={`${iconSizes[size]} ${colorConfig.icon}`} />
      </div>
      
      {showLabel && (
        <div>
          <p className="text-xs font-medium text-text-primary">{config.name}</p>
          <p className={`text-[10px] ${rarityConfig.textColor}`}>{rarityConfig.label}</p>
        </div>
      )}
    </div>
  );
}

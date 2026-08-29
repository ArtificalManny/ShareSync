// src/components/momentum/MomentumMessage.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Celebration Messages
// ═══════════════════════════════════════════════════════════════════════════════
//
// Displays contextual celebration messages when:
// - User levels up
// - Fire mode activates
// - Milestones are reached
//
// These are brief, non-blocking, and encouraging.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Rocket, 
  Star,
  Sparkles,
  PartyPopper,
  X,
} from 'lucide-react';

/**
 * Message type configurations
 */
const MESSAGE_CONFIG = {
  levelUp: {
    icon: Zap,
    bgGradient: 'from-brand-600/90 to-brand-700/90',
    iconColor: 'text-brand-300',
    textColor: 'text-white',
    glow: 'rgb(var(--brand-500-rgb) / 0.4)',
  },
  fireMode: {
    icon: Flame,
    bgGradient: 'from-energy-500/90 to-energy-600/90',
    iconColor: 'text-yellow-300',
    textColor: 'text-white',
    glow: 'rgb(var(--energy-500-rgb) / 0.5)',
  },
  milestone: {
    icon: Trophy,
    bgGradient: 'from-cyan-500/90 to-cyan-600/90',
    iconColor: 'text-cyan-200',
    textColor: 'text-white',
    glow: 'rgb(var(--cyan-500-rgb) / 0.4)',
  },
  ship: {
    icon: Rocket,
    bgGradient: 'from-success-500/90 to-success-600/90',
    iconColor: 'text-green-200',
    textColor: 'text-white',
    glow: 'rgb(var(--success-500-rgb) / 0.4)',
  },
  streak: {
    icon: Star,
    bgGradient: 'from-warning-500/90 to-warning-600/90',
    iconColor: 'text-yellow-200',
    textColor: 'text-white',
    glow: 'rgb(var(--warning-500-rgb) / 0.4)',
  },
};

/**
 * Animation variants
 */
const containerVariants = {
  hidden: { 
    opacity: 0, 
    y: -20,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay: 0.1,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      delay: 0.2,
    },
  },
};

/**
 * Confetti particle component
 */
function ConfettiParticle({ delay = 0 }) {
  const colors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 100 - 50;
  const rotation = Math.random() * 360;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{ 
        opacity: 1, 
        y: 0, 
        x: 0, 
        rotate: 0,
        scale: 1,
      }}
      animate={{ 
        opacity: 0, 
        y: 100, 
        x: x, 
        rotate: rotation,
        scale: 0,
      }}
      transition={{ 
        duration: 1, 
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

/**
 * MomentumMessage - Celebration overlay component
 */
export default function MomentumMessage({
  type = 'levelUp',
  message = 'Level Up!',
  subMessage = '',
  onDismiss,
  autoDismiss = true,
  duration = 3000,
  showConfetti = true,
  position = 'top', // 'top' | 'center' | 'bottom'
}) {
  const [showParticles, setShowParticles] = useState(showConfetti);
  const config = MESSAGE_CONFIG[type] || MESSAGE_CONFIG.levelUp;
  const Icon = config.icon;

  // Auto-dismiss
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, duration]);

  // Hide particles after animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowParticles(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const positionClasses = {
    top: 'top-20 left-1/2 -translate-x-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`
          fixed z-[100]
          ${positionClasses[position]}
        `}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Confetti particles */}
        {showParticles && type === 'fireMode' && (
          <div className="absolute top-1/2 left-1/2 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.05} />
            ))}
          </div>
        )}

        {/* Message card */}
        <motion.div
          className={`
            relative
            flex items-center gap-4
            px-6 py-4 rounded-2xl
            bg-gradient-to-r ${config.bgGradient}
            backdrop-blur-sm
            shadow-2xl
          `}
          style={{
            boxShadow: `0 20px 40px ${config.glow}, 0 0 60px ${config.glow}`,
          }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Icon */}
          <motion.div
            className={`
              w-12 h-12 rounded-xl 
              flex items-center justify-center
              bg-white/20
            `}
            variants={iconVariants}
          >
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </motion.div>

          {/* Text content */}
          <motion.div variants={textVariants}>
            <div className={`text-lg font-bold ${config.textColor}`}>
              {message}
            </div>
            {subMessage && (
              <div className={`text-sm ${config.textColor} opacity-80 mt-0.5`}>
                {subMessage}
              </div>
            )}
          </motion.div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                ml-2 p-1.5 rounded-lg
                ${config.textColor} opacity-60 hover:opacity-100
                hover:bg-white/10
                transition-all duration-200
              `}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 1.5, 
                delay: 0.3,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline momentum message for use within content
 */
export function MomentumInlineMessage({
  type = 'milestone',
  message,
  className = '',
}) {
  const config = MESSAGE_CONFIG[type] || MESSAGE_CONFIG.milestone;
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center gap-2
      px-3 py-1.5 rounded-lg
      bg-gradient-to-r ${config.bgGradient}
      ${className}
    `}>
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {message}
      </span>
    </div>
  );
}

/**
 * Toast-style momentum notification
 */
export function MomentumToast({
  type = 'levelUp',
  message,
  subMessage,
  onDismiss,
  duration = 3000,
}) {
  const config = MESSAGE_CONFIG[type] || MESSAGE_CONFIG.levelUp;
  const Icon = config.icon;

  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [onDismiss, duration]);

  return (
    <motion.div
      className={`
        flex items-center gap-3
        px-4 py-3 rounded-xl
        bg-gradient-to-r ${config.bgGradient}
        shadow-lg
      `}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      style={{
        boxShadow: `0 10px 30px ${config.glow}`,
      }}
    >
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        bg-white/20
      `}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <div>
        <div className={`text-sm font-semibold ${config.textColor}`}>
          {message}
        </div>
        {subMessage && (
          <div className={`text-xs ${config.textColor} opacity-75`}>
            {subMessage}
          </div>
        )}
      </div>
    </motion.div>
  );
}

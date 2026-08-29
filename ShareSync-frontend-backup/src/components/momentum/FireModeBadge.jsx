// src/components/momentum/FireModeBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Fire Mode Badge
// ═══════════════════════════════════════════════════════════════════════════════
//
// A special badge that appears when user reaches Level 5 (Fire Mode).
// This is a rare, earned state that should feel like an achievement.
//
// FEATURES:
// - Animated entrance when first activated
// - Persistent glow while in fire mode
// - Shows current score/time in fire mode
// - Celebratory animations
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, TrendingUp, Clock, Zap } from 'lucide-react';
import { useMomentumEngine } from '../../hooks/useMomentumEngine';

/**
 * FireModeBadge - Persistent indicator when in fire mode
 */
export default function FireModeBadge({
  justActivated = false,
  score = 90,
  position = 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showDetails = false,
  dismissible = false,
  onDismiss,
}) {
  const [isExpanded, setIsExpanded] = useState(showDetails || justActivated);
  const [timeInFireMode, setTimeInFireMode] = useState(0);

  // Track time in fire mode
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInFireMode(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-collapse after initial celebration
  useEffect(() => {
    if (justActivated) {
      setIsExpanded(true);
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [justActivated]);

  // Format time
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeInFireMode / 60);
    const seconds = timeInFireMode % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [timeInFireMode]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`
          fixed z-[90]
          ${positionClasses[position]}
        `}
        initial={{ opacity: 0, scale: 0.5, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgb(var(--energy-500-rgb) / 0.3), transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main badge */}
        <motion.div
          className={`
            relative
            flex items-center gap-3
            rounded-2xl overflow-hidden
            bg-gradient-to-r from-energy-500 to-energy-600
            shadow-2xl
            cursor-pointer
            ${isExpanded ? 'px-5 py-4' : 'px-4 py-3'}
          `}
          style={{
            boxShadow: `
              0 10px 40px rgb(var(--energy-500-rgb) / 0.4),
              0 0 60px rgb(var(--energy-500-rgb) / 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
          }}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          layout
        >
          {/* Fire icon with animation */}
          <motion.div
            className="relative"
            animate={justActivated ? {
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.2, 1],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Flame className="w-6 h-6 text-yellow-300 drop-shadow-lg" />
            </motion.div>
            
            {/* Spark particles */}
            {justActivated && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    initial={{ 
                      opacity: 1, 
                      x: 0, 
                      y: 0,
                      scale: 1,
                    }}
                    animate={{ 
                      opacity: 0, 
                      x: (Math.random() - 0.5) * 40,
                      y: -20 - Math.random() * 20,
                      scale: 0,
                    }}
                    transition={{ 
                      duration: 0.8, 
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex flex-col">
            <motion.span 
              className="text-white font-bold text-sm"
              layout
            >
              {isExpanded ? 'FIRE MODE' : '🔥'}
            </motion.span>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="flex items-center gap-3 mt-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center gap-1 text-white/80 text-xs">
                    <Zap className="w-3 h-3" />
                    <span>{score}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/80 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formattedTime}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dismiss button */}
          {dismissible && isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="
                ml-2 p-1 rounded-lg
                text-white/60 hover:text-white
                hover:bg-white/10
                transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>

        {/* "You're crushing it" message on activation */}
        <AnimatePresence>
          {justActivated && (
            <motion.div
              className="
                absolute left-1/2 -translate-x-1/2
                mt-2 px-4 py-2 rounded-lg
                bg-surface-1/90 backdrop-blur-sm
                border border-energy-500/20
                text-sm text-text-primary
                whitespace-nowrap
              "
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-energy-500">🔥</span>
              {' '}You're absolutely crushing it!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact fire mode indicator for inline use
 */
export function FireModeInline({ className = '' }) {
  const { isFireMode, score } = useMomentumEngine();

  if (!isFireMode) return null;

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        bg-gradient-to-r from-energy-500 to-energy-600
        text-white text-xs font-semibold
        ${className}
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        🔥
      </motion.span>
      <span>Fire Mode</span>
    </motion.span>
  );
}

/**
 * Fire mode background effect
 */
export function FireModeBackground({ children }) {
  const { isFireMode, fireModeJustActivated } = useMomentumEngine();

  return (
    <div className="relative">
      {/* Fire mode ambient glow */}
      <AnimatePresence>
        {isFireMode && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Corner glows */}
            <div 
              className="absolute top-0 right-0 w-96 h-96"
              style={{
                background: 'radial-gradient(circle at top right, rgb(var(--energy-500-rgb) / 0.1), transparent 60%)',
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-96 h-96"
              style={{
                background: 'radial-gradient(circle at bottom left, rgb(var(--brand-500-rgb) / 0.08), transparent 60%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burst effect on activation */}
      <AnimatePresence>
        {fireModeJustActivated && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle, rgb(var(--energy-500-rgb) / 0.3), transparent 50%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

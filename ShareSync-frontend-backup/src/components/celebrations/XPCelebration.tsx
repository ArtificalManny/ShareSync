// ═══════════════════════════════════════════════════════════════════════════
// SHARESYNC XP CELEBRATION COMPONENT
// Displays XP rewards with variable celebration intensity
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Trophy, Star, Zap, Target } from 'lucide-react';
import type { XPResult } from '@/lib/xp-engine';
import { springs, easings } from '@/lib/motion';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface XPCelebrationProps {
  result: XPResult | null;
  onComplete?: () => void;
}

interface ConfettiOptions {
  particleCount: number;
  spread: number;
  origin: { x?: number; y: number };
  colors?: string[];
  startVelocity?: number;
  gravity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI HELPER (uses canvas-confetti if available, otherwise no-op)
// ─────────────────────────────────────────────────────────────────────────────

async function triggerConfetti(options: ConfettiOptions): Promise<void> {
  try {
    // Dynamically import canvas-confetti to avoid SSR issues
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default;
    confetti(options);
  } catch (error) {
    // canvas-confetti not available, fail silently
    console.debug('Confetti not available:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CELEBRATION ICON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function CelebrationIcon({
  type,
  isLegendary
}: {
  type: XPResult['celebrationType'];
  isLegendary: boolean;
}) {
  const iconClass = isLegendary
    ? 'w-16 h-16 text-yellow-400'
    : 'w-12 h-12';

  if (isLegendary) {
    return (
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Trophy className={iconClass} />
      </motion.div>
    );
  }

  switch (type) {
    case 'streak':
      return (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            filter: [
              'brightness(1)',
              'brightness(1.3)',
              'brightness(1)',
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Flame className={`${iconClass} text-orange-500`} />
        </motion.div>
      );
    case 'milestone':
      return (
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          <Target className={`${iconClass} text-brand-400`} />
        </motion.div>
      );
    default:
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Sparkles className={`${iconClass} text-brand-400`} />
        </motion.div>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BONUS PILL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function BonusPill({
  bonus,
  index
}: {
  bonus: XPResult['bonuses'][0];
  index: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: 0.5 + index * 0.1,
        type: 'spring',
        stiffness: 500,
        damping: 25,
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                 bg-white/10 text-xs text-text-secondary
                 border border-white/5"
    >
      <span>{bonus.icon}</span>
      <span>{bonus.message}</span>
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING XP PARTICLES
// ─────────────────────────────────────────────────────────────────────────────

function FloatingParticles({ count, isLegendary }: { count: number; isLegendary: boolean }) {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            delay: Math.random() * 0.3,
            ease: 'easeOut',
          }}
          className={`absolute w-2 h-2 rounded-full ${
            isLegendary
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
              : 'bg-brand-400'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function XPCelebration({ result, onComplete }: XPCelebrationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 200);
  }, [onComplete]);

  useEffect(() => {
    if (!result) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setShowDetails(false);

    // Trigger confetti for special celebrations
    if (result.celebrationType === 'legendary') {
      // Gold confetti explosion
      triggerConfetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#8B5CF6'],
        startVelocity: 45,
      });

      // Second burst
      setTimeout(() => {
        triggerConfetti({
          particleCount: 75,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500'],
        });
      }, 200);
    } else if (result.celebrationType === 'milestone') {
      // Subtle confetti
      triggerConfetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
      });
    } else if (result.celebrationType === 'streak') {
      // Fire-colored confetti
      triggerConfetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#EF4444', '#F59E0B', '#FCD34D'],
      });
    }

    // Show details after main animation
    const detailsTimer = setTimeout(() => setShowDetails(true), 400);

    // Auto-dismiss
    const dismissDuration = result.isLegendary ? 4000 :
                           result.celebrationType === 'milestone' ? 3000 :
                           2500;

    const dismissTimer = setTimeout(handleComplete, dismissDuration);

    return () => {
      clearTimeout(detailsTimer);
      clearTimeout(dismissTimer);
    };
  }, [result, handleComplete]);

  if (!result) return null;

  // FIX:
  // Framer Motion expects a cubic-bezier tuple or easing function.
  // If easings.overshoot is currently `number[]`, TS rejects it.
  // This local cast keeps the change isolated to this file.
  const overshootEase = (easings.overshoot as unknown) as [number, number, number, number];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          onClick={handleComplete}
        >
          {/* Backdrop for legendary */}
          {result.isLegendary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
            />
          )}

          {/* Floating particles */}
          <FloatingParticles
            count={result.isLegendary ? 20 : 10}
            isLegendary={result.isLegendary}
          />

          {/* Main XP Display */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{
              scale: [0, 1.3, 1],
              rotate: [-10, 5, 0],
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.6,
              times: [0, 0.6, 1],
              ease: overshootEase,
            }}
            className={`
              relative flex flex-col items-center p-8 rounded-2xl
              pointer-events-auto cursor-pointer
              ${result.isLegendary
                ? 'bg-gradient-to-br from-yellow-500/20 via-red-500/20 to-purple-500/20 border-2 border-yellow-500/50 shadow-glow-legendary'
                : 'bg-surface-2/95 border border-white/10'
              }
              backdrop-blur-xl shadow-2xl
            `}
          >
            {/* Glow effect for legendary */}
            {result.isLegendary && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-purple-500/10 animate-pulse" />
            )}

            {/* Icon */}
            <div className="mb-4 relative z-10">
              <CelebrationIcon
                type={result.celebrationType}
                isLegendary={result.isLegendary}
              />
            </div>

            {/* XP Amount */}
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 500,
                damping: 25,
              }}
              className={`
                text-5xl font-bold mb-2 relative z-10
                ${result.isLegendary
                  ? 'bg-gradient-to-r from-yellow-400 via-red-400 to-purple-400 bg-clip-text text-transparent animate-pulse'
                  : 'text-xp-gold'
                }
              `}
            >
              +{result.totalXP} XP
            </motion.div>

            {/* Base XP breakdown */}
            {result.bonusXP > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-text-tertiary mb-2 relative z-10"
              >
                {result.baseXP} base + {result.bonusXP} bonus
              </motion.div>
            )}

            {/* Multiplier Badge */}
            {result.multiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35 }}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium mb-4 relative z-10
                  ${result.isLegendary
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  }
                `}
              >
                <Zap className="inline w-3 h-3 mr-1" />
                {result.multiplier.toFixed(1)}x Multiplier
              </motion.div>
            )}

            {/* Bonus List */}
            <AnimatePresence>
              {showDetails && result.bonuses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 justify-center max-w-xs relative z-10"
                >
                  {result.bonuses.map((bonus, i) => (
                    <BonusPill key={bonus.type} bonus={bonus} index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap to dismiss hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-2 text-xs text-text-muted"
            >
              Tap to dismiss
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI XP TOAST (For inline/subtle celebrations)
// ─────────────────────────────────────────────────────────────────────────────

interface MiniXPToastProps {
  xp: number;
  show: boolean;
  onComplete?: () => void;
}

export function MiniXPToast({ xp, show, onComplete }: MiniXPToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={springs.bouncy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                     bg-xp-gold/20 text-xp-gold text-sm font-medium"
        >
          <Star className="w-3 h-3" />
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default XPCelebration;

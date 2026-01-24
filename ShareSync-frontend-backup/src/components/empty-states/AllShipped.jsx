// src/components/empty-states/AllShipped.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - All Shipped! (Victory State)
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the ULTIMATE celebration state!
// All tasks/missions shipped = maximum dopamine hit.
//
// Key features:
// - Confetti explosion
// - Trophy animation
// - XP earned summary
// - Streak highlight
// - "What's next?" suggestions
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Trophy, 
  Sparkles, 
  Zap,
  Star,
  Flame,
  Plus,
  ArrowRight,
  PartyPopper,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { TrophyIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// EPIC CONFETTI EXPLOSION
// ═══════════════════════════════════════════════════════════════════════════════
const EpicConfetti = ({ trigger = true, intensity = 'high' }) => {
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);
  
  const particleCount = intensity === 'high' ? 80 : intensity === 'medium' ? 50 : 25;
  
  useEffect(() => {
    if (!trigger) return;
    
    const colors = [
      '#8B5CF6', // brand
      '#A78BFA', // brand light
      '#06B6D4', // cyan
      '#10B981', // success
      '#F59E0B', // warning
      '#F43F5E', // energy
      '#EC4899', // pink
    ];
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: 50,
      y: 40,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 12 - 5,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
    }));
    
    setParticles(newParticles);
    
    // Clean up
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, [trigger, particleCount]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: 1,
              scale: 1,
              rotate: particle.rotation,
            }}
            animate={{
              x: `${particle.x + particle.vx * 8}vw`,
              y: `${particle.y + particle.vy * -4 + 80}vh`,
              opacity: [1, 1, 0],
              scale: [1, 1.2, 0.5],
              rotate: particle.rotation + particle.rotationSpeed * 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'square' ? '2px' : '0',
              clipPath: particle.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// XP EARNED SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const XPEarnedSummary = ({ tasksCompleted = 0, xpEarned = 0, bonusXP = 0 }) => {
  const { glowLevel } = useMomentumContext();
  const totalXP = xpEarned + bonusXP;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
      className={`
        inline-flex items-center gap-4 px-6 py-3 rounded-2xl
        bg-gradient-to-r from-brand-500/10 to-cyan-500/10
        border border-brand-500/20
        ${glowLevel >= 4 ? 'shadow-glow-brand' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-brand-400" />
        <div>
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            +{totalXP} XP
          </div>
          <div className="text-xs text-text-tertiary">
            {tasksCompleted} tasks shipped
          </div>
        </div>
      </div>
      
      {bonusXP > 0 && (
        <>
          <div className="w-px h-10 bg-white/[0.1]" />
          <div className="text-center">
            <div className="text-sm font-semibold text-warning-500">
              +{bonusXP} Bonus
            </div>
            <div className="text-[10px] text-text-tertiary">
              Streak bonus
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK CELEBRATION
// ═══════════════════════════════════════════════════════════════════════════════
const StreakCelebration = ({ streak = 0, bestStreak = 0 }) => {
  const isNewBest = streak > 0 && streak >= bestStreak;
  
  if (streak === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-xl
        ${isNewBest 
          ? 'bg-warning-500/10 border border-warning-500/20' 
          : 'bg-surface-2 border border-white/[0.06]'
        }
      `}
    >
      <Flame className={`w-5 h-5 ${isNewBest ? 'text-warning-500 animate-pulse' : 'text-warning-400'}`} />
      <div>
        <div className={`text-sm font-semibold ${isNewBest ? 'text-warning-500' : 'text-text-primary'}`}>
          {streak} Day Ship Streak
        </div>
        {isNewBest && (
          <div className="text-xs text-warning-400">🎉 New personal best!</div>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHAT'S NEXT SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const WhatsNextSuggestions = ({ onAddMore, onViewStats, onTakeBreak }) => {
  const suggestions = [
    { 
      icon: Plus, 
      label: 'Add more tasks', 
      description: 'Keep the momentum going',
      action: onAddMore,
      primary: true,
    },
    { 
      icon: TrendingUp, 
      label: 'View stats', 
      description: 'See your progress',
      action: onViewStats,
    },
    { 
      icon: Calendar, 
      label: 'Plan tomorrow', 
      description: 'Stay ahead',
      action: onTakeBreak,
    },
  ].filter(s => s.action);
  
  if (suggestions.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="mt-8"
    >
      <div className="text-xs text-text-tertiary mb-4 text-center">What's next?</div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            onClick={suggestion.action}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${suggestion.primary 
                ? 'bg-brand-600 text-white hover:bg-brand-500' 
                : 'bg-surface-2 border border-white/[0.06] hover:bg-surface-3'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <suggestion.icon className={`w-5 h-5 ${suggestion.primary ? 'text-white' : 'text-text-tertiary'}`} />
            <div className="text-left">
              <div className={`text-sm font-medium ${suggestion.primary ? 'text-white' : 'text-text-primary'}`}>
                {suggestion.label}
              </div>
              <div className={`text-xs ${suggestion.primary ? 'text-white/70' : 'text-text-tertiary'}`}>
                {suggestion.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION MESSAGE (rotating)
// ═══════════════════════════════════════════════════════════════════════════════
const celebrationMessages = [
  { text: "You absolute legend! 🏆", emoji: "🏆" },
  { text: "Shipped like a boss! 🚀", emoji: "🚀" },
  { text: "Productivity royalty! 👑", emoji: "👑" },
  { text: "You're on fire! 🔥", emoji: "🔥" },
  { text: "Mission accomplished! ✅", emoji: "✅" },
  { text: "Crushed it! 💪", emoji: "💪" },
];

const CelebrationMessage = ({ streak = 0 }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  useEffect(() => {
    // Pick a message based on streak or random
    const index = streak >= 7 
      ? 3 // "You're on fire!" for big streaks
      : Math.floor(Math.random() * celebrationMessages.length);
    setMessageIndex(index);
  }, [streak]);
  
  const message = celebrationMessages[messageIndex];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
      className="text-center mb-2"
    >
      <span className="text-4xl">{message.emoji}</span>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AllShipped({
  // Stats
  tasksCompleted = 0,
  xpEarned = 0,
  bonusXP = 0,
  streak = 0,
  bestStreak = 0,
  projectName = '',
  
  // Actions
  onAddMore,
  onViewStats,
  onPlanNext,
  
  // Options
  showConfetti = true,
  showXP = true,
  showStreak = true,
  confettiIntensity = 'high', // 'low' | 'medium' | 'high'
  variant = 'celebratory', // 'minimal' | 'illustrated' | 'celebratory'
  className = '',
}) {
  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  
  // Trigger confetti on mount
  useEffect(() => {
    if (showConfetti && variant === 'celebratory') {
      const timer = setTimeout(() => setConfettiTriggered(true), 200);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, variant]);
  
  // Record achievement
  useEffect(() => {
    if (recordActivity) {
      recordActivity('ALL_SHIPPED', { 
        tasksCompleted, 
        projectName,
        streak,
      });
    }
  }, []);
  
  // Generate title
  const title = projectName 
    ? `${projectName} is fully shipped!`
    : "Everything shipped!";
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center mx-auto mb-3">
          <Rocket className="w-6 h-6 text-success-500" />
        </div>
        <p className="text-sm font-medium text-text-primary">All shipped! 🚀</p>
        {tasksCompleted > 0 && (
          <p className="text-xs text-text-tertiary mt-1">{tasksCompleted} tasks completed</p>
        )}
        {onAddMore && (
          <button
            onClick={onAddMore}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            + Add more tasks
          </button>
        )}
      </div>
    );
  }
  
  // Illustrated variant
  if (variant === 'illustrated') {
    return (
      <div className={className}>
        <EmptyState
          illustration={TrophyIllustration}
          title={title}
          description="Every task has been shipped. You've earned your moment of glory!"
          primaryAction={onAddMore}
          primaryActionLabel="Add More Tasks"
          primaryActionIcon={Plus}
          variant="illustrated"
          accentColor={isFireMode ? 'energy' : 'success'}
        >
          {showXP && xpEarned > 0 && (
            <div className="flex justify-center mt-4">
              <XPEarnedSummary 
                tasksCompleted={tasksCompleted}
                xpEarned={xpEarned}
                bonusXP={bonusXP}
              />
            </div>
          )}
        </EmptyState>
      </div>
    );
  }
  
  // Full celebratory variant
  return (
    <div className={className}>
      {/* Epic confetti */}
      {confettiTriggered && (
        <EpicConfetti trigger={confettiTriggered} intensity={confettiIntensity} />
      )}
      
      <EmptyState
        illustration={TrophyIllustration}
        title={title}
        description="You've conquered every task, shipped every mission, and left nothing behind. This is what peak productivity looks like!"
        variant="celebratory"
        size="large"
        accentColor={isFireMode ? 'energy' : 'success'}
        showConfetti={false}
      >
        {/* Celebration message */}
        <CelebrationMessage streak={streak} />
        
        {/* XP Summary */}
        {showXP && (xpEarned > 0 || tasksCompleted > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mt-4"
          >
            <XPEarnedSummary 
              tasksCompleted={tasksCompleted}
              xpEarned={xpEarned}
              bonusXP={bonusXP}
            />
          </motion.div>
        )}
        
        {/* Streak */}
        {showStreak && streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center mt-4"
          >
            <StreakCelebration streak={streak} bestStreak={bestStreak} />
          </motion.div>
        )}
        
        {/* What's next */}
        <WhatsNextSuggestions 
          onAddMore={onAddMore}
          onViewStats={onViewStats}
          onTakeBreak={onPlanNext}
        />
      </EmptyState>
      
      {/* Inline styles */}
      <style>{`
        .shadow-glow-brand {
          box-shadow: 0 0 30px rgb(139 92 246 / 0.3);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for cards, panels)
// ═══════════════════════════════════════════════════════════════════════════════
export function AllShippedCompact({ 
  tasksCompleted = 0, 
  xpEarned = 0,
  onAddMore, 
  className = '' 
}) {
  return (
    <div className={`p-4 rounded-xl bg-success-500/5 border border-success-500/20 ${className}`}>
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <Trophy className="w-6 h-6 text-success-500" />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
            All shipped! 
            <span className="text-lg">🚀</span>
          </div>
          <div className="text-xs text-text-tertiary">
            {tasksCompleted} tasks • +{xpEarned} XP
          </div>
        </div>
        {onAddMore && (
          <button
            onClick={onAddMore}
            className="px-3 py-1.5 rounded-lg bg-surface-2 text-xs text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          >
            Add more
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export function AllShippedToast({ tasksCompleted = 0, xpEarned = 0, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-success-500/10 to-brand-500/10 border border-success-500/20 shadow-lg"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <PartyPopper className="w-6 h-6 text-success-500" />
      </motion.div>
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">Everything shipped! 🚀</div>
        <div className="text-xs text-text-tertiary">
          {tasksCompleted} tasks completed • +{xpEarned} XP
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}

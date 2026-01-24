// src/components/empty-states/EmptyInbox.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Inbox (Celebratory!)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Inbox zero is a VICTORY, not a void!
// This empty state celebrates the achievement.
//
// Key messaging:
// - "Inbox Zero achieved! 🎉"
// - Victory moment with confetti
// - Streak tracking
// - Encouraging next action
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  CheckCircle2, 
  Sparkles, 
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Star,
  MessageSquare,
  Send,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { InboxZeroIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI BURST EFFECT
// ═══════════════════════════════════════════════════════════════════════════════
const ConfettiBurst = ({ trigger = true }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'][i % 5],
        angle: Math.random() * 360,
        velocity: 2 + Math.random() * 4,
        spin: (Math.random() - 0.5) * 720,
      }));
      setParticles(newParticles);
      
      // Clean up after animation
      const timer = setTimeout(() => setParticles([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: '50vh',
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: `${particle.x + Math.cos(particle.angle * Math.PI / 180) * particle.velocity * 20}vw`,
              y: `${50 + Math.sin(particle.angle * Math.PI / 180) * particle.velocity * 15 + 50}vh`,
              opacity: 0,
              scale: 0.5,
              rotate: particle.spin,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 + Math.random(), ease: 'easeOut' }}
            className="absolute w-3 h-3"
            style={{
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INBOX ZERO STREAK TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
const InboxZeroStreak = ({ streak = 0, bestStreak = 0 }) => {
  const { glowLevel } = useMomentumContext();
  const isNewBest = streak > 0 && streak >= bestStreak;
  
  if (streak === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className={`
        inline-flex items-center gap-3 px-4 py-2 rounded-xl
        ${isNewBest ? 'bg-warning-500/10 border border-warning-500/20' : 'bg-surface-2 border border-white/[0.06]'}
        ${glowLevel >= 4 && isNewBest ? 'shadow-glow-warning' : ''}
      `}
    >
      <div className="flex items-center gap-1.5">
        <Flame className={`w-4 h-4 ${isNewBest ? 'text-warning-500' : 'text-text-tertiary'}`} />
        <span className={`text-sm font-semibold ${isNewBest ? 'text-warning-500' : 'text-text-primary'}`}>
          {streak} day streak
        </span>
      </div>
      
      {isNewBest && (
        <span className="text-[10px] font-medium text-warning-500 uppercase tracking-wider">
          New Best!
        </span>
      )}
      
      {!isNewBest && bestStreak > 0 && (
        <span className="text-xs text-text-tertiary">
          Best: {bestStreak}
        </span>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIME SINCE INBOX ZERO
// ═══════════════════════════════════════════════════════════════════════════════
const TimeSinceZero = ({ timestamp }) => {
  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    if (!timestamp) return;
    
    const updateTime = () => {
      const now = new Date();
      const then = new Date(timestamp);
      const diffMs = now - then;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) {
        setTimeAgo('Just now');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours}h ago`);
      } else {
        setTimeAgo(`${Math.floor(diffHours / 24)}d ago`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);
  
  if (!timestamp) return null;
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
      <Clock className="w-3.5 h-3.5" />
      <span>Achieved {timeAgo}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const QuickActions = ({ onCompose, onViewSent }) => {
  const actions = [
    { icon: Send, label: 'Compose', onClick: onCompose, primary: true },
    { icon: MessageSquare, label: 'View Sent', onClick: onViewSent },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex justify-center gap-3 mt-6"
    >
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all duration-200
            ${action.primary 
              ? 'bg-brand-600 text-white hover:bg-brand-500' 
              : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
            }
          `}
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </button>
      ))}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGES
// ═══════════════════════════════════════════════════════════════════════════════
const AchievementBadges = ({ achievements = [] }) => {
  if (achievements.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="mt-6 pt-6 border-t border-white/[0.06]"
    >
      <div className="text-xs text-text-tertiary mb-3">Recent achievements</div>
      <div className="flex justify-center gap-2">
        {achievements.slice(0, 3).map((achievement, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 text-xs text-text-secondary"
          >
            <Star className="w-3.5 h-3.5 text-warning-500" />
            <span>{achievement}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyInbox({
  // State
  streak = 0,
  bestStreak = 0,
  achievedAt = null,
  achievements = [],
  
  // Actions
  onCompose,
  onViewSent,
  onViewArchive,
  
  // Options
  showConfetti = true,
  showStreak = true,
  showAchievements = true,
  variant = 'celebratory', // 'minimal' | 'illustrated' | 'celebratory'
  className = '',
}) {
  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  
  // Trigger confetti on mount
  useEffect(() => {
    if (showConfetti && variant === 'celebratory') {
      const timer = setTimeout(() => setConfettiTriggered(true), 300);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, variant]);
  
  // Record achievement for momentum
  useEffect(() => {
    if (recordActivity) {
      recordActivity('INBOX_ZERO', { streak });
    }
  }, []);
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-success-500" />
        </div>
        <p className="text-sm font-medium text-text-primary">Inbox Zero!</p>
        <p className="text-xs text-text-tertiary mt-1">All caught up</p>
      </div>
    );
  }
  
  // Illustrated variant (no confetti)
  if (variant === 'illustrated') {
    return (
      <div className={className}>
        <EmptyState
          illustration={InboxZeroIllustration}
          title="Inbox Zero! 🎉"
          description="You've processed everything. Take a moment to appreciate this achievement."
          primaryAction={onCompose}
          primaryActionLabel="Compose New"
          primaryActionIcon={Send}
          variant="illustrated"
          accentColor="success"
        >
          {showStreak && streak > 0 && (
            <div className="flex justify-center mt-4">
              <InboxZeroStreak streak={streak} bestStreak={bestStreak} />
            </div>
          )}
        </EmptyState>
      </div>
    );
  }
  
  // Full celebratory variant
  return (
    <div className={className}>
      {/* Confetti burst */}
      {confettiTriggered && <ConfettiBurst trigger={confettiTriggered} />}
      
      <EmptyState
        illustration={InboxZeroIllustration}
        title="Inbox Zero achieved! 🎉"
        description="You've conquered the inbox. Every message handled, every thread resolved. You're officially a productivity legend."
        variant="celebratory"
        size="large"
        accentColor={isFireMode ? 'energy' : 'success'}
        showConfetti={false} // We handle our own confetti
      >
        {/* Time since achievement */}
        {achievedAt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-4"
          >
            <TimeSinceZero timestamp={achievedAt} />
          </motion.div>
        )}
        
        {/* Streak tracker */}
        {showStreak && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <InboxZeroStreak streak={streak} bestStreak={bestStreak} />
          </motion.div>
        )}
        
        {/* Quick actions */}
        <QuickActions onCompose={onCompose} onViewSent={onViewSent} />
        
        {/* Achievement badges */}
        {showAchievements && achievements.length > 0 && (
          <AchievementBadges achievements={achievements} />
        )}
      </EmptyState>
      
      {/* Inline styles */}
      <style>{`
        .shadow-glow-warning {
          box-shadow: 0 0 20px rgb(245 158 11 / 0.3);
        }
        
        .shadow-glow-success {
          box-shadow: 0 0 20px rgb(16 185 129 / 0.3);
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for sidebars, small panels)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyInboxCompact({ streak = 0, onCompose, className = '' }) {
  return (
    <div className={`p-4 rounded-xl bg-success-500/5 border border-success-500/20 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary flex items-center gap-2">
            Inbox Zero! 
            <span className="text-base">🎉</span>
          </div>
          {streak > 0 && (
            <div className="text-xs text-text-tertiary flex items-center gap-1">
              <Flame className="w-3 h-3 text-warning-500" />
              {streak} day streak
            </div>
          )}
        </div>
        {onCompose && (
          <button
            onClick={onCompose}
            className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
          >
            <Send className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION VARIANT (for toast/notification)
// ═══════════════════════════════════════════════════════════════════════════════
export function InboxZeroNotification({ streak = 0, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success-500/10 border border-success-500/20 shadow-lg"
    >
      <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-success-500" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">Inbox Zero achieved!</div>
        {streak > 1 && (
          <div className="text-xs text-text-tertiary">{streak} day streak 🔥</div>
        )}
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

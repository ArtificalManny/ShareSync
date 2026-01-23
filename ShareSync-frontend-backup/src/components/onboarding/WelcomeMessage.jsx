// src/components/onboarding/WelcomeMessage.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME MESSAGE - Personalized Greeting
// ═══════════════════════════════════════════════════════════════════════════════
// "Welcome back, Manny. You're on a 7-day streak."
//
// This message fades in during the entrance sequence (400ms - 1000ms).
// It's personalized, acknowledges the user's progress, and sets the tone.
//
// Message variants based on context:
// - First time: "Welcome to ShareSync. Let's build something."
// - Returning (streak): "Welcome back, {name}. You're on a {n}-day streak."
// - Returning (no streak): "Good to see you, {name}."
// - Morning: "Good morning, {name}. Ready to ship?"
// - Late night: "Burning the midnight oil, {name}?"
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Sun, Moon, Coffee, Rocket } from 'lucide-react';

export default function WelcomeMessage({
  isVisible = true,
  userName = 'there',
  streakDays = 0,
  isFirstTime = false,
  shipsToday = 0,
  onDismiss,
  className = '',
}) {
  // Determine time of day for contextual greeting
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, []);

  // Build the message and icon based on context
  const { message, subMessage, Icon, iconColor } = useMemo(() => {
    // First time user
    if (isFirstTime) {
      return {
        message: `Welcome to ShareSync, ${userName}`,
        subMessage: "Let's build something great together.",
        Icon: Rocket,
        iconColor: 'text-brand-400',
      };
    }

    // Has active streak (3+ days)
    if (streakDays >= 3) {
      const streakMessage = streakDays >= 7 
        ? `🔥 ${streakDays}-day streak!`
        : `${streakDays}-day streak`;
      
      return {
        message: `Welcome back, ${userName}`,
        subMessage: streakMessage,
        Icon: Flame,
        iconColor: streakDays >= 7 ? 'text-warning-400' : 'text-brand-400',
      };
    }

    // Already shipped today
    if (shipsToday > 0) {
      return {
        message: `Back for more, ${userName}?`,
        subMessage: `${shipsToday} ship${shipsToday > 1 ? 's' : ''} today already. Keep going.`,
        Icon: Sparkles,
        iconColor: 'text-success-400',
      };
    }

    // Time-based greetings
    if (timeOfDay === 'morning') {
      return {
        message: `Good morning, ${userName}`,
        subMessage: "Ready to ship?",
        Icon: Sun,
        iconColor: 'text-warning-400',
      };
    }

    if (timeOfDay === 'night') {
      return {
        message: `Burning the midnight oil, ${userName}?`,
        subMessage: "Let's make it count.",
        Icon: Moon,
        iconColor: 'text-brand-300',
      };
    }

    if (timeOfDay === 'afternoon') {
      return {
        message: `Good afternoon, ${userName}`,
        subMessage: "What's the focus?",
        Icon: Coffee,
        iconColor: 'text-amber-400',
      };
    }

    // Default evening
    return {
      message: `Good evening, ${userName}`,
      subMessage: "Let's wrap up strong.",
      Icon: Sparkles,
      iconColor: 'text-brand-400',
    };
  }, [userName, streakDays, isFirstTime, shipsToday, timeOfDay]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`welcome-message ${className}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1],
          }}
          onClick={onDismiss}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </motion.div>

            {/* Text */}
            <div className="flex flex-col">
              <motion.span
                className="text-sm font-medium text-text-primary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {message}
              </motion.span>
              
              {subMessage && (
                <motion.span
                  className="text-xs text-text-secondary"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  {subMessage}
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact version for navbar
export function WelcomeMessageCompact({
  isVisible,
  userName,
  streakDays = 0,
}) {
  if (!isVisible) return null;

  const hasStreak = streakDays >= 3;

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-1 border border-white/[0.06]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {hasStreak && (
        <Flame className={`w-3.5 h-3.5 ${streakDays >= 7 ? 'text-warning-400' : 'text-brand-400'}`} />
      )}
      <span className="text-xs text-text-secondary">
        Welcome back, <span className="text-text-primary font-medium">{userName}</span>
        {hasStreak && (
          <span className="text-brand-400 ml-1">
            · {streakDays}d streak
          </span>
        )}
      </span>
    </motion.div>
  );
}

// Toast-style welcome (alternative placement)
export function WelcomeToast({
  isVisible,
  userName,
  streakDays = 0,
  onDismiss,
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="
            fixed bottom-4 left-1/2 z-50
            px-4 py-3 rounded-xl
            bg-surface-1/95 backdrop-blur-xl
            border border-white/[0.08]
            shadow-xl
          "
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ 
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
          onClick={onDismiss}
        >
          <WelcomeMessage
            isVisible={true}
            userName={userName}
            streakDays={streakDays}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

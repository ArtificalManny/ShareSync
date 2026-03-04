// src/sounds/AchievementSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Achievement Sounds
// ⭐ PHASE 3: The Auditory Trigger (880Hz Dopamine Ding for 'Ship' events)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Rewarding audio feedback for accomplishments.
// These sounds trigger dopamine and reinforce productive behavior.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo, useRef } from 'react';
import { useSounds, useAchievementSounds as useAchievementSoundsBase } from '../hooks/useSounds';
import { useSoundContext } from '../contexts/SoundContext';

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SOUND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_SOUNDS = {
  // Task completion
  task_complete: {
    id: 'task_complete',
    description: 'Single task completed',
    intensity: 'low',
    useCase: 'Checking off a task, completing a todo',
  },
  
  // Shipping
  ship: {
    id: 'ship',
    description: 'Project/feature shipped',
    intensity: 'medium',
    useCase: 'Marking a project as shipped, completing a sprint',
  },
  
  ship_epic: {
    id: 'ship_epic',
    description: 'Major milestone shipped',
    intensity: 'high',
    useCase: 'Completing a major project, shipping to production',
  },
  
  // Leveling
  level_up: {
    id: 'level_up',
    description: 'Level/rank increased',
    intensity: 'high',
    useCase: 'Momentum level increase, league promotion',
  },
  
  // Streaks
  streak_milestone: {
    id: 'streak_milestone',
    description: 'Streak milestone reached',
    intensity: 'high',
    useCase: '3-day, 7-day, 14-day, 30-day streaks',
  },
  
  // XP
  xp_gain: {
    id: 'xp_gain',
    description: 'Experience points gained',
    intensity: 'low',
    useCase: 'Earning XP from any action',
  },
  
  // Achievement unlock
  achievement_unlock: {
    id: 'achievement_unlock',
    description: 'New achievement unlocked',
    intensity: 'high',
    useCase: 'Unlocking badges, trophies, special rewards',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK MILESTONE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

export const STREAK_MILESTONES = {
  3: { name: 'Getting Started', sound: 'streak_milestone', intensity: 0.7 },
  7: { name: 'Week Warrior', sound: 'streak_milestone', intensity: 0.85 },
  14: { name: 'Fortnight Force', sound: 'streak_milestone', intensity: 1.0 },
  30: { name: 'Monthly Master', sound: 'streak_milestone', intensity: 1.0 },
  60: { name: 'Two Month Titan', sound: 'streak_milestone', intensity: 1.0 },
  90: { name: 'Quarter Champion', sound: 'streak_milestone', intensity: 1.0 },
  180: { name: 'Half Year Hero', sound: 'streak_milestone', intensity: 1.0 },
  365: { name: 'Year Legend', sound: 'streak_milestone', intensity: 1.0 },
};

/**
 * Check if a streak count is a milestone
 */
export function isStreakMilestone(days) {
  return STREAK_MILESTONES.hasOwnProperty(days);
}

/**
 * Get milestone info for a streak count
 */
export function getStreakMilestone(days) {
  return STREAK_MILESTONES[days] || null;
}

/**
 * Get the next milestone for a streak count
 */
export function getNextStreakMilestone(days) {
  const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
  return milestones.find(m => m > days) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP SOUND CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const XP_SOUND_CONFIG = {
  // Minimum XP to trigger sound
  minXP: 5,
  
  // XP thresholds for sound intensity
  thresholds: {
    small: { min: 5, max: 25, playCount: 1 },
    medium: { min: 26, max: 75, playCount: 2 },
    large: { min: 76, max: 150, playCount: 3 },
    massive: { min: 151, max: Infinity, playCount: 4 },
  },
  
  // Cooldown between XP sounds (ms)
  cooldown: 500,
};

/**
 * Get XP sound configuration based on amount
 */
export function getXPSoundConfig(xpAmount) {
  if (xpAmount < XP_SOUND_CONFIG.minXP) return null;
  
  for (const [size, config] of Object.entries(XP_SOUND_CONFIG.thresholds)) {
    if (xpAmount >= config.min && xpAmount <= config.max) {
      return { size, ...config };
    }
  }
  
  return XP_SOUND_CONFIG.thresholds.massive;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIP SOUND CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const SHIP_SOUND_CONFIG = {
  // Normal ship
  normal: {
    sound: 'ship',
    description: 'Standard task/project ship',
  },
  
  // Epic ship (major milestone)
  epic: {
    sound: 'ship_epic',
    description: 'Major milestone, production deploy',
  },
  
  // Criteria for epic ship
  epicCriteria: {
    taskCount: 10, // 10+ tasks in project
    duration: 7,   // 7+ days working on it
    isProduction: true, // Marked as production
  },
};

/**
 * Determine if a ship should be epic based on criteria
 */
export function shouldPlayEpicShip(shipData) {
  const { taskCount = 0, durationDays = 0, isProduction = false } = shipData;
  
  // Any of these criteria makes it epic
  return (
    taskCount >= SHIP_SOUND_CONFIG.epicCriteria.taskCount ||
    durationDays >= SHIP_SOUND_CONFIG.epicCriteria.duration ||
    isProduction
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for ship sounds with auto epic detection
 * ⭐ PHASE 3: Engineered auditory trigger (880Hz, 150ms decay)
 */
export function useShipSound() {
  const { playShip } = useAchievementSoundsBase();
  
  const playShipSound = useCallback((shipData = {}) => {
    const isEpic = shouldPlayEpicShip(shipData);
    
    // Fallback to base system if needed, but we intercept it here to inject the raw Web Audio API signal
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      // 880Hz represents the A5 note - recognized universally as a bright, successful pitch
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      
      // Punchy attack, rapid decay (150ms total)
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // If Web Audio API is blocked, fall back to base system
      playShip(isEpic);
    }

    return isEpic;
  }, [playShip]);
  
  return { playShipSound };
}

/**
 * Hook for XP gain sounds with intensity scaling
 * * @example
 * const { playXP } = useXPSound();
 * playXP(50); // Plays medium intensity XP sound
 */
export function useXPSound() {
  const { playXPGain } = useAchievementSoundsBase();
  const lastPlayTime = useRef(0);
  
  const playXP = useCallback((xpAmount) => {
    const now = Date.now();
    if (now - lastPlayTime.current < XP_SOUND_CONFIG.cooldown) {
      return; // Cooldown active
    }
    
    const config = getXPSoundConfig(xpAmount);
    if (!config) return;
    
    lastPlayTime.current = now;
    
    // Play sound(s) based on intensity
    for (let i = 0; i < config.playCount; i++) {
      setTimeout(() => playXPGain(), i * 100);
    }
  }, [playXPGain]);
  
  return { playXP };
}

/**
 * Hook for streak milestone sounds
 * * @example
 * const { checkAndPlayStreak } = useStreakSound();
 * const wasMilestone = checkAndPlayStreak(7); // Returns true, plays milestone
 */
export function useStreakSound() {
  const { playStreakMilestone } = useAchievementSoundsBase();
  
  const checkAndPlayStreak = useCallback((days) => {
    const milestone = getStreakMilestone(days);
    if (milestone) {
      playStreakMilestone();
      return true;
    }
    return false;
  }, [playStreakMilestone]);
  
  const getNextMilestone = useCallback((days) => {
    const nextDays = getNextStreakMilestone(days);
    if (!nextDays) return null;
    return {
      days: nextDays,
      daysUntil: nextDays - days,
      ...STREAK_MILESTONES[nextDays],
    };
  }, []);
  
  return { 
    checkAndPlayStreak, 
    getNextMilestone,
    isStreakMilestone,
  };
}

/**
 * Hook for level up sounds
 * * @example
 * const { playLevelUp } = useLevelUpSound();
 * playLevelUp(3); // Plays level up for reaching level 3
 */
export function useLevelUpSound() {
  const { playLevelUp } = useAchievementSoundsBase();
  
  const playLevelUpSound = useCallback((newLevel) => {
    playLevelUp();
    // Could add additional effects based on level here
    return newLevel;
  }, [playLevelUp]);
  
  return { playLevelUp: playLevelUpSound };
}

/**
 * Hook for achievement unlock sounds
 * * @example
 * const { playUnlock } = useAchievementUnlockSound();
 * playUnlock({ name: 'First Ship', rarity: 'epic' });
 */
export function useAchievementUnlockSound() {
  const { playAchievementUnlock } = useAchievementSoundsBase();
  
  const playUnlock = useCallback((achievement) => {
    playAchievementUnlock();
    // Could vary sound based on rarity in future
    return achievement;
  }, [playAchievementUnlock]);
  
  return { playUnlock };
}

/**
 * Combined hook for all achievement sounds
 */
export function useAchievementSounds() {
  const base = useAchievementSoundsBase();
  const { playShipSound } = useShipSound();
  const { playXP } = useXPSound();
  const { checkAndPlayStreak, getNextMilestone } = useStreakSound();
  const { playLevelUp } = useLevelUpSound();
  const { playUnlock } = useAchievementUnlockSound();
  
  return useMemo(() => ({
    // Base sounds
    ...base,
    
    // Enhanced sounds
    playShipSound,
    playXP,
    checkAndPlayStreak,
    getNextMilestone,
    playLevelUp,
    playUnlock,
    
    // Utilities
    isStreakMilestone,
    shouldPlayEpicShip,
  }), [base, playShipSound, playXP, checkAndPlayStreak, getNextMilestone, playLevelUp, playUnlock]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SOUND SEQUENCES
// Pre-composed sequences for specific scenarios
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Play a celebration sequence for major achievements
 */
export function useCelebrationSequence() {
  const { playLevelUp, playStreakMilestone, playAchievementUnlock } = useAchievementSoundsBase();
  
  const playMinorCelebration = useCallback(() => {
    // Just the achievement sound
    playAchievementUnlock();
  }, [playAchievementUnlock]);
  
  const playMajorCelebration = useCallback(() => {
    // Level up followed by achievement
    playLevelUp();
    setTimeout(() => playAchievementUnlock(), 600);
  }, [playLevelUp, playAchievementUnlock]);
  
  const playEpicCelebration = useCallback(() => {
    // Full sequence: level up -> streak -> achievement
    playLevelUp();
    setTimeout(() => playStreakMilestone(), 500);
    setTimeout(() => playAchievementUnlock(), 1000);
  }, [playLevelUp, playStreakMilestone, playAchievementUnlock]);
  
  return {
    playMinorCelebration,
    playMajorCelebration,
    playEpicCelebration,
  };
}

export default ACHIEVEMENT_SOUNDS;

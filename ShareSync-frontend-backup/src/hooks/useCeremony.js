// src/hooks/useCeremony.js
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Completions Are Celebrated
// Variable rewards, celebrations, and streak protection
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION TIERS
// ═══════════════════════════════════════════════════════════════════════════════

export const CELEBRATION_TIERS = {
  MICRO: 'micro',           // Subtle checkmark animation
  STANDARD: 'standard',     // Confetti burst + sound
  BLOCKING: 'blocking',     // "You unblocked N people!"
  SPRINT_GOAL: 'sprint_goal', // Screen takeover
  PROJECT_SHIP: 'project_ship', // Full ceremony
  LEGENDARY: 'legendary',   // Rare (1%) special celebration
};

export const TIER_CONFIG = {
  [CELEBRATION_TIERS.MICRO]: {
    name: 'Quick Win',
    baseXP: 10,
    animation: 'checkmark',
    sound: null,
    confetti: false,
    duration: 500,
    teamNotify: false,
  },
  [CELEBRATION_TIERS.STANDARD]: {
    name: 'Task Complete',
    baseXP: 25,
    animation: 'confetti',
    sound: 'complete',
    confetti: true,
    duration: 1500,
    teamNotify: false,
  },
  [CELEBRATION_TIERS.BLOCKING]: {
    name: 'Team Unlocker',
    baseXP: 50,
    animation: 'unlock',
    sound: 'unlock',
    confetti: true,
    duration: 2500,
    teamNotify: true,
  },
  [CELEBRATION_TIERS.SPRINT_GOAL]: {
    name: 'Sprint Goal',
    baseXP: 100,
    animation: 'takeover',
    sound: 'achievement',
    confetti: true,
    duration: 4000,
    teamNotify: true,
  },
  [CELEBRATION_TIERS.PROJECT_SHIP]: {
    name: 'Project Ship',
    baseXP: 250,
    animation: 'ceremony',
    sound: 'ship',
    confetti: true,
    duration: 6000,
    teamNotify: true,
  },
  [CELEBRATION_TIERS.LEGENDARY]: {
    name: 'Legendary Ship',
    baseXP: 500,
    animation: 'legendary',
    sound: 'legendary',
    confetti: true,
    duration: 8000,
    teamNotify: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const BADGE_TYPES = {
  FIRST_SHIP: { id: 'first_ship', name: 'First Ship', icon: '🚀', description: 'Completed your first task' },
  STREAK_3: { id: 'streak_3', name: '3-Day Streak', icon: '🔥', description: '3 days of shipping' },
  STREAK_7: { id: 'streak_7', name: 'Week Warrior', icon: '💪', description: '7 days of shipping' },
  STREAK_30: { id: 'streak_30', name: 'Monthly Master', icon: '👑', description: '30 days of shipping' },
  UNLOCKER: { id: 'unlocker', name: 'Team Unlocker', icon: '🔓', description: 'Unblocked 10 teammates' },
  SPEEDSTER: { id: 'speedster', name: 'Speedster', icon: '⚡', description: '5 tasks in one day' },
  PERFECTIONIST: { id: 'perfectionist', name: 'Perfectionist', icon: '✨', description: '10 tasks with no revisions' },
  LEGENDARY: { id: 'legendary', name: 'Legendary', icon: '🌟', description: 'Achieved a legendary ship' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Shipped before 7am' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Shipped after midnight' },
  SPRINT_HERO: { id: 'sprint_hero', name: 'Sprint Hero', icon: '🏆', description: 'Completed sprint goal' },
  PROJECT_LAUNCHER: { id: 'project_launcher', name: 'Project Launcher', icon: '🎯', description: 'Shipped a project' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VARIABLE REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

const VARIABLE_REWARD_CONFIG = {
  bonusXPChance: 0.15,        // 15% chance of bonus XP
  bonusXPMultiplier: [1.5, 2, 2.5, 3], // Random multiplier options
  legendaryChance: 0.01,      // 1% chance of legendary designation
  luckyStreakChance: 0.05,    // 5% chance of streak multiplier
  luckyStreakMultiplier: [1.25, 1.5, 2],
  mysteryBadgeChance: 0.02,   // 2% chance of mystery badge
};

function rollVariableRewards() {
  const rewards = {
    bonusXP: false,
    bonusMultiplier: 1,
    isLegendary: false,
    luckyStreak: false,
    streakMultiplier: 1,
    mysteryBadge: null,
  };
  
  // Roll for bonus XP
  if (Math.random() < VARIABLE_REWARD_CONFIG.bonusXPChance) {
    rewards.bonusXP = true;
    rewards.bonusMultiplier = VARIABLE_REWARD_CONFIG.bonusXPMultiplier[
      Math.floor(Math.random() * VARIABLE_REWARD_CONFIG.bonusXPMultiplier.length)
    ];
  }
  
  // Roll for legendary
  if (Math.random() < VARIABLE_REWARD_CONFIG.legendaryChance) {
    rewards.isLegendary = true;
  }
  
  // Roll for lucky streak
  if (Math.random() < VARIABLE_REWARD_CONFIG.luckyStreakChance) {
    rewards.luckyStreak = true;
    rewards.streakMultiplier = VARIABLE_REWARD_CONFIG.luckyStreakMultiplier[
      Math.floor(Math.random() * VARIABLE_REWARD_CONFIG.luckyStreakMultiplier.length)
    ];
  }
  
  return rewards;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK WINS
// ═══════════════════════════════════════════════════════════════════════════════

export const QUICK_WIN_TYPES = {
  REVIEW_PR: { id: 'review_pr', name: 'Review a PR', duration: '5 min', xp: 15, icon: '👀' },
  UPDATE_STATUS: { id: 'update_status', name: 'Update task status', duration: '1 min', xp: 5, icon: '📝' },
  WRITE_STANDUP: { id: 'write_standup', name: 'Write standup', duration: '2 min', xp: 10, icon: '✍️' },
  ADD_COMMENT: { id: 'add_comment', name: 'Add helpful comment', duration: '2 min', xp: 10, icon: '💬' },
  LINK_TASK: { id: 'link_task', name: 'Link related tasks', duration: '1 min', xp: 5, icon: '🔗' },
  ADD_ESTIMATE: { id: 'add_estimate', name: 'Add time estimate', duration: '1 min', xp: 5, icon: '⏱️' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  STREAK: 'ss.ceremony.streak',
  STREAK_FREEZES: 'ss.ceremony.freezes',
  HALL_OF_FAME: 'ss.ceremony.fame',
  BADGES: 'ss.ceremony.badges',
  CLAPS: 'ss.ceremony.claps',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECTS
// ═══════════════════════════════════════════════════════════════════════════════

const SOUNDS = {
  complete: '/sounds/complete.mp3',
  unlock: '/sounds/unlock.mp3',
  achievement: '/sounds/achievement.mp3',
  ship: '/sounds/ship.mp3',
  legendary: '/sounds/legendary.mp3',
  countdown: '/sounds/countdown.mp3',
  clap: '/sounds/clap.mp3',
};

function playSound(soundKey, volume = 0.5) {
  if (typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(SOUNDS[soundKey]);
    audio.volume = volume;
    audio.play().catch(() => {}); // Ignore autoplay errors
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useCeremony - Celebration and reward system
 */
export function useCeremony({
  userId,
  soundEnabled = true,
  onXPGain,
  onBadgeUnlock,
  onTeamNotify,
} = {}) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [activeCelebration, setActiveCelebration] = useState(null);
  const [shipCountdown, setShipCountdown] = useState(null);
  const [clapQueue, setClapQueue] = useState([]);
  
  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.STREAK}.${userId}`);
      return saved ? JSON.parse(saved) : { count: 0, lastShipDate: null };
    } catch {
      return { count: 0, lastShipDate: null };
    }
  });
  
  const [streakFreezes, setStreakFreezes] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.STREAK_FREEZES}.${userId}`);
      return saved ? JSON.parse(saved) : 3;
    } catch {
      return 3;
    }
  });
  
  const [hallOfFame, setHallOfFame] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.HALL_OF_FAME}.${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [earnedBadges, setEarnedBadges] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.BADGES}.${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const celebrationTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PERSIST STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`${LS_KEYS.STREAK}.${userId}`, JSON.stringify(streak));
      localStorage.setItem(`${LS_KEYS.STREAK_FREEZES}.${userId}`, JSON.stringify(streakFreezes));
      localStorage.setItem(`${LS_KEYS.HALL_OF_FAME}.${userId}`, JSON.stringify(hallOfFame));
      localStorage.setItem(`${LS_KEYS.BADGES}.${userId}`, JSON.stringify(earnedBadges));
    } catch {}
  }, [userId, streak, streakFreezes, hallOfFame, earnedBadges]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STREAK CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const streakStatus = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const lastShip = streak.lastShipDate ? new Date(streak.lastShipDate) : null;
    const lastShipDay = lastShip?.toDateString();
    
    // Already shipped today
    if (lastShipDay === today) {
      return {
        isAtRisk: false,
        shippedToday: true,
        hoursRemaining: 24,
        status: 'safe',
      };
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastShipDay === yesterday.toDateString()) {
      // Calculate hours remaining until midnight
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const hoursRemaining = Math.floor((midnight - now) / (1000 * 60 * 60));
      
      return {
        isAtRisk: hoursRemaining <= 4,
        shippedToday: false,
        hoursRemaining,
        status: hoursRemaining <= 4 ? 'at_risk' : 'pending',
      };
    }
    
    // Streak broken
    return {
      isAtRisk: false,
      shippedToday: false,
      hoursRemaining: 0,
      status: 'broken',
    };
  }, [streak]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINE CELEBRATION TIER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const determineTier = useCallback((task, context = {}) => {
    const { unblockedCount = 0, isSprintGoal = false, isProjectShip = false } = context;
    
    // Check for legendary (1% chance)
    const variableRewards = rollVariableRewards();
    if (variableRewards.isLegendary) {
      return { tier: CELEBRATION_TIERS.LEGENDARY, variableRewards };
    }
    
    // Project ship
    if (isProjectShip) {
      return { tier: CELEBRATION_TIERS.PROJECT_SHIP, variableRewards };
    }
    
    // Sprint goal
    if (isSprintGoal) {
      return { tier: CELEBRATION_TIERS.SPRINT_GOAL, variableRewards };
    }
    
    // Blocking task
    if (unblockedCount > 0) {
      return { tier: CELEBRATION_TIERS.BLOCKING, variableRewards };
    }
    
    // Check task size/priority
    const isQuickTask = task.estimatedHours && task.estimatedHours < 0.5;
    if (isQuickTask || task.priority === 'low') {
      return { tier: CELEBRATION_TIERS.MICRO, variableRewards };
    }
    
    // Standard
    return { tier: CELEBRATION_TIERS.STANDARD, variableRewards };
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRIGGER CELEBRATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const celebrate = useCallback((task, context = {}) => {
    // Determine tier and variable rewards
    const { tier, variableRewards } = determineTier(task, context);
    const config = TIER_CONFIG[tier];
    
    // Calculate XP
    let xp = config.baseXP;
    if (variableRewards.bonusXP) {
      xp = Math.floor(xp * variableRewards.bonusMultiplier);
    }
    if (variableRewards.luckyStreak) {
      xp = Math.floor(xp * variableRewards.streakMultiplier);
    }
    
    // Play sound
    if (soundEnabled && config.sound) {
      playSound(config.sound);
    }
    
    // Create celebration object
    const celebration = {
      id: Date.now().toString(),
      tier,
      config,
      task,
      xp,
      variableRewards,
      unblockedCount: context.unblockedCount || 0,
      timestamp: Date.now(),
    };
    
    // Set active celebration
    setActiveCelebration(celebration);
    
    // Clear after duration
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
    }
    celebrationTimeoutRef.current = setTimeout(() => {
      setActiveCelebration(null);
    }, config.duration);
    
    // Update streak
    const now = new Date();
    const today = now.toDateString();
    const lastShipDay = streak.lastShipDate 
      ? new Date(streak.lastShipDate).toDateString() 
      : null;
    
    if (lastShipDay !== today) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const newCount = lastShipDay === yesterday.toDateString()
        ? streak.count + 1
        : 1;
      
      setStreak({
        count: newCount,
        lastShipDate: now.toISOString(),
      });
      
      // Check for streak badges
      checkStreakBadges(newCount);
    }
    
    // Add to hall of fame for major celebrations
    if (tier === CELEBRATION_TIERS.PROJECT_SHIP || 
        tier === CELEBRATION_TIERS.SPRINT_GOAL ||
        tier === CELEBRATION_TIERS.LEGENDARY) {
      addToHallOfFame({
        id: celebration.id,
        task: { id: task.id, title: task.title },
        tier,
        xp,
        isLegendary: variableRewards.isLegendary,
        timestamp: Date.now(),
      });
    }
    
    // Notify callbacks
    onXPGain?.(xp, celebration);
    
    // Team notify
    if (config.teamNotify) {
      onTeamNotify?.(celebration);
    }
    
    return celebration;
  }, [determineTier, soundEnabled, streak, onXPGain, onTeamNotify]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SHIP CEREMONY (WITH COUNTDOWN)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const startShipCountdown = useCallback((task, context = {}) => {
    return new Promise((resolve) => {
      let count = 3;
      setShipCountdown({ count, task });
      
      if (soundEnabled) {
        playSound('countdown', 0.3);
      }
      
      countdownIntervalRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setShipCountdown({ count, task });
          if (soundEnabled) {
            playSound('countdown', 0.3);
          }
        } else {
          clearInterval(countdownIntervalRef.current);
          setShipCountdown(null);
          
          // Trigger celebration
          const celebration = celebrate(task, context);
          resolve(celebration);
        }
      }, 1000);
    });
  }, [celebrate, soundEnabled]);
  
  const cancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setShipCountdown(null);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM CLAPS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const sendClap = useCallback((celebrationId, fromUser) => {
    const clap = {
      id: Date.now().toString(),
      celebrationId,
      fromUser,
      timestamp: Date.now(),
    };
    
    setClapQueue(prev => [...prev, clap]);
    
    if (soundEnabled) {
      playSound('clap', 0.2);
    }
    
    // Auto-remove after animation
    setTimeout(() => {
      setClapQueue(prev => prev.filter(c => c.id !== clap.id));
    }, 2000);
    
    return clap;
  }, [soundEnabled]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STREAK PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const useStreakFreeze = useCallback(() => {
    if (streakFreezes <= 0) return false;
    
    setStreakFreezes(prev => prev - 1);
    setStreak(prev => ({
      ...prev,
      lastShipDate: new Date().toISOString(),
    }));
    
    return true;
  }, [streakFreezes]);
  
  const getQuickWins = useCallback((availableTasks = []) => {
    // Get tasks that can be quickly completed
    const quickTasks = availableTasks
      .filter(t => t.estimatedHours && t.estimatedHours <= 0.5)
      .slice(0, 3)
      .map(t => ({
        type: 'task',
        task: t,
        duration: `${Math.round(t.estimatedHours * 60)} min`,
        xp: TIER_CONFIG[CELEBRATION_TIERS.MICRO].baseXP,
      }));
    
    // Add static quick wins
    const staticWins = Object.values(QUICK_WIN_TYPES).slice(0, 3 - quickTasks.length);
    
    return [...quickTasks, ...staticWins];
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BADGE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const checkStreakBadges = useCallback((newCount) => {
    const badgesToCheck = [
      { count: 3, badge: BADGE_TYPES.STREAK_3 },
      { count: 7, badge: BADGE_TYPES.STREAK_7 },
      { count: 30, badge: BADGE_TYPES.STREAK_30 },
    ];
    
    badgesToCheck.forEach(({ count, badge }) => {
      if (newCount >= count && !earnedBadges.includes(badge.id)) {
        unlockBadge(badge);
      }
    });
  }, [earnedBadges]);
  
  const unlockBadge = useCallback((badge) => {
    if (earnedBadges.includes(badge.id)) return;
    
    setEarnedBadges(prev => [...prev, badge.id]);
    onBadgeUnlock?.(badge);
    
    return badge;
  }, [earnedBadges, onBadgeUnlock]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HALL OF FAME
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addToHallOfFame = useCallback((entry) => {
    setHallOfFame(prev => [entry, ...prev].slice(0, 50)); // Keep last 50
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // Active state
    activeCelebration,
    shipCountdown,
    clapQueue,
    
    // Streak
    streak,
    streakStatus,
    streakFreezes,
    
    // Badges & Fame
    earnedBadges,
    hallOfFame,
    allBadges: BADGE_TYPES,
    
    // Actions
    celebrate,
    startShipCountdown,
    cancelCountdown,
    sendClap,
    useStreakFreeze,
    getQuickWins,
    unlockBadge,
    
    // Helpers
    determineTier,
    
    // Constants
    CELEBRATION_TIERS,
    TIER_CONFIG,
    BADGE_TYPES,
    QUICK_WIN_TYPES,
  };
}

export default useCeremony;

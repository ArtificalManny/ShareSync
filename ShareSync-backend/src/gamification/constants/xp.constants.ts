// src/gamification/constants/xp.constants.ts

export const BASE_XP = {
  TASK_LOW: 10,
  TASK_MEDIUM: 25,
  TASK_HIGH: 40,
  TASK_CRITICAL: 75,

  TASK_BLOCKING: 50,
  SUBTASK: 5,
  BUG_FIX: 35,

  SPRINT_GOAL: 200,
  MILESTONE: 300,
  PROJECT_SHIP: 500,

  LEGENDARY_SHIP: 1000,
} as const;

export const VARIABLE_REWARDS = {
  BONUS_CHANCE: 0.15,
  LEGENDARY_CHANCE: 0.01,
  MULTIPLIER_CHANCE: 0.08,

  BONUS_MIN_MULTIPLIER: 0.5,
  BONUS_MAX_MULTIPLIER: 2.0,

  MULTIPLIER_MIN: 1.5,
  MULTIPLIER_MAX: 3.0,
} as const;

export const XP_MULTIPLIERS = {
  ON_TIME_COMPLETION: 1.25,
  EARLY_COMPLETION: 1.5,
  OVERDUE_PENALTY: 0.75,

  STREAK_3_DAYS: 1.1,
  STREAK_7_DAYS: 1.25,
  STREAK_14_DAYS: 1.5,
  STREAK_30_DAYS: 2.0,
  STREAK_60_DAYS: 2.5,
  STREAK_100_DAYS: 3.0,

  FIRST_TASK_OF_DAY: 1.1,
  BLOCKING_TASK: 1.3,
  FOCUS_MODE: 1.2,

  TEAM_GOAL_BONUS: 1.5,
} as const;

// IMPORTANT: plain number[] to prevent literal tuple inference
export const LEVEL_THRESHOLDS: number[] = [
  0,
  100,
  250,
  500,
  1000,
  2000,
  3500,
  5500,
  8000,
  11000,
  15000,
  20000,
  26000,
  33000,
  41000,
  50000,
  60000,
  72000,
  85000,
  100000,
];

export const LEVELS = {
  LEVEL_THRESHOLDS,
  MAX_DEFINED_LEVEL: 20,
  XP_PER_LEVEL_AFTER_MAX: 20000,
  TITLES: {
    1: 'Rookie',
    2: 'Apprentice',
    3: 'Contributor',
    4: 'Builder',
    5: 'Achiever',
    6: 'Producer',
    7: 'Expert',
    8: 'Master',
    9: 'Champion',
    10: 'Legend',
    11: 'Elite',
    12: 'Virtuoso',
    13: 'Grandmaster',
    14: 'Immortal',
    15: 'Titan',
    16: 'Mythic',
    17: 'Divine',
    18: 'Cosmic',
    19: 'Transcendent',
    20: 'Eternal',
  } as Record<number, string>,
} as const;

export const STREAKS = {
  TASKS_PER_DAY_FOR_STREAK: 1,
  MAX_FREEZES: 3,
  FREEZE_COST_XP: 500,
  FREEZE_DURATION_HOURS: 24,
  MILESTONES: [3, 7, 14, 21, 30, 60, 90, 100, 180, 365],
  GRACE_PERIOD_HOURS: 4,
} as const;

export const CEREMONY_TIERS = {
  MICRO: { name: 'micro', xpThreshold: 0, duration: 500, animation: 'confetti-small', sound: 'pop' },
  STANDARD: { name: 'standard', xpThreshold: 25, duration: 1500, animation: 'confetti-medium', sound: 'success' },
  BLOCKING: { name: 'blocking', xpThreshold: 50, duration: 2500, animation: 'confetti-large', sound: 'unlock' },
  SPRINT_GOAL: { name: 'sprint_goal', xpThreshold: 200, duration: 4000, animation: 'fireworks', sound: 'fanfare' },
  PROJECT_SHIP: { name: 'project_ship', xpThreshold: 500, duration: 6000, animation: 'epic-celebration', sound: 'epic-fanfare' },
  LEGENDARY: { name: 'legendary', xpThreshold: 1000, duration: 8000, animation: 'legendary-explosion', sound: 'legendary' },
} as const;

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= LEVELS.MAX_DEFINED_LEVEL) return LEVEL_THRESHOLDS[level - 1];
  const extraLevels = level - LEVELS.MAX_DEFINED_LEVEL;
  return LEVEL_THRESHOLDS[LEVELS.MAX_DEFINED_LEVEL - 1] + extraLevels * LEVELS.XP_PER_LEVEL_AFTER_MAX;
}

export function getLevelForXP(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  if (level === LEVELS.MAX_DEFINED_LEVEL) {
    const xpBeyondMax = totalXP - LEVEL_THRESHOLDS[LEVELS.MAX_DEFINED_LEVEL - 1];
    level += Math.floor(xpBeyondMax / LEVELS.XP_PER_LEVEL_AFTER_MAX);
  }
  return level;
}

export function getLevelProgress(totalXP: number) {
  const level = getLevelForXP(totalXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInLevel = totalXP - currentLevelXP;
  const xpForNextLevel = nextLevelXP - currentLevelXP;
  const progress = xpForNextLevel > 0 ? (xpInLevel / xpForNextLevel) * 100 : 100;

  return {
    level,
    progress: Math.min(100, progress),
    xpInLevel,
    xpForNextLevel,
  };
}

export function getLevelTitle(level: number): string {
  if (level <= LEVELS.MAX_DEFINED_LEVEL) return LEVELS.TITLES[level] || 'Unknown';
  return `${LEVELS.TITLES[LEVELS.MAX_DEFINED_LEVEL]}+`;
}

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return XP_MULTIPLIERS.STREAK_100_DAYS;
  if (streakDays >= 60) return XP_MULTIPLIERS.STREAK_60_DAYS;
  if (streakDays >= 30) return XP_MULTIPLIERS.STREAK_30_DAYS;
  if (streakDays >= 14) return XP_MULTIPLIERS.STREAK_14_DAYS;
  if (streakDays >= 7) return XP_MULTIPLIERS.STREAK_7_DAYS;
  if (streakDays >= 3) return XP_MULTIPLIERS.STREAK_3_DAYS;
  return 1.0;
}

export function getCeremonyTier(xpAwarded: number, isLegendary: boolean) {
  if (isLegendary) return CEREMONY_TIERS.LEGENDARY;
  if (xpAwarded >= 500) return CEREMONY_TIERS.PROJECT_SHIP;
  if (xpAwarded >= 200) return CEREMONY_TIERS.SPRINT_GOAL;
  if (xpAwarded >= 50) return CEREMONY_TIERS.BLOCKING;
  if (xpAwarded >= 25) return CEREMONY_TIERS.STANDARD;
  return CEREMONY_TIERS.MICRO;
}

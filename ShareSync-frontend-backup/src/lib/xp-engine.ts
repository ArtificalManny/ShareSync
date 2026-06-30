// ═══════════════════════════════════════════════════════════════════════════
// SHARESYNC XP ENGINE
// Variable reward schedule based on slot machine psychology
// Users never know exactly what they'll get, creating dopamine anticipation
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface XPResult {
  baseXP: number;
  bonusXP: number;
  multiplier: number;
  totalXP: number;
  isLegendary: boolean;
  bonuses: XPBonus[];
  celebrationType: 'standard' | 'streak' | 'legendary' | 'milestone';
}

export interface XPBonus {
  type: string;
  amount: number;
  multiplier?: number;
  message: string;
  icon: string;
}

export interface CompletionContext {
  userId: string;
  consecutiveCompletions: number;  // How many tasks in a row today
  currentStreak: number;           // Daily streak count
  tasksSinceLegendary: number;     // Tasks since last legendary
  tasksCompletedToday: number;     // Total tasks today
  timeOfDay: Date;                 // When task was completed
  taskDifficulty: 'easy' | 'medium' | 'hard' | 'epic';
  isFirstTaskOfDay: boolean;
  isLastTaskBeforeDeadline: boolean;
  lifetimeTasksCompleted?: number; // For milestone tracking
}

export interface StreakStatus {
  isAtRisk: boolean;
  hoursRemaining: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE XP VALUES
// ─────────────────────────────────────────────────────────────────────────────

const BASE_XP: Record<CompletionContext['taskDifficulty'], number> = {
  easy: 15,
  medium: 25,
  hard: 50,
  epic: 100,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN XP CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTaskXP(
  taskDifficulty: CompletionContext['taskDifficulty'],
  context: CompletionContext
): XPResult {
  const baseXP = BASE_XP[taskDifficulty];
  const bonuses: XPBonus[] = [];
  let multiplier = 1;
  let isLegendary = false;
  let celebrationType: XPResult['celebrationType'] = 'standard';

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS 1: HOT STREAK (Consistency Reward)
  // Hidden until triggered - creates surprise delight
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (context.consecutiveCompletions >= 3) {
    bonuses.push({
      type: 'hot_streak',
      amount: 15,
      message: 'Hot Streak!',
      icon: '🔥',
    });
  }

  if (context.consecutiveCompletions >= 5) {
    bonuses.push({
      type: 'on_fire',
      amount: 25,
      message: 'ON FIRE!',
      icon: '🔥',
    });
    celebrationType = 'streak';
  }

  if (context.consecutiveCompletions >= 10) {
    bonuses.push({
      type: 'unstoppable',
      amount: 50,
      message: 'UNSTOPPABLE!',
      icon: '💀',
    });
    multiplier *= 1.5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS 2: TIME-BASED (Create urgency & reward early birds)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const hour = context.timeOfDay.getHours();

  // Early Bird (5 AM - 9 AM)
  if (hour >= 5 && hour < 9) {
    bonuses.push({
      type: 'early_bird',
      amount: 0,
      multiplier: 1.25,
      message: 'Early Bird! 1.25x',
      icon: '🌅',
    });
    multiplier *= 1.25;
  }

  // Night Owl (10 PM - 2 AM)
  if (hour >= 22 || hour < 2) {
    bonuses.push({
      type: 'night_owl',
      amount: 0,
      multiplier: 1.15,
      message: 'Night Owl! 1.15x',
      icon: '🦉',
    });
    multiplier *= 1.15;
  }

  // First Task of Day
  if (context.isFirstTaskOfDay) {
    bonuses.push({
      type: 'first_blood',
      amount: 10,
      message: 'First Blood!',
      icon: '⚡',
    });
  }

  // Clutch - completed right before deadline
  if (context.isLastTaskBeforeDeadline) {
    bonuses.push({
      type: 'clutch',
      amount: 20,
      message: 'Clutch!',
      icon: '⏰',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS 3: DAILY STREAK (Loss Aversion)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (context.currentStreak >= 7) {
    bonuses.push({
      type: 'weekly_warrior',
      amount: 25,
      message: 'Weekly Warrior!',
      icon: '🗡️',
    });
  }

  if (context.currentStreak >= 30) {
    bonuses.push({
      type: 'monthly_master',
      amount: 100,
      multiplier: 1.3,
      message: 'Monthly Master! 1.3x',
      icon: '👑',
    });
    multiplier *= 1.3;
  }

  if (context.currentStreak >= 100) {
    bonuses.push({
      type: 'centurion',
      amount: 500,
      multiplier: 1.5,
      message: 'CENTURION! 1.5x',
      icon: '🏛️',
    });
    multiplier *= 1.5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS 4: LEGENDARY JACKPOT (Variable Reward - The Slot Machine)
  // ~5% base chance, increases by 2% per task without legendary
  // Guaranteed after 20 tasks (pity system)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const legendaryChance = Math.min(
    0.05 + (context.tasksSinceLegendary * 0.02),
    1.0  // Cap at Available (pity system kicks in at 20 tasks)
  );

  if (Math.random() < legendaryChance) {
    isLegendary = true;
    multiplier *= 3;
    celebrationType = 'legendary';
    bonuses.push({
      type: 'legendary',
      amount: 0,
      multiplier: 3,
      message: 'LEGENDARY! 3X XP!!!',
      icon: '🎰',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS 5: COMBO MULTIPLIER (Stacking rewards)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (context.tasksCompletedToday >= 5) {
    multiplier *= 1.1;
  }

  if (context.tasksCompletedToday >= 10) {
    multiplier *= 1.1;
  }

  if (context.tasksCompletedToday >= 20) {
    multiplier *= 1.2;
    bonuses.push({
      type: 'machine',
      amount: 0,
      multiplier: 1.2,
      message: 'Machine Mode! 1.2x',
      icon: '🤖',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MILESTONE BONUSES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const milestones = [10, 25, 50, 100, 250, 500, 1000, 5000, 10000];
  const lifetimeTasks = context.lifetimeTasksCompleted ?? context.tasksCompletedToday;

  if (milestones.includes(lifetimeTasks)) {
    celebrationType = 'milestone';
    
    // Scale bonus based on milestone
    const milestoneBonus = Math.min(lifetimeTasks, 1000);
    
    bonuses.push({
      type: 'milestone',
      amount: milestoneBonus,
      message: `${lifetimeTasks} Tasks Shipped!`,
      icon: '🎯',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE FINAL XP
  // ═══════════════════════════════════════════════════════════════════════════
  
  const bonusXP = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const totalXP = Math.round((baseXP + bonusXP) * multiplier);

  return {
    baseXP,
    bonusXP,
    multiplier: Math.round(multiplier * 100) / 100, // Round to 2 decimal places
    totalXP,
    isLegendary,
    bonuses,
    celebrationType,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export function calculateStreakStatus(lastActiveDate: Date | null): StreakStatus {
  if (!lastActiveDate) {
    return {
      isAtRisk: false,
      hoursRemaining: 24,
      message: 'Start your streak!',
    };
  }

  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  
  // Calculate midnight of today
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
  const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  // Streak resets if no activity for 24 hours
  if (hoursSinceActive >= 24) {
    return {
      isAtRisk: true,
      hoursRemaining: 0,
      message: 'Streak lost! Start fresh.',
    };
  }

  // Warning if less than 4 hours until reset
  if (hoursUntilMidnight < 4) {
    return {
      isAtRisk: true,
      hoursRemaining: Math.round(hoursUntilMidnight * 10) / 10,
      message: `⚠️ ${Math.round(hoursUntilMidnight)}h left to save your streak!`,
    };
  }

  // Warning if less than 8 hours until reset
  if (hoursUntilMidnight < 8) {
    return {
      isAtRisk: false,
      hoursRemaining: Math.round(hoursUntilMidnight * 10) / 10,
      message: `${Math.round(hoursUntilMidnight)}h left today`,
    };
  }

  return {
    isAtRisk: false,
    hoursRemaining: Math.round(hoursUntilMidnight * 10) / 10,
    message: 'Streak safe!',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// XP LEVEL CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
}

// XP required for each level (exponential curve)
function getXPForLevel(level: number): number {
  // Level 1 = 0 XP
  // Level 2 = 100 XP
  // Level 3 = 250 XP
  // Level 4 = 450 XP
  // etc. (accelerating curve)
  if (level <= 1) return 0;
  return Math.floor(50 * Math.pow(level, 1.8));
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Rookie',
  5: 'Contributor',
  10: 'Builder',
  15: 'Shipper',
  20: 'Achiever',
  25: 'Expert',
  30: 'Master',
  40: 'Grandmaster',
  50: 'Legend',
  75: 'Mythic',
  100: 'Immortal',
};

function getTitleForLevel(level: number): string {
  const thresholds = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return LEVEL_TITLES[threshold];
    }
  }
  return 'Rookie';
}

export function calculateLevel(totalXP: number): LevelInfo {
  let level = 1;
  
  // Find current level
  while (getXPForLevel(level + 1) <= totalXP) {
    level++;
  }
  
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const xpIntoLevel = totalXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min((xpIntoLevel / xpNeededForLevel) * 100, 100);

  return {
    level,
    currentXP: totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent: Math.round(progressPercent * 10) / 10,
    title: getTitleForLevel(level),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Create default context for testing/simple usage
// ─────────────────────────────────────────────────────────────────────────────

export function createDefaultContext(
  userId: string,
  taskDifficulty: CompletionContext['taskDifficulty'] = 'medium',
  overrides: Partial<CompletionContext> = {}
): CompletionContext {
  return {
    userId,
    taskDifficulty,
    consecutiveCompletions: 0,
    currentStreak: 0,
    tasksSinceLegendary: 0,
    tasksCompletedToday: 0,
    timeOfDay: new Date(),
    isFirstTaskOfDay: false,
    isLastTaskBeforeDeadline: false,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format XP for display
// ─────────────────────────────────────────────────────────────────────────────

export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// CELEBRATION TYPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getCelebrationConfig(type: XPResult['celebrationType']) {
  switch (type) {
    case 'legendary':
      return {
        duration: 4000,
        confettiCount: 150,
        sound: 'legendary',
        screenShake: true,
      };
    case 'milestone':
      return {
        duration: 3000,
        confettiCount: 100,
        sound: 'milestone',
        screenShake: false,
      };
    case 'streak':
      return {
        duration: 2500,
        confettiCount: 50,
        sound: 'streak',
        screenShake: false,
      };
    default:
      return {
        duration: 2000,
        confettiCount: 0,
        sound: 'standard',
        screenShake: false,
      };
  }
}

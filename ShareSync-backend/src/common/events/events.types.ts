// ═══════════════════════════════════════════════════════════════════════════════
// FILE: src/common/events/events.types.ts
// ═══════════════════════════════════════════════════════════════════════════════
// 
// INSTRUCTIONS:
// 1. Create folder: mkdir -p src/common/events
// 2. Create this file: src/common/events/events.types.ts
//
// ═══════════════════════════════════════════════════════════════════════════════

// Event name constants
export const EVENTS = {
  // Task events
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_UPDATED: 'task.updated',

  // Gamification events  
  XP_AWARDED: 'xp.awarded',
  LEVEL_UP: 'level.up',
  BADGE_EARNED: 'badge.earned',
  
  // Streak events
  STREAK_UPDATED: 'streak.updated',
  STREAK_MILESTONE: 'streak.milestone',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Task Event Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskCompletedEvent {
  taskId: string;
  projectId: string;
  userId: string;
  title: string;
  priority: 'critical' | 'urgent' | 'high' | 'medium' | 'low';
  isBlocking: boolean;
  storyPoints: number;
  dueDate?: Date;
  completedAt: Date;
  wasOnTime: boolean;
  isEarlyBird: boolean;
  inFocusMode: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gamification Event Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface XPAwardedEvent {
  userId: string;
  amount: number;
  source: string;
  newTotal: number;
  level: number;
  leveledUp: boolean;
  bonuses: string[];
  streak: {
    current: number;
    longest: number;
    atRisk: boolean;
  };
}

export interface LevelUpEvent {
  userId: string;
  oldLevel: number;
  newLevel: number;
  totalXP: number;
}

export interface BadgeEarnedEvent {
  userId: string;
  badge: {
    id: string;
    name: string;
    icon: string;
    rarity: string;
  };
}

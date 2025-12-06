// src/utils/activitySummary.ts

import { calculateStreak, StreakEvent } from './streakEngine';

export interface ActivitySummaryInput {
  timestamp: Date | string;
  /** e.g. "TASK_COMPLETED", "LOGIN", etc. */
  type: string;
  /** XP gained from this activity, if any */
  xpDelta?: number;
}

export interface ActivitySummary {
  xp: number;
  streakDays: number;
  longestStreak: number;
  lastActiveAt: Date | null;

  daysActiveThisMonth: number;
  totalTasksCompleted: number;
  totalActivityCount: number;
}

/**
 * Build a stats object for the Home page / MomentumRing / WelcomeCard.
 *
 * This file is PURE: it doesn’t know about Mongoose, Express, Nest, etc.
 */
export function buildActivitySummary(
  activities: ActivitySummaryInput[],
  baseXp: number = 0
): ActivitySummary {
  // 1) Streak-related numbers (delegated to streakEngine)
  const streakEvents: StreakEvent[] = activities.map((a) => ({
    timestamp: a.timestamp,
  }));
  const streak = calculateStreak(streakEvents);

  // 2) Aggregate stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthDayKeys = new Set<string>();

  let xp = baseXp;
  let totalTasksCompleted = 0;

  for (const activity of activities) {
    xp += activity.xpDelta ?? 0;

    const ts =
      typeof activity.timestamp === 'string'
        ? new Date(activity.timestamp)
        : activity.timestamp;

    if (ts.getFullYear() === currentYear && ts.getMonth() === currentMonth) {
      const key = `${ts.getFullYear()}-${ts.getMonth()}-${ts.getDate()}`;
      monthDayKeys.add(key);
    }

    const typeUpper = activity.type.toUpperCase();

    // You can tweak these string checks to match your Activity model
    if (
      typeUpper === 'TASK_COMPLETED' ||
      typeUpper === 'TASK_COMPLETE' ||
      typeUpper === 'TASK_DONE'
    ) {
      totalTasksCompleted += 1;
    }
  }

  return {
    xp,
    streakDays: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveAt: streak.lastActiveAt,
    daysActiveThisMonth: monthDayKeys.size,
    totalTasksCompleted,
    totalActivityCount: activities.length,
  };
}

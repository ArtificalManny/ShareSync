// src/gamification/dto/stats-response.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// STATS RESPONSE DTO
// - Matches your GamificationService.getUserStats() return shape.
// - Does NOT force runtime mapping changes (purely typing + swagger).
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty } from '@nestjs/swagger';

export class StreakResponseDto {
  @ApiProperty({ example: 5 })
  currentStreak: number;

  @ApiProperty({ example: 12 })
  longestStreak: number;

  @ApiProperty({ example: 1 })
  freezesAvailable: number;

  @ApiProperty({ example: 0 })
  freezesUsed: number;

  @ApiProperty({ example: false })
  atRisk: boolean;

  @ApiProperty({
    description: 'ISO day strings (YYYY-MM-DD)',
    example: ['2026-02-07', '2026-02-08', '2026-02-09'],
  })
  activeDays: string[];

  @ApiProperty({ example: '2026-02-09T00:00:00.000Z', nullable: true })
  lastActivityDate: string | null;
}

export class StatsResponseDto {
  // Identity
  @ApiProperty({ example: '6987c6d8566ac5a5f00d70b0' })
  userId: string;

  // XP & Level
  @ApiProperty({ example: 420 })
  totalXP: number;

  @ApiProperty({ example: 3 })
  level: number;

  @ApiProperty({ example: 42 })
  levelProgress: number;

  @ApiProperty({ example: 'Rising Operator' })
  levelTitle: string;

  @ApiProperty({ example: 58 })
  xpToNextLevel: number;

  // Time-based XP
  @ApiProperty({ example: 50 })
  todayXP: number;

  @ApiProperty({ example: 120 })
  weeklyXP: number;

  @ApiProperty({ example: 420 })
  monthlyXP: number;

  // Streak
  @ApiProperty({ type: StreakResponseDto })
  streak: StreakResponseDto;

  // Back-compat flat fields
  @ApiProperty({ example: 5 })
  currentStreak: number;

  @ApiProperty({ example: 12 })
  longestStreak: number;

  // Task metrics
  @ApiProperty({ example: 18 })
  tasksCompleted: number;

  @ApiProperty({ example: 18 })
  totalTasksCompleted: number;

  @ApiProperty({ example: 3 })
  tasksCompletedToday: number;

  @ApiProperty({ example: 9 })
  tasksCompletedThisWeek: number;

  @ApiProperty({ example: 7 })
  tasksCompletedOnTime: number;

  @ApiProperty({ example: 2 })
  blockingTasksCompleted: number;

  // Badges
  @ApiProperty({ type: [Object], example: [{ badgeId: 'starter', earnedAt: '...' }] })
  earnedBadges: any[];

  @ApiProperty({ example: 1 })
  badgeCount: number;

  // Additional stats
  @ApiProperty({ example: 0 })
  projectsCompleted: number;

  @ApiProperty({ example: 0 })
  focusTasksCompleted: number;

  @ApiProperty({ example: 90 })
  totalFocusMinutes: number;

  // Achievements
  @ApiProperty({ example: 0 })
  shipsCount: number;

  @ApiProperty({ example: 0 })
  legendaryHits: number;
}

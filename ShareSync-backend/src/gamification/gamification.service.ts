// src/gamification/gamification.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION SERVICE: Main orchestrator for all game mechanics
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserStats, UserStatsDocument } from './schemas/user-stats.schema';
import {
  HallOfFameEntry,
  HallOfFameDocument,
  HallOfFameCategory,
} from './schemas/hall-of-fame.schema';
import {
  XPCalculatorService,
  TaskCompletionContext,
} from './services/xp-calculator.service';
import { StreakService } from './services/streak.service';
import { BadgeService } from './services/badge.service';
import { LeaderboardService } from './services/leaderboard.service';
import { CeremonyService } from './services/ceremony.service';
import { getLevelProgress, getLevelTitle } from './constants/xp.constants';
import { TaskCompletionXPDto } from './dto/gamification.dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(UserStats.name)
    private readonly userStatsModel: Model<UserStatsDocument>,
    @InjectModel(HallOfFameEntry.name)
    private readonly hallOfFameModel: Model<HallOfFameDocument>,
    private readonly xpCalculator: XPCalculatorService,
    private readonly streakService: StreakService,
    private readonly badgeService: BadgeService,
    private readonly leaderboardService: LeaderboardService,
    private readonly ceremonyService: CeremonyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // USER STATS
  // ─────────────────────────────────────────────────────────────────────────────

  // ✅ FIXED: Return format that matches frontend expectations (nested streak object)
  async getUserStats(userId: string): Promise<any> {
    const stats = await this.getOrCreateStats(userId);
    const levelProgress = getLevelProgress(stats.totalXP);

    return {
      // Identity
      userId: stats.userId.toString(),

      // XP & Level
      totalXP: stats.totalXP || 0,
      level: stats.level || 1,
      levelProgress: levelProgress.progress || 0,
      levelTitle: getLevelTitle(stats.level || 1),

      // ✅ FIXED: getLevelProgress() does NOT have xpToNext
      xpToNextLevel: Math.max(
        0,
        (levelProgress.xpForNextLevel || 0) - (levelProgress.xpInLevel || 0),
      ),

      // Time-based XP
      todayXP: stats.todayXP || 0,
      weeklyXP: stats.weeklyXP || 0,
      monthlyXP: stats.monthlyXP || 0,

      // Streak - NESTED OBJECT (what frontend expects)
      streak: {
        currentStreak: stats.streak?.currentStreak || 0,
        longestStreak: stats.streak?.longestStreak || 0,
        freezesAvailable: stats.streak?.freezesAvailable || 1,
        freezesUsed: stats.streak?.freezesUsed || 0,
        atRisk: stats.streak?.atRisk || false,
        activeDays: stats.streak?.activeDays || [],
        lastActivityDate: stats.streak?.lastActivityDate || null,
      },

      // ALSO include flat fields for backwards compatibility
      currentStreak: stats.streak?.currentStreak || 0,
      longestStreak: stats.streak?.longestStreak || 0,

      // Task metrics
      tasksCompleted: stats.tasksCompleted || 0,
      totalTasksCompleted: stats.tasksCompleted || 0, // alias
      tasksCompletedToday: stats.tasksCompletedToday || 0,
      tasksCompletedThisWeek: stats.tasksCompletedThisWeek || 0,
      tasksCompletedOnTime: stats.tasksCompletedOnTime || 0,
      blockingTasksCompleted: stats.blockingTasksCompleted || 0,

      // Badges
      earnedBadges: stats.earnedBadges || [],
      badgeCount: stats.earnedBadges?.length || 0,

      // Additional stats
      projectsCompleted: stats.projectsCompleted || 0,
      focusTasksCompleted: stats.focusTasksCompleted || 0,
      totalFocusMinutes: stats.totalFocusMinutes || 0,

      // Achievements
      shipsCount: stats.shipsCount || 0,
      legendaryHits: stats.legendaryHits || 0,
    };
  }

  async getDetailedStats(userId: string): Promise<UserStatsDocument> {
    return this.getOrCreateStats(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TASK COMPLETION (Main Entry Point)
  // ─────────────────────────────────────────────────────────────────────────────

  async processTaskCompletion(dto: TaskCompletionXPDto): Promise<{
    xpGained: number;
    totalXP: number;
    level: number;
    levelProgress: number;
    leveledUp: boolean;
    newLevel?: number;
    bonusAwarded: number;
    isLegendary: boolean;
    multiplier: number;
    ceremony: any;
    badgesEarned: any[];
    streakUpdated: boolean;
    newStreak: number;
    streakMilestone?: number;
  }> {
    const stats = await this.getOrCreateStats(dto.userId);

    const isFirstTaskOfDay = stats.tasksCompletedToday === 0;

    const context: TaskCompletionContext = {
      priority: dto.priority,
      isBlocking: dto.isBlocking,
      isOnTime: dto.isOnTime,
      isEarly: dto.isEarly,
      inFocusMode: dto.inFocusMode,
      currentStreak: stats.streak?.currentStreak || 0,
      isFirstTaskOfDay,
    };

    const xpResult = this.xpCalculator.calculateTaskXP(context);

    const previousLevel = stats.level;
    const xpResult2 = await stats.addXP(xpResult.totalXP, 'task_complete', {
      sourceId: dto.taskId,
      isBonus: xpResult.hasBonus,
      isLegendary: xpResult.isLegendary,
      multiplier: xpResult.multiplier,
    });

    stats.tasksCompleted += 1;
    stats.tasksCompletedToday += 1;
    stats.tasksCompletedThisWeek += 1;

    if (dto.isBlocking) stats.blockingTasksCompleted += 1;
    if (dto.isOnTime) stats.tasksCompletedOnTime += 1;
    if (dto.isEarly) stats.earlyTasks += 1;
    if (dto.inFocusMode) stats.focusTasksCompleted += 1;
    if (xpResult.isLegendary) stats.legendaryHits += 1;
    if (xpResult.hasBonus) stats.bonusesEarned += 1;
    if (xpResult.hasMultiplier) stats.multipliersTriggered += 1;

    const hour = new Date().getHours();
    if (hour < 9) stats.earlyTasks += 1;
    else if (hour >= 22) stats.lateTasks += 1;

    await stats.save();

    const streakResult = await this.streakService.recordActivity(dto.userId);

    const badgesEarned = await this.badgeService.checkAndUnlockBadges(dto.userId, {
      taskId: dto.taskId,
      projectId: dto.projectId,
    });

    const ceremonyResult = await this.ceremonyService.triggerTaskComplete(
      dto.userId,
      xpResult.baseXP,
      xpResult.bonusXP,
      xpResult.isLegendary,
      xpResult.multiplier,
      {
        taskId: dto.taskId,
        projectId: dto.projectId,
        priority: dto.priority,
        isBlocking: dto.isBlocking,
        breakdown: xpResult.breakdown,
      },
    );

    if (xpResult2.leveledUp) {
      this.eventEmitter.emit('level.up', {
        userId: dto.userId,
        newLevel: xpResult2.newLevel,
        totalXP: stats.totalXP,
      });

      await this.ceremonyService.triggerLevelUp(dto.userId, xpResult2.newLevel!, {
        previousLevel,
      });
    }

    if (xpResult.isLegendary) {
      await this.leaderboardService.addToHallOfFame(
        dto.userId,
        HallOfFameCategory.LEGENDARY_SHIP,
        '🌟 Legendary Reward!',
        `Hit the 1% chance legendary reward for ${xpResult.totalXP} XP!`,
        '🌟',
        { taskId: dto.taskId, projectId: dto.projectId },
        xpResult.totalXP,
      );
    }

    if (streakResult.milestoneReached) {
      await this.leaderboardService.addToHallOfFame(
        dto.userId,
        HallOfFameCategory.STREAK_MILESTONE,
        `🔥 ${streakResult.milestoneReached}-Day Streak!`,
        `Maintained productivity for ${streakResult.milestoneReached} consecutive days!`,
        '🔥',
        { streakDays: streakResult.milestoneReached },
        streakResult.milestoneReached * 10,
      );

      await this.ceremonyService.triggerStreakMilestone(
        dto.userId,
        streakResult.milestoneReached,
      );
    }

    // ✅ FIXED: ceremony method name
    for (const badge of badgesEarned) {
      await this.ceremonyService.triggerBadgeEarned(
        dto.userId,
        badge.badge.id,
        badge.badge.name,
        badge.badge.icon,
        badge.badge.xpReward,
      );
    }

    const levelProgress = getLevelProgress(stats.totalXP);

    this.eventEmitter.emit('xp.awarded', {
      userId: dto.userId,
      taskId: dto.taskId,
      projectId: dto.projectId,

      amount: xpResult.totalXP,
      baseXP: xpResult.baseXP,
      bonusXP: xpResult.bonusXP,
      multiplier: xpResult.multiplier,
      isLegendary: xpResult.isLegendary,

      newTotal: stats.totalXP,
      level: stats.level,
      levelProgress: levelProgress.progress,

      leveledUp: xpResult2.leveledUp,
      newLevel: xpResult2.newLevel,

      streak: {
        updated: streakResult.streakUpdated,
        current: streakResult.newStreak,
        milestone: streakResult.milestoneReached || null,
      },

      breakdown: xpResult.breakdown,
      ceremony: ceremonyResult ?? null,
      timestamp: new Date().toISOString(),
    });

    return {
      xpGained: xpResult.totalXP,
      totalXP: stats.totalXP,
      level: stats.level,
      levelProgress: levelProgress.progress,
      leveledUp: xpResult2.leveledUp,
      newLevel: xpResult2.newLevel,
      bonusAwarded: xpResult.bonusXP,
      isLegendary: xpResult.isLegendary,
      multiplier: xpResult.multiplier,
      ceremony: {
        tier: xpResult.ceremony.tier,
        animation: xpResult.ceremony.animation,
        sound: xpResult.ceremony.sound,
        duration: xpResult.ceremony.duration,
      },
      badgesEarned: badgesEarned.map((b) => ({
        id: b.badge.id,
        name: b.badge.name,
        icon: b.badge.icon,
        rarity: b.badge.rarity,
        xpReward: b.badge.xpReward,
      })),
      streakUpdated: streakResult.streakUpdated,
      newStreak: streakResult.newStreak,
      streakMilestone: streakResult.milestoneReached,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    taskId: string;
    projectId: string;
    userId: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    isBlocking?: boolean;
    unblockedCount?: number;
    dueDate?: Date;
    completedAt: Date;
    inFocusMode?: boolean;
  }) {
    let isOnTime = false;
    let isEarly = false;

    if (payload.dueDate) {
      const dueDate = new Date(payload.dueDate);
      const completedAt = new Date(payload.completedAt);

      if (completedAt <= dueDate) {
        isOnTime = true;
        if (dueDate.getTime() - completedAt.getTime() > 24 * 60 * 60 * 1000) {
          isEarly = true;
        }
      }
    }

    await this.processTaskCompletion({
      taskId: payload.taskId,
      userId: payload.userId,
      projectId: payload.projectId,
      priority: payload.priority,
      isBlocking: payload.isBlocking,
      isOnTime,
      isEarly,
      inFocusMode: payload.inFocusMode,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY RESET
  // ─────────────────────────────────────────────────────────────────────────────

  async resetDailyCounters(userId: string): Promise<void> {
    await this.userStatsModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        todayXP: 0,
        tasksCompletedToday: 0,
        todayFocusMinutes: 0,
        lastDailyReset: new Date(),
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async getOrCreateStats(userId: string): Promise<UserStatsDocument> {
    let stats = await this.userStatsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!stats) {
      stats = new this.userStatsModel({
        userId: new Types.ObjectId(userId),
      });
      await stats.save();
    }

    return stats;
  }
}

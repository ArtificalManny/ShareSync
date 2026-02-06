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
import { XPCalculatorService, TaskCompletionContext } from './services/xp-calculator.service';
import { StreakService } from './services/streak.service';
import { BadgeService } from './services/badge.service';
import { LeaderboardService } from './services/leaderboard.service';
import { CeremonyService } from './services/ceremony.service';
import { getLevelProgress, getLevelTitle } from './constants/xp.constants';
import { TaskCompletionXPDto, UserStatsResponseDto } from './dto/gamification.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

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

  async getUserStats(userId: string): Promise<UserStatsResponseDto> {
    const stats = await this.getOrCreateStats(userId);
    const levelProgress = getLevelProgress(stats.totalXP);

    return {
      userId: stats.userId.toString(),
      totalXP: stats.totalXP,
      level: stats.level,
      levelProgress: levelProgress.progress,
      levelTitle: getLevelTitle(stats.level),
      currentStreak: stats.streak?.currentStreak || 0,
      longestStreak: stats.streak?.longestStreak || 0,
      totalTasksCompleted: stats.tasksCompleted,
      badgeCount: stats.earnedBadges.length,
      todayXP: stats.todayXP || 0,
      weeklyXP: stats.weeklyXP || 0,
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

    // Check if first task of the day
    const isFirstTaskOfDay = stats.tasksCompletedToday === 0;

    // Build context for XP calculation
    const context: TaskCompletionContext = {
      priority: dto.priority,
      isBlocking: dto.isBlocking,
      isOnTime: dto.isOnTime,
      isEarly: dto.isEarly,
      inFocusMode: dto.inFocusMode,
      currentStreak: stats.streak?.currentStreak || 0,
      isFirstTaskOfDay,
    };

    // Calculate XP
    const xpResult = this.xpCalculator.calculateTaskXP(context);

    // Update stats
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

    if (dto.isBlocking) {
      stats.blockingTasksCompleted += 1;
    }
    if (dto.isOnTime) {
      stats.tasksCompletedOnTime += 1;
    }
    if (dto.isEarly) {
      stats.earlyTasks += 1;
    }
    if (dto.inFocusMode) {
      stats.focusTasksCompleted += 1;
    }
    if (xpResult.isLegendary) {
      stats.legendaryHits += 1;
    }
    if (xpResult.hasBonus) {
      stats.bonusesEarned += 1;
    }
    if (xpResult.hasMultiplier) {
      stats.multipliersTriggered += 1;
    }

    // Update time-based stats
    const hour = new Date().getHours();
    if (hour < 9) {
      stats.earlyTasks += 1;
    } else if (hour >= 22) {
      stats.lateTasks += 1;
    }

    await stats.save();

    // Update streak
    const streakResult = await this.streakService.recordActivity(dto.userId);

    // Check and unlock badges
    const badgesEarned = await this.badgeService.checkAndUnlockBadges(dto.userId, {
      taskId: dto.taskId,
      projectId: dto.projectId,
    });

    // Trigger ceremony
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

    // Handle level up
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

    // Handle legendary hit - add to Hall of Fame
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

    // Handle streak milestone - add to Hall of Fame
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

    // Trigger badge ceremonies
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

  @OnEvent('project.completed')
  async handleProjectCompleted(payload: {
    projectId: string;
    projectName: string;
    userId: string;
  }) {
    const stats = await this.getOrCreateStats(payload.userId);
    stats.projectsCompleted += 1;
    await stats.save();

    const xpAmount = this.xpCalculator.calculateProjectShipXP();
    await stats.addXP(xpAmount, 'project_ship', { sourceId: payload.projectId });

    await this.ceremonyService.triggerProjectShip(
      payload.userId,
      payload.projectId,
      payload.projectName,
    );

    await this.leaderboardService.addToHallOfFame(
      payload.userId,
      HallOfFameCategory.PROJECT_SHIP,
      '🚀 Project Shipped!',
      `Successfully completed project: ${payload.projectName}`,
      '🚀',
      { projectId: payload.projectId, projectName: payload.projectName },
      xpAmount,
    );

    await this.badgeService.checkAndUnlockBadges(payload.userId, {
      projectId: payload.projectId,
    });
  }

  @OnEvent('sprint.completed')
  async handleSprintCompleted(payload: {
    sprintId: string;
    sprintName: string;
    projectId: string;
    completedBy: string[];
    goalAchieved: boolean;
  }) {
    if (!payload.goalAchieved) return;

    for (const userId of payload.completedBy) {
      const stats = await this.getOrCreateStats(userId);
      stats.sprintsCompleted += 1;
      
      const xpAmount = this.xpCalculator.calculateSprintGoalXP();
      await stats.addXP(xpAmount, 'sprint_goal', { sourceId: payload.sprintId });
      await stats.save();

      await this.ceremonyService.triggerSprintGoal(
        userId,
        payload.projectId,
        payload.sprintName,
      );
    }
  }

  @OnEvent('message.sent')
  async handleMessageSent(payload: { senderId: string }) {
    const stats = await this.getOrCreateStats(payload.senderId);
    stats.messagesSent += 1;
    await stats.save();

    await this.badgeService.checkAndUnlockBadges(payload.senderId);
  }

  @OnEvent('focus.session.ended')
  async handleFocusSessionEnded(payload: {
    userId: string;
    durationMinutes: number;
  }) {
    const stats = await this.getOrCreateStats(payload.userId);
    stats.totalFocusMinutes += payload.durationMinutes;
    stats.todayFocusMinutes += payload.durationMinutes;
    await stats.save();

    await this.badgeService.checkAndUnlockBadges(payload.userId);
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

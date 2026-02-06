// src/gamification/services/streak.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// STREAK SERVICE: Maintain that momentum!
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserStats, UserStatsDocument } from '../schemas/user-stats.schema';
import { STREAKS } from '../constants/xp.constants';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  isAtRisk: boolean;
  freezesAvailable: number;
  lastActivityDate?: Date;
  streakStartDate?: Date;
  nextMilestone: number;
  daysUntilMilestone: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    @InjectModel(UserStats.name)
    private readonly userStatsModel: Model<UserStatsDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET STREAK STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  async getStreakStatus(userId: string): Promise<StreakStatus> {
    const stats = await this.userStatsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!stats || !stats.streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isActive: false,
        isAtRisk: false,
        freezesAvailable: 0,
        nextMilestone: STREAKS.MILESTONES[0],
        daysUntilMilestone: STREAKS.MILESTONES[0],
      };
    }

    const currentStreak = stats.streak.currentStreak || 0;
    const nextMilestone = this.getNextMilestone(currentStreak);
    const daysUntilMilestone = nextMilestone - currentStreak;

    return {
      currentStreak,
      longestStreak: stats.streak.longestStreak || 0,
      isActive: currentStreak > 0,
      isAtRisk: stats.streak.atRisk || false,
      freezesAvailable: stats.streak.freezesAvailable || 0,
      lastActivityDate: stats.streak.lastActivityDate,
      streakStartDate: stats.streak.streakStartDate,
      nextMilestone,
      daysUntilMilestone,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE STREAK
  // ─────────────────────────────────────────────────────────────────────────────

  async recordActivity(userId: string): Promise<{
    streakUpdated: boolean;
    newStreak: number;
    milestoneReached?: number;
  }> {
    const stats = await this.getOrCreateStats(userId);
    const previousStreak = stats.streak?.currentStreak || 0;
    
    const result = await stats.updateStreak(true);

    // Check for milestone
    let milestoneReached: number | undefined;
    const newStreak = result.currentStreak;
    if (newStreak > previousStreak) {
      milestoneReached = this.checkMilestone(previousStreak, newStreak);
      
      if (milestoneReached) {
        this.eventEmitter.emit('streak.milestone', {
          userId,
          streakDays: milestoneReached,
        });
        this.logger.log(`User ${userId} hit streak milestone: ${milestoneReached} days!`);
      }
    }

    return {
      streakUpdated: newStreak > previousStreak || newStreak === previousStreak,
      newStreak,
      milestoneReached,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USE STREAK FREEZE
  // ─────────────────────────────────────────────────────────────────────────────

  async useStreakFreeze(userId: string): Promise<{
    success: boolean;
    freezesRemaining: number;
    message: string;
  }> {
    const stats = await this.getOrCreateStats(userId);

    if (!stats.streak || stats.streak.freezesAvailable <= 0) {
      return {
        success: false,
        freezesRemaining: 0,
        message: 'No streak freezes available',
      };
    }

    if (!stats.streak.atRisk) {
      return {
        success: false,
        freezesRemaining: stats.streak.freezesAvailable,
        message: 'Streak is not at risk',
      };
    }

    const used = await stats.useStreakFreeze();
    if (used) {
      this.logger.log(`User ${userId} used a streak freeze`);
      
      return {
        success: true,
        freezesRemaining: stats.streak.freezesAvailable,
        message: 'Streak freeze activated! Your streak is protected for 24 hours.',
      };
    }

    return {
      success: false,
      freezesRemaining: stats.streak.freezesAvailable,
      message: 'Failed to use streak freeze',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PURCHASE STREAK FREEZE
  // ─────────────────────────────────────────────────────────────────────────────

  async purchaseStreakFreeze(userId: string): Promise<{
    success: boolean;
    freezesAvailable: number;
    xpDeducted: number;
    message: string;
  }> {
    const stats = await this.getOrCreateStats(userId);
    const cost = STREAKS.FREEZE_COST_XP;

    if (stats.totalXP < cost) {
      return {
        success: false,
        freezesAvailable: stats.streak?.freezesAvailable || 0,
        xpDeducted: 0,
        message: `Not enough XP. Need ${cost} XP, have ${stats.totalXP} XP.`,
      };
    }

    if ((stats.streak?.freezesAvailable || 0) >= STREAKS.MAX_FREEZES) {
      return {
        success: false,
        freezesAvailable: stats.streak?.freezesAvailable || 0,
        xpDeducted: 0,
        message: `Already at max freezes (${STREAKS.MAX_FREEZES})`,
      };
    }

    stats.totalXP -= cost;
    if (!stats.streak) {
      stats.streak = {
        currentStreak: 0,
        longestStreak: 0,
        freezesAvailable: 0,
        freezesUsed: 0,
        activeDays: [],
        atRisk: false,
        milestones: [],
      };
    }
    stats.streak.freezesAvailable += 1;
    await stats.save();

    this.logger.log(`User ${userId} purchased a streak freeze for ${cost} XP`);

    return {
      success: true,
      freezesAvailable: stats.streak.freezesAvailable,
      xpDeducted: cost,
      message: `Streak freeze purchased! You now have ${stats.streak.freezesAvailable} freezes.`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON: CHECK AT-RISK STREAKS
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async checkAtRiskStreaks(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const atRiskUsers = await this.userStatsModel.find({
      'streak.currentStreak': { $gt: 0 },
      'streak.lastActivityDate': {
        $gte: yesterday,
        $lt: today,
      },
      'streak.atRisk': false,
    });

    for (const stats of atRiskUsers) {
      stats.streak.atRisk = true;
      await stats.save();

      this.eventEmitter.emit('streak.at_risk', {
        userId: stats.userId.toString(),
        currentStreak: stats.streak.currentStreak,
        hoursRemaining: 24 - now.getHours(),
      });
    }

    if (atRiskUsers.length > 0) {
      this.logger.log(`Marked ${atRiskUsers.length} users as at-risk streaks`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON: BREAK EXPIRED STREAKS
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron('0 4 * * *')
  async breakExpiredStreaks(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    const brokenStreaks = await this.userStatsModel.find({
      'streak.currentStreak': { $gt: 0 },
      'streak.lastActivityDate': { $lt: twoDaysAgo },
    });

    for (const stats of brokenStreaks) {
      const oldStreak = stats.streak.currentStreak;
      stats.streak.currentStreak = 0;
      stats.streak.atRisk = false;
      await stats.save();

      this.eventEmitter.emit('streak.broken', {
        userId: stats.userId.toString(),
        previousStreak: oldStreak,
      });
    }

    if (brokenStreaks.length > 0) {
      this.logger.log(`Broke ${brokenStreaks.length} expired streaks`);
    }
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

  private getNextMilestone(currentStreak: number): number {
    for (const milestone of STREAKS.MILESTONES) {
      if (milestone > currentStreak) {
        return milestone;
      }
    }
    return currentStreak + 100;
  }

  private checkMilestone(previousStreak: number, newStreak: number): number | undefined {
    for (const milestone of STREAKS.MILESTONES) {
      if (previousStreak < milestone && newStreak >= milestone) {
        return milestone;
      }
    }
    return undefined;
  }
}

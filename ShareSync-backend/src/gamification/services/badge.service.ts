// src/gamification/services/badge.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BADGE SERVICE: Unlock achievements and rewards
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserStats, UserStatsDocument, EarnedBadge } from '../schemas/user-stats.schema';
import { Achievement, AchievementDocument } from '../schemas/achievement.schema';
import {
  BADGE_DEFINITIONS,
  BadgeDefinition,
  BadgeCategory,
  BadgeRarity,
} from '../constants/badges.constants';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BadgeWithProgress extends BadgeDefinition {
  isEarned: boolean;
  earnedAt?: Date;
  progress: number;
  currentValue: number;
}

export interface BadgeUnlockResult {
  badge: BadgeDefinition;
  xpRewarded: number;
  isNew: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    @InjectModel(UserStats.name)
    private readonly userStatsModel: Model<UserStatsDocument>,
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET BADGES
  // ─────────────────────────────────────────────────────────────────────────────

  async getAllBadges(
    userId: string,
    options: {
      category?: BadgeCategory;
      rarity?: BadgeRarity;
      includeHidden?: boolean;
    } = {},
  ): Promise<BadgeWithProgress[]> {
    const stats = await this.getOrCreateStats(userId);
    const achievements = await this.achievementModel.find({
      userId: new Types.ObjectId(userId),
    });

    const earnedMap = new Map(achievements.map((a) => [a.badgeId, a]));

    const badges = BADGE_DEFINITIONS.filter((b) => {
      if (b.isHidden && !options.includeHidden && !earnedMap.has(b.id)) return false;
      if (options.category && b.category !== options.category) return false;
      if (options.rarity && b.rarity !== options.rarity) return false;
      return true;
    });

    return badges.map((badge) => {
      const earned = earnedMap.get(badge.id);
      const { progress, currentValue } = this.calculateProgress(badge, stats);

      return {
        ...badge,
        isEarned: !!earned,
        earnedAt: earned?.earnedAt,
        progress,
        currentValue,
      };
    });
  }

  async getEarnedBadges(userId: string): Promise<AchievementDocument[]> {
    return this.achievementModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ earnedAt: -1 });
  }

  async getShowcasedBadges(userId: string): Promise<AchievementDocument[]> {
    return this.achievementModel.find({
      userId: new Types.ObjectId(userId),
      isShowcased: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK & UNLOCK BADGES
  // ─────────────────────────────────────────────────────────────────────────────

  async checkAndUnlockBadges(
    userId: string,
    context?: Record<string, any>,
  ): Promise<BadgeUnlockResult[]> {
    const stats = await this.getOrCreateStats(userId);
    const unlockedBadges: BadgeUnlockResult[] = [];

    const earnedIds = this.getEarnedBadgeIds(stats);

    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already earned
      if (earnedIds.has(badge.id)) continue;

      // Check if criteria met
      if (this.checkCriteria(badge, stats, context)) {
        const result = await this.unlockBadge(userId, badge, stats, context);
        if (result) {
          unlockedBadges.push(result);
          earnedIds.add(badge.id); // prevents double-unlock in same loop
        }
      }
    }

    return unlockedBadges;
  }

  async unlockBadge(
    userId: string,
    badge: BadgeDefinition,
    stats: UserStatsDocument,
    context?: Record<string, any>,
  ): Promise<BadgeUnlockResult | null> {
    // Double-check not already earned (DB-level)
    const existing = await this.achievementModel.findOne({
      userId: new Types.ObjectId(userId),
      badgeId: badge.id,
    });

    if (existing) return null;

    // Create achievement record (canonical history)
    const achievement = new this.achievementModel({
      userId: new Types.ObjectId(userId),
      badgeId: badge.id,
      badgeName: badge.name,
      badgeDescription: badge.description,
      badgeIcon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      xpRewarded: badge.xpReward,
      context,
      earnedAt: new Date(),
    });

    await achievement.save();

    // Update user stats earnedBadges (EarnedBadge[])
    if (!stats.earnedBadges) stats.earnedBadges = [];

    const alreadyInStats = (stats.earnedBadges as EarnedBadge[]).some(
      (e) => e?.badgeId === badge.id,
    );

    if (!alreadyInStats) {
      (stats.earnedBadges as EarnedBadge[]).push({
        badgeId: badge.id,
        earnedAt: new Date(),
        metadata: context ?? {},
      });

      // ensure mongoose change tracking is aware
      stats.markModified?.('earnedBadges');
    }

    await stats.save();

    // Emit event
    this.eventEmitter.emit('badge.earned', {
      userId,
      badgeId: badge.id,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgeDescription: badge.description,
      rarity: badge.rarity,
      xpReward: badge.xpReward,
    });

    this.logger.log(`User ${userId} earned badge: ${badge.name}`);

    return {
      badge,
      xpRewarded: badge.xpReward,
      isNew: true,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHOWCASE BADGES
  // ─────────────────────────────────────────────────────────────────────────────

  async toggleShowcase(userId: string, badgeId: string, showcase: boolean): Promise<boolean> {
    const result = await this.achievementModel.updateOne(
      { userId: new Types.ObjectId(userId), badgeId },
      { isShowcased: showcase },
    );

    return result.modifiedCount > 0;
  }

  async markAsViewed(userId: string, badgeId: string): Promise<boolean> {
    const result = await this.achievementModel.updateOne(
      { userId: new Types.ObjectId(userId), badgeId },
      { isViewed: true },
    );

    return result.modifiedCount > 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRITERIA CHECKING
  // ─────────────────────────────────────────────────────────────────────────────

  private checkCriteria(
    badge: BadgeDefinition,
    stats: UserStatsDocument,
    context?: Record<string, any>,
  ): boolean {
    const { type, value } = badge.criteria;

    switch (type) {
      case 'tasks_completed':
        return (stats.tasksCompleted ?? 0) >= value;

      case 'streak_days':
        return (stats.streak?.currentStreak ?? 0) >= value;

      case 'total_xp':
        return (stats.totalXP ?? 0) >= value;

      case 'blocking_tasks':
        return (stats.blockingTasksCompleted ?? 0) >= value;

      case 'on_time_tasks':
        return (stats.tasksCompletedOnTime ?? 0) >= value;

      case 'early_tasks':
        return (stats.earlyTasks ?? 0) >= value;

      case 'late_tasks':
        return (stats.lateTasks ?? 0) >= value;

      case 'focus_tasks':
        return (stats.focusTasksCompleted ?? 0) >= value;

      case 'focus_hours':
        return ((stats.totalFocusMinutes ?? 0) / 60) >= value;

      case 'legendary_rewards':
        return (stats.legendaryRewardsHit ?? 0) >= value;

      case 'projects_completed':
        return (stats.projectsCompleted ?? 0) >= value;

      case 'unique_collaborators':
        return (stats.collaborators?.length ?? 0) >= value;

      case 'messages_sent':
        return (stats.messagesSent ?? 0) >= value;

      case 'tasks_in_day':
        return (stats.tasksCompletedToday ?? 0) >= value;

      default:
        return false;
    }
  }

  private calculateProgress(
    badge: BadgeDefinition,
    stats: UserStatsDocument,
  ): { progress: number; currentValue: number } {
    const { type, value } = badge.criteria;
    let currentValue = 0;

    switch (type) {
      case 'tasks_completed':
        currentValue = stats.tasksCompleted ?? 0;
        break;
      case 'streak_days':
        currentValue = stats.streak?.currentStreak ?? 0;
        break;
      case 'total_xp':
        currentValue = stats.totalXP ?? 0;
        break;
      case 'blocking_tasks':
        currentValue = stats.blockingTasksCompleted ?? 0;
        break;
      case 'on_time_tasks':
        currentValue = stats.tasksCompletedOnTime ?? 0;
        break;
      case 'focus_tasks':
        currentValue = stats.focusTasksCompleted ?? 0;
        break;
      case 'focus_hours':
        currentValue = Math.round((stats.totalFocusMinutes ?? 0) / 60);
        break;
      case 'legendary_rewards':
        currentValue = stats.legendaryRewardsHit ?? 0;
        break;
      case 'projects_completed':
        currentValue = stats.projectsCompleted ?? 0;
        break;
      case 'unique_collaborators':
        currentValue = stats.collaborators?.length ?? 0;
        break;
      case 'messages_sent':
        currentValue = stats.messagesSent ?? 0;
        break;
      default:
        currentValue = 0;
    }

    const progress = value > 0 ? Math.min(100, (currentValue / value) * 100) : 0;
    return { progress, currentValue };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private getEarnedBadgeIds(stats: UserStatsDocument): Set<string> {
    const earned = (stats.earnedBadges ?? []) as EarnedBadge[];
    const ids = earned
      .map((e) => e?.badgeId)
      .filter((x): x is string => typeof x === 'string' && x.length > 0);
    return new Set(ids);
  }

  private async getOrCreateStats(userId: string): Promise<UserStatsDocument> {
    let stats = await this.userStatsModel.findOne({ userId: new Types.ObjectId(userId) });

    if (!stats) {
      stats = new this.userStatsModel({ userId: new Types.ObjectId(userId) });
      await stats.save();
    }

    // Safety: ensure earnedBadges exists (and is object-array)
    if (!stats.earnedBadges) {
      stats.earnedBadges = [];
      stats.markModified?.('earnedBadges');
      await stats.save();
    }

    return stats;
  }
}

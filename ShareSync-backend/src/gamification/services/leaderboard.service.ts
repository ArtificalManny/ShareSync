// src/gamification/services/leaderboard.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD SERVICE: Competition drives excellence
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserStats, UserStatsDocument } from '../schemas/user-stats.schema';
import {
  HallOfFameEntry,
  HallOfFameDocument,
  HallOfFameCategory,
} from '../schemas/hall-of-fame.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  value: number;
  level: number;
  badges: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResult {
  type: 'all_time' | 'weekly' | 'monthly' | 'streak';
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalParticipants: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectModel(UserStats.name)
    private readonly userStatsModel: Model<UserStatsDocument>,
    @InjectModel(HallOfFameEntry.name)
    private readonly hallOfFameModel: Model<HallOfFameDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET LEADERBOARDS
  // ─────────────────────────────────────────────────────────────────────────────

  async getLeaderboard(
    type: 'all_time' | 'weekly' | 'monthly' | 'streak',
    currentUserId?: string,
    limit: number = 10,
    projectId?: string,
  ): Promise<LeaderboardResult> {
    let sortField: string;
    
    switch (type) {
      case 'weekly':
        sortField = 'weeklyXP';
        break;
      case 'monthly':
        sortField = 'monthlyXP';
        break;
      case 'streak':
        sortField = 'streak.currentStreak';
        break;
      default:
        sortField = 'totalXP';
    }

    // Get top entries
    const topEntries = await this.userStatsModel
      .find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName avatar')
      .lean();

    // Get total participants
    const totalParticipants = await this.userStatsModel.countDocuments();

    // Map to leaderboard entries
    const entries: LeaderboardEntry[] = topEntries.map((entry, index) => {
      const user = entry.userId as any;
      const value = this.getValueByType(entry, type);
      
      return {
        rank: index + 1,
        userId: entry.userId?._id?.toString() || entry.userId?.toString(),
        user: {
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          avatar: user?.avatar,
        },
        value,
        level: entry.level,
        badges: entry.earnedBadges?.length || 0,
        isCurrentUser: currentUserId === (entry.userId?._id?.toString() || entry.userId?.toString()),
      };
    });

    // Find current user's rank if not in top
    let currentUserRank: number | undefined;
    if (currentUserId) {
      const userInTop = entries.find((e) => e.isCurrentUser);
      if (!userInTop) {
        const userStats = await this.userStatsModel.findOne({
          userId: new Types.ObjectId(currentUserId),
        });
        
        if (userStats) {
          const userValue = this.getValueByType(userStats, type);
          const higherCount = await this.userStatsModel.countDocuments({
            [sortField]: { $gt: userValue },
          });
          currentUserRank = higherCount + 1;
        }
      }
    }

    return {
      type,
      entries,
      currentUserRank,
      totalParticipants,
    };
  }

  async getProjectLeaderboard(
    projectId: string,
    type: 'all_time' | 'weekly' | 'monthly' = 'weekly',
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    // TODO: Implement project-specific leaderboard
    // Would need to track XP per project
    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HALL OF FAME
  // ─────────────────────────────────────────────────────────────────────────────

  async getHallOfFame(
    options: {
      category?: HallOfFameCategory;
      limit?: number;
      featuredOnly?: boolean;
    } = {},
  ): Promise<HallOfFameDocument[]> {
    const query: any = {};
    
    if (options.category) {
      query.category = options.category;
    }
    
    if (options.featuredOnly) {
      query.isFeatured = true;
    }

    return this.hallOfFameModel
      .find(query)
      .populate('userId', 'firstName lastName avatar')
      .sort({ achievedAt: -1 })
      .limit(options.limit || 50);
  }

  async addToHallOfFame(
    userId: string,
    category: HallOfFameCategory,
    title: string,
    description: string,
    icon: string,
    context: Record<string, any> = {},
    xpValue: number = 0,
  ): Promise<HallOfFameDocument> {
    const entry = new this.hallOfFameModel({
      userId: new Types.ObjectId(userId),
      category,
      title,
      description,
      icon,
      xpValue,
      context,
      achievedAt: new Date(),
    });

    const saved = await entry.save();
    await saved.populate('userId', 'firstName lastName avatar');

    // Emit event for real-time
    this.eventEmitter.emit('hall_of_fame.new_entry', {
      entry: saved,
    });

    this.logger.log(`Hall of Fame entry added for user ${userId}: ${title}`);

    return saved;
  }

  async celebrate(
    entryId: string,
    userId: string,
  ): Promise<{ celebrationCount: number }> {
    const entry = await this.hallOfFameModel.findById(entryId);
    
    if (!entry) {
      throw new Error('Hall of Fame entry not found');
    }

    // Check if already celebrated
    if (entry.celebratedBy.some((id) => id.toString() === userId)) {
      return { celebrationCount: entry.celebrationCount };
    }

    entry.celebratedBy.push(new Types.ObjectId(userId));
    entry.celebrationCount += 1;
    await entry.save();

    // Emit event
    this.eventEmitter.emit('hall_of_fame.celebrated', {
      entryId,
      celebratedBy: userId,
      celebrationCount: entry.celebrationCount,
    });

    return { celebrationCount: entry.celebrationCount };
  }

  async uncelebrate(
    entryId: string,
    userId: string,
  ): Promise<{ celebrationCount: number }> {
    const entry = await this.hallOfFameModel.findById(entryId);
    
    if (!entry) {
      throw new Error('Hall of Fame entry not found');
    }

    const index = entry.celebratedBy.findIndex((id) => id.toString() === userId);
    if (index === -1) {
      return { celebrationCount: entry.celebrationCount };
    }

    entry.celebratedBy.splice(index, 1);
    entry.celebrationCount = Math.max(0, entry.celebrationCount - 1);
    await entry.save();

    return { celebrationCount: entry.celebrationCount };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON: WEEKLY CHAMPION
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron('0 0 * * 1') // Every Monday at midnight
  async crownWeeklyChampion(): Promise<void> {
    const weeklyLeader = await this.userStatsModel
      .findOne({ weeklyXP: { $gt: 0 } })
      .sort({ weeklyXP: -1 })
      .populate('userId', 'firstName lastName');

    if (weeklyLeader && weeklyLeader.weeklyXP > 0) {
      const user = weeklyLeader.userId as any;
      const weekNumber = this.getWeekNumber(new Date());

      await this.addToHallOfFame(
        weeklyLeader.userId.toString(),
        HallOfFameCategory.WEEKLY_CHAMPION,
        'Weekly Champion',
        `Earned ${weeklyLeader.weeklyXP} XP to claim the #1 spot!`,
        '🏆',
        {
          weekNumber,
          xpEarned: weeklyLeader.weeklyXP,
          tasksCompleted: weeklyLeader.tasksCompletedThisWeek,
        },
        weeklyLeader.weeklyXP,
      );

      this.eventEmitter.emit('leaderboard.weekly_champion', {
        userId: weeklyLeader.userId.toString(),
        userName: `${user.firstName} ${user.lastName}`,
        xpEarned: weeklyLeader.weeklyXP,
        weekNumber,
      });

      this.logger.log(`Weekly champion crowned: ${user.firstName} ${user.lastName}`);
    }

    // Reset weekly XP for all users
    await this.userStatsModel.updateMany({}, { weeklyXP: 0, tasksCompletedThisWeek: 0 });
    this.logger.log('Weekly XP reset for all users');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON: MONTHLY CHAMPION
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron('0 0 1 * *') // First day of each month at midnight
  async crownMonthlyChampion(): Promise<void> {
    const monthlyLeader = await this.userStatsModel
      .findOne({ monthlyXP: { $gt: 0 } })
      .sort({ monthlyXP: -1 })
      .populate('userId', 'firstName lastName');

    if (monthlyLeader && monthlyLeader.monthlyXP > 0) {
      const user = monthlyLeader.userId as any;
      const now = new Date();
      const monthYear = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

      await this.addToHallOfFame(
        monthlyLeader.userId.toString(),
        HallOfFameCategory.MONTHLY_CHAMPION,
        'Monthly Champion',
        `Dominated ${monthYear} with ${monthlyLeader.monthlyXP} XP!`,
        '👑',
        {
          monthYear,
          xpEarned: monthlyLeader.monthlyXP,
        },
        monthlyLeader.monthlyXP,
      );

      this.eventEmitter.emit('leaderboard.monthly_champion', {
        userId: monthlyLeader.userId.toString(),
        userName: `${user.firstName} ${user.lastName}`,
        xpEarned: monthlyLeader.monthlyXP,
        monthYear,
      });

      this.logger.log(`Monthly champion crowned: ${user.firstName} ${user.lastName}`);
    }

    // Reset monthly XP for all users
    await this.userStatsModel.updateMany({}, { monthlyXP: 0 });
    this.logger.log('Monthly XP reset for all users');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private getValueByType(
    stats: any,
    type: 'all_time' | 'weekly' | 'monthly' | 'streak',
  ): number {
    switch (type) {
      case 'weekly':
        return stats.weeklyXP || 0;
      case 'monthly':
        return stats.monthlyXP || 0;
      case 'streak':
        return stats.streak?.currentStreak || 0;
      default:
        return stats.totalXP || 0;
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

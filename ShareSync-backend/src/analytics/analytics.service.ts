// src/analytics/analytics.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS SERVICE: Insights and productivity metrics
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DailySnapshot,
  DailySnapshotDocument,
} from './schemas/daily-snapshot.schema';
import {
  EventLog,
  EventLogDocument,
  EventType,
} from './schemas/event-log.schema';
import {
  AnalyticsQueryDto,
  ProductivityMetricsDto,
  TeamProductivityDto,
  ProjectHealthDto,
  ForecastDto,
} from './dto/analytics.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(DailySnapshot.name)
    private readonly snapshotModel: Model<DailySnapshotDocument>,
    @InjectModel(EventLog.name)
    private readonly eventLogModel: Model<EventLogDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT LOGGING
  // ─────────────────────────────────────────────────────────────────────────────

  async logEvent(
    type: EventType,
    userId: string,
    options: {
      projectId?: string;
      taskId?: string;
      sprintId?: string;
      metadata?: Record<string, any>;
      value?: number;
    } = {},
  ): Promise<EventLogDocument> {
    const event = new this.eventLogModel({
      type,
      userId: new Types.ObjectId(userId),
      projectId: options.projectId ? new Types.ObjectId(options.projectId) : undefined,
      taskId: options.taskId ? new Types.ObjectId(options.taskId) : undefined,
      sprintId: options.sprintId ? new Types.ObjectId(options.sprintId) : undefined,
      metadata: options.metadata,
      value: options.value,
      timestamp: new Date(),
    });

    return event.save();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────

  async getProjectOverview(
    projectId: string,
    query: AnalyticsQueryDto = {},
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
    avgCompletionTime: number;
    velocity: number;
  }> {
    const { startDate, endDate } = this.getDateRange(query);

    // Get latest snapshot
    const latestSnapshot = await this.snapshotModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ date: -1 });

    // Calculate metrics from events
    const taskEvents = await this.eventLogModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          type: { $in: [EventType.TASK_COMPLETED, EventType.TASK_CREATED] },
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const tasksCreated = taskEvents.find((e) => e._id === EventType.TASK_CREATED)?.count || 0;
    const tasksCompleted = taskEvents.find((e) => e._id === EventType.TASK_COMPLETED)?.count || 0;

    return {
      totalTasks: latestSnapshot?.totalTasks || 0,
      completedTasks: latestSnapshot?.completedTasks || 0,
      inProgress: latestSnapshot?.inProgressTasks || 0,
      overdue: latestSnapshot?.overdueTasks || 0,
      completionRate: latestSnapshot?.totalTasks
        ? Math.round((latestSnapshot.completedTasks / latestSnapshot.totalTasks) * 100)
        : 0,
      avgCompletionTime: 0, // Would need task completion times
      velocity: latestSnapshot?.completedPoints || 0,
    };
  }

  async getProjectHealth(projectId: string): Promise<ProjectHealthDto> {
    const latestSnapshot = await this.snapshotModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ date: -1 });

    // Get velocity trend
    const recentSnapshots = await this.snapshotModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ date: -1 })
      .limit(14);

    let velocityTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentSnapshots.length >= 7) {
      const recent = recentSnapshots.slice(0, 7);
      const older = recentSnapshots.slice(7);
      const recentAvg = recent.reduce((sum, s) => sum + s.completedPoints, 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + s.completedPoints, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) velocityTrend = 'improving';
      else if (recentAvg < olderAvg * 0.9) velocityTrend = 'declining';
    }

    // Calculate health score (0-100)
    let healthScore = 100;
    if (latestSnapshot) {
      // Deduct for blockers
      healthScore -= Math.min(30, latestSnapshot.blockedTasks * 5);
      // Deduct for overdue
      healthScore -= Math.min(30, latestSnapshot.overdueTasks * 3);
      // Deduct for low completion rate
      const completionRate = latestSnapshot.totalTasks
        ? latestSnapshot.completedTasks / latestSnapshot.totalTasks
        : 0;
      if (completionRate < 0.3) healthScore -= 20;
      else if (completionRate < 0.5) healthScore -= 10;
    }

    // Identify risks
    const risks: string[] = [];
    if (latestSnapshot?.blockedTasks > 0) {
      risks.push(`${latestSnapshot.blockedTasks} blocked tasks need attention`);
    }
    if (latestSnapshot?.overdueTasks > 0) {
      risks.push(`${latestSnapshot.overdueTasks} tasks are overdue`);
    }
    if (velocityTrend === 'declining') {
      risks.push('Velocity is declining - consider reviewing workload');
    }

    // Forecast completion
    const remainingPoints = latestSnapshot?.remainingPoints || 0;
    const velocity = latestSnapshot?.completedPoints || 1;
    const daysToComplete = Math.ceil(remainingPoints / (velocity / 7)); // Assuming weekly velocity
    const completionForecast = new Date();
    completionForecast.setDate(completionForecast.getDate() + daysToComplete);

    return {
      projectId,
      healthScore: Math.max(0, healthScore),
      velocity: latestSnapshot?.completedPoints || 0,
      velocityTrend,
      blockerCount: latestSnapshot?.blockedTasks || 0,
      overdueCount: latestSnapshot?.overdueTasks || 0,
      teamMorale: 0, // From retrospectives
      completionForecast,
      risks,
    };
  }

  async getVelocityTrend(
    projectId: string,
    days: number = 30,
  ): Promise<{ date: Date; completed: number; created: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await this.snapshotModel
      .find({
        projectId: new Types.ObjectId(projectId),
        date: { $gte: startDate },
      })
      .sort({ date: 1 });

    return snapshots.map((s) => ({
      date: s.date,
      completed: s.tasksCompleted,
      created: s.tasksCreated,
    }));
  }

  async getCompletionForecast(projectId: string): Promise<ForecastDto> {
    const latestSnapshot = await this.snapshotModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ date: -1 });

    // Get velocity from last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentSnapshots = await this.snapshotModel
      .find({
        projectId: new Types.ObjectId(projectId),
        date: { $gte: twoWeeksAgo },
      })
      .sort({ date: 1 });

    const totalCompleted = recentSnapshots.reduce(
      (sum, s) => sum + s.tasksCompleted,
      0,
    );
    const avgDailyVelocity = totalCompleted / 14;

    const remainingPoints = latestSnapshot?.remainingPoints || 0;
    const currentVelocity = avgDailyVelocity * 7; // Weekly velocity

    // Calculate scenarios
    const daysRemaining = remainingPoints / avgDailyVelocity;
    const optimisticDays = Math.floor(daysRemaining * 0.7);
    const realisticDays = Math.ceil(daysRemaining);
    const pessimisticDays = Math.ceil(daysRemaining * 1.5);

    const now = new Date();
    const optimistic = new Date(now);
    optimistic.setDate(optimistic.getDate() + optimisticDays);
    const realistic = new Date(now);
    realistic.setDate(realistic.getDate() + realisticDays);
    const pessimistic = new Date(now);
    pessimistic.setDate(pessimistic.getDate() + pessimisticDays);

    // Determine confidence
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (recentSnapshots.length < 7) confidence = 'low';
    else if (recentSnapshots.length >= 14) confidence = 'high';

    return {
      projectId,
      currentVelocity,
      remainingPoints,
      estimatedCompletionDate: realistic,
      confidence,
      scenarios: {
        optimistic,
        realistic,
        pessimistic,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USER ANALYTICS & INTELLIGENCE
  // ─────────────────────────────────────────────────────────────────────────────

  async getIntelligence(userId: string, projectId?: string): Promise<any> {
    // 1. Peak Window (Analyze last 14 days of TASK_COMPLETED events)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const completions = await this.eventLogModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: EventType.TASK_COMPLETED,
          timestamp: { $gte: twoWeeksAgo }
        }
      },
      {
        $project: {
          hour: { $hour: "$timestamp" } // Basic UTC hour clustering
        }
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let peakHour = 10; // Default to 10:00 AM if insufficient data
    if (completions.length > 0 && completions[0]._id !== null) {
      peakHour = completions[0]._id;
    }

    const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 || 12;
      return `${hr}:00 ${ampm}`;
    };

    const peakWindowStart = formatHour(peakHour);
    const peakWindowEnd = formatHour((peakHour + 2) % 24);

    // 2. Co-working Multiplier (Check if team members fired events in the last 15 mins)
    let coWorkingMultiplier = 1.0;
    let isCoWorking = false;

    if (projectId && Types.ObjectId.isValid(projectId)) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const activeOthers = await this.eventLogModel.distinct('userId', {
        projectId: new Types.ObjectId(projectId),
        userId: { $ne: new Types.ObjectId(userId) },
        timestamp: { $gte: fifteenMinsAgo }
      });

      if (activeOthers.length > 0) {
        isCoWorking = true;
        // Base 1.0 + 0.2 per active teammate, capped at 1.5x
        coWorkingMultiplier = Math.min(1.0 + (activeOthers.length * 0.2), 1.5);
      }
    }

    // 3. Productivity Score
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEventsCount = await this.eventLogModel.countDocuments({
      userId: new Types.ObjectId(userId),
      timestamp: { $gte: today }
    });

    // Realistic scale capping at 98
    const productivity = Math.min(75 + (todayEventsCount * 2), 98);

    return {
      peakWindowStart,
      peakWindowEnd,
      productivity,
      coWorkingMultiplier: Number(coWorkingMultiplier.toFixed(1)),
      isCoWorking
    };
  }

  async getUserProductivity(
    userId: string,
    query: AnalyticsQueryDto = {},
  ): Promise<ProductivityMetricsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const events = await this.eventLogModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
        },
      },
    ]);

    const getEventData = (type: EventType) => {
      const event = events.find((e) => e._id === type);
      return { count: event?.count || 0, value: event?.totalValue || 0 };
    };

    const tasksCompleted = getEventData(EventType.TASK_COMPLETED);
    const tasksCreated = getEventData(EventType.TASK_CREATED);
    const xpEarned = getEventData(EventType.XP_EARNED);
    const focusSessions = getEventData(EventType.FOCUS_SESSION_ENDED);

    return {
      tasksCompleted: tasksCompleted.count,
      tasksCreated: tasksCreated.count,
      completionRate: tasksCreated.count > 0
        ? Math.round((tasksCompleted.count / tasksCreated.count) * 100)
        : 0,
      avgCompletionTime: 0, // Would need detailed tracking
      pointsCompleted: 0, // Would need task points
      xpEarned: xpEarned.value,
      focusMinutes: focusSessions.value,
      streakDays: 0, // From gamification
    };
  }

  async getTeamProductivity(
    projectId: string,
    query: AnalyticsQueryDto = {},
  ): Promise<TeamProductivityDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const teamMetrics = await this.eventLogModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          type: EventType.TASK_COMPLETED,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          tasksCompleted: { $sum: 1 },
          pointsCompleted: { $sum: '$value' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          tasksCompleted: 1,
          pointsCompleted: 1,
        },
      },
      {
        $sort: { tasksCompleted: -1 },
      },
    ]);

    // Get XP data
    const xpMetrics = await this.eventLogModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          type: EventType.XP_EARNED,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          xpEarned: { $sum: '$value' },
        },
      },
    ]);

    const xpMap = new Map(xpMetrics.map((x) => [x._id.toString(), x.xpEarned]));

    return teamMetrics.map((m) => ({
      userId: m.userId.toString(),
      name: m.name,
      tasksCompleted: m.tasksCompleted,
      pointsCompleted: m.pointsCompleted || 0,
      xpEarned: xpMap.get(m.userId.toString()) || 0,
      avgCompletionTime: 0,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVITY FEED
  // ─────────────────────────────────────────────────────────────────────────────

  async getRecentActivity(
    projectId: string,
    limit: number = 50,
  ): Promise<EventLogDocument[]> {
    return this.eventLogModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('userId', 'firstName lastName avatar')
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getUserActivity(
    userId: string,
    limit: number = 50,
  ): Promise<EventLogDocument[]> {
    return this.eventLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY SNAPSHOT CRON
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailySnapshots(): Promise<void> {
    // This would query all active projects and create snapshots
    // Implementation depends on how projects are tracked
    this.logger.log('Creating daily snapshots...');
    
    // Placeholder: In real implementation, iterate through projects
    // and create snapshots based on current state
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('task.created')
  async handleTaskCreated(payload: { taskId: string; projectId: string; userId: string }) {
    await this.logEvent(EventType.TASK_CREATED, payload.userId, {
      projectId: payload.projectId,
      taskId: payload.taskId,
    });
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    taskId: string;
    projectId: string;
    userId: string;
    priority: string;
  }) {
    await this.logEvent(EventType.TASK_COMPLETED, payload.userId, {
      projectId: payload.projectId,
      taskId: payload.taskId,
      metadata: { priority: payload.priority },
    });
  }

  @OnEvent('xp.gained')
  async handleXPGained(payload: { userId: string; amount: number; projectId?: string }) {
    await this.logEvent(EventType.XP_EARNED, payload.userId, {
      projectId: payload.projectId,
      value: payload.amount,
    });
  }

  @OnEvent('level.up')
  async handleLevelUp(payload: { userId: string; newLevel: number }) {
    await this.logEvent(EventType.LEVEL_UP, payload.userId, {
      value: payload.newLevel,
    });
  }

  @OnEvent('badge.earned')
  async handleBadgeEarned(payload: { userId: string; badgeId: string; badgeName: string }) {
    await this.logEvent(EventType.BADGE_EARNED, payload.userId, {
      metadata: { badgeId: payload.badgeId, badgeName: payload.badgeName },
    });
  }

  @OnEvent('focus.session.ended')
  async handleFocusEnded(payload: { userId: string; durationMinutes: number; projectId?: string }) {
    await this.logEvent(EventType.FOCUS_SESSION_ENDED, payload.userId, {
      projectId: payload.projectId,
      value: payload.durationMinutes,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const endDate = query.endDate || new Date();
    const startDate = query.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }
}

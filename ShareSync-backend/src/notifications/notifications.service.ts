// src/notifications/notifications.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS SERVICE: Real-time alerts and activity tracking
// + Phase 3 helpers: notify followers (spectator subscriptions)
// + Phase 4 helpers: digests (get unread for digest + mark digested)
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from './schemas/notification.schema';
import {
  CreateNotificationDto,
  NotificationQueryDto,
} from './dto/notification.dto';

// ✅ Phase 3: follower model (optional wiring)
import {
  ProjectFollow,
  ProjectFollowDocument,
} from '../follows/schemas/project-follow.schema';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  priority?: NotificationPriority;
  triggeredBy?: string;
  data?: any;
  actions?: any[];
  groupKey?: string;
}

type DigestWindow = '1d' | '7d' | '30d';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly eventEmitter: EventEmitter2,

    // ✅ Phase 3: OPTIONAL follower model
    // If NotificationsModule doesn't register ProjectFollow, the app still boots.
    @Optional()
    @InjectModel(ProjectFollow.name)
    private readonly projectFollowModel?: Model<ProjectFollowDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    if (dto.groupKey) {
      const existing = await this.notificationModel.findOne({
        userId: new Types.ObjectId(dto.userId),
        groupKey: dto.groupKey,
        isRead: false,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });

      if (existing) {
        existing.groupCount += 1;
        existing.body = `${dto.body} (+${existing.groupCount - 1} more)`;
        existing.updatedAt = new Date();
        const updated = await existing.save();
        this.emitNotification(updated);
        return updated;
      }
    }

    const notification = new this.notificationModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
      triggeredBy: dto.triggeredBy ? new Types.ObjectId(dto.triggeredBy) : undefined,
      data: {
        ...dto.data,
        projectId: dto.data?.projectId ? new Types.ObjectId(dto.data.projectId) : undefined,
        taskId: dto.data?.taskId ? new Types.ObjectId(dto.data.taskId) : undefined,
        conversationId: dto.data?.conversationId ? new Types.ObjectId(dto.data.conversationId) : undefined,
        messageId: dto.data?.messageId ? new Types.ObjectId(dto.data.messageId) : undefined,
        sprintId: dto.data?.sprintId ? new Types.ObjectId(dto.data.sprintId) : undefined,
      },
      channels: dto.channels || [NotificationChannel.IN_APP],
      priority: dto.priority || NotificationPriority.NORMAL,

      // ✅ Phase 4: digest tracking (optional field; harmless if schema doesn't declare it)
      digestedAt: (dto as any)?.digestedAt ?? undefined,
    });

    const saved = await notification.save();
    this.emitNotification(saved);
    this.logger.log(`Notification created for user ${dto.userId}: ${dto.type}`);
    return saved;
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<NotificationDocument[]> {
    const created: NotificationDocument[] = [];
    for (const dto of notifications) {
      const notification = await this.create(dto);
      created.push(notification);
    }
    return created;
  }

  async notify(payload: NotificationPayload): Promise<NotificationDocument> {
    return this.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      priority: payload.priority,
      triggeredBy: payload.triggeredBy,
      data: payload.data,
      actions: payload.actions,
      groupKey: payload.groupKey,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: FOLLOWER NOTIFICATION HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async getInAppFollowerUserIds(projectId: string): Promise<string[]> {
    // ✅ Safe boot: if follows model isn't registered, follower notifications are disabled
    if (!this.projectFollowModel) return [];

    const pid = new Types.ObjectId(projectId);

    const follows = await this.projectFollowModel
      .find({
        projectId: pid,
        'channelPrefs.inApp': true,
      })
      .select(['userId'])
      .lean();

    return (follows || [])
      .map((f: any) => f?.userId?.toString?.())
      .filter(Boolean);
  }

  async notifyFollowersShipUpdate(args: {
    projectId: string;
    projectName?: string;
    shipTitle: string;
    triggeredBy?: string;
  }) {
    const followerIds = await this.getInAppFollowerUserIds(args.projectId);
    const toNotify = followerIds.filter((uid) => uid !== args.triggeredBy);

    if (toNotify.length === 0) return { success: true, created: 0 };

    const bulk: CreateNotificationDto[] = toNotify.map((userId) => ({
      userId,
      type: NotificationType.PROJECT_SHIP_UPDATE,
      title: '🚀 New Ship Posted',
      body: args.projectName ? `${args.projectName}: ${args.shipTitle}` : `${args.shipTitle}`,
      icon: '🚀',
      priority: NotificationPriority.NORMAL,
      triggeredBy: args.triggeredBy,
      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        shipTitle: args.shipTitle,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],
      groupKey: `follow-ship-${userId}-${args.projectId}-${new Date().toDateString()}`,
    }));

    await this.createBulk(bulk);
    return { success: true, created: bulk.length };
  }

  async notifyFollowersMilestoneReached(args: {
    projectId: string;
    projectName?: string;
    milestoneName: string;
    triggeredBy?: string;
  }) {
    const followerIds = await this.getInAppFollowerUserIds(args.projectId);
    const toNotify = followerIds.filter((uid) => uid !== args.triggeredBy);

    if (toNotify.length === 0) return { success: true, created: 0 };

    const bulk: CreateNotificationDto[] = toNotify.map((userId) => ({
      userId,
      type: NotificationType.PROJECT_MILESTONE_REACHED,
      title: '🏁 Milestone Reached',
      body: args.projectName ? `${args.projectName}: ${args.milestoneName}` : `${args.milestoneName}`,
      icon: '🏁',
      priority: NotificationPriority.HIGH,
      triggeredBy: args.triggeredBy,
      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        milestoneName: args.milestoneName,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],
      groupKey: `follow-mile-${userId}-${args.projectId}-${new Date().toDateString()}`,
    }));

    await this.createBulk(bulk);
    return { success: true, created: bulk.length };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  async findByUser(
    userId: string,
    query: NotificationQueryDto = {},
  ): Promise<{ notifications: NotificationDocument[]; total: number; unread: number }> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query.unreadOnly) filter.isRead = false;
    if (query.type) filter.type = query.type;

    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const [notifications, total, unread] = await Promise.all([
      this.notificationModel
        .find(filter)
        .populate('triggeredBy', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
    ]);

    return { notifications, total, unread };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async getCountByType(userId: string): Promise<Record<string, number>> {
    const result = await this.notificationModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), isRead: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const item of result) counts[item._id] = item.count;
    return counts;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ PHASE 4: DIGEST HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  async getUnreadForDigest(
    userId: string,
    opts: { limit?: number; window?: DigestWindow } = {},
  ): Promise<NotificationDocument[]> {
    const limit = Number(opts.limit || 50);
    const window = (opts.window || '7d') as DigestWindow;

    const since = this.windowToDate(window);

    const filter: any = {
      userId: new Types.ObjectId(userId),
      isRead: false,
      createdAt: { $gte: since },
      $or: [{ digestedAt: { $exists: false } }, { digestedAt: null }],
    };

    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markDigested(notificationIds: string[], userId: string): Promise<number> {
    const ids = (notificationIds || [])
      .filter(Boolean)
      .map((id) => new Types.ObjectId(id));

    if (ids.length === 0) return 0;

    const res = await this.notificationModel.updateMany(
      { _id: { $in: ids }, userId: new Types.ObjectId(userId) },
      { $set: { digestedAt: new Date() } },
    );

    return (res as any).modifiedCount ?? 0;
  }

  private windowToDate(window: DigestWindow): Date {
    const now = Date.now();
    if (window === '1d') return new Date(now - 24 * 60 * 60 * 1000);
    if (window === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { isRead: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return result.modifiedCount;
  }

  async markAsClicked(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { isClicked: true, clickedAt: new Date(), isRead: true, readAt: new Date() },
    );
  }

  async dismiss(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { isDismissed: true, isRead: true },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
  }

  async deleteAllRead(userId: string): Promise<number> {
    const result = await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
      isRead: true,
    });
    return result.deletedCount;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REAL-TIME EMISSION
  // ─────────────────────────────────────────────────────────────────────────────

  private emitNotification(notification: NotificationDocument): void {
    this.eventEmitter.emit('notification.created', notification);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENTS (existing)
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: {
    taskId: string;
    taskTitle: string;
    assigneeId: string;
    assignedBy: string;
    projectId: string;
    projectName: string;
  }) {
    if (payload.assigneeId === payload.assignedBy) return;

    await this.notify({
      userId: payload.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      body: `You've been assigned: ${payload.taskTitle}`,
      icon: '📋',
      triggeredBy: payload.assignedBy,
      data: {
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        projectId: payload.projectId,
        projectName: payload.projectName,
      },
      actions: [{ label: 'View Task', url: `/projects/${payload.projectId}/tasks/${payload.taskId}` }],
    });
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    taskId: string;
    projectId: string;
    userId: string;
    xpAwarded: number;
    isLegendary: boolean;
    ceremonyTier: string;
  }) {
    await this.notify({
      userId: payload.userId,
      type: NotificationType.XP_GAINED,
      title: payload.isLegendary ? '🌟 LEGENDARY XP!' : 'XP Earned!',
      body: `+${payload.xpAwarded} XP for completing your task!`,
      icon: payload.isLegendary ? '🌟' : '✨',
      priority: payload.isLegendary ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      data: { xpAmount: payload.xpAwarded, taskId: payload.taskId, projectId: payload.projectId },
      groupKey: `xp-${payload.userId}-${new Date().toDateString()}`,
    });
  }

  @OnEvent('badge.earned')
  async handleBadgeEarned(payload: {
    userId: string;
    badgeName: string;
    badgeIcon: string;
    badgeDescription: string;
  }) {
    await this.notify({
      userId: payload.userId,
      type: NotificationType.BADGE_EARNED,
      title: '🏆 Badge Unlocked!',
      body: `You earned: ${payload.badgeName}`,
      icon: payload.badgeIcon,
      priority: NotificationPriority.HIGH,
      data: { badgeName: payload.badgeName, badgeIcon: payload.badgeIcon },
    });
  }

  @OnEvent('level.up')
  async handleLevelUp(payload: { userId: string; newLevel: number; totalXP: number }) {
    await this.notify({
      userId: payload.userId,
      type: NotificationType.LEVEL_UP,
      title: '🎉 LEVEL UP!',
      body: `Congratulations! You've reached Level ${payload.newLevel}!`,
      icon: '🎉',
      priority: NotificationPriority.HIGH,
      data: { newLevel: payload.newLevel, extra: { totalXP: payload.totalXP } },
    });
  }

  @OnEvent('streak.at_risk')
  async handleStreakAtRisk(payload: { userId: string; currentStreak: number; hoursRemaining: number }) {
    await this.notify({
      userId: payload.userId,
      type: NotificationType.STREAK_AT_RISK,
      title: '🔥 Streak at Risk!',
      body: `Complete a task in the next ${payload.hoursRemaining} hours to keep your ${payload.currentStreak}-day streak!`,
      icon: '🔥',
      priority: NotificationPriority.URGENT,
      data: { streakCount: payload.currentStreak, extra: { hoursRemaining: payload.hoursRemaining } },
    });
  }

  @OnEvent('project.member.added')
  async handleProjectMemberAdded(payload: { projectId: string; projectName: string; memberId: string; addedBy: string }) {
    await this.notify({
      userId: payload.memberId,
      type: NotificationType.PROJECT_INVITE,
      title: 'Project Invitation',
      body: `You've been added to: ${payload.projectName}`,
      icon: '👋',
      triggeredBy: payload.addedBy,
      data: { projectId: payload.projectId, projectName: payload.projectName },
      actions: [{ label: 'View Project', url: `/projects/${payload.projectId}` }],
    });
  }

  @OnEvent('message.sent')
  async handleMessageSent(payload: { conversationId: string; senderId: string; mentions: string[] }) {
    for (const userId of payload.mentions || []) {
      if (userId !== payload.senderId) {
        await this.notify({
          userId,
          type: NotificationType.MESSAGE_MENTION,
          title: 'You were mentioned',
          body: 'Someone mentioned you in a conversation',
          icon: '@',
          triggeredBy: payload.senderId,
          data: { conversationId: payload.conversationId },
          groupKey: `mention-${userId}-${payload.conversationId}`,
        });
      }
    }
  }
}

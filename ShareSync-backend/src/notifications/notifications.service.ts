// src/notifications/notifications.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS SERVICE: Real-time alerts and activity tracking
// + Phase 3 helpers: notify followers (spectator subscriptions)
// + Phase 4 helpers: digests (get unread for digest + mark digested)
// + Step 5 touchpoints: task.assigned / task.completed / task.moved_to_review
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

// ✅ Phase 12: Email + SMS fan-out
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

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
type ProjectEmailPreferenceKey =
  | 'taskAssigned'
  | 'taskCompleted'
  | 'announcements'
  | 'mentions'
  | 'deadlines';

type ProjectEmailPreferences = Record<ProjectEmailPreferenceKey, boolean> & {
  weeklyDigest: boolean;
};

const DEFAULT_PROJECT_EMAIL_PREFERENCES: ProjectEmailPreferences = {
  taskAssigned: true,
  taskCompleted: true,
  announcements: true,
  mentions: true,
  deadlines: true,
  weeklyDigest: false,
};

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

    // ✅ Phase 5: simple Follow fallback.
    // The active frontend Follow button currently writes to the simple
    // Follow collection through /api/follows/:projectId. Keep ProjectFollow
    // support, but also read from Follow so current followers receive updates.
    @Optional()
    @InjectModel('Follow')
    private readonly followModel?: Model<any>,

    // ✅ Phase 12: Email + SMS fan-out channels
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly smsService?: SmsService,
    @Optional()
    @InjectModel(User.name)
    private readonly userModel?: Model<UserDocument>,
    @Optional()
    @InjectModel(Project.name)
    private readonly projectModel?: Model<ProjectDocument>,
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

  private normalizeFollowerUserIds(values: Array<string | null | undefined>): string[] {
    return Array.from(
      new Set(
        (values || [])
          .map((value) => String(value || '').trim())
          .filter((value) => value && value !== 'undefined' && value !== 'null'),
      ),
    );
  }

  private async getInAppFollowerUserIds(projectId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      this.logger.warn(`Follower notification skipped: invalid projectId ${projectId}`);
      return [];
    }

    const pid = new Types.ObjectId(projectId);
    const followerIds: string[] = [];

    // Newer spectator-follow system with notification preferences.
    if (this.projectFollowModel) {
      try {
        const projectFollows = await this.projectFollowModel
          .find({
            projectId: pid,
            'channelPrefs.inApp': true,
          })
          .select(['userId'])
          .lean();

        followerIds.push(
          ...(projectFollows || [])
            .map((follow: any) => follow?.userId?.toString?.())
            .filter(Boolean),
        );
      } catch (err: any) {
        this.logger.warn(
          `ProjectFollow follower lookup failed for project ${projectId}: ${err?.message}`,
        );
      }
    }

    // Current/simple follow system used by /api/follows/:projectId.
    // No per-channel prefs here, so a simple Follow means in-app updates are enabled.
    if (this.followModel) {
      try {
        const simpleFollows = await this.followModel
          .find({ projectId: pid })
          .select(['userId'])
          .lean();

        followerIds.push(
          ...(simpleFollows || [])
            .map((follow: any) => follow?.userId?.toString?.())
            .filter(Boolean),
        );
      } catch (err: any) {
        this.logger.warn(
          `Simple Follow lookup failed for project ${projectId}: ${err?.message}`,
        );
      }
    }

    return this.normalizeFollowerUserIds(followerIds);
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
        emailFanoutEligible: true,
        followerNotification: true,
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
        emailFanoutEligible: true,
        followerNotification: true,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],
      groupKey: `follow-mile-${userId}-${args.projectId}-${new Date().toDateString()}`,
    }));

    await this.createBulk(bulk);
    return { success: true, created: bulk.length };
  }

  @OnEvent('project.milestone.reached')
  async handleProjectMilestoneReached(payload: {
    projectId: string;
    projectName?: string;
    milestoneName: string;
    triggeredBy?: string;
    memberRecipientIds?: string[];
  }) {
    const seen = new Set<string>();

    const recipients = Array.isArray(payload.memberRecipientIds)
      ? payload.memberRecipientIds
          .map((id) => String(id || '').trim())
          .filter((id) => {
            if (!id) return false;
            if (payload.triggeredBy && id === payload.triggeredBy) return false;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
      : [];

    if (recipients.length === 0) {
      return { success: true, created: 0 };
    }

    const projectName = payload.projectName || 'Project';
    const milestoneName = payload.milestoneName || 'Milestone';

    await this.createBulk(
      recipients.map((userId) => ({
        userId,
        type: NotificationType.PROJECT_MILESTONE_REACHED,
        title: '🏁 Milestone reached',
        body: `${projectName}: ${milestoneName}`,
        icon: '🏁',
        priority: NotificationPriority.HIGH,
        triggeredBy: payload.triggeredBy,
        data: {
          projectId: payload.projectId,
          projectName,
          milestoneName,
          emailFanoutEligible: true,
          projectMemberNotification: true,
        },
        actions: [{ label: 'View Project', url: `/projects/${payload.projectId}` }],
        groupKey: `project-member-mile-${userId}-${payload.projectId}-${milestoneName}`,
      })),
    );

    return { success: true, created: recipients.length };
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
    // Channel 1: In-App (WebSocket) — always fires
    this.eventEmitter.emit('notification.created', notification);

    // Channel 2 + 3: Email + SMS — async, non-blocking, preference-gated
    this.fanOutToChannels(notification).catch((err) => {
      this.logger.error('Fan-out to email/SMS failed (non-blocking):', err?.message);
    });
  }

  private getProjectIdFromNotification(notification: any): string {
    const rawProjectId =
      notification?.data?.projectId?._id ||
      notification?.data?.projectId ||
      notification?.projectId?._id ||
      notification?.projectId;

    return rawProjectId ? String(rawProjectId) : '';
  }

  private getProjectEmailPreferenceKey(type: any): ProjectEmailPreferenceKey | null {
    const normalized = String(type || '').toLowerCase();

    if (normalized.includes('task_assigned') || normalized.includes('task assigned')) {
      return 'taskAssigned';
    }
    if (
      normalized.includes('task_completed') ||
      normalized.includes('task completed') ||
      normalized === 'xp_gained'
    ) {
      return 'taskCompleted';
    }
    if (normalized.includes('announcement')) return 'announcements';
    if (normalized.includes('mention')) return 'mentions';
    if (
      normalized.includes('deadline') ||
      normalized.includes('due_soon') ||
      normalized.includes('due_soom') ||
      normalized.includes('overdue')
    ) {
      return 'deadlines';
    }

    return null;
  }

  private normalizeProjectEmailPreferences(value: any): ProjectEmailPreferences {
    const normalized = { ...DEFAULT_PROJECT_EMAIL_PREFERENCES };

    for (const key of Object.keys(normalized) as Array<keyof ProjectEmailPreferences>) {
      if (typeof value?.[key] === 'boolean') normalized[key] = value[key];
    }

    return normalized;
  }

  private async getProjectEmailPreferences(
    projectId: string,
    userId: string,
  ): Promise<ProjectEmailPreferences | null> {
    if (!this.projectModel || !projectId || !Types.ObjectId.isValid(projectId)) return null;

    try {
      const project: any = await this.projectModel
        .findById(projectId)
        .select({ ownerId: 1, owner: 1, members: 1 })
        .lean();

      if (!project) return null;

      const member = (Array.isArray(project.members) ? project.members : []).find((candidate: any) => {
        const candidateId = candidate?.userId?._id || candidate?.userId || candidate?.user?._id || candidate?.user;
        return String(candidateId || '') === String(userId);
      });

      if (member) return this.normalizeProjectEmailPreferences(member.preferences);

      const ownerId = project?.ownerId?._id || project?.ownerId || project?.owner?._id || project?.owner;
      if (String(ownerId || '') === String(userId)) {
        return this.normalizeProjectEmailPreferences(null);
      }
    } catch (error: any) {
      this.logger.warn(
        `Project email preference lookup failed: project=${projectId} user=${userId} ${error?.message || error}`,
      );
    }

    return null;
  }

  private async projectAllowsImmediateEmail(
    notification: NotificationDocument,
    userId: string,
  ): Promise<boolean> {
    const projectId = this.getProjectIdFromNotification(notification);
    const preferenceKey = this.getProjectEmailPreferenceKey(notification?.type);

    if (!projectId || !preferenceKey) return true;

    const preferences = await this.getProjectEmailPreferences(projectId, userId);
    return !preferences || preferences[preferenceKey] !== false;
  }

  async filterEmailDigestByProjectPreferences(
    userId: string,
    notifications: any[],
    frequency: 'daily' | 'weekly',
  ): Promise<any[]> {
    const cache = new Map<string, ProjectEmailPreferences | null>();
    const filtered: any[] = [];

    for (const notification of notifications || []) {
      const projectId = this.getProjectIdFromNotification(notification);
      if (!projectId) {
        filtered.push(notification);
        continue;
      }

      if (!cache.has(projectId)) {
        cache.set(projectId, await this.getProjectEmailPreferences(projectId, userId));
      }

      const preferences = cache.get(projectId);
      if (!preferences) {
        filtered.push(notification);
        continue;
      }

      const preferenceKey = this.getProjectEmailPreferenceKey(notification?.type);
      if (preferenceKey && preferences[preferenceKey] === false) continue;
      if (frequency === 'weekly' && preferences.weeklyDigest !== true) continue;

      filtered.push(notification);
    }

    return filtered;
  }

  /**
   * ✅ Phase 12: Fan-out notification to email and SMS channels
   * Respects global channel settings and per-user project email preferences.
   */
  private async fanOutToChannels(notification: NotificationDocument): Promise<void> {
    if (!this.userModel) return;

    const userId = notification.userId?.toString();
    if (!userId) return;

    let user: any;
    try {
      user = await this.userModel.findById(userId).lean();
    } catch {
      return; // User lookup failed — skip channels silently
    }
    if (!user) return;

    const notifType = notification.type;
    const priority = notification.priority;

    // ── EMAIL ──────────────────────────────────────────────────────────────
    // Preserve the existing fan-out eligibility rules, then apply the current
    // member's project-specific preference before EmailService's global gate.
    const isFollowerEmailEligible =
      notification.type === NotificationType.PROJECT_SHIP_UPDATE ||
      notification.type === NotificationType.PROJECT_MILESTONE_REACHED ||
      (notification as any)?.data?.emailFanoutEligible === true;
    const isEmailFanoutEligible =
      isFollowerEmailEligible ||
      notification.priority === NotificationPriority.HIGH ||
      notification.priority === NotificationPriority.URGENT;
    const projectAllowsEmail = await this.projectAllowsImmediateEmail(notification, userId);

    if (this.emailService && isEmailFanoutEligible && projectAllowsEmail) {
      try {
        await this.emailService.sendNotification(user, {
          type: notifType,
          title: notification.title,
          message: notification.body,
          actionData: notification.actions?.[0] ? { url: notification.actions[0].url } : undefined,
        });
      } catch (err: any) {
        this.logger.warn(`Email fan-out failed for user ${userId}: ${err?.message}`);
      }
    }

    // ── SMS ────────────────────────────────────────────────────────────────
    // Only send SMS for high-priority events to verified phone numbers
    const smsEligibleTypes = [
      'task_assigned',
      'milestone_reached',
      'project_milestone_reached',
      'mention',
      'message_mention',
      'streak_at_risk',
    ];

    const isSmsEligible =
      smsEligibleTypes.includes(notifType) ||
      priority === NotificationPriority.HIGH ||
      priority === NotificationPriority.URGENT;

    if (this.smsService && isSmsEligible) {
      const phone = user.phone || user.phoneNumber;
      const phoneVerified = user.phoneVerified === true;
      const smsEnabled = user.settings?.notifications?.smsEnabled !== false &&
                         user.notificationPrefs?.channels?.sms !== false;

      if (phone && phoneVerified && smsEnabled) {
        try {
          const smsBody = `ShareSync: ${notification.title} — ${notification.body}`.slice(0, 160);
          await this.smsService.sendNotification(phone, smsBody);
        } catch (err: any) {
          this.logger.warn(`SMS fan-out failed for user ${userId}: ${err?.message}`);
        }
      }
    }
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
      title: 'New task assigned',
      body: `You've been assigned: ${payload.taskTitle}`,
      icon: '📋',
      priority: NotificationPriority.HIGH,
      triggeredBy: payload.assignedBy,
      data: {
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        projectId: payload.projectId,
        projectName: payload.projectName,
        emailFanoutEligible: true,
      } as any,
      actions: [{ label: 'View Task', url: `/projects/${payload.projectId}/tasks/${payload.taskId}` }],
      groupKey: `task-assigned-${payload.assigneeId}-${payload.taskId}`,
    });
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    taskId: string;
    taskTitle?: string;
    projectId: string;
    projectName?: string;
    projectMembers?: Array<{
      userId?: string | null;
      memberId?: string | null;
      notificationsEnabled?: boolean;
    }>;
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

    const projectMembers = Array.isArray(payload.projectMembers) ? payload.projectMembers : [];
    const actorId = String(payload.userId || '');
    const taskTitle = payload.taskTitle || 'a task';
    const projectName = payload.projectName || 'this project';
    const seenRecipients = new Set<string>();

    for (const member of projectMembers) {
      const recipientId = String(member?.userId || member?.memberId || '');

      if (!recipientId) continue;
      if (recipientId === actorId) continue;
      if (seenRecipients.has(recipientId)) continue;
      if (member?.notificationsEnabled === false) continue;

      seenRecipients.add(recipientId);

      try {
        await this.notify({
          userId: recipientId,
          type: NotificationType.TASK_COMPLETED,
          title: 'Task completed',
          body: `A teammate completed "${taskTitle}" in ${projectName}.`,
          icon: '✅',
          priority: NotificationPriority.HIGH,
          triggeredBy: actorId,
          data: {
            taskId: payload.taskId,
            taskTitle,
            projectId: payload.projectId,
            projectName,
            emailFanoutEligible: true,
          } as any,
          actions: [
            {
              label: 'View Project',
              url: `/projects/${payload.projectId}`,
            },
          ],
          groupKey: `task-completed-${recipientId}-${payload.taskId}`,
        });
      } catch (err: any) {
        this.logger.warn(
          `Task completed notification fan-out failed for user ${recipientId}: ${
            err?.message || err
          }`,
        );
      }
    }
  }

  // ✅ Step 5: task moved to review (status change)
  @OnEvent('task.moved_to_review')
  async handleTaskMovedToReview(payload: {
    taskId: string;
    taskTitle: string;
    projectId: string;
    projectName: string;
    movedBy: string;
    assigneeId?: string | null;
    reporterId?: string | null;
  }) {
    const recipient = payload.reporterId || null;

    // If we don't know who to notify, do nothing (safe default)
    if (!recipient) return;

    // Don't notify actor about their own action
    if (recipient === payload.movedBy) return;

    await this.notify({
      userId: recipient,
      type: NotificationType.TASK_UPDATED,
      title: '🔎 Ready for Review',
      body: `Task moved to Review: ${payload.taskTitle}`,
      icon: '🔎',
      priority: NotificationPriority.NORMAL,
      triggeredBy: payload.movedBy,
      data: {
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        projectId: payload.projectId,
        projectName: payload.projectName,
        extra: { assigneeId: payload.assigneeId || null },
      },
      actions: [{ label: 'View Task', url: `/projects/${payload.projectId}/tasks/${payload.taskId}` }],
      groupKey: `review-${recipient}-${payload.taskId}-${new Date().toDateString()}`,
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


  @OnEvent('project.invite.created')
  async handleProjectInviteCreated(payload: {
    projectId: string;
    projectName: string;
    inviteeEmail: string;
    inviteToken: string;
    role: string;
    invitedBy: string;
  }) {
    const email = String(payload?.inviteeEmail || '').trim().toLowerCase();

    if (!email || !payload?.inviteToken || !payload?.projectId) {
      this.logger.warn('[NotificationsService] Skipping project invite notification: missing invite payload.');
      return;
    }

    const invitee = await this.userModel
      .findOne({ email })
      .select('_id email username firstName lastName')
      .lean();

    if (!invitee?._id) {
      this.logger.log(
        `[NotificationsService] Invite notification skipped. No local user found for ${email}. Email delivery/local invite link still applies.`,
      );
      return;
    }

    const inviteeId = String(invitee._id);
    const projectName = payload.projectName || 'this project';
    const roleLabel = payload.role
      ? String(payload.role).charAt(0).toUpperCase() + String(payload.role).slice(1)
      : 'Member';

    await this.notify({
      userId: inviteeId,
      type: NotificationType.PROJECT_INVITE,
      title: 'Project invitation',
      body: `You were invited to join ${projectName} as ${roleLabel}.`,
      icon: '👋',
      // In-app only: the actual invite email is sent by InvitesService.
      triggeredBy: payload.invitedBy,
      data: {
        projectId: payload.projectId,
        projectName,
        inviteToken: payload.inviteToken,
        inviteeEmail: email,
        role: payload.role,
      },
      actions: [
        {
          label: 'Accept Invite',
          url: `/invite/${payload.inviteToken}`,
        },
        {
          label: 'View Projects',
          url: '/projects',
        },
      ],
      groupKey: `project-invite-${payload.projectId}-${inviteeId}-${payload.inviteToken}`,
    });

    this.logger.log(
      `[NotificationsService] Project invite notification created for ${email} on ${projectName}.`,
    );
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
      actions: [{ label: 'Accept Invite', url: `/invite/accept?token=${encodeURIComponent(String((payload as any).token || (payload as any).inviteToken || ''))}` }],
    });
  }

  @OnEvent('task.comment.added')
  async handleTaskCommentAdded(payload: {
    taskId: string;
    taskTitle?: string;
    projectId: string;
    projectName?: string;
    userId: string;
    mentions?: string[];
    commentPreview?: string;
  }) {
    const mentions = Array.isArray(payload.mentions) ? payload.mentions : [];
    const actorId = String(payload.userId || '');
    const seenRecipients = new Set<string>();

    for (const mentionedUserId of mentions) {
      const recipientId = String(mentionedUserId || '');

      if (!recipientId) continue;
      if (recipientId === actorId) continue;
      if (seenRecipients.has(recipientId)) continue;

      seenRecipients.add(recipientId);

      await this.notify({
        userId: recipientId,
        type: NotificationType.MESSAGE_MENTION,
        title: 'You were mentioned in a task comment',
        body: payload.commentPreview
          ? `Mentioned on "${payload.taskTitle || 'a task'}": ${payload.commentPreview}`
          : `You were mentioned on "${payload.taskTitle || 'a task'}".`,
        icon: '@',
        priority: NotificationPriority.HIGH,
        triggeredBy: actorId,
        data: {
          taskId: payload.taskId,
          taskTitle: payload.taskTitle || 'Task',
          projectId: payload.projectId,
          projectName: payload.projectName || 'Project',
          commentPreview: payload.commentPreview || '',
          emailFanoutEligible: true,
        } as any,
        actions: [{ label: 'View Project', url: `/projects/${payload.projectId}` }],
        groupKey: `task-comment-mention-${recipientId}-${payload.taskId}`,
      });
    }
  }

  @OnEvent('project.completed')
  async handleProjectCompleted(payload: {
    projectId: string;
    projectName?: string;
    projectMembers?: Array<{
      userId?: string | null;
      notificationsEnabled?: boolean;
    }>;
    userId: string;
    outcomeStatus?: string;
    leftoverDecision?: string;
    deferredTaskCount?: number;
    canceledTaskCount?: number;
  }) {
    const projectMembers = Array.isArray(payload.projectMembers) ? payload.projectMembers : [];
    const actorId = String(payload.userId || '');
    const projectName = payload.projectName || 'Project';
    const seenRecipients = new Set<string>();

    for (const member of projectMembers) {
      const recipientId = String(member?.userId || '');

      if (!recipientId) continue;
      if (recipientId === actorId) continue;
      if (seenRecipients.has(recipientId)) continue;
      if (member?.notificationsEnabled === false) continue;

      seenRecipients.add(recipientId);

      await this.notify({
        userId: recipientId,
        type: NotificationType.PROJECT_UPDATE,
        title: 'Project completed',
        body: `${projectName} was marked complete.`,
        icon: '🏁',
        priority: NotificationPriority.HIGH,
        triggeredBy: actorId,
        data: {
          projectId: payload.projectId,
          projectName,
          outcomeStatus: payload.outcomeStatus || null,
          leftoverDecision: payload.leftoverDecision || null,
          deferredTaskCount: payload.deferredTaskCount || 0,
          canceledTaskCount: payload.canceledTaskCount || 0,
          emailFanoutEligible: true,
        } as any,
        actions: [{ label: 'View Project', url: `/projects/${payload.projectId}` }],
        groupKey: `project-completed-${recipientId}-${payload.projectId}`,
      });
    }
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

// src/milestones/milestones.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '../notifications/schemas/notification.schema';
import { Milestone, MilestoneDocument } from './schemas/milestone.schema';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';

// ✅ NEW: Task model for progress calculation
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<MilestoneDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly projectsService: ProjectsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers (safe ObjectId parsing)
  // ─────────────────────────────────────────────────────────────────────────────
  private toObjectIdOrThrow(value: string, fieldName: string): Types.ObjectId {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${fieldName} must be a valid ObjectId`);
    }
    return new Types.ObjectId(value);
  }

  private toObjectIdOrNull(value?: string): Types.ObjectId | null {
    if (!value || !Types.ObjectId.isValid(value)) return null;
    return new Types.ObjectId(value);
  }

  // Roadmap Activity Feed writer.
  private async recordProjectActivity(data: {
    userId: string;
    projectId: string;
    type: string;
    entityType: string;
    entityId: string;
    action: string;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
  }): Promise<void> {
    try {
      const now = new Date();
      const projectObjectId = this.toObjectIdOrNull(data.projectId);
      const actorObjectId = this.toObjectIdOrNull(data.userId);

      const doc = {
        projectId: projectObjectId || data.projectId,
        userId: actorObjectId || data.userId,
        actorId: actorObjectId || data.userId,
        actorUserId: actorObjectId || data.userId,
        type: data.type,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        details: data.details || {},
        metadata: data.metadata || {},
        payload: data.payload || {},
        createdAt: now,
        updatedAt: now,
      };

      const db = this.milestoneModel.db;
      const result = await db.collection('activities').insertOne(doc);

      if (projectObjectId) {
        await db.collection('projects').updateOne(
          { _id: projectObjectId },
          {
            $set: {
              lastActivityAt: now,
              'metrics.lastActivityAt': now,
            },
          },
        );
      }

      const savedActivity = { ...doc, _id: result.insertedId };

      this.eventEmitter.emit('activityCreated', savedActivity);
      this.eventEmitter.emit('activity:created', savedActivity);
      this.eventEmitter.emit('activity.created', savedActivity);
    } catch (err: any) {
      this.logger.warn(
        `Roadmap project activity skipped: ${err?.message || err}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(userId: string, dto: CreateMilestoneDto): Promise<MilestoneDocument> {
    // ✅ Prevent 500s: fail fast with clean 400s
    const projectObjectId = this.toObjectIdOrThrow(dto.projectId, 'projectId');

    // Some JWT strategies use sub=email/uuid. If your schema requires ObjectId,
    // it's better to throw a clear 400 than crash with a 500.
    const creatorObjectId = this.toObjectIdOrNull(userId);
    if (!creatorObjectId) {
      throw new BadRequestException('userId in token is not a valid ObjectId (cannot set createdBy)');
    }

    // ✅ If schema requires order, always set it here.
    // This avoids forcing the frontend to send order (and avoids DTO forbidNonWhitelisted issues).
    const milestone = new this.milestoneModel({
      title: dto.title,
      description: dto.description,
      projectId: projectObjectId,
      createdBy: creatorObjectId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      status: dto.status || 'planned',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
    });

    const saved = await milestone.save();

    await this.recordProjectActivity({
      userId,
      projectId: dto.projectId,
      type: 'milestone_created',
      entityType: 'milestone',
      entityId: String(saved._id),
      action: 'created',
      details: {
        milestoneTitle: (saved as any).title || dto.title || 'Milestone',
        title: (saved as any).title || dto.title || 'Milestone',
        status: (saved as any).status || dto.status || 'planned',
        progress: (saved as any).progress ?? 0,
        targetDate: (saved as any).targetDate || dto.targetDate || null,
      },
      metadata: {
        source: 'roadmap',
        milestoneId: String(saved._id),
      },
      payload: {
        milestoneTitle: (saved as any).title || dto.title || 'Milestone',
        milestoneId: String(saved._id),
      },
    });

    const createdAsCompleted =
      String((saved as any)?.status || dto?.status || '').toLowerCase() === 'completed' ||
      Number((saved as any)?.progress ?? (dto as any)?.progress ?? 0) >= 100;

    if (createdAsCompleted) {
      try {
        const projectId = saved.projectId?.toString?.();

        if (projectId) {
          const project = await this.projectsService.findById(projectId);

          await this.projectsService.recordMilestoneReached({
            projectId,
            userId,
            milestoneName: (saved as any).title || dto.title || 'Milestone',
            projectNameOverride: (project as any)?.name,
          });
        }
      } catch (err: any) {
        this.logger.warn(
          `Milestone create completion notification skipped for ${saved._id?.toString?.()}: ${
            err?.message || err
          }`,
        );
      }
    }

    // ⭐ DIRECT REALTIME NOTIFICATIONS & LIVE ROOM OVERRIDE
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

      const db = this.milestoneModel.db;
      const projectDoc = await db.collection('projects').findOne({ _id: projectObjectId });

      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];

        // Grab owner, ownerId, and all members to ensure no one is missed
        const allAssociatedIds: any[] = [
          projectDoc.ownerId,
          projectDoc.owner,
          ...rawMembers.map((m: any) => m?.userId || m?._id || m)
        ];

        const memberIdsToNotify: string[] = allAssociatedIds
          .filter(Boolean)
          .map(id => id.toString())
          .filter(id => id !== userId);

        const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
        const safeProjectName = typeof projectDoc.name === 'string' && projectDoc.name.trim() ? projectDoc.name.trim() : (projectDoc.title || 'Project');
        const safeMilestoneTitle = typeof dto.title === 'string' && dto.title.trim() ? dto.title.trim() : 'New Milestone';

        let notificationsService: NotificationsService | null = null;
        try {
          notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
        } catch (serviceErr) {
          this.logger.warn(
            'NotificationsService not available for milestone-created email fan-out; falling back to native in-app notification only',
          );
        }

        // 1. Notify official DB members through NotificationsService so email fan-out runs.
        for (const recipientId of uniqueMembers) {
          try {
            if (notificationsService) {
              await notificationsService.notify({
                userId: recipientId as string,
                type: NotificationType.MILESTONE_CREATED,
                title: `📍 New Milestone in ${safeProjectName}`,
                body: safeMilestoneTitle,
                icon: '📍',
                priority: NotificationPriority.HIGH,
                triggeredBy: userId,
                data: {
                  projectId: dto.projectId,
                  projectName: safeProjectName,
                  milestoneId: saved._id.toString(),
                  milestoneTitle: safeMilestoneTitle,
                  emailFanoutEligible: true,
                  extra: { milestoneId: saved._id.toString() },
                } as any,
                actions: [
                  {
                    label: 'View Roadmap',
                    url: `/projects/${dto.projectId}?tab=roadmap`,
                  },
                ],
                groupKey: `milestone-created-${recipientId}-${saved._id.toString()}`,
              });

              continue;
            }

            const notifResult = await db.collection('notifications').insertOne({
              userId: new Types.ObjectId(recipientId as string),
              type: 'milestone_created',
              title: `📍 New Milestone in ${safeProjectName}`,
              body: safeMilestoneTitle,
              data: {
                projectId: dto.projectId,
                projectName: safeProjectName,
                milestoneId: saved._id.toString(),
                milestoneTitle: safeMilestoneTitle,
                emailFanoutEligible: true,
                extra: { milestoneId: saved._id.toString() }
              },
              channels: ['in_app'],
              priority: 'high',
              isRead: false,
              isClicked: false,
              isDismissed: false,
              groupCount: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });

            if (notifGateway && notifGateway.server) {
              notifGateway.server.to(recipientId as string).emit('new_notification', newNotif);
              notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }
            if (rtGateway && rtGateway.server) {
              rtGateway.server.to(recipientId as string).emit('new_notification', newNotif);
              rtGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }

            this.eventEmitter.emit('notification.created', newNotif);
          } catch (innerErr) {
            this.logger.error(`Failed to notify user ${recipientId} for created milestone`, innerErr);
          }
        }

        // 2. LIVE ROOM OVERRIDE: Blast notification to anyone currently viewing the project board
        const liveRoomNotif = {
          _id: new Types.ObjectId(), // Ephemeral ID for the frontend to render
          type: 'milestone_created',
          title: `📍 New Milestone in ${safeProjectName}`,
          body: safeMilestoneTitle,
          data: {
            projectId: dto.projectId,
            projectName: safeProjectName,
            extra: { milestoneId: saved._id.toString() }
          },
          channels: ['in_app'],
          priority: 'normal',
          isRead: false,
          createdAt: new Date()
        };

        if (notifGateway && notifGateway.server) {
          notifGateway.server.to(`project:${dto.projectId}`).emit('new_notification', liveRoomNotif);
          notifGateway.server.to(dto.projectId).emit('new_notification', liveRoomNotif);
        }
        if (rtGateway && rtGateway.server) {
          rtGateway.server.to(`project:${dto.projectId}`).emit('new_notification', liveRoomNotif);
          rtGateway.server.to(dto.projectId).emit('new_notification', liveRoomNotif);
        }

        this.logger.log(`✅ Milestone ${saved._id.toString()} natively notified ${uniqueMembers.length} DB recipient(s) AND broadcasted to Live Rooms`);
      }
    } catch (err) {
      this.logger.error('⚠️ Failed to process native milestone notifications:', err);
    }

    return saved;
  }

  async findById(id: string): Promise<MilestoneDocument> {
    const milestone = await this.milestoneModel.findById(id);
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    return milestone;
  }

  async findByProject(projectId: string): Promise<MilestoneDocument[]> {
    if (!projectId) return [];

    // ✅ Prevent 500 if projectId is invalid
    if (!Types.ObjectId.isValid(projectId)) return [];

    return this.milestoneModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ targetDate: 1 })
      .exec();
  }

  /**
   * ✅ Roadmap Phase 1:
   * Return milestones + computed progress from tasks where task.milestoneId matches.
   *
   * NOTE: This does NOT persist progress back to Milestone docs (safe + non-invasive).
   */
  async findByProjectWithProgress(projectId: string): Promise<any[]> {
    if (!projectId) return [];
    if (!Types.ObjectId.isValid(projectId)) return [];

    const projectObjectId = new Types.ObjectId(projectId);

    // 1) Load milestones for project
    const milestones = await this.milestoneModel
      .find({ projectId: projectObjectId })
      .sort({ targetDate: 1 })
      .lean()
      .exec();

    if (!milestones.length) return [];

    // 2) Aggregate task counts grouped by milestoneId
    const stats = await this.taskModel
      .aggregate([
        {
          $match: {
            projectId: projectObjectId,
            milestoneId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$milestoneId',
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ['$status', TaskStatus.DONE] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    const statsMap = new Map<string, { totalTasks: number; completedTasks: number }>();
    for (const row of stats) {
      const key = row._id?.toString?.();
      if (!key) continue;
      statsMap.set(key, {
        totalTasks: row.totalTasks || 0,
        completedTasks: row.completedTasks || 0,
      });
    }

    // 3) Merge computed stats onto milestones
    return milestones.map((m: any) => {
      const id = m._id?.toString?.() || m.id?.toString?.();
      const taskStats = id ? statsMap.get(id) : undefined;

      const totalTasks = taskStats?.totalTasks ?? 0;
      const completedTasks = taskStats?.completedTasks ?? 0;
      const tasksLeft = Math.max(totalTasks - completedTasks, 0);

      const progress =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      return {
        ...m,
        id: id || m.id,
        totalTasks,
        completedTasks,
        tasksLeft,
        progress,
      };
    });
  }

  async update(id: string, userId: string, dto: UpdateMilestoneDto): Promise<MilestoneDocument> {
    const milestone = await this.findById(id);

    const wasCompleted =
      String((milestone as any)?.status || '').toLowerCase() === 'completed' ||
      Number((milestone as any)?.progress || 0) >= 100 ||
      Boolean((milestone as any)?.completedAt);

    Object.assign(milestone, dto);

    const requestedCompleted =
      String((dto as any)?.status || '').toLowerCase() === 'completed' ||
      Number((dto as any)?.progress || 0) >= 100 ||
      Boolean((dto as any)?.completedAt);

    // Auto-update status based on progress or explicit completed status.
    if (requestedCompleted) {
      (milestone as any).status = 'completed';
      if (!(milestone as any).completedAt) {
        (milestone as any).completedAt = new Date();
      }
    } else if (dto.progress !== undefined) {
      if (dto.progress >= 100) {
        (milestone as any).status = 'completed';
        (milestone as any).completedAt = new Date();
      } else if (dto.progress >= 1 && (milestone as any).status === 'planned') {
        (milestone as any).status = 'in_progress';
      }
    }

    const saved = await milestone.save();

    const isNowCompleted =
      String((saved as any)?.status || '').toLowerCase() === 'completed' ||
      Number((saved as any)?.progress || 0) >= 100 ||
      Boolean((saved as any)?.completedAt);

    const projectId = saved.projectId?.toString?.();

    if (projectId) {
      const completedNow = !wasCompleted && isNowCompleted;
      const activityType = completedNow ? 'milestone_completed' : 'milestone_updated';
      const activityAction = completedNow ? 'completed' : 'updated';

      await this.recordProjectActivity({
        userId,
        projectId,
        type: activityType,
        entityType: 'milestone',
        entityId: String(saved._id),
        action: activityAction,
        details: {
          milestoneTitle: (saved as any).title || (saved as any).name || 'Milestone',
          title: (saved as any).title || (saved as any).name || 'Milestone',
          status: (saved as any).status || 'planned',
          progress: (saved as any).progress ?? 0,
          targetDate: (saved as any).targetDate || null,
          completedAt: (saved as any).completedAt || null,
        },
        metadata: {
          source: 'roadmap',
          milestoneId: String(saved._id),
        },
        payload: {
          milestoneTitle: (saved as any).title || (saved as any).name || 'Milestone',
          milestoneId: String(saved._id),
        },
      });
    }

    // Fire project-member milestone completion notifications only once:
    // first transition from not-completed -> completed.
    if (!wasCompleted && isNowCompleted && projectId) {
      try {
        const projectForNotification = await this.projectsService.findById(projectId);

        const projectName =
          String(
            (projectForNotification as any)?.name ||
              (projectForNotification as any)?.title ||
              'Project',
          );

        const seen = new Set<string>();
        const memberRecipientIds: string[] = [];

        const addRecipient = (
          rawUserId: any,
          rawMemberId: any = null,
          notificationsEnabled = true,
        ) => {
          const userIdValue = rawUserId
            ? String(rawUserId?._id || rawUserId?.id || rawUserId)
            : '';

          const memberIdValue = rawMemberId
            ? String(rawMemberId?._id || rawMemberId?.id || rawMemberId)
            : '';

          const recipientId = userIdValue || memberIdValue;

          if (!recipientId) return;
          if (recipientId === userId) return;
          if (notificationsEnabled === false) return;
          if (seen.has(recipientId)) return;

          seen.add(recipientId);
          memberRecipientIds.push(recipientId);
        };

        const members = Array.isArray((projectForNotification as any)?.members)
          ? (projectForNotification as any).members
          : [];

        for (const member of members) {
          addRecipient(
            member?.userId,
            member?.memberId,
            member?.preferences?.notifications !== false,
          );
        }

        for (const ownerCandidate of [
          (projectForNotification as any)?.ownerId,
          (projectForNotification as any)?.owner,
          (projectForNotification as any)?.createdBy,
          (projectForNotification as any)?.createdById,
          (projectForNotification as any)?.userId,
        ]) {
          addRecipient(ownerCandidate, null, true);
        }

        this.eventEmitter.emit('project.milestone.reached', {
          projectId,
          projectName,
          milestoneName: String((saved as any)?.title || (saved as any)?.name || 'Milestone'),
          triggeredBy: userId,
          memberRecipientIds,
        });

        this.logger.log(
          `Milestone completion notification emitted for ${saved._id.toString()} to ${memberRecipientIds.length} project members`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Milestone completion notification skipped for ${saved._id.toString()}: ${
            err?.message || err
          }`,
        );
      }
    }

    // Public spectator stream: milestone updated.
    if (projectId) {
      const project = await this.projectsService.findById(projectId);
      if ((project as any)?.public === true) {
        this.eventEmitter.emit('public.project.update', {
          projectId,
          type: 'milestone.updated',
          data: {
            id: saved._id.toString(),
            projectId,
            title: (saved as any).title,
            status: (saved as any).status,
            progress: (saved as any).progress,
            targetDate: (saved as any).targetDate,
            completedAt: (saved as any).completedAt,
            updatedAt: (saved as any).updatedAt || new Date(),
          },
          createdAt: new Date(),
        });
      }
    }

    return saved;
  }

  async delete(id: string, userId: string): Promise<void> {
    const milestone = await this.findById(id);
    await this.milestoneModel.deleteOne({ _id: milestone._id });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TASK LINKING (kept for backwards compatibility)
  // NOTE: Roadmap uses task.milestoneId primarily.
  // ═══════════════════════════════════════════════════════════════════════════════

  async linkTask(milestoneId: string, taskId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);

    const taskObjectId = new Types.ObjectId(taskId);

    // Check if already linked
    if (milestone.taskIds.some(id => id.equals(taskObjectId))) {
      return milestone;
    }

    milestone.taskIds.push(taskObjectId);
    milestone.totalTasks = milestone.taskIds.length;

    return milestone.save();
  }

  async unlinkTask(milestoneId: string, taskId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);

    const taskObjectId = new Types.ObjectId(taskId);
    milestone.taskIds = milestone.taskIds.filter(id => !id.equals(taskObjectId));
    milestone.totalTasks = milestone.taskIds.length;

    // Recalculate progress (legacy mode)
    await this.recalculateProgress(milestoneId);

    return milestone.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROGRESS TRACKING (legacy, kept)
  // ═══════════════════════════════════════════════════════════════════════════════

  async recalculateProgress(milestoneId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);

    if (milestone.totalTasks === 0) {
      milestone.progress = 0;
    } else {
      milestone.progress = Math.round((milestone.completedTasks / milestone.totalTasks) * 100);
    }

    // Update status based on progress and date
    const now = new Date();
    const targetDate = new Date(milestone.targetDate);

    if (milestone.progress >= 100) {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
    } else if (milestone.progress > 0) {
      // Check if at risk (less than expected progress)
      const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = Math.max(0, 100 - (daysUntilTarget * 5));

      if (milestone.progress < expectedProgress * 0.8 && daysUntilTarget <= 14) {
        milestone.status = 'at_risk';
      } else {
        milestone.status = 'in_progress';
      }
    } else {
      milestone.status = 'planned';
    }

    return milestone.save();
  }

  async incrementCompletedTasks(milestoneId: string): Promise<MilestoneDocument> {
    await this.milestoneModel.updateOne(
      { _id: milestoneId },
      { $inc: { completedTasks: 1 } }
    );
    return this.recalculateProgress(milestoneId);
  }

  async decrementCompletedTasks(milestoneId: string): Promise<MilestoneDocument> {
    await this.milestoneModel.updateOne(
      { _id: milestoneId },
      { $inc: { completedTasks: -1 } }
    );
    return this.recalculateProgress(milestoneId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // QUERIES (kept)
  // ═══════════════════════════════════════════════════════════════════════════════

  async findUpcoming(projectId: string, days: number = 30): Promise<MilestoneDocument[]> {
    if (!Types.ObjectId.isValid(projectId)) return [];

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        targetDate: { $lte: futureDate },
        status: { $ne: 'completed' },
      })
      .sort({ targetDate: 1 })
      .exec();
  }

  async findAtRisk(projectId: string): Promise<MilestoneDocument[]> {
    if (!Types.ObjectId.isValid(projectId)) return [];

    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: 'at_risk',
      })
      .sort({ targetDate: 1 })
      .exec();
  }

  async findCompleted(projectId: string): Promise<MilestoneDocument[]> {
    if (!Types.ObjectId.isValid(projectId)) return [];

    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: 'completed',
      })
      .sort({ completedAt: -1 })
      .exec();
  }
}

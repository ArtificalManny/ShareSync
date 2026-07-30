// src/tasks/tasks.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS SERVICE: Business Logic with Gamification Integration
// + Normalized Task Mutation Events (3.3)
// + Realtime Socket Emits (Step 4)
// + Step 5 Notification Touchpoints (task.assigned / task.completed / task.moved_to_review)
// + ✅ Public Spectator Stream (public:project:{projectId}) (Step 6)
// + ⭐ Native DB Insert + Shotgun Gateway Broadcast + Live Room Override
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';

import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
  CeremonyTier,
} from './schemas/task.schema';
import { EVENTS, TaskCompletedEvent } from '../common/events/events.types';
import { ProjectsService } from '../projects/projects.service';
import { VaultService } from '../vault/vault.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  UpdateTaskDto,
  MoveTaskDto,
  CompleteTaskDto,
  AddCommentDto,
  AddAttachmentDto,
  LinkProjectFileDto,
  WatchTaskDto,
  LogTimeDto,
} from './dto/update-task.dto';

import { TaskEventType } from './events/task-events';
import { buildTaskSnapshot, emitTaskEvent } from './events/task-event.utils';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TextModerationService } from '../moderation/text-moderation.service';
import {
  NotificationPriority,
  NotificationType,
} from '../notifications/schemas/notification.schema';

export interface TaskQueryOptions {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  sprintId?: string;
  search?: string;
  tags?: string[];
  isBlocking?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface KanbanBoard {
  [key: string]: any[]; 
}

export interface CompletionResult {
  task: TaskDocument;
  xpAwarded: number;
  bonusXP: number;
  isLegendary: boolean;
  ceremonyTier: CeremonyTier;
  unblocked: TaskDocument[];
}

const VARIABLE_REWARDS = {
  BONUS_CHANCE: 0.15,       
  LEGENDARY_CHANCE: 0.01,   
  MULTIPLIER_CHANCE: 0.08,  
};

type TaskWatcherPreferenceKey =
  | 'comments'
  | 'statusChanges'
  | 'assignmentChanges'
  | 'dueDateChanges'
  | 'completion';

const DEFAULT_TASK_WATCHER_PREFERENCES = {
  comments: true,
  statusChanges: true,
  assignmentChanges: true,
  dueDateChanges: true,
  completion: true,
} as const;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly projectsService: ProjectsService,
    private readonly vaultService: VaultService,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtime: RealtimeService,
    private readonly textModerationService: TextModerationService,
    private readonly moduleRef: ModuleRef,
  ) {}

  private async assertTaskTextAllowed(
    userId: string,
    dto: CreateTaskDto | UpdateTaskDto,
  ): Promise<void> {
    const values = [
      (dto as any)?.title,
      (dto as any)?.description,
    ]
      .filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0,
      )
      .map((value) => value.trim());

    const textToModerate = Array.from(
      new Set(values),
    ).join('\n');

    if (!textToModerate) return;

    const result =
      await this.textModerationService.moderateText(
        textToModerate,
        'project-task',
      );

    if (result.action !== 'block') return;

    // Never log the rejected title or description.
    this.logger.warn(
      `[Task moderation] blocked user=${userId} ` +
      `categories=${result.categories.join(',') || 'unknown'}`,
    );

    throw new BadRequestException({
      code: 'CONTENT_BLOCKED',
      message:
        'This task contains content that is not allowed. Please revise it.',
      categories: result.categories,
    });
  }

  private async emitPublicProjectUpdate(projectId: string, payload: any): Promise<void> {
    try {
      const project = await this.projectsService.findById(projectId);
      if ((project as any)?.public === true) {
        this.realtime.roomEmit?.(`public:project:${projectId}`, 'public:project:update', payload);
      }
    } catch (_err) {}
  }

  private getTaskWatcherUserId(
    watcher: any,
  ): string {
    return String(
      watcher?.userId?._id ||
        watcher?.userId?.id ||
        watcher?.userId ||
        '',
    ).trim();
  }

  private getTaskWatchers(
    task: TaskDocument,
  ): any[] {
    return Array.isArray(
      (task as any).watchers,
    )
      ? (task as any).watchers
      : [];
  }

  private getTaskWatcherIds(
    task: TaskDocument,
  ): string[] {
    return [
      ...new Set(
        this.getTaskWatchers(task)
          .map((watcher: any) =>
            this.getTaskWatcherUserId(watcher),
          )
          .filter(Boolean),
      ),
    ];
  }

  private getTaskWatcherIdsForPreference(
    task: TaskDocument,
    preference: TaskWatcherPreferenceKey,
  ): string[] {
    return [
      ...new Set(
        this.getTaskWatchers(task)
          .filter(
            (watcher: any) =>
              watcher?.[preference] !== false,
          )
          .map((watcher: any) =>
            this.getTaskWatcherUserId(watcher),
          )
          .filter(Boolean),
      ),
    ];
  }

  private buildTaskWatchSettings(
    task: TaskDocument,
    userId: string,
  ) {
    const watchers =
      this.getTaskWatchers(task);

    const watcher = watchers.find(
      (candidate: any) =>
        this.getTaskWatcherUserId(candidate) ===
        userId,
    );

    return {
      following: Boolean(watcher),
      preferences: {
        comments:
          watcher?.comments ??
          DEFAULT_TASK_WATCHER_PREFERENCES.comments,
        statusChanges:
          watcher?.statusChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.statusChanges,
        assignmentChanges:
          watcher?.assignmentChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.assignmentChanges,
        dueDateChanges:
          watcher?.dueDateChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.dueDateChanges,
        completion:
          watcher?.completion ??
          DEFAULT_TASK_WATCHER_PREFERENCES.completion,
      },
      watcherCount:
        this.getTaskWatcherIds(task).length,
    };
  }

  async getWatchSettings(
    taskId: string,
    userId: string,
  ) {
    const task =
      await this.findByIdWithAccess(
        taskId,
        userId,
      );

    return this.buildTaskWatchSettings(
      task,
      userId,
    );
  }

  async updateWatchSettings(
    taskId: string,
    userId: string,
    dto: WatchTaskDto,
  ) {
    const task =
      await this.findByIdWithAccess(
        taskId,
        userId,
      );

    const watchers = [
      ...this.getTaskWatchers(task),
    ];

    const existingWatcher = watchers.find(
      (candidate: any) =>
        this.getTaskWatcherUserId(candidate) ===
        userId,
    );

    const remainingWatchers =
      watchers.filter(
        (candidate: any) =>
          this.getTaskWatcherUserId(candidate) !==
          userId,
      );

    if (dto.following) {
      remainingWatchers.push({
        userId: new Types.ObjectId(userId),
        comments:
          dto.comments ??
          existingWatcher?.comments ??
          DEFAULT_TASK_WATCHER_PREFERENCES.comments,
        statusChanges:
          dto.statusChanges ??
          existingWatcher?.statusChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.statusChanges,
        assignmentChanges:
          dto.assignmentChanges ??
          existingWatcher?.assignmentChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.assignmentChanges,
        dueDateChanges:
          dto.dueDateChanges ??
          existingWatcher?.dueDateChanges ??
          DEFAULT_TASK_WATCHER_PREFERENCES.dueDateChanges,
        completion:
          dto.completion ??
          existingWatcher?.completion ??
          DEFAULT_TASK_WATCHER_PREFERENCES.completion,
        followedAt:
          existingWatcher?.followedAt ||
          new Date(),
        updatedAt: new Date(),
      });
    }

    (task as any).watchers =
      remainingWatchers;

    task.markModified('watchers');

    const updated = await task.save();

    return this.buildTaskWatchSettings(
      updated,
      userId,
    );
  }

  private async notifyTaskWatchers(
    task: TaskDocument,
    actorId: string,
    preference: TaskWatcherPreferenceKey,
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      icon?: string;
      priority?: NotificationPriority;
      groupKeySuffix: string;
      extra?: Record<string, any>;
      excludeUserIds?: string[];
    },
  ): Promise<void> {
    try {
      const excluded = new Set(
        [
          actorId,
          ...(payload.excludeUserIds || []),
        ]
          .map((value) =>
            String(value || '').trim(),
          )
          .filter(Boolean),
      );

      const recipients = [
        ...new Set(
          this.getTaskWatchers(task)
            .filter(
              (watcher: any) =>
                watcher?.[preference] !== false,
            )
            .map((watcher: any) =>
              this.getTaskWatcherUserId(watcher),
            )
            .filter(
              (watcherId: string) =>
                watcherId &&
                !excluded.has(watcherId),
            ),
        ),
      ];

      if (!recipients.length) return;

      let notificationsService:
        | NotificationsService
        | null = null;

      try {
        notificationsService =
          this.moduleRef.get(
            NotificationsService,
            { strict: false },
          );
      } catch (_error) {}

      if (!notificationsService?.notify) return;

      const projectId =
        task.projectId.toString();

      const taskId =
        task._id.toString();

      let projectName = 'Project';

      try {
        const project =
          await this.projectsService.findById(
            projectId,
          );

        projectName = String(
          (project as any)?.name ||
            (project as any)?.title ||
            'Project',
        );
      } catch (_error) {}

      for (const recipientId of recipients) {
        try {
          await notificationsService.notify({
            userId: recipientId,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            priority:
              payload.priority ||
              NotificationPriority.NORMAL,
            triggeredBy: actorId,
            data: {
              projectId,
              projectName,
              taskId,
              taskTitle:
                String(task.title || 'Move'),
              extra: {
                watcherNotification: true,
                watcherEvent: preference,
                ...(payload.extra || {}),
              },
            },
            actions: [
              {
                label: 'View Move',
                url:
                  `/projects/${projectId}` +
                  '?tab=stack',
              },
            ],
            groupKey:
              `task-watch-${preference}-` +
              `${recipientId}-${taskId}-` +
              payload.groupKeySuffix,
          });
        } catch (error: any) {
          this.logger.warn(
            `Move watcher notification failed ` +
              `for user ${recipientId}: ` +
              `${error?.message || error}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.warn(
        `Move watcher fan-out skipped: ` +
          `${error?.message || error}`,
      );
    }
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDocument> {
    const project = await this.projectsService.findByIdWithAccess(dto.projectId, userId);

    await this.assertTaskTextAllowed(userId, dto);

    if (dto.parentId) {
      const parent = await this.taskModel.findById(dto.parentId);
      if (!parent || parent.projectId.toString() !== dto.projectId) {
        throw new BadRequestException('Invalid parent task');
      }
    }

    const resolvedBlockedBy =
      await this.resolveTaskDependencies(
        dto.projectId,
        null,
        dto.blockedBy || [],
      );

    const xpValue = this.calculateBaseXP(dto.priority || TaskPriority.MEDIUM);

    const task = new this.taskModel({
      ...dto,
      projectId: new Types.ObjectId(dto.projectId),
      reporterId: new Types.ObjectId(userId),
      createdBy: new Types.ObjectId(userId),
      assigneeId: dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : undefined,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
      sprintId: dto.sprintId ? new Types.ObjectId(dto.sprintId) : undefined,
      milestoneId: dto.milestoneId ? new Types.ObjectId(dto.milestoneId) : undefined,
      blockedBy: resolvedBlockedBy.map(
        (id) => new Types.ObjectId(id),
      ),
      xpValue,
    });

    const saved = await task.save();

    await this.projectsService.incrementTaskCount(dto.projectId);

    if (resolvedBlockedBy.length) {
      await this.updateBlockingRelationships(saved, []);
    }

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_CREATED,
      projectId: dto.projectId,
      actorId: userId,
      taskId: saved._id.toString(),
      snapshot: buildTaskSnapshot(saved),
      meta: { assigneeId: dto.assigneeId },
    });

    if (dto.assigneeId && dto.assigneeId !== userId) {
      this.eventEmitter.emit('task.assigned', {
        taskId: saved._id.toString(),
        taskTitle: saved.title,
        assigneeId: dto.assigneeId,
        assignedBy: userId,
        projectId: dto.projectId,
        projectName: project?.name || '',
      });
    }

    this.realtime.projectEmit(dto.projectId, 'taskUpdated', buildTaskSnapshot(saved));

    if ((project as any)?.public === true) {
      await this.emitPublicProjectUpdate(dto.projectId, {
        type: 'task.created',
        projectId: dto.projectId,
        data: buildTaskSnapshot(saved),
        createdAt: new Date(),
      });
    }

    // ⭐ DIRECT REALTIME BOARD UPDATE FALLBACK
    let rtGateway: any = null;
    let notifGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

    try {
      if (rtGateway && rtGateway.server) {
        const payload = buildTaskSnapshot(saved);
        rtGateway.server.to(`project:${dto.projectId}`).emit('taskUpdated', payload);
        rtGateway.server.to(dto.projectId).emit('taskUpdated', payload);
        rtGateway.server.to(`project:${dto.projectId}`).emit('taskCreated', payload);
        rtGateway.server.to(dto.projectId).emit('taskCreated', payload);
      }
    } catch (err) {}

    // ⭐ 1-TO-MANY BROADCAST: Notify all project members + LIVE ROOM OVERRIDE
    try {
      const db = this.taskModel.db;
      const projectDoc = await db.collection('projects').findOne({ _id: new Types.ObjectId(dto.projectId) });

      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
        
        // Grab owner, ownerId, and all members to ensure no one is missed
        const allAssociatedIds: any[] = [
          projectDoc.ownerId,
          projectDoc.owner,
          ...rawMembers.map((m: any) => m?.userId || m?._id || m)
        ];

        const memberIdsToNotify: string[] = allAssociatedIds
          .filter(Boolean) // Remove undefined/null
          .map(id => id.toString())
          .filter(id => id !== userId);

        const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
        const safeProjectName = typeof projectDoc.name === 'string' && projectDoc.name.trim() ? projectDoc.name.trim() : (projectDoc.title || 'Project');
        const safeTaskTitle = typeof dto.title === 'string' && dto.title.trim() ? dto.title.trim() : 'New Task';

        let notificationsService: NotificationsService | null = null;
        try {
          notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
        } catch (e) {}

        // 1. Notify Official DB Members
        for (const recipientId of uniqueMembers) {
          try {
            let createdViaNotificationsService = false;

            if (notificationsService?.notify) {
              try {
                await notificationsService.notify({
                  userId: recipientId,
                  type: 'task_created' as any,
                  title: `📝 New Task in ${safeProjectName}`,
                  body: safeTaskTitle,
                  icon: '📝',
                  priority: NotificationPriority.HIGH,
                  triggeredBy: userId,
                  data: {
                    projectId: dto.projectId,
                    projectName: safeProjectName,
                    taskId: saved._id.toString(),
                    extra: { taskId: saved._id.toString() },
                    emailFanoutEligible: true,
                    projectMemberNotification: true,
                  },
                  actions: [{ label: 'View Move', url: `/projects/${dto.projectId}?tab=move` }],
                  groupKey: `project-task-${recipientId}-${dto.projectId}-${saved._id.toString()}`,
                });

                createdViaNotificationsService = true;
              } catch (notificationErr) {
                this.logger.warn(
                  `NotificationsService task-created notification failed for user ${recipientId}; falling back to direct insert: ${
                    (notificationErr as any)?.message || notificationErr
                  }`,
                );
              }
            }

            if (createdViaNotificationsService) continue;

            const notifResult = await db.collection('notifications').insertOne({
              userId: new Types.ObjectId(recipientId as string),
              type: 'task_created',
              title: `📝 New Task in ${safeProjectName}`,
              body: safeTaskTitle,
              data: {
                projectId: dto.projectId,
                projectName: safeProjectName,
                extra: { taskId: saved._id.toString() },
                emailFanoutEligible: true,
                projectMemberNotification: true,
              },
              channels: ['in_app', 'email'],
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
            this.logger.error(`Failed to natively notify user ${recipientId}`, innerErr);
          }
        }
        
        // 2. LIVE ROOM OVERRIDE: Blast notification to anyone currently viewing the project board
        const liveRoomNotif = {
          _id: new Types.ObjectId(), // Ephemeral ID for the frontend to render
          type: 'task_created',
          title: `📝 New Task in ${safeProjectName}`,
          body: safeTaskTitle,
          data: {
            projectId: dto.projectId,
            projectName: safeProjectName,
            extra: { taskId: saved._id.toString() }
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

        this.logger.log(`✅ Task ${saved._id.toString()} natively notified ${uniqueMembers.length} DB recipient(s) AND broadcasted to Live Rooms`);
      }
    } catch (err) {
      this.logger.error('⚠️ Failed to process native task notifications:', err);
    }

    this.logger.log(`Task created: ${saved._id}`);
    return saved;
  }

  async findById(taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel
      .findById(taskId)
      .select('+watchers');
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return task;
  }

  async findByIdWithAccess(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.findById(taskId);
    await this.projectsService.findByIdWithAccess(task.projectId.toString(), userId);
    return task;
  }

  async find(
    userId: string,
    options: TaskQueryOptions = {},
  ): Promise<{ tasks: any[]; total: number }> {
    const {
      projectId,
      assigneeId,
      status,
      priority,
      sprintId,
      search,
      tags,
      isBlocking,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query: any = {};

    if (projectId) {
      await this.projectsService.findByIdWithAccess(projectId, userId);
      query.projectId = new Types.ObjectId(projectId);
    }

    if (assigneeId) query.assigneeId = new Types.ObjectId(assigneeId);
    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    if (priority) query.priority = Array.isArray(priority) ? { $in: priority } : priority;
    if (sprintId) query.sprintId = new Types.ObjectId(sprintId);
    if (search) query.$text = { $search: search };
    if (tags?.length) query.tags = { $in: tags };
    if (typeof isBlocking === 'boolean') query.isBlocking = isBlocking;

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      this.taskModel.countDocuments(query),
    ]);

    return { tasks, total };
  }

  async getKanbanBoard(projectId: string, userId: string, sprintId?: string): Promise<KanbanBoard> {
    await this.projectsService.findByIdWithAccess(projectId, userId);

    const query: any = { projectId: new Types.ObjectId(projectId) };
    if (sprintId) query.sprintId = new Types.ObjectId(sprintId);

    const tasks = await this.taskModel.find(query).sort({ order: 1 }).lean();

    const board: KanbanBoard = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    for (const task of tasks) {
      if (board[task.status]) board[task.status].push(task);
    }

    return board;
  }

  async getPriorityStack(
    projectId: string,
    userId: string,
    assigneeId?: string,
    limit: number = 10,
  ): Promise<any[]> {
    await this.projectsService.findByIdWithAccess(projectId, userId);

    const query: any = {
      projectId: new Types.ObjectId(projectId),
      status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
    };

    if (assigneeId) {
      query.assigneeId = new Types.ObjectId(assigneeId);
    }

    return this.taskModel
      .find(query)
      .sort({
        priority: -1,
        isBlocking: -1,
        stackOrder: 1,
        dueDate: 1,
      })
      .limit(limit);
  }

  async getSubtasks(taskId: string, userId: string): Promise<TaskDocument[]> {
    const task = await this.findByIdWithAccess(taskId, userId);
    return this.taskModel.find({ parentId: task._id }).sort({ order: 1 });
  }

  async getMyPriorityTasks(
    userId: string,
    limit: number = 3,
    projectId?: string,
  ): Promise<TaskDocument[]> {
    this.logger.log(`getMyPriorityTasks called for user: ${userId}`);

    if (projectId) {
      if (!Types.ObjectId.isValid(projectId)) {
        throw new BadRequestException('Invalid projectId');
      }
      await this.projectsService.findByIdWithAccess(projectId, userId);
    }

    const userObjectId = new Types.ObjectId(userId);

    const tasks = await this.taskModel
      .find({
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
        $or: [
          // Current task ownership/assignment fields
          { assigneeId: userObjectId },
          { assignee: userObjectId },
          { reporterId: userObjectId },
          { reporter: userObjectId },

          // Backward-compatible / alternate field names used by older task records
          { createdBy: userObjectId },
          { createdById: userObjectId },
          { assignedTo: userObjectId },
          { assignedToId: userObjectId },
        ],
        status: { $in: ['todo', 'in_progress', 'backlog', 'TODO', 'IN_PROGRESS', 'BACKLOG'] },
        completedAt: null,
      })
      .sort({
        priority: -1,
        isBlocking: -1,
        dueDate: 1,
        createdAt: -1,
      })
      .limit(limit)
      .populate({
        path: 'projectId',
        select: 'title name',
      })
      .lean()
      .exec();

    this.logger.log(`Found ${tasks.length} priority tasks`);
    return tasks.map((task: any) => ({
      ...task,
      projectName:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectName ||
        task?.projectTitle ||
        '',
      projectTitle:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectTitle ||
        task?.projectName ||
        '',
    }));
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);

    await this.assertTaskTextAllowed(userId, dto);

    const previousAssigneeId =
      task.assigneeId?.toString?.() || null;

    const previousStatus = task.status;

    const previousDueDate = task.dueDate
      ? new Date(task.dueDate)
      : null;

    if (dto.status && dto.status !== task.status) {
      if (dto.status === TaskStatus.DONE) {
        throw new BadRequestException('Use the complete endpoint to mark tasks as done');
      }
    }

    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : undefined;
      delete (dto as any).assigneeId;
    }

    if (dto.sprintId !== undefined) {
      task.sprintId = dto.sprintId ? new Types.ObjectId(dto.sprintId) : undefined;
      delete (dto as any).sprintId;
    }

    if (dto.milestoneId !== undefined) {
      task.milestoneId = dto.milestoneId ? new Types.ObjectId(dto.milestoneId) : undefined;
      delete (dto as any).milestoneId;
    }

    const previousBlockedBy = Array.isArray(task.blockedBy)
      ? task.blockedBy.map(
          (id: any) => id.toString(),
        )
      : [];

    let dependencyChanges:
      | {
          previousBlockedBy: string[];
          blockedBy: string[];
        }
      | undefined;

    if ((dto as any).blockedBy !== undefined) {
      const resolvedBlockedBy =
        await this.resolveTaskDependencies(
          task.projectId.toString(),
          task._id.toString(),
          (dto as any).blockedBy,
        );

      task.blockedBy = resolvedBlockedBy.map(
        (id) => new Types.ObjectId(id),
      );

      dependencyChanges = {
        previousBlockedBy,
        blockedBy: resolvedBlockedBy,
      };

      delete (dto as any).blockedBy;
    }

    Object.assign(task, dto);
    const updated = await task.save();

    if (dependencyChanges) {
      await this.updateBlockingRelationships(
        updated,
        dependencyChanges.previousBlockedBy,
      );
    }

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_UPDATED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: {
        ...(dto as any),
        ...(dependencyChanges
          ? {
              blockedBy: dependencyChanges.blockedBy,
              previousBlockedBy:
                dependencyChanges.previousBlockedBy,
            }
          : {}),
      },
    });

    const newAssigneeId =
      updated.assigneeId?.toString?.() || null;

    const assigneeChanged =
      newAssigneeId !== previousAssigneeId;

    const statusChanged =
      updated.status !== previousStatus;

    const newDueDate = updated.dueDate
      ? new Date(updated.dueDate)
      : null;

    const previousDueDateValue =
      previousDueDate?.getTime() ?? null;

    const newDueDateValue =
      newDueDate?.getTime() ?? null;

    const dueDateChanged =
      previousDueDateValue !==
      newDueDateValue;

    if (assigneeChanged && newAssigneeId && newAssigneeId !== userId) {
      const project = await this.projectsService.findById(updated.projectId.toString());
      this.eventEmitter.emit('task.assigned', {
        taskId: updated._id.toString(),
        taskTitle: updated.title,
        assigneeId: newAssigneeId,
        assignedBy: userId,
        projectId: updated.projectId.toString(),
        projectName: project?.name || '',
      });
    }

    if (statusChanged) {
      const fromStatus = String(
        previousStatus || 'previous stage',
      ).replace(/_/g, ' ');

      const toStatus = String(
        updated.status || 'new stage',
      ).replace(/_/g, ' ');

      await this.notifyTaskWatchers(
        updated,
        userId,
        'statusChanges',
        {
          type: NotificationType.TASK_MOVED,
          title: 'Move status changed',
          body:
            `${updated.title} moved from ` +
            `${fromStatus} to ${toStatus}.`,
          icon: '↔️',
          groupKeySuffix:
            String(updated.status),
          extra: {
            previousStatus,
            newStatus: updated.status,
          },
        },
      );
    }

    if (assigneeChanged) {
      await this.notifyTaskWatchers(
        updated,
        userId,
        'assignmentChanges',
        {
          type: NotificationType.TASK_UPDATED,
          title: 'Move assignment changed',
          body: newAssigneeId
            ? `${updated.title} has a new assignee.`
            : `${updated.title} is now unassigned.`,
          icon: '👤',
          groupKeySuffix:
            newAssigneeId || 'unassigned',
          extra: {
            previousAssigneeId,
            newAssigneeId,
          },
          excludeUserIds:
            newAssigneeId
              ? [newAssigneeId]
              : [],
        },
      );
    }

    if (dueDateChanged) {
      const dueDateLabel = newDueDate
        ? newDueDate.toISOString().slice(0, 10)
        : 'No due date';

      await this.notifyTaskWatchers(
        updated,
        userId,
        'dueDateChanges',
        {
          type: NotificationType.TASK_UPDATED,
          title: 'Move due date changed',
          body:
            `${updated.title}: ${dueDateLabel}.`,
          icon: '📅',
          groupKeySuffix:
            newDueDateValue === null
              ? 'removed'
              : String(newDueDateValue),
          extra: {
            previousDueDate:
              previousDueDate?.toISOString() ||
              null,
            newDueDate:
              newDueDate?.toISOString() ||
              null,
          },
        },
      );
    }

    this.realtime.projectEmit(task.projectId.toString(), 'taskUpdated', buildTaskSnapshot(updated));

    // ⭐ DIRECT REALTIME BOARD UPDATE FALLBACK
    try {
      let rtGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      if (rtGateway && rtGateway.server) {
        const payload = buildTaskSnapshot(updated);
        rtGateway.server.to(`project:${task.projectId.toString()}`).emit('taskUpdated', payload);
        rtGateway.server.to(task.projectId.toString()).emit('taskUpdated', payload);
      }
    } catch (err) {}

    await this.emitPublicProjectUpdate(task.projectId.toString(), {
      type: 'task.updated',
      projectId: task.projectId.toString(),
      data: buildTaskSnapshot(updated),
      createdAt: new Date(),
    });

    return updated;
  }

  async move(taskId: string, userId: string, dto: MoveTaskDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    const previousStatus = task.status;

    if (dto.status) {
      if (dto.status === TaskStatus.DONE) {
        throw new BadRequestException('Use the complete endpoint to mark tasks as done');
      }
      task.status = dto.status;
    }

    if (typeof dto.order === 'number') {
      task.order = dto.order;
    }

    if (dto.sprintId !== undefined) {
      task.sprintId = dto.sprintId ? new Types.ObjectId(dto.sprintId) : undefined;
    }

    const updated = await task.save();

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_MOVED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: {
        previousStatus,
        newStatus: updated.status,
        order: dto.order,
        sprintId: dto.sprintId,
      },
    });

    if (previousStatus !== updated.status) {
      const fromStatus = String(
        previousStatus || 'previous stage',
      ).replace(/_/g, ' ');

      const toStatus = String(
        updated.status || 'new stage',
      ).replace(/_/g, ' ');

      await this.notifyTaskWatchers(
        updated,
        userId,
        'statusChanges',
        {
          type: NotificationType.TASK_MOVED,
          title: 'Move status changed',
          body:
            `${updated.title} moved from ` +
            `${fromStatus} to ${toStatus}.`,
          icon: '↔️',
          groupKeySuffix:
            String(updated.status),
          extra: {
            previousStatus,
            newStatus: updated.status,
          },
        },
      );
    }

    // ProjectHome Flow email fan-out:
    // Only notify on real column/status changes, not simple reorder changes.
    if (previousStatus !== updated.status) {
      try {
        let notificationsService: NotificationsService | null = null;
        try {
          notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
        } catch (serviceErr) {}

        if (notificationsService?.notify) {
          const projectDoc: any = await this.projectsService.findById(updated.projectId.toString());

          const rawMembers = [
            ...(Array.isArray(projectDoc?.members) ? projectDoc.members : []),
            ...(Array.isArray(projectDoc?.sharedWith) ? projectDoc.sharedWith : []),
            ...(Array.isArray(projectDoc?.participantIds) ? projectDoc.participantIds : []),
            ...(Array.isArray(projectDoc?.collaborators) ? projectDoc.collaborators : []),
          ];

          const allAssociatedIds: any[] = [
            projectDoc?.ownerId,
            projectDoc?.owner,
            projectDoc?.createdBy,
            ...rawMembers.map((m: any) => m?.userId || m?.memberId || m?.user || m?._id || m),
          ];

            const moveWatcherIds =
              new Set(
                this.getTaskWatcherIdsForPreference(
                  updated,
                  'statusChanges',
                ),
              );

            const recipientIds = [...new Set(
              allAssociatedIds
                .filter(Boolean)
                .map((id: any) => id.toString())
                .filter(
                  (id: string) =>
                    id &&
                    id !== userId &&
                    !moveWatcherIds.has(id),
                )
            )];

          const projectName = String(projectDoc?.name || projectDoc?.title || 'Project');
          const taskTitle = String((updated as any)?.title || 'Task');
          const fromStatus = String(previousStatus || 'previous stage').replace(/_/g, ' ');
          const toStatus = String(updated.status || 'new stage').replace(/_/g, ' ');

          for (const recipientId of recipientIds) {
            try {
              await notificationsService.notify({
                userId: recipientId,
                type: 'task_moved' as any,
                title: `↔️ Task moved in ${projectName}`,
                body: `${taskTitle} moved from ${fromStatus} to ${toStatus}.`,
                icon: '↔️',
                priority: NotificationPriority.HIGH,
                triggeredBy: userId,
                data: {
                  projectId: updated.projectId.toString(),
                  projectName,
                  taskId: updated._id.toString(),
                  taskTitle,
                  previousStatus,
                  newStatus: updated.status,
                  emailFanoutEligible: true,
                  projectMemberNotification: true,
                } as any,
                actions: [
                  {
                    label: 'View Flow',
                    url: `/projects/${updated.projectId.toString()}?tab=flow`,
                  },
                ],
                groupKey: `task-moved-${recipientId}-${updated._id.toString()}-${updated.status}`,
              });
            } catch (recipientErr) {
              this.logger.warn(
                `Task moved notification fan-out failed for user ${recipientId}: ${
                  (recipientErr as any)?.message || recipientErr
                }`,
              );
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          `Task moved email notification skipped: ${(err as any)?.message || err}`,
        );
      }
    }

    if (previousStatus !== updated.status && updated.status === TaskStatus.REVIEW) {
      const project = await this.projectsService.findById(updated.projectId.toString());
      this.eventEmitter.emit('task.moved_to_review', {
        taskId: updated._id.toString(),
        taskTitle: updated.title,
        projectId: updated.projectId.toString(),
        projectName: project?.name || '',
        movedBy: userId,
        assigneeId: updated.assigneeId?.toString?.() || null,
        reporterId:
          (updated as any).reporterId?.toString?.() ||
          (updated as any).createdBy?.toString?.() ||
          null,
      });
    }

    this.realtime.projectEmit(task.projectId.toString(), 'taskUpdated', buildTaskSnapshot(updated));

    // ⭐ DIRECT REALTIME BOARD UPDATE FALLBACK
    try {
      let rtGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      if (rtGateway && rtGateway.server) {
        const payload = buildTaskSnapshot(updated);
        rtGateway.server.to(`project:${task.projectId.toString()}`).emit('taskUpdated', payload);
        rtGateway.server.to(task.projectId.toString()).emit('taskUpdated', payload);
      }
    } catch (err) {}

    await this.emitPublicProjectUpdate(task.projectId.toString(), {
      type: 'task.moved',
      projectId: task.projectId.toString(),
      data: buildTaskSnapshot(updated),
      createdAt: new Date(),
    });

    return updated;
  }

  async completeTask(
    taskId: string,
    userId: string,
    options?: { inFocusMode?: boolean },
  ): Promise<TaskDocument> {
    const result = await this.complete(taskId, userId, {
      ...(options?.inFocusMode !== undefined ? { inFocusMode: options.inFocusMode } : {}),
    } as any);

    return result.task;
  }

  async complete(taskId: string, userId: string, dto: CompleteTaskDto = {}): Promise<CompletionResult> {
    const task = await this.findByIdWithAccess(taskId, userId);

    if (task.status === TaskStatus.DONE) {
      throw new BadRequestException('Task is already completed');
    }

    const variableRewards = this.calculateVariableRewards(task.xpValue);

    task.status = TaskStatus.DONE;
    task.completedAt = new Date();
    task.completedBy = new Types.ObjectId(userId);
    task.bonusXP = variableRewards.bonusXP;
    task.isLegendary = variableRewards.isLegendary;

    if ((dto as any).actualHours) {
      task.actualHours = (dto as any).actualHours;
    }

    let ceremonyTier = task.determineCeremonyTier();
    if (variableRewards.isLegendary) ceremonyTier = CeremonyTier.PROJECT_SHIP;
    task.ceremonyTier = ceremonyTier;

    const totalXP = task.xpValue + variableRewards.bonusXP;

    await task.save();
    await this.projectsService.markTaskCompleted(task.projectId.toString());

    const unblocked = await this.unblockDependentTasks(task);

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_COMPLETED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: task._id.toString(),
      snapshot: buildTaskSnapshot(task),
      meta: {
        xpAwarded: totalXP,
        bonusXP: variableRewards.bonusXP,
        isLegendary: variableRewards.isLegendary,
        ceremonyTier,
        unblockedTaskIds: unblocked.map((t) => t._id.toString()),
        inFocusMode: !!(dto as any)?.inFocusMode,
      },
    });

    await this.notifyTaskWatchers(
      task,
      userId,
      'completion',
      {
        type: NotificationType.TASK_COMPLETED,
        title: 'Move completed',
        body: `${task.title} was completed.`,
        icon: '✅',
        priority: NotificationPriority.HIGH,
        groupKeySuffix: 'completed',
        extra: {
          completedAt:
            task.completedAt?.toISOString?.() ||
            new Date().toISOString(),
        },
      },
    );

    const completionWatcherIds =
      new Set(
        this.getTaskWatcherIdsForPreference(
          task,
          'completion',
        ),
      );

    let taskCompletedProjectName = 'Project';
    let taskCompletedProjectMembers: Array<{
      userId?: string | null;
      memberId?: string | null;
      notificationsEnabled: boolean;
    }> = [];

    try {
      const projectForTaskCompletedNotification = await this.projectsService.findById(
        task.projectId.toString(),
      );

      taskCompletedProjectName = String(
        (projectForTaskCompletedNotification as any)?.name ||
          (projectForTaskCompletedNotification as any)?.title ||
          (projectForTaskCompletedNotification as any)?.projectName ||
          'Project',
      );

      const seenMemberIds = new Set<string>();

      const addProjectMember = (
        rawUserId: unknown,
        rawMemberId: unknown = null,
        notificationsEnabled = true,
      ) => {
        const userIdValue = rawUserId ? String(rawUserId) : '';
        const memberIdValue = rawMemberId ? String(rawMemberId) : '';
        const recipientId = userIdValue || memberIdValue;

          if (
            !recipientId ||
            seenMemberIds.has(recipientId) ||
            completionWatcherIds.has(recipientId)
          ) {
            return;
          }

        seenMemberIds.add(recipientId);
        taskCompletedProjectMembers.push({
          userId: userIdValue || null,
          memberId: memberIdValue || null,
          notificationsEnabled,
        });
      };

      const members = Array.isArray((projectForTaskCompletedNotification as any)?.members)
        ? (projectForTaskCompletedNotification as any).members
        : [];

      for (const member of members) {
        addProjectMember(
          member?.userId,
          member?.memberId,
          member?.preferences?.notifications !== false,
        );
      }

      for (const ownerCandidate of [
        (projectForTaskCompletedNotification as any)?.ownerId,
        (projectForTaskCompletedNotification as any)?.owner,
        (projectForTaskCompletedNotification as any)?.createdBy,
        (projectForTaskCompletedNotification as any)?.createdById,
        (projectForTaskCompletedNotification as any)?.userId,
      ]) {
        addProjectMember(ownerCandidate, null, true);
      }
    } catch (err: any) {
      this.logger.warn(
        `Task completed member fan-out enrichment skipped for task ${task._id.toString()}: ${
          err?.message || err
        }`,
      );
    }

    this.eventEmitter.emit('task.completed', {
      taskId: task._id.toString(),
      taskTitle: task.title,
      projectId: task.projectId.toString(),
      projectName: taskCompletedProjectName,
      projectMembers: taskCompletedProjectMembers,
      userId,
      xpAwarded: totalXP,
      isLegendary: variableRewards.isLegendary,
      ceremonyTier: ceremonyTier as any,
    });

    this.realtime.projectEmit(task.projectId.toString(), 'taskUpdated', buildTaskSnapshot(task));

    await this.emitPublicProjectUpdate(task.projectId.toString(), {
      type: 'task.completed',
      projectId: task.projectId.toString(),
      data: buildTaskSnapshot(task),
      createdAt: new Date(),
    });

    const completedAt = task.completedAt || new Date();
    const wasOnTime = task.dueDate ? completedAt <= new Date(task.dueDate) : true;
    const hour = completedAt.getHours();
    const isEarlyBird = hour < 9;

    const gamificationEvent: TaskCompletedEvent = {
      taskId: task._id.toString(),
      projectId: task.projectId.toString(),
      userId,
      title: task.title,
      priority: (task.priority as any) || 'medium',
      isBlocking: !!task.isBlocking,
      storyPoints: (task as any).storyPoints || 1,
      dueDate: task.dueDate,
      completedAt,
      wasOnTime,
      isEarlyBird,
      inFocusMode: !!(dto as any)?.inFocusMode,
    };

    this.eventEmitter.emit(EVENTS.TASK_COMPLETED, gamificationEvent);
    this.logger.log(`Task completed: ${taskId}, XP: ${totalXP}, Legendary: ${variableRewards.isLegendary}`);

    return {
      task,
      xpAwarded: totalXP,
      bonusXP: variableRewards.bonusXP,
      isLegendary: variableRewards.isLegendary,
      ceremonyTier,
      unblocked,
    };
  }

  async delete(
    taskId: string,
    userId: string,
  ): Promise<void> {
    const task = await this.findByIdWithAccess(
      taskId,
      userId,
    );

    const wasCompleted =
      task.status === TaskStatus.DONE;

    const deletedTaskId =
      new Types.ObjectId(task._id.toString());

    const previousDependencyIds = Array.isArray(
      task.blockedBy,
    )
      ? task.blockedBy.map(
          (id: any) => id.toString(),
        )
      : [];

    const dependentTasks = await this.taskModel
      .find({
        blockedBy: deletedTaskId,
      })
      .select("_id projectId")
      .lean()
      .exec();

    const dependentIds = dependentTasks.map(
      (dependent: any) => dependent._id,
    );

    if (dependentIds.length) {
      await this.taskModel.updateMany(
        {
          _id: {
            $in: dependentIds,
          },
        },
        {
          $pull: {
            blockedBy: deletedTaskId,
          },
        },
      );
    }

    if (previousDependencyIds.length) {
      await this.taskModel.updateMany(
        {
          _id: {
            $in: previousDependencyIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        },
        {
          $pull: {
            blocks: deletedTaskId,
          },
        },
      );
    }

    await this.taskModel.deleteMany({
      parentId: deletedTaskId,
    });

    await this.taskModel.deleteOne({
      _id: deletedTaskId,
    });

    await Promise.all(
      previousDependencyIds.map(
        async (blockingId) => {
          const blockingObjectId =
            new Types.ObjectId(blockingId);

          const activeBlockingCount =
            await this.taskModel.countDocuments({
              blockedBy: blockingObjectId,
              status: {
                $ne: TaskStatus.DONE,
              },
            });

          await this.taskModel.updateOne(
            {
              _id: blockingObjectId,
            },
            {
              $set: {
                blockingCount:
                  activeBlockingCount,
                isBlocking:
                  activeBlockingCount > 0,
              },
            },
          );
        },
      ),
    );

    const changedTaskIds = [
      ...new Set([
        ...dependentIds.map(
          (id: any) => id.toString(),
        ),
        ...previousDependencyIds,
      ]),
    ];

    if (changedTaskIds.length) {
      const changedTasks = await this.taskModel
        .find({
          _id: {
            $in: changedTaskIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        })
        .exec();

      for (const changedTask of changedTasks) {
        this.realtime.projectEmit(
          changedTask.projectId.toString(),
          "taskUpdated",
          buildTaskSnapshot(changedTask),
        );
      }
    }

    await this.projectsService.decrementTaskCount(
      task.projectId.toString(),
      wasCompleted,
    );

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_DELETED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: task._id.toString(),
      snapshot: buildTaskSnapshot(task),
    });

    this.realtime.projectEmit(
      task.projectId.toString(),
      "taskUpdated",
      {
        id: task._id.toString(),
        projectId: task.projectId.toString(),
        deleted: true,
      },
    );

    await this.emitPublicProjectUpdate(
      task.projectId.toString(),
      {
        type: "task.deleted",
        projectId: task.projectId.toString(),
        data: {
          id: task._id.toString(),
          projectId:
            task.projectId.toString(),
          deleted: true,
        },
        createdAt: new Date(),
      },
    );

    this.logger.log(
      `Task deleted: ${taskId}`,
    );
  }

  async addComment(taskId: string, userId: string, dto: AddCommentDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);

    const commentId =
      new Types.ObjectId();

    task.comments.push({
      _id: commentId,
      userId: new Types.ObjectId(userId),
      content: (dto as any).content,
      mentions: (dto as any).mentions?.map((id: string) => new Types.ObjectId(id)) || [],
      createdAt: new Date(),
      isEdited: false,
    } as any);

    const updated = await task.save();

    const commentProject = await this.projectsService.findById(task.projectId.toString());

    this.eventEmitter.emit('task.comment.added', {
      taskId: task._id.toString(),
      taskTitle: task.title,
      projectId: task.projectId.toString(),
      projectName: commentProject?.name || '',
      userId,
      mentions: (dto as any).mentions || [],
      commentPreview: String((dto as any).content || '').slice(0, 160),
    });

    const commentPreview = String(
      (dto as any).content || '',
    ).slice(0, 160);

    await this.notifyTaskWatchers(
      updated,
      userId,
      'comments',
      {
        type: NotificationType.TASK_COMMENT,
        title: 'New comment on a Move',
        body:
          `${updated.title}: ${commentPreview}`,
        icon: '💬',
        groupKeySuffix:
          commentId.toString(),
        extra: {
          commentId:
            commentId.toString(),
          commentPreview,
        },
        excludeUserIds:
          Array.isArray((dto as any).mentions)
            ? (dto as any).mentions
            : [],
      },
    );

    return updated;
  }

  async deleteComment(taskId: string, commentId: string, userId: string): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);

    const commentIndex = task.comments.findIndex((c: any) => c._id.toString() === commentId);
    if (commentIndex === -1) {
      throw new NotFoundException('Comment not found');
    }

    if (task.comments[commentIndex].userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    task.comments.splice(commentIndex, 1);
    return task.save();
  }

  async addAttachment(
    taskId: string,
    userId: string,
    dto: AddAttachmentDto,
  ): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(
      taskId,
      userId,
    );

    const fileId = String(dto.fileId || '').trim();
    const fileName = String(dto.fileName || '').trim();
    const fileUrl = String(dto.fileUrl || '').trim();
    const fileType = String(dto.fileType || '').trim();
    const fileSize = Number(dto.fileSize || 0);

    if (!fileId || !fileName || !fileUrl) {
      throw new BadRequestException(
        'File ID, file name, and file URL are required',
      );
    }

    if (!/^[A-Za-z0-9._~-]+$/.test(fileId)) {
      throw new BadRequestException(
        'Attachment file ID is invalid',
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize < 0 ||
      fileSize > 20 * 1024 * 1024
    ) {
      throw new BadRequestException(
        'Attachment must be 20 MB or smaller',
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      throw new BadRequestException(
        'Attachment URL is invalid',
      );
    }

    if (
      !['http:', 'https:'].includes(parsedUrl.protocol)
    ) {
      throw new BadRequestException(
        'Attachment URL must use HTTP or HTTPS',
      );
    }

    if (!parsedUrl.pathname.includes('/uploads/')) {
      throw new BadRequestException(
        'Attachment is not from the upload system',
      );
    }

    const approvedBases = [
      process.env.R2_PUBLIC_BASE_URL,
      process.env.UPLOADS_BASE_URL,
      process.env.PUBLIC_BACKEND_URL,
      process.env.API_PUBLIC_URL,
      process.env.BACKEND_URL,
      process.env.RENDER_EXTERNAL_URL,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\/+$/, ''));

    if (
      approvedBases.length > 0 &&
      !approvedBases.some(
        (base) =>
          fileUrl === base ||
          fileUrl.startsWith(`${base}/`),
      )
    ) {
      throw new BadRequestException(
        'Attachment URL is not from an approved upload location',
      );
    }

    if (!Array.isArray(task.attachments)) {
      task.attachments = [] as any;
    }

    const duplicate = task.attachments.some(
      (attachment: any) =>
        String(attachment?.fileId || '') === fileId ||
        String(
          attachment?.fileUrl ||
            attachment?.url ||
            '',
        ) === fileUrl,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This file is already attached to the task',
      );
    }

    task.attachments.push({
      fileId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      source: 'upload',
      name: fileName,
      url: fileUrl,
      type: fileType,
      size: fileSize,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
    } as any);

    const updated = await task.save();

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_UPDATED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: {
        attachmentAdded: {
          fileId,
          fileName,
        },
      } as any,
    });

    this.realtime.projectEmit(
      task.projectId.toString(),
      'taskUpdated',
      buildTaskSnapshot(updated),
    );

    return updated;
  }

  async addFileReference(
    taskId: string,
    userId: string,
    dto: LinkProjectFileDto,
  ): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(
      taskId,
      userId,
    );

    const fileId = String(
      dto?.fileId || '',
    ).trim();

    if (!Types.ObjectId.isValid(fileId)) {
      throw new BadRequestException(
        'Project File ID is invalid',
      );
    }

    const taskProjectId =
      task.projectId.toString();

    const file =
      await this.vaultService
        .findAccessibleFileForProject(
          fileId,
          taskProjectId,
          userId,
        );

    const fileProjectId = String(
      (file as any)?.projectId || '',
    );

    if (
      !fileProjectId ||
      fileProjectId !== taskProjectId
    ) {
      throw new ForbiddenException(
        'This File does not belong to the Move project',
      );
    }

    const fileStatus = String(
      (file as any)?.status || '',
    ).toLowerCase();

    const fileKind = String(
      (file as any)?.type || '',
    ).toLowerCase();

    if (
      fileStatus === 'deleted' ||
      (file as any)?.isArchived === true
    ) {
      throw new BadRequestException(
        'This project File is not available',
      );
    }

    if (fileKind === 'folder') {
      throw new BadRequestException(
        'Folders cannot be linked to a Move',
      );
    }

    const fileName = String(
      (file as any)?.name ||
        (file as any)?.originalName ||
        'Project file',
    ).trim();

    const fileUrl = String(
      (file as any)?.url ||
        (file as any)?.fileUrl ||
        '',
    ).trim();

    const fileType = String(
      (file as any)?.mimeType ||
        (file as any)?.fileType ||
        '',
    ).trim();

    const rawFileSize = Number(
      (file as any)?.size ??
        (file as any)?.sizeInBytes ??
        0,
    );

    const fileSize =
      Number.isFinite(rawFileSize) &&
      rawFileSize >= 0
        ? rawFileSize
        : 0;

    if (!fileName || !fileUrl) {
      throw new BadRequestException(
        'This project File is missing required file information',
      );
    }

    if (!Array.isArray(task.attachments)) {
      task.attachments = [] as any;
    }

    const duplicate = task.attachments.some(
      (attachment: any) =>
        String(
          attachment?.fileId || '',
        ) === fileId ||
        String(
          attachment?.fileUrl ||
            attachment?.url ||
            '',
        ) === fileUrl,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This project File is already linked to the Move',
      );
    }

    task.attachments.push({
      fileId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      source: 'project_file',
      name: fileName,
      url: fileUrl,
      type: fileType,
      size: fileSize,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
    } as any);

    const updated = await task.save();

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_UPDATED,
      projectId: taskProjectId,
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: {
        attachmentAdded: {
          fileId,
          fileName,
          source: 'project_file',
        },
      } as any,
    });

    this.realtime.projectEmit(
      taskProjectId,
      'taskUpdated',
      buildTaskSnapshot(updated),
    );

    return updated;
  }

  async deleteAttachment(
    taskId: string,
    fileId: string,
    userId: string,
  ): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(
      taskId,
      userId,
    );

    const normalizedFileId = String(fileId || '').trim();

    if (!Array.isArray(task.attachments)) {
      task.attachments = [] as any;
    }

    const attachmentIndex = task.attachments.findIndex(
      (attachment: any) =>
        String(attachment?.fileId || '') ===
        normalizedFileId,
    );

    if (attachmentIndex === -1) {
      throw new NotFoundException(
        'Attachment not found',
      );
    }

    const attachment: any =
      task.attachments[attachmentIndex];

    if (
      !attachment?.uploadedBy ||
      attachment.uploadedBy.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You can only remove attachments you uploaded',
      );
    }

    const removedFileName = String(
      attachment?.fileName ||
        attachment?.name ||
        'Attachment',
    );

    task.attachments.splice(attachmentIndex, 1);

    const updated = await task.save();

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_UPDATED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: {
        attachmentRemoved: {
          fileId: normalizedFileId,
          fileName: removedFileName,
        },
      } as any,
    });

    this.realtime.projectEmit(
      task.projectId.toString(),
      'taskUpdated',
      buildTaskSnapshot(updated),
    );

    return updated;
  }

  async logTime(taskId: string, userId: string, dto: LogTimeDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);

    task.timeLogs.push({
      userId: new Types.ObjectId(userId),
      minutes: (dto as any).minutes,
      description: (dto as any).description,
      loggedAt: new Date(),
    } as any);

    task.actualHours = task.timeLogs.reduce(
      (total: number, log: any) => total + log.minutes / 60,
      0,
    );

    return task.save();
  }

  private calculateBaseXP(priority: TaskPriority): number {
    const baseXP: Record<string, number> = {
      [TaskPriority.LOW]: 10,
      [TaskPriority.MEDIUM]: 25,
      [TaskPriority.HIGH]: 40,
      [TaskPriority.CRITICAL]: 75,
    };
    return baseXP[priority] || 25;
  }

  private calculateVariableRewards(baseXP: number): {
    bonusXP: number;
    isLegendary: boolean;
    multiplier: number;
  } {
    let bonusXP = 0;
    let isLegendary = false;
    let multiplier = 1;

    if (Math.random() < VARIABLE_REWARDS.LEGENDARY_CHANCE) {
      isLegendary = true;
      bonusXP = 1000;
      return { bonusXP, isLegendary, multiplier };
    }

    if (Math.random() < VARIABLE_REWARDS.BONUS_CHANCE) {
      bonusXP = Math.floor(baseXP * (0.5 + Math.random() * 1.5));
    }

    if (Math.random() < VARIABLE_REWARDS.MULTIPLIER_CHANCE) {
      multiplier = 1.5 + Math.random() * 1.5;
      bonusXP = Math.floor(bonusXP * multiplier);
    }

    return { bonusXP, isLegendary, multiplier };
  }

  private async resolveTaskDependencies(
    projectId: string,
    taskId: string | null,
    requestedIds: unknown,
  ): Promise<string[]> {
    const rawIds = Array.isArray(requestedIds)
      ? requestedIds
      : [];

    const uniqueIds = [
      ...new Set(
        rawIds
          .map((value) =>
            String(value || "").trim(),
          )
          .filter(Boolean),
      ),
    ];

    const invalidId = uniqueIds.find(
      (id) => !Types.ObjectId.isValid(id),
    );

    if (invalidId) {
      throw new BadRequestException(
        "One of the selected Move dependencies is invalid",
      );
    }

    if (taskId && uniqueIds.includes(taskId)) {
      throw new BadRequestException(
        "A Move cannot depend on itself",
      );
    }

    if (!uniqueIds.length) {
      return [];
    }

    const dependencies = await this.taskModel
      .find({
        _id: {
          $in: uniqueIds.map(
            (id) => new Types.ObjectId(id),
          ),
        },
        projectId: new Types.ObjectId(projectId),
      })
      .select("_id status blockedBy")
      .lean()
      .exec();

    if (dependencies.length !== uniqueIds.length) {
      throw new BadRequestException(
        "Dependencies must be Moves from the same project",
      );
    }

    const activeDependencyIds = new Set(
      dependencies
        .filter(
          (dependency: any) =>
            String(
              dependency?.status || "",
            ).toLowerCase() !== TaskStatus.DONE,
        )
        .map((dependency: any) =>
          dependency._id.toString(),
        ),
    );

    const resolvedIds = uniqueIds.filter(
      (id) => activeDependencyIds.has(id),
    );

    if (!taskId || !resolvedIds.length) {
      return resolvedIds;
    }

    const visited = new Set<string>();
    let frontier = [...resolvedIds];

    while (frontier.length) {
      const currentIds = frontier.filter(
        (id) => !visited.has(id),
      );

      if (!currentIds.length) break;

      currentIds.forEach(
        (id) => visited.add(id),
      );

      const currentTasks = await this.taskModel
        .find({
          _id: {
            $in: currentIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        })
        .select("_id blockedBy")
        .lean()
        .exec();

      const nextFrontier: string[] = [];

      for (const currentTask of currentTasks as any[]) {
        const nestedDependencies = Array.isArray(
          currentTask?.blockedBy,
        )
          ? currentTask.blockedBy
          : [];

        for (
          const nestedDependency
          of nestedDependencies
        ) {
          const nestedId =
            nestedDependency.toString();

          if (nestedId === taskId) {
            throw new BadRequestException(
              "This dependency would create a circular chain",
            );
          }

          if (!visited.has(nestedId)) {
            nextFrontier.push(nestedId);
          }
        }
      }

      frontier = nextFrontier;
    }

    return resolvedIds;
  }

  private async updateBlockingRelationships(
    task: TaskDocument,
    previousBlockedBy: string[] = [],
  ): Promise<void> {
    const taskId = task._id.toString();

    const currentBlockedBy = Array.isArray(
      task.blockedBy,
    )
      ? task.blockedBy.map(
          (id: any) => id.toString(),
        )
      : [];

    const previousIds = [
      ...new Set(
        previousBlockedBy.map(
          (id) => String(id),
        ),
      ),
    ];

    const currentIds = [
      ...new Set(currentBlockedBy),
    ];

    const removedIds = previousIds.filter(
      (id) => !currentIds.includes(id),
    );

    if (removedIds.length) {
      await this.taskModel.updateMany(
        {
          _id: {
            $in: removedIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        },
        {
          $pull: {
            blocks: new Types.ObjectId(taskId),
          },
        },
      );
    }

    if (currentIds.length) {
      await this.taskModel.updateMany(
        {
          _id: {
            $in: currentIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        },
        {
          $addToSet: {
            blocks: new Types.ObjectId(taskId),
          },
        },
      );
    }

    const affectedIds = [
      ...new Set([
        ...previousIds,
        ...currentIds,
      ]),
    ];

    await Promise.all(
      affectedIds.map(async (blockingId) => {
        const blockingObjectId =
          new Types.ObjectId(blockingId);

        const activeBlockingCount =
          await this.taskModel.countDocuments({
            blockedBy: blockingObjectId,
            status: {
              $ne: TaskStatus.DONE,
            },
          });

        await this.taskModel.updateOne(
          {
            _id: blockingObjectId,
          },
          {
            $set: {
              blockingCount:
                activeBlockingCount,
              isBlocking:
                activeBlockingCount > 0,
            },
          },
        );
      }),
    );
  }

  private async unblockDependentTasks(
    completedTask: TaskDocument,
  ): Promise<TaskDocument[]> {
    const completedTaskId =
      new Types.ObjectId(
        completedTask._id.toString(),
      );

    const dependents = await this.taskModel
      .find({
        blockedBy: completedTaskId,
      })
      .select("_id")
      .lean()
      .exec();

    const dependentIds = dependents.map(
      (dependent: any) => dependent._id,
    );

    if (dependentIds.length) {
      await this.taskModel.updateMany(
        {
          _id: {
            $in: dependentIds,
          },
        },
        {
          $pull: {
            blockedBy: completedTaskId,
          },
        },
      );
    }

    await this.taskModel.updateOne(
      {
        _id: completedTaskId,
      },
      {
        $set: {
          blocks: [],
          isBlocking: false,
          blockingCount: 0,
        },
      },
    );

    if (!dependentIds.length) {
      return [];
    }

    const updatedDependents =
      await this.taskModel
        .find({
          _id: {
            $in: dependentIds,
          },
        })
        .exec();

    for (const dependent of updatedDependents) {
      this.realtime.projectEmit(
        dependent.projectId.toString(),
        "taskUpdated",
        buildTaskSnapshot(dependent),
      );
    }

    return updatedDependents.filter(
      (dependent) =>
        dependent.status !== TaskStatus.DONE &&
        (
          !Array.isArray(dependent.blockedBy) ||
          dependent.blockedBy.length === 0
        ),
    );
  }
}

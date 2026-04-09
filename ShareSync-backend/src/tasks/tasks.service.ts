// src/tasks/tasks.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS SERVICE: Business Logic with Gamification & Real-time Shotgun Engine
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
import { CreateTaskDto } from './dto/create-task.dto';
import {
  UpdateTaskDto,
  MoveTaskDto,
  CompleteTaskDto,
  AddCommentDto,
  LogTimeDto,
} from './dto/update-task.dto';

import { TaskEventType } from './events/task-events';
import { buildTaskSnapshot, emitTaskEvent } from './events/task-event.utils';
import { RealtimeService } from '../realtime/realtime.service';

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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtime: RealtimeService,
    private readonly moduleRef: ModuleRef,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // PULSE METRICS ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  async getPulseMetrics(projectId: string): Promise<any> {
    const projId = new Types.ObjectId(projectId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [doneToday, createdToday, inMotion, blocked, movedToReviewToday, doneLast7Days] = await Promise.all([
      this.taskModel.countDocuments({ projectId: projId, status: TaskStatus.DONE, completedAt: { $gte: today } }),
      this.taskModel.countDocuments({ projectId: projId, createdAt: { $gte: today } }),
      this.taskModel.countDocuments({ projectId: projId, status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } }),
      this.taskModel.countDocuments({ projectId: projId, blockedBy: { $exists: true, $not: { $size: 0 } }, status: { $ne: TaskStatus.DONE } }),
      this.taskModel.countDocuments({ projectId: projId, status: TaskStatus.REVIEW, updatedAt: { $gte: today } }),
      this.taskModel.countDocuments({ projectId: projId, status: TaskStatus.DONE, completedAt: { $gte: sevenDaysAgo } })
    ]);

    return {
      doneToday,
      createdToday,
      inMotion,
      blocked,
      movedToReviewToday,
      doneLast7Days
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  private async emitPublicProjectUpdate(projectId: string, payload: any): Promise<void> {
    try {
      const project = await this.projectsService.findById(projectId);
      if ((project as any)?.public === true) {
        this.realtime.roomEmit?.(`public:project:${projectId}`, 'public:project:update', payload);
      }
    } catch (_err) {}
  }

  // Helper for Shotgun Broadcasts
  private async shotgunBroadcast(projectId: string, userId: string, type: string, title: string, body: string, extraData: any = {}) {
    let rtGateway: any = null;
    let notifGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

    try {
      const db = this.taskModel.db;
      const projectDoc = await db.collection('projects').findOne({ _id: new Types.ObjectId(projectId) });

      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
        const allAssociatedIds: any[] = [projectDoc.ownerId, projectDoc.owner, ...rawMembers.map((m: any) => m?.userId || m?._id || m)];
        const memberIdsToNotify = [...new Set(allAssociatedIds.filter(Boolean).map(id => id.toString()).filter(id => id !== userId))];
        const safeProjectName = projectDoc.name || projectDoc.title || 'Project';

        for (const recipientId of memberIdsToNotify) {
          const notif = {
            userId: new Types.ObjectId(recipientId),
            type,
            title,
            body,
            data: { projectId, projectName: safeProjectName, ...extraData },
            channels: ['in_app'],
            priority: 'normal',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const res = await db.collection('notifications').insertOne(notif);
          const savedNotif = await db.collection('notifications').findOne({ _id: res.insertedId });

          if (notifGateway?.server) notifGateway.server.to(recipientId).emit('new_notification', savedNotif);
          if (rtGateway?.server) rtGateway.server.to(recipientId).emit('new_notification', savedNotif);
        }

        // Live Room Override
        const liveNotif = { type, title, body, data: { projectId, ...extraData }, createdAt: new Date() };
        if (notifGateway?.server) notifGateway.server.to(`project:${projectId}`).emit('new_notification', liveNotif);
        if (rtGateway?.server) rtGateway.server.to(`project:${projectId}`).emit('new_notification', liveNotif);
      }
    } catch (err) { this.logger.error('Shotgun failed', err); }
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDocument> {
    const project = await this.projectsService.findByIdWithAccess(dto.projectId, userId);

    if (dto.parentId) {
      const parent = await this.taskModel.findById(dto.parentId);
      if (!parent || parent.projectId.toString() !== dto.projectId) {
        throw new BadRequestException('Invalid parent task');
      }
    }

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
      blockedBy: dto.blockedBy?.map((id) => new Types.ObjectId(id)) || [],
      xpValue,
    });

    const saved = await task.save();
    await this.projectsService.incrementTaskCount(dto.projectId);

    if (dto.blockedBy?.length) await this.updateBlockingRelationships(saved);

    // ⭐ BROADCAST
    await this.shotgunBroadcast(dto.projectId, userId, 'task_created', `📝 New Task in ${project?.name || 'Project'}`, dto.title, { taskId: saved._id });
    
    // Board Refresh
    let rtGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    if (rtGateway?.server) rtGateway.server.to(`project:${dto.projectId}`).emit('taskUpdated', buildTaskSnapshot(saved));

    return saved;
  }

  async findById(taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  async findByIdWithAccess(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.findById(taskId);
    await this.projectsService.findByIdWithAccess(task.projectId.toString(), userId);
    return task;
  }

  async find(userId: string, options: TaskQueryOptions = {}): Promise<{ tasks: any[]; total: number }> {
    const { projectId, assigneeId, status, priority, sprintId, search, tags, isBlocking, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
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
      this.taskModel.find(query).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(offset).limit(limit).lean(),
      this.taskModel.countDocuments(query),
    ]);
    return { tasks, total };
  }

  async getKanbanBoard(projectId: string, userId: string, sprintId?: string): Promise<KanbanBoard> {
    await this.projectsService.findByIdWithAccess(projectId, userId);
    const query: any = { projectId: new Types.ObjectId(projectId) };
    if (sprintId) query.sprintId = new Types.ObjectId(sprintId);
    const tasks = await this.taskModel.find(query).sort({ order: 1 }).lean();
    const board: KanbanBoard = { [TaskStatus.BACKLOG]: [], [TaskStatus.TODO]: [], [TaskStatus.IN_PROGRESS]: [], [TaskStatus.REVIEW]: [], [TaskStatus.DONE]: [] };
    for (const task of tasks) if (board[task.status]) board[task.status].push(task);
    return board;
  }

  async getPriorityStack(projectId: string, userId: string, assigneeId?: string, limit: number = 10): Promise<TaskDocument[]> {
    await this.projectsService.findByIdWithAccess(projectId, userId);
    const query: any = { projectId: new Types.ObjectId(projectId), status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } };
    if (assigneeId) query.assigneeId = new Types.ObjectId(assigneeId);
    return this.taskModel.find(query).sort({ priority: -1, isBlocking: -1, stackOrder: 1, dueDate: 1 }).limit(limit);
  }

  async getSubtasks(taskId: string, userId: string): Promise<TaskDocument[]> {
    const task = await this.findByIdWithAccess(taskId, userId);
    return this.taskModel.find({ parentId: task._id }).sort({ order: 1 });
  }

  async getMyPriorityTasks(userId: string, limit: number = 3, projectId?: string): Promise<TaskDocument[]> {
    if (projectId) await this.projectsService.findByIdWithAccess(projectId, userId);
    return this.taskModel.find({
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
        $or: [{ assigneeId: new Types.ObjectId(userId) }, { assignee: new Types.ObjectId(userId) }, { reporterId: new Types.ObjectId(userId) }, { reporter: new Types.ObjectId(userId) }],
        status: { $in: ['todo', 'in_progress', 'backlog', 'TODO', 'IN_PROGRESS', 'BACKLOG'] },
        completedAt: null,
      }).sort({ priority: -1, isBlocking: -1, dueDate: 1, createdAt: -1 }).limit(limit).exec();
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    if (dto.status && dto.status !== task.status && dto.status === TaskStatus.DONE) {
      throw new BadRequestException('Use the complete endpoint to mark tasks as done');
    }
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : undefined;
    if (dto.sprintId !== undefined) task.sprintId = dto.sprintId ? new Types.ObjectId(dto.sprintId) : undefined;
    if (dto.milestoneId !== undefined) task.milestoneId = dto.milestoneId ? new Types.ObjectId(dto.milestoneId) : undefined;
    if ((dto as any).blockedBy) {
      task.blockedBy = (dto as any).blockedBy.map((id: string) => new Types.ObjectId(id));
      await this.updateBlockingRelationships(task);
    }
    Object.assign(task, dto);
    const updated = await task.save();

    // ⭐ SHOTGUN
    let rtGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    if (rtGateway?.server) {
      const payload = buildTaskSnapshot(updated);
      rtGateway.server.to(`project:${task.projectId}`).emit('taskUpdated', payload);
    }

    return updated;
  }

  async move(taskId: string, userId: string, dto: MoveTaskDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    if (dto.status === TaskStatus.DONE) throw new BadRequestException('Use the complete endpoint');
    if (dto.status) task.status = dto.status;
    if (typeof dto.order === 'number') task.order = dto.order;
    const updated = await task.save();

    // ⭐ SHOTGUN
    let rtGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    if (rtGateway?.server) {
      const payload = buildTaskSnapshot(updated);
      rtGateway.server.to(`project:${task.projectId}`).emit('taskUpdated', payload);
      rtGateway.server.to(`project:${task.projectId}`).emit('taskMoved', payload);
    }

    return updated;
  }

  async complete(taskId: string, userId: string, dto: CompleteTaskDto = {}): Promise<CompletionResult> {
    const task = await this.findByIdWithAccess(taskId, userId);
    if (task.status === TaskStatus.DONE) throw new BadRequestException('Task already completed');

    const variableRewards = this.calculateVariableRewards(task.xpValue);
    task.status = TaskStatus.DONE;
    task.completedAt = new Date();
    task.completedBy = new Types.ObjectId(userId);
    task.bonusXP = variableRewards.bonusXP;
    task.isLegendary = variableRewards.isLegendary;
    task.ceremonyTier = variableRewards.isLegendary ? CeremonyTier.PROJECT_SHIP : task.determineCeremonyTier();

    const totalXP = task.xpValue + variableRewards.bonusXP;
    await task.save();
    await this.projectsService.markTaskCompleted(task.projectId.toString());
    const unblocked = await this.unblockDependentTasks(task);

    // ⭐ SHOTGUN
    await this.shotgunBroadcast(task.projectId.toString(), userId, 'task_completed', `🔥 Task Completed!`, task.title, { taskId: task._id, xp: totalXP });
    
    let rtGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    if (rtGateway?.server) {
      const payload = buildTaskSnapshot(task);
      rtGateway.server.to(`project:${task.projectId}`).emit('taskUpdated', payload);
      rtGateway.server.to(`project:${task.projectId}`).emit('taskCompleted', { ...payload, totalXP, isLegendary: task.isLegendary });
    }

    return { task, xpAwarded: totalXP, bonusXP: variableRewards.bonusXP, isLegendary: variableRewards.isLegendary, ceremonyTier: task.ceremonyTier, unblocked };
  }

  async delete(taskId: string, userId: string): Promise<void> {
    const task = await this.findByIdWithAccess(taskId, userId);
    const wasCompleted = task.status === TaskStatus.DONE;
    await this.taskModel.updateMany({ blockedBy: task._id }, { $pull: { blockedBy: task._id } });
    await this.taskModel.deleteMany({ parentId: task._id });
    await this.taskModel.deleteOne({ _id: task._id });
    await this.projectsService.decrementTaskCount(task.projectId.toString(), wasCompleted);
    
    let rtGateway: any = null;
    try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
    if (rtGateway?.server) rtGateway.server.to(`project:${task.projectId}`).emit('taskDeleted', { id: task._id });
  }

  async addComment(taskId: string, userId: string, dto: AddCommentDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    task.comments.push({ _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), content: (dto as any).content, createdAt: new Date(), isEdited: false } as any);
    return task.save();
  }

  async logTime(taskId: string, userId: string, dto: LogTimeDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    task.timeLogs.push({ userId: new Types.ObjectId(userId), minutes: (dto as any).minutes, loggedAt: new Date() } as any);
    task.actualHours = task.timeLogs.reduce((total: number, log: any) => total + log.minutes / 60, 0);
    return task.save();
  }

  private calculateBaseXP(priority: TaskPriority): number {
    const baseXP: Record<string, number> = { [TaskPriority.LOW]: 10, [TaskPriority.MEDIUM]: 25, [TaskPriority.HIGH]: 40, [TaskPriority.CRITICAL]: 75 };
    return baseXP[priority] || 25;
  }

  private calculateVariableRewards(baseXP: number) {
    let bonusXP = 0; let isLegendary = false;
    if (Math.random() < 0.01) { isLegendary = true; bonusXP = 1000; }
    else if (Math.random() < 0.15) { bonusXP = Math.floor(baseXP * (0.5 + Math.random())); }
    return { bonusXP, isLegendary };
  }

  private async updateBlockingRelationships(task: TaskDocument): Promise<void> {
    if (task.blockedBy?.length) {
      await this.taskModel.updateMany({ _id: { $in: task.blockedBy } }, { $addToSet: { blocks: task._id }, $set: { isBlocking: true } });
    }
  }

  private async unblockDependentTasks(completedTask: TaskDocument): Promise<TaskDocument[]> {
    const unblocked = await this.taskModel.find({ blockedBy: completedTask._id });
    await this.taskModel.updateMany({ blockedBy: completedTask._id }, { $pull: { blockedBy: completedTask._id } });
    await this.taskModel.updateOne({ _id: completedTask._id }, { $set: { isBlocking: false, blockingCount: 0 } });
    return unblocked;
  }
}

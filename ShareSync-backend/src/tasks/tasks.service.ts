// src/tasks/tasks.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS SERVICE: Business Logic with Gamification Integration
// + Normalized Task Mutation Events (3.3)
// + Realtime Socket Emits (Step 4)
// + Step 5 Notification Touchpoints (task.assigned / task.completed / task.moved_to_review)
// + ✅ Public Spectator Stream (public:project:{projectId}) (Step 6)
// + ✅ Priority 1: First-task XP bonus, first-completion XP bonus, template task creation
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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

// ✅ Priority 1: UserService for first-task/first-ship tracking
import { UserService } from '../user/user.service';

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

// ✅ Priority 1: Onboarding XP bonuses
const ONBOARDING_XP = {
  FIRST_TASK_CREATED: 50,
  FIRST_TASK_COMPLETED: 100,
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

    // ✅ Priority 1: Inject UserService via forwardRef to avoid circular dependency
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  private async emitPublicProjectUpdate(projectId: string, payload: any): Promise<void> {
    try {
      const project = await this.projectsService.findById(projectId);
      if ((project as any)?.public === true) {
        this.realtime.roomEmit?.(`public:project:${projectId}`, 'public:project:update', payload);
      }
    } catch (_err) {}
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

    if (dto.blockedBy?.length) {
      await this.updateBlockingRelationships(saved);
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

    // ═════════════════════════════════════════════════════════════════════════
    // ✅ PRIORITY 1: First-task-created XP bonus (non-blocking)
    // ═════════════════════════════════════════════════════════════════════════
    try {
      const user = await this.userService.findById(userId);
      if (user) {
        // Count user's total tasks (including this one just created)
        const totalUserTasks = await this.taskModel.countDocuments({
          $or: [
            { reporterId: new Types.ObjectId(userId) },
            { createdBy: new Types.ObjectId(userId) },
          ],
        });

        // If this is their very first task, award bonus XP
        if (totalUserTasks === 1) {
          this.logger.log(`🎉 First task created by user ${userId}! Awarding +${ONBOARDING_XP.FIRST_TASK_CREATED} bonus XP`);
          this.eventEmitter.emit('onboarding.first_task_created', {
            userId,
            taskId: saved._id.toString(),
            bonusXP: ONBOARDING_XP.FIRST_TASK_CREATED,
          });
        }
      }
    } catch (err) {
      // Non-blocking: don't fail task creation if bonus check fails
      this.logger.warn(`First-task bonus check failed (non-blocking): ${err}`);
    }

    this.logger.log(`Task created: ${saved._id}`);
    return saved;
  }

  async findById(taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId);
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
  ): Promise<TaskDocument[]> {
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

    const tasks = await this.taskModel
      .find({
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
        $or: [
          { assigneeId: new Types.ObjectId(userId) },
          { assignee: new Types.ObjectId(userId) },
          { reporterId: new Types.ObjectId(userId) },
          { reporter: new Types.ObjectId(userId) },
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
      .exec();

    this.logger.log(`Found ${tasks.length} priority tasks`);
    return tasks;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);
    const previousAssigneeId = task.assigneeId?.toString?.() || null;

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

    if ((dto as any).blockedBy) {
      task.blockedBy = (dto as any).blockedBy.map((id: string) => new Types.ObjectId(id));
      await this.updateBlockingRelationships(task);
      delete (dto as any).blockedBy;
    }

    Object.assign(task, dto);
    const updated = await task.save();

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_UPDATED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: updated._id.toString(),
      snapshot: buildTaskSnapshot(updated),
      changes: dto as any,
    });

    const newAssigneeId = updated.assigneeId?.toString?.() || null;
    const assigneeChanged = newAssigneeId !== previousAssigneeId;

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

    this.realtime.projectEmit(task.projectId.toString(), 'taskUpdated', buildTaskSnapshot(updated));

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

    this.eventEmitter.emit('task.completed', {
      taskId: task._id.toString(),
      projectId: task.projectId.toString(),
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

    // ═════════════════════════════════════════════════════════════════════════
    // ✅ PRIORITY 1: First-task-completed bonus + first-ship recording (non-blocking)
    // ═════════════════════════════════════════════════════════════════════════
    try {
      const user = await this.userService.findById(userId);
      if (user) {
        const totalCompleted = await this.taskModel.countDocuments({
          completedBy: new Types.ObjectId(userId),
          status: TaskStatus.DONE,
        });

        // If this is their very first completion (count=1 because we just completed it)
        if (totalCompleted === 1) {
          this.logger.log(`🎉 First task completed by user ${userId}! Awarding +${ONBOARDING_XP.FIRST_TASK_COMPLETED} bonus XP`);
          this.eventEmitter.emit('onboarding.first_task_completed', {
            userId,
            taskId: task._id.toString(),
            bonusXP: ONBOARDING_XP.FIRST_TASK_COMPLETED,
          });

          // Record first-ship timestamp for aha moment metric
          await this.userService.recordFirstShip(userId);
        }
      }
    } catch (err) {
      // Non-blocking: don't fail task completion if bonus check fails
      this.logger.warn(`First-completion bonus check failed (non-blocking): ${err}`);
    }

    return {
      task,
      xpAwarded: totalXP,
      bonusXP: variableRewards.bonusXP,
      isLegendary: variableRewards.isLegendary,
      ceremonyTier,
      unblocked,
    };
  }

  async delete(taskId: string, userId: string): Promise<void> {
    const task = await this.findByIdWithAccess(taskId, userId);
    const wasCompleted = task.status === TaskStatus.DONE;

    await this.taskModel.updateMany({ blockedBy: task._id }, { $pull: { blockedBy: task._id } });
    await this.taskModel.updateMany({ blocks: task._id }, { $pull: { blocks: task._id } });
    await this.taskModel.deleteMany({ parentId: task._id });
    await this.taskModel.deleteOne({ _id: task._id });

    await this.projectsService.decrementTaskCount(task.projectId.toString(), wasCompleted);

    emitTaskEvent({
      eventEmitter: this.eventEmitter,
      type: TaskEventType.TASK_DELETED,
      projectId: task.projectId.toString(),
      actorId: userId,
      taskId: task._id.toString(),
      snapshot: buildTaskSnapshot(task),
    });

    this.realtime.projectEmit(task.projectId.toString(), 'taskUpdated', {
      id: task._id.toString(),
      projectId: task.projectId.toString(),
      deleted: true,
    });

    await this.emitPublicProjectUpdate(task.projectId.toString(), {
      type: 'task.deleted',
      projectId: task.projectId.toString(),
      data: {
        id: task._id.toString(),
        projectId: task.projectId.toString(),
        deleted: true,
      },
      createdAt: new Date(),
    });

    this.logger.log(`Task deleted: ${taskId}`);
  }

  async addComment(taskId: string, userId: string, dto: AddCommentDto): Promise<TaskDocument> {
    const task = await this.findByIdWithAccess(taskId, userId);

    task.comments.push({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      content: (dto as any).content,
      mentions: (dto as any).mentions?.map((id: string) => new Types.ObjectId(id)) || [],
      createdAt: new Date(),
      isEdited: false,
    } as any);

    const updated = await task.save();

    this.eventEmitter.emit('task.comment.added', {
      taskId: task._id,
      projectId: task.projectId,
      userId,
      mentions: (dto as any).mentions,
    });

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

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ PRIORITY 1: EVENT LISTENER — Create template tasks when project created from template
  // Listens for the event emitted by ProjectsService.createFromTemplate()
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('project.template.tasks.create')
  async handleTemplateTasks(payload: {
    projectId: string;
    userId: string;
    tasks: Array<{
      title: string;
      description: string;
      priority: string;
      tags: string[];
    }>;
  }): Promise<void> {
    this.logger.log(`Creating ${payload.tasks.length} template tasks for project ${payload.projectId}`);

    for (let i = 0; i < payload.tasks.length; i++) {
      const templateTask = payload.tasks[i];
      try {
        const task = new this.taskModel({
          title: templateTask.title,
          description: templateTask.description,
          priority: templateTask.priority || 'medium',
          tags: templateTask.tags || [],
          projectId: new Types.ObjectId(payload.projectId),
          reporterId: new Types.ObjectId(payload.userId),
          createdBy: new Types.ObjectId(payload.userId),
          status: TaskStatus.TODO,
          order: i,
          xpValue: this.calculateBaseXP((templateTask.priority as TaskPriority) || TaskPriority.MEDIUM),
        });

        await task.save();
        await this.projectsService.incrementTaskCount(payload.projectId);
      } catch (err) {
        this.logger.warn(`Failed to create template task "${templateTask.title}": ${err}`);
        // Continue creating other tasks even if one fails
      }
    }

    this.logger.log(`✅ Template tasks created for project ${payload.projectId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

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

  private async updateBlockingRelationships(task: TaskDocument): Promise<void> {
    if (task.blockedBy?.length) {
      await this.taskModel.updateMany(
        { _id: { $in: task.blockedBy } },
        { $addToSet: { blocks: task._id }, $set: { isBlocking: true } },
      );

      for (const blockingId of task.blockedBy) {
        const count = await this.taskModel.countDocuments({
          blockedBy: blockingId,
          status: { $ne: TaskStatus.DONE },
        });

        await this.taskModel.updateOne({ _id: blockingId }, { $set: { blockingCount: count } });
      }
    }
  }

  private async unblockDependentTasks(completedTask: TaskDocument): Promise<TaskDocument[]> {
    const unblocked = await this.taskModel.find({ blockedBy: completedTask._id });

    await this.taskModel.updateMany(
      { blockedBy: completedTask._id },
      { $pull: { blockedBy: completedTask._id } },
    );

    await this.taskModel.updateOne(
      { _id: completedTask._id },
      { $set: { isBlocking: false, blockingCount: 0 } },
    );

    return unblocked;
  }
}

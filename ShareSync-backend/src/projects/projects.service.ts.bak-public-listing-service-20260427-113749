// src/projects/projects.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SERVICE: Business Logic for Project Management
// Phase K: Added real-time event emission to recordShipUpdate for global analytics sync
// Overview data pass: real overview derivation for ProjectHome
// Active Goals pass: expose project goals/objectives into overview snapshot
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project, ProjectDocument, ProjectStatus, ProjectVisibility, MemberRole, ProjectMember, ProjectOutcomeStatus, ProjectClosureDecision } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';
import { NotificationsService } from '../notifications/notifications.service';

function safeNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface ProjectQueryOptions {
  status?: ProjectStatus;
  visibility?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PulseData {
  project: ProjectDocument;
  metrics: {
    momentum: number;
    velocity: number;
    weeklyShips: number;
    momentumTrend: number;
    completionRate: number;
  };
  criticalMoves: any[];
  objectives: any[];
  sprint: any;
  activity: any[];
}


export interface ProjectClosureReadinessResult {
  isReadyToClose: boolean;
  readinessScore: number;
  blockingReasons: string[];
  warnings: string[];
  openTaskCount: number;
  openCriticalTaskCount: number;
  blockedTaskCount: number;
  activeGoalCount: number;
  completedGoalCount: number;
  hasActiveSprint: boolean;
}

export interface CompleteProjectPayload {
  closureSummary: string;
  outcomeStatus?: ProjectOutcomeStatus;
  leftoverDecision?: ProjectClosureDecision;
  followUpProjectId?: string | null;
  forceComplete?: boolean;
  closureChecklist?: {
    primaryGoalConfirmed?: boolean;
    openWorkResolved?: boolean;
    blockersReviewed?: boolean;
    handoffPrepared?: boolean;
    summaryWritten?: boolean;
    stakeholderSignoff?: boolean;
  };
}

export interface ReopenProjectPayload {
  reason: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async findOneForUser(userId: string, projectId: string): Promise<ProjectDocument | null> {
    try {
      return await this.findByIdWithAccess(projectId, userId);
    } catch {
      return null;
    }
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    return result.projects;
  }

  async list(userId: string, options: ProjectQueryOptions = {}): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId, options);
    return result.projects;
  }

  async findAllNoFilter(): Promise<ProjectDocument[]> {
    return this.projectModel.find({}).exec();
  }

  async findByUser(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    return result.projects;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT CARD ENRICHMENT
  // Computes per-project task aggregates (open/completed/blocked/progress)
  // for the Projects list page (ProjectCardV2). One Mongo aggregation across
  // all project IDs in the list — does not N+1.
  // Returns plain enriched objects (NOT Mongoose documents) so adding ad-hoc
  // fields is safe. Callers that needed real ProjectDocuments must keep using
  // findUserProjects directly.
  // ═══════════════════════════════════════════════════════════════════════════
  private async enrichProjectsWithCardData(
    projects: ProjectDocument[],
  ): Promise<any[]> {
    if (!Array.isArray(projects) || projects.length === 0) {
      return projects as any[];
    }

    const projectIds = projects
      .map((p) => p?._id)
      .filter((id) => id != null);

    if (projectIds.length === 0) {
      return projects.map((p) => (p?.toObject ? p.toObject() : p));
    }

    // Aggregate all task counts for these projects in a single query.
    // Status values matched here come from TaskStatus + common legacy values.
    let taskCounts: any[] = [];
    try {
      taskCounts = await this.taskModel.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: '$projectId',
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['done', 'completed', 'DONE', 'COMPLETED']] },
                  1,
                  0,
                ],
              },
            },
            blocked: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['blocked', 'BLOCKED']] },
                  1,
                  0,
                ],
              },
            },
            lastUpdate: { $max: '$updatedAt' },
          },
        },
      ]);
    } catch (err) {
      // If aggregation fails for any reason, log and fall back to plain projects.
      // We never want this enrichment step to break the project list endpoint.
      this.logger?.warn?.(
        `enrichProjectsWithCardData: aggregation failed (${(err as Error)?.message}); returning unenriched projects`,
      );
      return projects.map((p) => (p?.toObject ? p.toObject() : p));
    }

    const countsByProjectId = new Map<string, any>();
    for (const row of taskCounts) {
      countsByProjectId.set(String(row._id), row);
    }

    return projects.map((p) => {
      const plain: any = p?.toObject ? p.toObject() : { ...(p as any) };
      const counts = countsByProjectId.get(String(plain?._id)) || {};

      const total = safeNumber(counts.total, 0);
      const completed = safeNumber(counts.completed, 0);
      const blockerCount = safeNumber(counts.blocked, 0);
      const openTaskCount = Math.max(total - completed, 0);
      const computedProgress =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      let momentumState: string;
      if (blockerCount > 0) {
        momentumState = 'Blocked';
      } else if (computedProgress >= 100 && total > 0) {
        momentumState = 'Complete';
      } else if (openTaskCount > 0 && completed > 0) {
        momentumState = 'Building';
      } else if (openTaskCount > 0) {
        momentumState = 'Ready';
      } else {
        momentumState = 'Planning';
      }

      // Card-friendly fields. We DO NOT overwrite anything that's already
      // set on the project — we only fill in when the field is missing.
      // The frontend ProjectCardV2 already reads each of these names.
      plain.taskCount = plain.taskCount ?? total;
      plain.completedTasks = plain.completedTasks ?? completed;
      plain.openTaskCount = plain.openTaskCount ?? openTaskCount;
      plain.blockerCount = plain.blockerCount ?? blockerCount;
      plain.computedProgress = plain.computedProgress ?? computedProgress;
      plain.momentumState = plain.momentumState ?? momentumState;

      // Only fill progress if it's missing or zero AND we have computed data.
      const existingProgress = safeNumber(plain.progress, 0);
      if (existingProgress === 0 && total > 0) {
        plain.progress = computedProgress;
      }

      // Activity timestamp: prefer existing lastActivityAt, otherwise the
      // most recent task update we just aggregated, otherwise updatedAt.
      plain.lastActivityAt =
        plain.lastActivityAt ||
        counts.lastUpdate ||
        plain.updatedAt ||
        null;

      return plain;
    });
  }

  async enablePublic(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to enable public sharing');
    }

    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    (project as any).publicEnabled = true;
    (project as any).publicToken = publicToken;
    await project.save();

    return { publicToken };
  }

  async disablePublic(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to disable public sharing');
    }

    (project as any).publicEnabled = false;
    (project as any).publicToken = null;
    await project.save();
  }

  async regeneratePublicToken(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to regenerate public token');
    }

    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    (project as any).publicEnabled = true;
    (project as any).publicToken = publicToken;
    await project.save();

    return { publicToken };
  }

  async getPublicSnapshotByToken(token: string): Promise<any | null> {
    const project = await this.projectModel
      .findOne({ publicToken: token, publicEnabled: true })
      .lean()
      .exec();

    if (!project) return null;

    return {
      id: project._id,
      name: project.name,
      description: (project as any).description || null,
      status: project.status,
      category: (project as any).category || null,
      tags: project.tags || [],
      metrics: project.metrics || {},
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);

    const emoji = (dto.emoji || dto.icon || '📁').trim();
    let visibility: ProjectVisibility = ProjectVisibility.PRIVATE;

    if (dto.visibility) {
      visibility = dto.visibility;
    } else if (dto.privacy) {
      const privacyLower = String(dto.privacy).toLowerCase();
      if (privacyLower === 'public') visibility = ProjectVisibility.PUBLIC;
      else if (privacyLower === 'listed') visibility = ProjectVisibility.LISTED;
      else visibility = ProjectVisibility.PRIVATE;
    }

    const projectName = dto.name || dto.title || 'Untitled Project';
    const isPublic =
      dto.isPublic === true ||
      visibility === ProjectVisibility.PUBLIC ||
      visibility === ProjectVisibility.LISTED;

    const settings = {
      ...(dto.settings || {}),
      isPublic: dto.settings?.isPublic ?? isPublic,
      isListed: dto.settings?.isListed ?? (visibility === ProjectVisibility.LISTED),
    };

    const project = new this.projectModel({
      name: projectName,
      description: dto.description,
      emoji,
      icon: dto.icon || emoji,
      color: dto.color || '#7C3AED',
      visibility,
      tags: dto.tags || [],
      category: dto.category || null,
      status: dto.status ? this.normalizeStatus(dto.status) : ProjectStatus.ACTIVE,
      ownerId: new Types.ObjectId(userId),
      members: [],
      goals: dto.goals || [],
      settings,
      metrics: {
        momentum: 0,
        velocity: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalXP: 0,
        lastActivityAt: new Date(),
        weeklyShips: 0,
        momentumTrend: 0,
        activeSprintId: null,
        totalShips: 0,
        memberCount: 1,
        likes: 0,
        comments: 0,
      },
      followersCount: 0,
      streakDays: 0,
      trendingScore: 0,
    });

    const saved = await project.save();

    if (dto.members && Array.isArray(dto.members) && dto.members.length > 0) {
      this.eventEmitter.emit('project.members.invited', {
        projectId: saved._id,
        invitedBy: userId,
        members: dto.members,
      });
    }

    this.eventEmitter.emit('project.created', {
      projectId: saved._id,
      userId,
      projectName: saved.name,
      visibility: saved.visibility,
      isPublic,
    });

    return saved;
  }

  private normalizeStatus(status: string): ProjectStatus {
    const statusLower = String(status).toLowerCase().replace(/\s+/g, '_');

    switch (statusLower) {
      case 'active':
      case 'in_progress':
      case 'in progress':
        return ProjectStatus.ACTIVE;
      case 'planning':
        return (ProjectStatus as any).PLANNING || ProjectStatus.ACTIVE;
      case 'on_hold':
      case 'on hold':
      case 'paused':
        return (ProjectStatus as any).ON_HOLD || (ProjectStatus as any).PAUSED || ProjectStatus.ACTIVE;
      case 'completed':
      case 'done':
        return ProjectStatus.COMPLETED;
      case 'archived':
        return ProjectStatus.ARCHIVED;
      default:
        return ProjectStatus.ACTIVE;
    }
  }

  async findById(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  async findByIdWithAccess(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.findById(projectId);
    if (!this.hasAccess(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async findUserProjects(userId: string, options: ProjectQueryOptions = {}): Promise<{ projects: ProjectDocument[]; total: number }> {
    const {
      status,
      search,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'metrics.lastActivityAt',
      sortOrder = 'desc',
    } = options;

    const query: any = {
      $or: [
        { ownerId: new Types.ObjectId(userId) },
        { owner: new Types.ObjectId(userId) },
        { 'members.userId': new Types.ObjectId(userId) },
        { 'members.user': new Types.ObjectId(userId) },
      ],
      isArchived: { $ne: true },
    };

    if (status) query.status = status;
    else query.status = { $ne: ProjectStatus.ARCHIVED };

    if (search) query.$text = { $search: search };
    if (tags && tags.length > 0) query.tags = { $in: tags };

    const [projects, total] = await Promise.all([
      this.projectModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit),
      this.projectModel.countDocuments(query),
    ]);

    const enrichedProjects = await this.enrichProjectsWithCardData(projects);

    return { projects: enrichedProjects as any, total };
  }

  async findStarred(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({
        ownerId: new Types.ObjectId(userId),
        isStarred: true,
        status: { $ne: ProjectStatus.ARCHIVED },
      })
      .sort({ 'metrics.lastActivityAt': -1 });
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to edit this project');
    }

    if (dto.status) {
      if (dto.status === ProjectStatus.ARCHIVED) {
        project.archivedAt = new Date();
      } else if (dto.status === ProjectStatus.COMPLETED) {
        project.completedAt = new Date();
      }
    }

    if ((dto as any).settings) {
      (project as any).settings = {
        ...(project as any).settings,
        ...(dto as any).settings,
      };
      delete (dto as any).settings;
    }

    if ((dto as any).goals) {
      (project as any).goals = (dto as any).goals;
      delete (dto as any).goals;
    }

    if ((dto as any).emoji || (dto as any).icon) {
      const nextEmoji = ((dto as any).emoji || (dto as any).icon || project.emoji || project.icon || '📁').trim();
      project.emoji = nextEmoji;
      project.icon = (dto as any).icon || nextEmoji;
      delete (dto as any).emoji;
      delete (dto as any).icon;
    }

    Object.assign(project, dto);

    const updated = await project.save();

    this.eventEmitter.emit('project.updated', {
      projectId: updated._id,
      userId,
      changes: dto,
    });

    return updated;
  }

  async updateMetrics(projectId: string, metrics: Partial<Project['metrics']>): Promise<void> {
    const set: Record<string, any> = {};

    for (const [key, value] of Object.entries(metrics || {})) {
      set[`metrics.${key}`] = value;
    }

    set['metrics.lastActivityAt'] = new Date();

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: set },
    );
  }

  async incrementTaskCount(projectId: string, completed: boolean = false): Promise<void> {
    const update: any = {
      $inc: { 'metrics.totalTasks': 1 },
      $set: { 'metrics.lastActivityAt': new Date() },
    };

    if (completed) update.$inc['metrics.completedTasks'] = 1;

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      update,
    );
  }

  async decrementTaskCount(projectId: string, wasCompleted: boolean = false): Promise<void> {
    const update: any = { $inc: { 'metrics.totalTasks': -1 } };

    if (wasCompleted) update.$inc['metrics.completedTasks'] = -1;

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      update,
    );
  }

  async markTaskCompleted(projectId: string): Promise<void> {
    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      {
        $inc: {
          'metrics.completedTasks': 1,
          'metrics.weeklyShips': 1,
        },
        $set: { 'metrics.lastActivityAt': new Date() },
      },
    );
  }

  async recordShipUpdate(args: {
    projectId: string;
    userId: string;
    shipTitle: string;
    projectNameOverride?: string;
  }): Promise<{ success: true }> {
    const project = await this.findByIdWithAccess(args.projectId, args.userId);

    if (!this.canEdit(project, args.userId)) {
      throw new ForbiddenException('You do not have permission to post updates for this project');
    }

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(args.projectId) },
      {
        $inc: {
          'metrics.weeklyShips': 1,
          'metrics.totalShips': 1,
        },
        $set: {
          'metrics.lastActivityAt': new Date(),
          lastShip: args.shipTitle,
          lastShipAt: new Date(),
        },
      },
    );

    const projectName = args.projectNameOverride || project.name;

    this.eventEmitter.emit('project.ship.posted', {
      projectId: args.projectId,
      projectName,
      shipTitle: args.shipTitle,
      triggeredBy: args.userId,
    });

    if (this.notifications?.notifyFollowersShipUpdate) {
      await this.notifications.notifyFollowersShipUpdate({
        projectId: args.projectId,
        projectName,
        shipTitle: args.shipTitle,
        triggeredBy: args.userId,
      });
    }

    return { success: true };
  }

  async recordMilestoneReached(args: {
    projectId: string;
    userId: string;
    milestoneName: string;
    projectNameOverride?: string;
  }): Promise<{ success: true }> {
    const project = await this.findByIdWithAccess(args.projectId, args.userId);

    if (!this.canEdit(project, args.userId)) {
      throw new ForbiddenException('You do not have permission to post milestones for this project');
    }

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(args.projectId) },
      { $set: { 'metrics.lastActivityAt': new Date() } },
    );

    const projectName = args.projectNameOverride || project.name;

    this.eventEmitter.emit('project.milestone.reached', {
      projectId: args.projectId,
      projectName,
      milestoneName: args.milestoneName,
      triggeredBy: args.userId,
    });

    if (this.notifications?.notifyFollowersMilestoneReached) {
      await this.notifications.notifyFollowersMilestoneReached({
        projectId: args.projectId,
        projectName,
        milestoneName: args.milestoneName,
        triggeredBy: args.userId,
      });
    }

    return { success: true };
  }


  async evaluateProjectClosure(
    projectId: string,
    userId: string,
  ): Promise<ProjectClosureReadinessResult> {
    const project = await this.findByIdWithAccess(projectId, userId);

    const tasks = await this.taskModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .lean()
      .exec();

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const closureReadiness = this.buildClosureReadiness(project, tasks, normalizedGoals);

    (project as any).closureReadiness = {
      ...(project as any).closureReadiness,
      ...closureReadiness,
      lastEvaluatedAt: new Date(),
    };

    await project.save();

    return closureReadiness;
  }

  async completeProject(
    projectId: string,
    userId: string,
    payload: CompleteProjectPayload,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to complete this project');
    }

    const tasks = await this.taskModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .lean()
      .exec();

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const closureReadiness = this.buildClosureReadiness(project, tasks, normalizedGoals);

    if (!closureReadiness.isReadyToClose && !payload?.forceComplete) {
      throw new BadRequestException({
        message: 'Project is not ready to close',
        closureReadiness,
      });
    }

    const now = new Date();
    const openTasks = tasks.filter((task) => !this.isTaskDone(task));
    const blockedTasks = openTasks.filter((task) => this.isTaskBlocked(task));
    const completedGoals = normalizedGoals.filter((goal) => goal?.status === 'completed');

    const leftoverDecision = String(payload?.leftoverDecision || 'backlog') as ProjectClosureDecision;
    const isCancelDecision = leftoverDecision === 'cancel';
    const isDeferDecision = leftoverDecision === 'defer';
    const isFollowUpDecision = leftoverDecision === 'follow_up';

    if (isFollowUpDecision && !payload?.followUpProjectId) {
      throw new BadRequestException('followUpProjectId is required when leftoverDecision is follow_up');
    }

    const openTaskIds = openTasks
      .map((task) => this.extractAnyId(task?._id || task?.id || task))
      .filter(Boolean);

    const openTaskObjectIds = openTaskIds.map((taskId) => new Types.ObjectId(taskId));

    const deferredTaskIds = !isCancelDecision ? [...openTaskIds] : [];
    const canceledTaskIds = isCancelDecision ? [...openTaskIds] : [];

    if (openTaskObjectIds.length > 0) {
      const decisionTags = ['closeout:leftover'];

      if (isCancelDecision) {
        decisionTags.push('closeout:canceled');
      } else if (isDeferDecision) {
        decisionTags.push('closeout:deferred');
      } else if (isFollowUpDecision) {
        decisionTags.push('closeout:follow_up');
      } else {
        decisionTags.push('closeout:backlog');
      }

      if (isFollowUpDecision && payload?.followUpProjectId) {
        decisionTags.push(`closeout:follow_up:${payload.followUpProjectId}`);
      }

      await this.taskModel.updateMany(
        { _id: { $in: openTaskObjectIds } },
        {
          $set: {
            status: TaskStatus.BACKLOG,
            updatedAt: now,
          },
          $unset: {
            sprintId: 1,
          },
          $addToSet: {
            tags: { $each: decisionTags },
          },
        },
      ).exec();
    }

    const derivedOutcome =
      payload?.outcomeStatus ||
      (openTasks.length === 0 && normalizedGoals.length > 0 && completedGoals.length === normalizedGoals.length
        ? ProjectOutcomeStatus.ACHIEVED
        : openTasks.length === 0
          ? ProjectOutcomeStatus.ACHIEVED
          : ProjectOutcomeStatus.PARTIALLY_ACHIEVED);

    const closureChecklist = {
      ...((project as any).closureChecklist || {}),
      ...(payload?.closureChecklist || {}),
      summaryWritten: Boolean(payload?.closureSummary || (project as any).closureSummary),
    };

    project.status = ProjectStatus.COMPLETED;
    project.completedAt = now;
    (project as any).completedBy = new Types.ObjectId(userId);
    (project as any).closureSummary = payload?.closureSummary || (project as any).closureSummary || '';
    (project as any).outcomeStatus = derivedOutcome;
    (project as any).closureChecklist = closureChecklist;
    (project as any).closureReadiness = {
      ...closureReadiness,
      isReadyToClose: true,
      readinessScore: 100,
      blockingReasons: [],
      lastEvaluatedAt: now,
    };
    (project as any).completionSnapshot = {
      summary: (project as any).closureSummary || '',
      outcomeStatus: derivedOutcome,
      completedTaskCount: tasks.filter((task) => this.isTaskDone(task)).length,
      openTaskCount: openTasks.length,
      blockedTaskCount: blockedTasks.length,
      goalsAchievedCount: completedGoals.length,
      goalsTotalCount: normalizedGoals.length,
      deferredTaskIds,
      canceledTaskIds,
      leftoverDecision,
      followUpProjectId: payload?.followUpProjectId
        ? new Types.ObjectId(payload.followUpProjectId)
        : undefined,
      completedBy: new Types.ObjectId(userId),
      completedAt: now,
    };
    (project as any).reopenedAt = undefined;
    (project as any).reopenedBy = undefined;
    (project as any).reopenReason = undefined;
    project.isArchived = false;
    project.archivedAt = undefined;

    const updated = await project.save();

    this.eventEmitter.emit('project.completed', {
      projectId: updated._id,
      userId,
      outcomeStatus: derivedOutcome,
      leftoverDecision,
      deferredTaskCount: deferredTaskIds.length,
      canceledTaskCount: canceledTaskIds.length,
    });

    return updated;
  }

  async reopenProject(
    projectId: string,
    userId: string,
    payload: ReopenProjectPayload,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to reopen this project');
    }

    const now = new Date();

    project.status = ProjectStatus.ACTIVE;
    project.isArchived = false;
    project.archivedAt = undefined;
    project.completedAt = undefined;
    (project as any).completedBy = undefined;
    (project as any).reopenedAt = now;
    (project as any).reopenedBy = new Types.ObjectId(userId);
    (project as any).reopenReason = payload?.reason?.trim() || 'Project reopened';
    (project as any).closureReadiness = {
      ...((project as any).closureReadiness || {}),
      isReadyToClose: false,
      lastEvaluatedAt: now,
    };

    const updated = await project.save();

    this.eventEmitter.emit('project.reopened', {
      projectId: updated._id,
      userId,
      reason: (project as any).reopenReason,
    });

    return updated;
  }

  private resolveStatusAfterArchiveRestore(project: ProjectDocument): ProjectStatus {
    if (project.completedAt) {
      return ProjectStatus.COMPLETED;
    }

    if (project.status === ProjectStatus.READY_TO_CLOSE) {
      return ProjectStatus.READY_TO_CLOSE;
    }

    return ProjectStatus.ACTIVE;
  }

  async archive(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to archive this project');
    }

    const now = new Date();
    const previousStatus = project.status;

    project.status = ProjectStatus.ARCHIVED;
    project.isArchived = true;
    project.archivedAt = now;

    const updated = await project.save();

    this.eventEmitter.emit('project.archived', {
      projectId: updated._id,
      userId,
      previousStatus,
      archivedAt: now,
    });

    return updated;
  }

  async restoreArchivedProject(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to restore this project');
    }

    const now = new Date();
    const restoredStatus = this.resolveStatusAfterArchiveRestore(project);

    project.status = restoredStatus;
    project.isArchived = false;
    project.archivedAt = undefined;

    const updated = await project.save();

    this.eventEmitter.emit('project.restored', {
      projectId: updated._id,
      userId,
      restoredStatus,
      restoredAt: now,
    });

    return updated;
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectModel.deleteOne({ _id: project._id });

    this.eventEmitter.emit('project.deleted', {
      projectId: project._id,
      userId,
    });
  }

  async addMember(projectId: string, userId: string, dto: AddMemberDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    const existingMember = project.members.find((m) => m.userId.toString() === dto.userId);
    if (existingMember) throw new BadRequestException('User is already a member of this project');
    if (project.ownerId.toString() === dto.userId) {
      throw new BadRequestException('Cannot add project owner as a member');
    }

    project.members.push({
      userId: new Types.ObjectId(dto.userId),
      role: dto.role || MemberRole.MEMBER,
      joinedAt: new Date(),
      invitedBy: new Types.ObjectId(userId),
    } as ProjectMember);

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length + 1 } },
    );

    const updated = await project.save();

    this.eventEmitter.emit('project.member.added', {
      projectId: updated._id,
      memberId: dto.userId,
      role: dto.role || MemberRole.MEMBER,
      addedBy: userId,
    });

    return updated;
  }

  async removeMember(projectId: string, userId: string, memberUserId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    project.members.splice(memberIndex, 1);

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length + 1 } },
    );

    const updated = await project.save();

    this.eventEmitter.emit('project.member.removed', {
      projectId: updated._id,
      memberId: memberUserId,
      removedBy: userId,
    });

    return updated;
  }

  async updateMemberRole(projectId: string, userId: string, memberUserId: string, dto: UpdateMemberRoleDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can change member roles');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot change owner role');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
    }

    const member = project.members.find((m) => m.userId.toString() === memberUserId);
    if (!member) throw new NotFoundException('Member not found in project');

    member.role = dto.role;
    return project.save();
  }

  async updateMemberPreferences(projectId: string, userId: string, preferences: any): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    let memberIndex = project.members.findIndex((m) => m.userId.toString() === userId);

    if (memberIndex === -1) {
      const isOwner = (project.ownerId || (project as any).owner)?.toString() === userId;
      if (!isOwner) throw new BadRequestException('You are not a member of this project');

      project.members.push({
        userId: new Types.ObjectId(userId),
        role: MemberRole.OWNER || 'owner',
        joinedAt: project.createdAt || new Date(),
      } as ProjectMember);

      memberIndex = project.members.length - 1;
    }

    project.members[memberIndex].preferences = {
      ...project.members[memberIndex].preferences,
      ...preferences,
    };

    project.markModified(`members.${memberIndex}.preferences`);
    return project.save();
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);
    const isOwner = project.ownerId.toString() === userId;
    const otherMembers = (project.members || []).filter(
      (m) => m.userId.toString() !== userId,
    );

    if (isOwner && otherMembers.length > 0) {
      throw new BadRequestException('Owner cannot leave project with other members. Transfer ownership first.');
    }

    if (isOwner && otherMembers.length === 0) {
      project.status = 'archived' as any;
      project.isArchived = true;
      project.archivedAt = new Date();
      await project.save();

      this.eventEmitter.emit('project.archived', {
        projectId: project._id,
        userId,
      });

      return;
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === userId);
    if (memberIndex === -1) throw new BadRequestException('You are not a member of this project');

    project.members.splice(memberIndex, 1);
    await project.save();

    this.eventEmitter.emit('project.member.left', {
      projectId: project._id,
      userId,
    });
  }

  private isTaskDone(task: any): boolean {
    const status = String(task?.status || '').toLowerCase();
    return status === 'done' || status === 'completed';
  }

  private isTaskInProgress(task: any): boolean {
    const status = String(task?.status || '').toLowerCase();
    return status === 'in_progress' || status === 'review' || status === 'active';
  }

  private isTaskBlocked(task: any): boolean {
    const status = String(task?.status || '').toLowerCase();
    return Boolean(
      task?.isBlocking ||
      task?.isBlocked ||
      task?.blocked ||
      task?.hasBlocker ||
      task?.blockedBy ||
      status.includes('block') ||
      (Array.isArray(task?.blockers) && task.blockers.length > 0)
    );
  }

  private priorityRank(priority: any): number {
    const value = String(priority || '').toLowerCase();
    if (value === 'critical') return 4;
    if (value === 'high') return 3;
    if (value === 'medium') return 2;
    if (value === 'low') return 1;
    return 0;
  }

  private taskDueTime(task: any): number {
    if (!task?.dueDate) return Number.POSITIVE_INFINITY;
    const value = new Date(task.dueDate).getTime();
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }

  private buildCriticalMoves(tasks: any[]): any[] {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    const actionable = tasks.filter((task) => !this.isTaskDone(task));

    return actionable
      .sort((a, b) => {
        const blockedDelta = Number(this.isTaskBlocked(b)) - Number(this.isTaskBlocked(a));
        if (blockedDelta !== 0) return blockedDelta;

        const priorityDelta = this.priorityRank(b?.priority) - this.priorityRank(a?.priority);
        if (priorityDelta !== 0) return priorityDelta;

        const inProgressDelta = Number(this.isTaskInProgress(b)) - Number(this.isTaskInProgress(a));
        if (inProgressDelta !== 0) return inProgressDelta;

        const dueDelta = this.taskDueTime(a) - this.taskDueTime(b);
        if (dueDelta !== 0) return dueDelta;

        return String(a?.title || '').localeCompare(String(b?.title || ''));
      })
      .slice(0, 5)
      .map((task) => ({
        _id: task?._id,
        id: task?._id?.toString?.() || task?.id,
        title: task?.title || 'Priority task',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        dueDate: task?.dueDate || null,
        isBlocking: this.isTaskBlocked(task),
        assigneeId: task?.assigneeId || null,
      }));
  }

  private buildRecentActivity(tasks: any[]): any[] {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    return [...tasks]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 8)
      .map((task) => ({
        id: task?._id?.toString?.() || task?.id,
        type: this.isTaskDone(task)
          ? 'task_completed'
          : this.isTaskInProgress(task)
            ? 'task_in_progress'
            : 'task_updated',
        action: this.isTaskDone(task)
          ? 'completed'
          : this.isTaskInProgress(task)
            ? 'moved to work'
            : 'updated',
        target: task?.title || 'Task',
        createdAt: task?.updatedAt || task?.createdAt || new Date().toISOString(),
        status: task?.status || 'todo',
      }));
  }

  private extractAnyId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value?._id) return String(value._id);
    if (value?.id) return String(value.id);
    if (value?.userId) {
      if (typeof value.userId === 'string' || typeof value.userId === 'number') {
        return String(value.userId);
      }
      if (value.userId?._id) return String(value.userId._id);
      if (value.userId?.id) return String(value.userId.id);
    }

    if (typeof value?.toString === 'function') {
      const str = value.toString();
      if (str && str !== '[object Object]') return String(str);
    }

    return '';
  }

  private normalizeGoalPercent(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;

    const num = Number(value);
    if (!Number.isFinite(num)) return null;

    if (num > 0 && num <= 1) {
      return Math.max(0, Math.min(100, Math.round(num * 100)));
    }

    return Math.max(0, Math.min(100, Math.round(num)));
  }

  private goalTaskRefIds(goal: any): string[] {
    const buckets = [
      ...(Array.isArray(goal?.taskIds) ? goal.taskIds : []),
      ...(Array.isArray(goal?.linkedTaskIds) ? goal.linkedTaskIds : []),
      ...(Array.isArray(goal?.tasks) ? goal.tasks : []),
      ...(Array.isArray(goal?.linkedTasks) ? goal.linkedTasks : []),
      ...(Array.isArray(goal?.taskRefs) ? goal.taskRefs : []),
    ];

    const ids = buckets
      .map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        return (
          this.extractAnyId(item) ||
          this.extractAnyId(item?.taskId) ||
          this.extractAnyId(item?.task) ||
          ''
        );
      })
      .filter(Boolean);

    return [...new Set(ids)];
  }

  private buildGoalOwner(goal: any): { ownerId: string; ownerName: string } {
    const ownerLike =
      goal?.owner ||
      goal?.ownerId ||
      goal?.assignee ||
      goal?.assigneeId ||
      goal?.lead ||
      goal?.leadId ||
      goal?.user ||
      goal?.userId ||
      null;

    if (!ownerLike) {
      return {
        ownerId: '',
        ownerName:
          goal?.ownerName ||
          goal?.assigneeName ||
          goal?.leadName ||
          'Owner not set',
      };
    }

    if (typeof ownerLike === 'string' || typeof ownerLike === 'number') {
      return {
        ownerId: String(ownerLike),
        ownerName:
          goal?.ownerName ||
          goal?.assigneeName ||
          goal?.leadName ||
          'Assigned owner',
      };
    }

    const fullName = [ownerLike?.firstName, ownerLike?.lastName].filter(Boolean).join(' ').trim();

    return {
      ownerId:
        this.extractAnyId(ownerLike) ||
        this.extractAnyId(ownerLike?.userId) ||
        '',
      ownerName:
        goal?.ownerName ||
        goal?.assigneeName ||
        goal?.leadName ||
        ownerLike?.name ||
        fullName ||
        ownerLike?.username ||
        ownerLike?.email ||
        'Assigned owner',
    };
  }

  private normalizeGoalStatus(
    rawStatus: any,
    blocked: boolean,
    progress: number,
    completedTaskCount: number,
    linkedTaskCount: number,
    dueDate: any,
  ): string {
    const value = String(rawStatus || '').toLowerCase();
    const dueTime =
      dueDate && !Number.isNaN(new Date(dueDate).getTime())
        ? new Date(dueDate).getTime()
        : Number.POSITIVE_INFINITY;

    if (blocked || value === 'blocked') return 'blocked';

    if (
      value === 'completed' ||
      value === 'complete' ||
      value === 'done' ||
      progress >= 100 ||
      (linkedTaskCount > 0 && completedTaskCount >= linkedTaskCount)
    ) {
      return 'completed';
    }

    if (
      value === 'at_risk' ||
      value === 'at-risk' ||
      value === 'risk' ||
      (Number.isFinite(dueTime) && dueTime < Date.now() && progress < 100)
    ) {
      return 'at_risk';
    }

    if (
      value === 'in_progress' ||
      value === 'in-progress' ||
      value === 'active' ||
      value === 'doing' ||
      value === 'executing' ||
      progress > 0 ||
      completedTaskCount > 0
    ) {
      return 'in_progress';
    }

    return 'planned';
  }

  private buildGoalSnapshots(project: any, tasks: any[]): any[] {
    const rawGoals = Array.isArray((project as any)?.goals) ? (project as any).goals : [];
    if (rawGoals.length === 0) return [];

    const normalized = rawGoals
      .map((goal: any, index: number) => {
        if (!goal) return null;

        if (typeof goal === 'string') {
          return {
            id: `goal-${index}`,
            title: goal,
            ownerId: '',
            ownerName: 'Owner not set',
            status: 'planned',
            progress: 0,
            dueDate: null,
            blocked: false,
            linkedTaskCount: 0,
            completedTaskCount: 0,
            summary: '',
          };
        }

        if (typeof goal !== 'object') return null;

        const refIds = this.goalTaskRefIds(goal);
        const linkedTasks = refIds.length > 0
          ? tasks.filter((task) => refIds.includes(this.extractAnyId(task?._id || task?.id)))
          : [];

        const linkedTaskCount =
          safeNumber(goal?.linkedTaskCount, NaN) ||
          safeNumber(goal?.taskCount, NaN) ||
          safeNumber(goal?.tasksCount, NaN) ||
          safeNumber(goal?.linkedItemsCount, linkedTasks.length);

        const completedTaskCount =
          safeNumber(goal?.completedTaskCount, NaN) ||
          safeNumber(goal?.completedTasks, NaN) ||
          safeNumber(goal?.doneTaskCount, NaN) ||
          linkedTasks.filter((task) => this.isTaskDone(task)).length;

        const blockedTaskCount =
          safeNumber(goal?.blockedTaskCount, NaN) ||
          linkedTasks.filter((task) => this.isTaskBlocked(task)).length;

        const blocked = Boolean(
          goal?.blocked ||
          goal?.isBlocked ||
          goal?.hasBlocker ||
          goal?.blockedCount > 0 ||
          blockedTaskCount > 0 ||
          String(goal?.status || goal?.state || '').toLowerCase() === 'blocked'
        );

        const explicitProgress =
          this.normalizeGoalPercent(goal?.progress) ??
          this.normalizeGoalPercent(goal?.percentComplete) ??
          this.normalizeGoalPercent(goal?.completionPercentage) ??
          this.normalizeGoalPercent(goal?.completionRate);

        const progress =
          explicitProgress ??
          (linkedTaskCount > 0
            ? Math.max(0, Math.min(100, Math.round((completedTaskCount / linkedTaskCount) * 100)))
            : String(goal?.status || goal?.state || '').toLowerCase() === 'completed'
              ? 100
              : 0);

        const dueDate =
          goal?.dueDate ||
          goal?.targetDate ||
          goal?.deadline ||
          goal?.endDate ||
          null;

        const owner = this.buildGoalOwner(goal);
        const status = this.normalizeGoalStatus(
          goal?.status || goal?.state || goal?.phase,
          blocked,
          progress,
          completedTaskCount,
          linkedTaskCount,
          dueDate,
        );

        return {
          id: this.extractAnyId(goal) || `goal-${index}`,
          title:
            goal?.title ||
            goal?.name ||
            goal?.label ||
            goal?.objective ||
            `Goal ${index + 1}`,
          ownerId: owner.ownerId,
          ownerName: owner.ownerName,
          status,
          progress,
          dueDate,
          blocked,
          linkedTaskCount,
          completedTaskCount,
          summary:
            goal?.summary ||
            goal?.description ||
            goal?.subtitle ||
            goal?.notes ||
            '',
        };
      })
      .filter(Boolean);

    const seen = new Set<string>();

    return normalized
      .filter((goal: any) => {
        if (!goal?.id) return false;
        if (seen.has(goal.id)) return false;
        seen.add(goal.id);
        return true;
      })
      .sort((a: any, b: any) => {
        const statusRank: Record<string, number> = {
          blocked: 4,
          at_risk: 3,
          in_progress: 2,
          planned: 1,
          completed: 0,
        };

        const aRank = statusRank[a?.status] ?? 0;
        const bRank = statusRank[b?.status] ?? 0;
        if (bRank !== aRank) return bRank - aRank;

        if ((b?.progress || 0) !== (a?.progress || 0)) {
          return (b?.progress || 0) - (a?.progress || 0);
        }

        const aDue = a?.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b?.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      });
  }


  private buildClosureReadiness(
    project: any,
    tasks: any[],
    goals: any[],
  ): ProjectClosureReadinessResult {
    const openTasks = Array.isArray(tasks)
      ? tasks.filter((task) => !this.isTaskDone(task))
      : [];

    const openCriticalTasks = openTasks.filter(
      (task) => this.priorityRank(task?.priority) >= 3,
    );

    const blockedTasks = openTasks.filter((task) => this.isTaskBlocked(task));

    const activeGoals = Array.isArray(goals)
      ? goals.filter((goal) => goal?.status !== 'completed')
      : [];

    const completedGoals = Array.isArray(goals)
      ? goals.filter((goal) => goal?.status === 'completed')
      : [];

    const hasActiveSprint = Boolean((project as any)?.metrics?.activeSprintId);
    const checklist = (project as any)?.closureChecklist || {};

    const blockingReasons: string[] = [];
    const warnings: string[] = [];

    if (openCriticalTasks.length > 0) {
      blockingReasons.push(
        `${openCriticalTasks.length} high-priority task${openCriticalTasks.length === 1 ? '' : 's'} still open`,
      );
    }

    if (blockedTasks.length > 0) {
      blockingReasons.push(
        `${blockedTasks.length} blocker${blockedTasks.length === 1 ? '' : 's'} unresolved`,
      );
    }

    if (hasActiveSprint) {
      blockingReasons.push('Active sprint still running');
    }

    if (activeGoals.length > 0) {
      blockingReasons.push(
        `${activeGoals.length} active goal${activeGoals.length === 1 ? '' : 's'} still in progress`,
      );
    }

    if (!checklist.primaryGoalConfirmed) {
      warnings.push('Primary outcome not yet confirmed');
    }

    if (!checklist.summaryWritten) {
      warnings.push('Closure summary not yet written');
    }

    if (!checklist.stakeholderSignoff) {
      warnings.push('Stakeholder signoff not yet recorded');
    }

    let readinessScore = 100;
    readinessScore -= Math.min(40, openCriticalTasks.length * 20);
    readinessScore -= Math.min(25, blockedTasks.length * 10);
    readinessScore -= hasActiveSprint ? 15 : 0;
    readinessScore -= Math.min(15, activeGoals.length * 5);
    readinessScore -= Math.min(15, warnings.length * 5);
    readinessScore = Math.max(0, Math.min(100, readinessScore));

    return {
      isReadyToClose: blockingReasons.length === 0,
      readinessScore,
      blockingReasons,
      warnings,
      openTaskCount: openTasks.length,
      openCriticalTaskCount: openCriticalTasks.length,
      blockedTaskCount: blockedTasks.length,
      activeGoalCount: activeGoals.length,
      completedGoalCount: completedGoals.length,
      hasActiveSprint,
    };
  }

  async getOverviewData(projectId: string, userId: string): Promise<any> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project && typeof (project as any).populate === 'function') {
      await (project as any).populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );

      await (project as any).populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    const pid = new Types.ObjectId(projectId);
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const tasks = await this.taskModel
      .find({ projectId: pid })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => this.isTaskDone(task)).length;
    const completedToday = tasks.filter(
      (task) =>
        this.isTaskDone(task) &&
        task?.completedAt &&
        new Date(task.completedAt) >= todayStart,
    ).length;

    const completedThisWeek = tasks.filter(
      (task) =>
        this.isTaskDone(task) &&
        task?.completedAt &&
        new Date(task.completedAt) >= weekStart,
    ).length;

    const inProgress = tasks.filter((task) => this.isTaskInProgress(task)).length;
    const blocked = tasks.filter((task) => this.isTaskBlocked(task)).length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let derivedMomentum = 0;

    if (totalTasks > 0) {
      derivedMomentum += Math.min(10, totalTasks * 2);
      derivedMomentum += Math.round((completedTasks / Math.max(totalTasks, 1)) * 35);
      derivedMomentum += Math.min(25, completedThisWeek * 5);
      derivedMomentum += Math.min(20, inProgress * 5);
      derivedMomentum -= Math.min(15, blocked * 5);

      if (derivedMomentum <= 0) {
        derivedMomentum = 10;
      }
    }

    const storedMetrics = (project as any).metrics || {};
    const weeklyShips =
      completedThisWeek > 0 ? completedThisWeek : storedMetrics.weeklyShips || 0;

    const criticalMoves = this.buildCriticalMoves(tasks);
    const activity = this.buildRecentActivity(tasks);

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const activeGoals = normalizedGoals.filter((goal) => goal.status !== 'completed');
    const closureReadiness = this.buildClosureReadiness(project, tasks, normalizedGoals);

    return {
      project,
      tasks,
      milestones: [],
      events: [],
      threads: [],
      files: [],
      announcements: [],
      pinnedAnnouncement: null,
      metrics: {
        momentum:
          typeof storedMetrics.momentum === 'number' && storedMetrics.momentum > 0
            ? storedMetrics.momentum
            : derivedMomentum,
        velocity: storedMetrics.velocity || 0,
        weeklyShips,
        momentumTrend:
          typeof storedMetrics.momentumTrend === 'number'
            ? storedMetrics.momentumTrend
            : completedThisWeek > 0
              ? Math.min(completedThisWeek, 5)
              : inProgress > 0
                ? 1
                : 0,
        completionRate,
        totalTasks,
        completedTasks,
        inProgress,
        blocked,
      },
      completedToday,
      completedThisWeek,
      inProgress,
      blocked,
      totalTasks,
      completedTasks,
      criticalMoves,
      activeGoals,
      closureReadiness,
      goals: normalizedGoals,
      objectives: normalizedGoals,
      sprint: null,
      activity,
    };
  }

  async getPulseData(projectId: string, userId: string): Promise<PulseData> {
    const overview = await this.getOverviewData(projectId, userId);

    return {
      project: overview.project,
      metrics: {
        momentum: overview.metrics?.momentum || 0,
        velocity: overview.metrics?.velocity || 0,
        weeklyShips: overview.metrics?.weeklyShips || 0,
        momentumTrend: overview.metrics?.momentumTrend || 0,
        completionRate: overview.metrics?.completionRate || 0,
      },
      criticalMoves: overview.criticalMoves || [],
      objectives: overview.objectives || overview.goals || overview.activeGoals || [],
      sprint: overview.sprint || null,
      activity: overview.activity || [],
      completedToday: overview.completedToday || 0,
      completedThisWeek: overview.completedThisWeek || 0,
      inProgress: overview.inProgress || 0,
      blocked: overview.blocked || 0,
      totalTasks: overview.totalTasks || 0,
      completedTasks: overview.completedTasks || 0,
    } as any;
  }

  async createFromTemplate(userId: string, templateType: string): Promise<{ project: ProjectDocument; taskCount: number }> {
    this.logger.warn(`createFromTemplate called but not yet implemented. templateType=${templateType}`);

    const project = await this.create(userId, {
      name: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Project`,
      description: `Created from ${templateType} template`,
    } as CreateProjectDto);

    return { project, taskCount: 0 };
  }

  async getFeaturedProjects(limit: number = 6): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({
        visibility: ProjectVisibility.PUBLIC,
        status: { $ne: ProjectStatus.ARCHIVED },
      })
      .sort({
        'metrics.totalShips': -1,
        'metrics.lastActivityAt': -1,
      })
      .limit(limit)
      .exec();
  }

  private hasAccess(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    return project.members.some((m) => m.userId.toString() === userId);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }

  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }
}

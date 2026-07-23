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
import { Project, ProjectDocument, ProjectStatus, ProjectVisibility,
  ProjectPublicAccessMode, MemberRole, ProjectMember, ProjectOutcomeStatus, ProjectClosureDecision } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority, NotificationType } from '../notifications/schemas/notification.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivitiesService } from '../activities/activities.service';

export const DEFAULT_PROJECT_NOTIFICATION_PREFERENCES = {
  taskAssigned: true,
  taskCompleted: true,
  announcements: true,
  mentions: true,
  deadlines: true,
  weeklyDigest: false,
} as const;

export type ProjectNotificationPreferences = {
  -readonly [K in keyof typeof DEFAULT_PROJECT_NOTIFICATION_PREFERENCES]: boolean;
};

const PROJECT_NOTIFICATION_PREFERENCE_KEYS = Object.keys(
  DEFAULT_PROJECT_NOTIFICATION_PREFERENCES,
) as Array<keyof ProjectNotificationPreferences>;

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
  remainingMilestoneCount: number;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
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
    private readonly subscriptionsService: SubscriptionsService,
    @Optional() private readonly notifications?: NotificationsService,
    @Optional() private readonly activities?: ActivitiesService,
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
      // canonical-project-action-progress-v1
      taskCounts = await this.taskModel.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            isArchived: { $ne: true },
            tags: { $ne: 'closeout:canceled' },
          },
        },
        {
          $addFields: {
            __normalizedStatus: {
              $toLower: {
                $ifNull: ['$status', ''],
              },
            },
          },
        },
        {
          $group: {
            _id: '$projectId',
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $in: [
                          '$__normalizedStatus',
                          ['done', 'completed', 'complete', 'shipped'],
                        ],
                      },
                      {
                        $eq: [
                          { $ifNull: ['$isCompleted', false] },
                          true,
                        ],
                      },
                      {
                        $ne: [
                          { $ifNull: ['$completedAt', null] },
                          null,
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            blocked: {
              $sum: {
                $cond: [
                  { $eq: ['$__normalizedStatus', 'blocked'] },
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
      const completed = Math.min(
        safeNumber(counts.completed, 0),
        total,
      );
      const blockerCount = safeNumber(counts.blocked, 0);
      const openTaskCount = Math.max(total - completed, 0);

      const normalizedProjectStatus = String(
        plain?.status || '',
      )
        .trim()
        .toLowerCase();

      const isCompletedProject =
        Boolean(plain?.completedAt) ||
        ['completed', 'complete', 'done', 'shipped'].includes(
          normalizedProjectStatus,
        );

      const computedProgress = isCompletedProject
        ? 100
        : total > 0
          ? Math.round((completed / total) * 100)
          : 0;

      let momentumState: string;

      if (isCompletedProject) {
        momentumState = 'Complete';
      } else if (blockerCount > 0) {
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

      /*
       * These values are derived from the canonical Task collection.
       * Do not preserve stale project-level counters here.
       */
      plain.taskCount = total;
      plain.completedTasks = completed;
      plain.openTaskCount = openTaskCount;
      plain.blockerCount = blockerCount;
      plain.computedProgress = computedProgress;
      plain.momentumState = momentumState;

      plain.progressSummary = {
        completed,
        pending: openTaskCount,
        total,
        blocked: blockerCount,
        percent: computedProgress,
        source: 'canonical-task-actions',
      };

      // Canonical calculated progress always replaces stale stored progress.
      plain.progress = computedProgress;

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
  private normalizeProjectPublicConfig(dto: any) {
    const rawVisibility = String(dto?.visibility || '').trim().toLowerCase();
    const rawPrivacy = String(dto?.privacy || '').trim().toLowerCase();

    const isPublic =
      dto?.isPublic === true ||
      rawVisibility === ProjectVisibility.PUBLIC ||
      rawVisibility === 'public' ||
      rawVisibility === 'listed' ||
      rawPrivacy === 'public' ||
      rawPrivacy === 'listed';

    const listingPreference =
      dto?.isListed ??
      dto?.discoverable ??
      dto?.settings?.isListed ??
      dto?.settings?.discoverable;

    const isListed = isPublic ? listingPreference !== false : false;

    const rawAccessMode = String(
      dto?.publicAccessMode ??
        dto?.spectatorMode ??
        dto?.settings?.publicAccessMode ??
        dto?.settings?.spectatorMode ??
        '',
    )
      .trim()
      .toLowerCase();

    const publicAccessMode = !isPublic
      ? ProjectPublicAccessMode.NONE
      : rawAccessMode === 'suggest' || rawAccessMode === 'suggestions'
        ? ProjectPublicAccessMode.SUGGESTIONS
        : ProjectPublicAccessMode.VIEW_ONLY;

    const suggestionsEnabled =
      isPublic &&
      (publicAccessMode === ProjectPublicAccessMode.SUGGESTIONS ||
        dto?.suggestionsEnabled === true ||
        dto?.settings?.suggestionsEnabled === true);

    return {
      visibility: isPublic ? ProjectVisibility.PUBLIC : ProjectVisibility.PRIVATE,
      isPublic,
      isListed,
      discoverable: isListed,
      publicAccessMode,
      spectatorMode: publicAccessMode,
      suggestionsEnabled,
    };
  }



  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    const publicConfig = this.normalizeProjectPublicConfig(dto as any);

    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);

    const projectUsageCheck = await this.subscriptionsService.checkLimit(userId, 'projects');

    if (!projectUsageCheck.allowed) {
      const planLimit = projectUsageCheck.limit === -1 ? 'unlimited' : projectUsageCheck.limit;

      throw new ForbiddenException(
        `Project limit reached. Your current plan allows ${planLimit} owned projects. Completed and archived projects still count. Permanently delete a project or upgrade to create more projects.`,
      );
    }

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
      visibility: publicConfig.visibility,
      tags: dto.tags || [],
      category: dto.category || null,
      status: dto.status ? this.normalizeStatus(dto.status) : ProjectStatus.ACTIVE,
      ownerId: new Types.ObjectId(userId),
      settings: {
        ...(settings || {}),
        isPublic: publicConfig.isPublic,
        isListed: publicConfig.isListed,
        discoverable: publicConfig.discoverable,
        publicAccessMode: publicConfig.publicAccessMode,
        spectatorMode: publicConfig.spectatorMode,
        suggestionsEnabled: publicConfig.suggestionsEnabled,
      },
      members: [],
      goals: dto.goals || [],
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
      visibility: publicConfig.visibility,
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

    const userObjectId = new Types.ObjectId(userId);

    const query: any = {
      $or: [
        // Current owner/member fields
        { ownerId: userObjectId },
        { owner: userObjectId },
        { 'members.userId': userObjectId },
        { 'members.user': userObjectId },

        // Backward-compatible / alternate project ownership fields
        { createdBy: userObjectId },
        { createdById: userObjectId },
        { 'members.memberId': userObjectId },
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
        .populate('ownerId', 'name firstName lastName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl headline bio')
        .populate('members.userId', 'name firstName lastName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl headline bio')
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

    const patch: Record<string, any> = {};
    const now = new Date();

    if (typeof dto.name === 'string') {
      patch.name = dto.name.trim();
    }

    if (typeof (dto as any).title === 'string' && !patch.name) {
      patch.name = String((dto as any).title).trim();
    }

    if (typeof dto.description === 'string') {
      patch.description = dto.description.trim();
    }

    if (typeof (dto as any).icon === 'string') {
      patch.icon = String((dto as any).icon).trim() || '📁';
    }

    if (typeof (dto as any).emoji === 'string') {
      patch.emoji = String((dto as any).emoji).trim() || patch.icon || '📁';
    }

    if (typeof (dto as any).color === 'string') {
      patch.color = String((dto as any).color).trim();
    }

    if (Array.isArray((dto as any).tags)) {
      patch.tags = (dto as any).tags;
    }

    if (typeof (dto as any).category === 'string') {
      patch.category = String((dto as any).category).trim();
    }

    if (typeof (dto as any).logoUrl === 'string' && String((dto as any).logoUrl).trim()) {
      patch.logoUrl = String((dto as any).logoUrl).trim();
    }

    if (typeof (dto as any).bannerUrl === 'string' && String((dto as any).bannerUrl).trim()) {
      patch.bannerUrl = String((dto as any).bannerUrl).trim();
    }

    if (typeof (dto as any).isStarred === 'boolean') {
      patch.isStarred = (dto as any).isStarred;
    }

    if (typeof (dto as any).isArchived === 'boolean') {
      patch.isArchived = (dto as any).isArchived;
    }

    if (dto.status) {
      const normalizedStatus = this.normalizeStatus(dto.status as any);
      patch.status = normalizedStatus;

      if (normalizedStatus === ProjectStatus.ARCHIVED) {
        patch.archivedAt = now;
        patch.isArchived = true;
      } else if (normalizedStatus === ProjectStatus.COMPLETED) {
        patch.completedAt = now;
      } else {
        patch.isArchived = false;
      }
    }

    if ((dto as any).settings && typeof (dto as any).settings === 'object' && !Array.isArray((dto as any).settings)) {
      const existingSettings = (project as any).settings || {};
      patch.settings = {
        ...existingSettings,
        ...(dto as any).settings,
      };
    }

    patch.updatedAt = now;

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: patch },
        {
          new: true,
          runValidators: false,
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    this.eventEmitter.emit('project.updated', {
      projectId: updated._id,
      userId,
      changes: patch,
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

    // Ship updates are lightweight project activity, not full project closeout/editing.
    // Owners and real project members may post ship updates.
    // Public spectators still cannot post because they are not owners/members.
    if (!this.isProjectOwner(project, args.userId) && !this.isProjectMember(project, args.userId)) {
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

    const milestoneEventRecipientIds = (() => {
      const seen = new Set<string>();
      const recipients: string[] = [];

      const addRecipient = (rawUserId: any, rawMemberId: any = null, notificationsEnabled = true) => {
        const userIdValue = rawUserId
          ? String(rawUserId?._id || rawUserId?.id || rawUserId)
          : '';
        const memberIdValue = rawMemberId
          ? String(rawMemberId?._id || rawMemberId?.id || rawMemberId)
          : '';

        const recipientId = userIdValue || memberIdValue;

        if (!recipientId) return;
        if (recipientId === args.userId) return;
        if (notificationsEnabled === false) return;
        if (seen.has(recipientId)) return;

        seen.add(recipientId);
        recipients.push(recipientId);
      };

      const members = Array.isArray((project as any)?.members) ? (project as any).members : [];

      for (const member of members) {
        addRecipient(
          member?.userId,
          member?.memberId,
          member?.preferences?.notifications !== false,
        );
      }

      for (const ownerCandidate of [
        (project as any)?.ownerId,
        (project as any)?.owner,
        (project as any)?.createdBy,
        (project as any)?.createdById,
        (project as any)?.userId,
      ]) {
        addRecipient(ownerCandidate, null, true);
      }

      return recipients;
    })();

    this.eventEmitter.emit('project.milestone.reached', {
      projectId: args.projectId,
      projectName,
      milestoneName: args.milestoneName,
      triggeredBy: args.userId,
      memberRecipientIds: milestoneEventRecipientIds,
    });

    if (this.notifications?.notifyFollowersMilestoneReached) {
      await this.notifications.notifyFollowersMilestoneReached({
        projectId: args.projectId,
        projectName,
        milestoneName: args.milestoneName,
        triggeredBy: args.userId,
      });
    }

    if (this.notifications?.createBulk) {
      const seenMemberIds = new Set<string>();
      const memberRecipientIds: string[] = [];

      const addMemberRecipient = (rawUserId: any, rawMemberId: any = null, notificationsEnabled = true) => {
        const userIdValue = rawUserId
          ? String(rawUserId?._id || rawUserId?.id || rawUserId)
          : '';
        const memberIdValue = rawMemberId
          ? String(rawMemberId?._id || rawMemberId?.id || rawMemberId)
          : '';

        const recipientId = userIdValue || memberIdValue;

        if (!recipientId) return;
        if (recipientId === args.userId) return;
        if (notificationsEnabled === false) return;
        if (seenMemberIds.has(recipientId)) return;

        seenMemberIds.add(recipientId);
        memberRecipientIds.push(recipientId);
      };

      const members = Array.isArray((project as any)?.members) ? (project as any).members : [];

      for (const member of members) {
        addMemberRecipient(
          member?.userId,
          member?.memberId,
          member?.preferences?.notifications !== false,
        );
      }

      for (const ownerCandidate of [
        (project as any)?.ownerId,
        (project as any)?.owner,
        (project as any)?.createdBy,
        (project as any)?.createdById,
        (project as any)?.userId,
      ]) {
        addMemberRecipient(ownerCandidate, null, true);
      }

      if (memberRecipientIds.length > 0) {
        await this.notifications.createBulk(
          memberRecipientIds.map((userId) => ({
            userId,
            type: 'project_milestone_reached' as any,
            title: '🏁 Milestone reached',
            body: `${projectName}: ${args.milestoneName}`,
            icon: '🏁',
            priority: 'high' as any,
            triggeredBy: args.userId,
            data: {
              projectId: args.projectId,
              projectName,
              milestoneName: args.milestoneName,
              emailFanoutEligible: true,
              projectMemberNotification: true,
            },
            actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],
            groupKey: `project-member-mile-${userId}-${args.projectId}-${args.milestoneName}`,
          }) as any),
        );
      }
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

    // finish-line-milestone-closure-paths-v1
    const milestones =
      await this.loadProjectMilestones(projectId);

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const closureReadiness =
      this.buildClosureReadiness(
        project,
        tasks,
        normalizedGoals,
        milestones,
      );

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

    const milestones =
      await this.loadProjectMilestones(projectId);

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const closureReadiness =
      this.buildClosureReadiness(
        project,
        tasks,
        normalizedGoals,
        milestones,
      );

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

    const completedProjectMembers = [
      {
        userId: updated.ownerId?.toString?.() || String(updated.ownerId || ''),
        notificationsEnabled: true,
      },
      ...(Array.isArray(updated.members)
        ? updated.members.map((member: any) => ({
            userId: member?.userId?.toString?.() || String(member?.userId || ''),
            notificationsEnabled: member?.preferences?.notifications !== false,
          }))
        : []),
    ].filter((member) => Boolean(member.userId));

    this.eventEmitter.emit('project.completed', {
      projectId: updated._id.toString(),
      projectName: (updated as any).name || (updated as any).title || 'Project',
      projectMembers: completedProjectMembers,
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

    const workspaceOwnerId = String(
      (project as any).ownerId ||
      (project as any).owner ||
      (project as any).createdBy ||
      (project as any).createdById ||
      (project as any).creatorId ||
      userId,
    );

    const memberUsageCheck = await this.subscriptionsService.checkWorkspaceMemberLimit(
      workspaceOwnerId,
      { userId: dto.userId },
    );

    if (!memberUsageCheck.allowed) {
      throw new ForbiddenException(
        `Workspace member limit reached. Your current plan allows ${memberUsageCheck.limit} active workspace members.`,
      );
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

    if (userId === memberUserId) {
      throw new BadRequestException('Use leave project instead of removing yourself');
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    const removedMember = project.members[memberIndex] as any;
    const removedDisplayRole = removedMember?.displayRole || removedMember?.role || MemberRole.MEMBER;

    project.members.splice(memberIndex, 1);

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length } },
    );

    const updated = await project.save();

    await this.notifyProjectMembersAboutMemberRemoval(
      updated,
      userId,
      memberUserId,
      removedDisplayRole,
    );

    this.eventEmitter.emit('project.member.removed', {
      projectId: updated._id,
      memberId: memberUserId,
      removedBy: userId,
    });

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'member_removed',
      memberId: memberUserId,
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
    const updated = await project.save();

    await this.notifyProjectMembersAboutPermissionRoleChange(
      updated,
      userId,
      memberUserId,
      dto.role,
    );

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'permission_role_updated',
      memberId: memberUserId,
      role: dto.role,
    });

    return updated;
  }

  async updateMemberDisplayRole(
    projectId: string,
    userId: string,
    memberUserId: string,
    displayRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to manage member roles');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Owner display role is controlled by ownership');
    }

    const normalizedDisplayRole = this.normalizeMemberDisplayRole(displayRole);

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    (project.members[memberIndex] as any).displayRole = normalizedDisplayRole;
    project.markModified(`members.${memberIndex}.displayRole`);

    const updated = await project.save();

    await this.notifyProjectMembersAboutDisplayRoleChange(
      updated,
      userId,
      memberUserId,
      normalizedDisplayRole,
    );

    this.eventEmitter.emit('project.member.display_role_updated', {
      projectId: updated._id,
      changedBy: userId,
      memberId: memberUserId,
      displayRole: normalizedDisplayRole,
    });

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'display_role_updated',
      memberId: memberUserId,
      displayRole: normalizedDisplayRole,
    });

    return updated;
  }

  private normalizeMemberDisplayRole(displayRole: string): string {
    const normalized = String(displayRole || '').replace(/\s+/g, ' ').trim();

    if (!normalized) {
      throw new BadRequestException('Display role is required');
    }

    if (normalized.length > 40) {
      throw new BadRequestException('Display role must be 40 characters or fewer');
    }

    return normalized;
  }

  private getProjectNotificationName(project: ProjectDocument): string {
    return String((project as any)?.name || (project as any)?.title || 'Project').trim() || 'Project';
  }

  private getProjectNotificationId(project: ProjectDocument): string {
    return String((project as any)?._id || (project as any)?.id || '').trim();
  }

  private getProjectNotificationUserIds(
    project: ProjectDocument,
    extraUserIds: string[] = [],
  ): string[] {
    const ids = new Set<string>();

    const ownerId = this.getProjectOwnerId(project);
    if (ownerId) ids.add(ownerId);

    const members = Array.isArray(project?.members) ? project.members : [];
    members.forEach((member: any) => {
      const memberId = this.getProjectMemberUserId(member);
      if (memberId) ids.add(memberId);
    });

    extraUserIds.forEach((id) => {
      const normalized = this.normalizeAccessUserId(id);
      if (normalized) ids.add(normalized);
    });

    return Array.from(ids).filter(Boolean);
  }

  private async notifyProjectMembers(args: {
    project: ProjectDocument;
    recipientUserIds?: string[];
    triggeredBy: string;
    type: NotificationType;
    title: string;
    body: string;
    icon: string;
    groupKey: string;
    extra?: Record<string, any>;
  }): Promise<void> {
    if (!this.notifications?.createBulk) return;

    const projectId = this.getProjectNotificationId(args.project);
    const projectName = this.getProjectNotificationName(args.project);
    const recipientUserIds = args.recipientUserIds?.length
      ? args.recipientUserIds
      : this.getProjectNotificationUserIds(args.project);

    if (!projectId || recipientUserIds.length === 0) return;

    await this.notifications.createBulk(
      recipientUserIds.map((recipientId) => ({
        userId: recipientId,
        type: args.type,
        title: args.title,
        body: args.body,
        icon: args.icon,
        priority: NotificationPriority.NORMAL,
        triggeredBy: args.triggeredBy,
        data: {
          projectId,
          projectName,
          extra: args.extra || {},
        },
        actions: [{ label: 'View Project', url: `/projects/${projectId}` }],
        groupKey: `${args.groupKey}-${recipientId}`,
      })),
    );
  }

  private async notifyProjectMembersAboutDisplayRoleChange(
    project: ProjectDocument,
    changedBy: string,
    memberUserId: string,
    displayRole: string,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);

    await this.notifyProjectMembers({
      project,
      triggeredBy: changedBy,
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project Role Updated',
      body: `${projectName}: a member role label was changed to ${displayRole}.`,
      icon: '🏷️',
      groupKey: `project-display-role-${projectId}-${memberUserId}-${displayRole}`,
      extra: {
        action: 'display_role_updated',
        memberId: memberUserId,
        displayRole,
      },
    });
  }

  private async notifyProjectMembersAboutPermissionRoleChange(
    project: ProjectDocument,
    changedBy: string,
    memberUserId: string,
    role: MemberRole,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);

    await this.notifyProjectMembers({
      project,
      triggeredBy: changedBy,
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project Permission Updated',
      body: `${projectName}: a member permission role was changed to ${role}.`,
      icon: '🛡️',
      groupKey: `project-permission-role-${projectId}-${memberUserId}-${role}`,
      extra: {
        action: 'permission_role_updated',
        memberId: memberUserId,
        role,
      },
    });
  }

  private async notifyProjectMembersAboutMemberRemoval(
    project: ProjectDocument,
    removedBy: string,
    removedMemberUserId: string,
    removedDisplayRole: string,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);
    const recipientUserIds = this.getProjectNotificationUserIds(project, [removedMemberUserId]);

    await this.notifyProjectMembers({
      project,
      recipientUserIds,
      triggeredBy: removedBy,
      type: NotificationType.PROJECT_MEMBER_LEFT,
      title: 'Project Member Removed',
      body: `${projectName}: a member was removed from the project.`,
      icon: '👋',
      groupKey: `project-member-removed-${projectId}-${removedMemberUserId}`,
      extra: {
        action: 'member_removed',
        memberId: removedMemberUserId,
        displayRole: removedDisplayRole,
      },
    });
  }

  private normalizeProjectNotificationPreferences(
    preferences: any,
  ): ProjectNotificationPreferences {
    const normalized: ProjectNotificationPreferences = {
      ...DEFAULT_PROJECT_NOTIFICATION_PREFERENCES,
    };

    for (const key of PROJECT_NOTIFICATION_PREFERENCE_KEYS) {
      if (typeof preferences?.[key] === 'boolean') {
        normalized[key] = preferences[key];
      }
    }

    return normalized;
  }

  private getProjectPreferenceMemberIndex(project: ProjectDocument, userId: string): number {
    const normalizedUserId = String(userId || '');
    const members = Array.isArray(project?.members) ? project.members : [];

    return members.findIndex((member: any) => {
      const memberUserId = member?.userId?._id || member?.userId || member?.user?._id || member?.user;
      return String(memberUserId || '') === normalizedUserId;
    });
  }

  async getMemberPreferences(
    projectId: string,
    userId: string,
  ): Promise<ProjectNotificationPreferences> {
    const project = await this.findByIdWithAccess(projectId, userId);
    const memberIndex = this.getProjectPreferenceMemberIndex(project, userId);

    if (memberIndex >= 0) {
      return this.normalizeProjectNotificationPreferences(
        project.members[memberIndex]?.preferences,
      );
    }

    const ownerId = project?.ownerId?._id || project?.ownerId || (project as any)?.owner?._id || (project as any)?.owner;
    if (String(ownerId || '') !== String(userId)) {
      throw new BadRequestException('You are not a member of this project');
    }

    return this.normalizeProjectNotificationPreferences(null);
  }

  async updateMemberPreferences(
    projectId: string,
    userId: string,
    preferences: Partial<ProjectNotificationPreferences>,
  ): Promise<ProjectNotificationPreferences> {
    const project = await this.findByIdWithAccess(projectId, userId);
    let memberIndex = this.getProjectPreferenceMemberIndex(project, userId);

    if (memberIndex === -1) {
      const ownerId = project?.ownerId?._id || project?.ownerId || (project as any)?.owner?._id || (project as any)?.owner;
      if (String(ownerId || '') !== String(userId)) {
        throw new BadRequestException('You are not a member of this project');
      }

      project.members.push({
        userId: new Types.ObjectId(userId),
        role: MemberRole.OWNER,
        joinedAt: project.createdAt || new Date(),
        preferences: {},
      } as ProjectMember);
      memberIndex = project.members.length - 1;
    }

    const currentPreferences = this.normalizeProjectNotificationPreferences(
      project.members[memberIndex]?.preferences,
    );
    const nextPreferences = { ...currentPreferences };

    for (const key of PROJECT_NOTIFICATION_PREFERENCE_KEYS) {
      if (typeof preferences?.[key] === 'boolean') {
        nextPreferences[key] = preferences[key] as boolean;
      }
    }

    project.members[memberIndex].preferences = {
      ...(project.members[memberIndex].preferences || {}),
      ...nextPreferences,
    };

    project.markModified(`members.${memberIndex}.preferences`);
    await project.save();
    return nextPreferences;
  }

  async leaveProject(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.findByIdWithAccess(
      projectId,
      userId,
    );

    const ownerId =
      project.ownerId?.toString?.() ||
      String((project as any)?.owner || '');

    if (ownerId === String(userId)) {
      throw new BadRequestException(
        'Project owners cannot leave their own project. ' +
        'Archive or permanently delete the project.',
      );
    }

    const memberIndex = (
      project.members || []
    ).findIndex((member: any) => {
      const memberId =
        member?.userId?._id ||
        member?.userId ||
        member?.user?._id ||
        member?.user ||
        member?.memberId ||
        '';

      return String(memberId) === String(userId);
    });

    if (memberIndex === -1) {
      throw new BadRequestException(
        'You are not a member of this project',
      );
    }

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

  private buildDisplayName(userLike: any, fallback = 'Someone'): string {
    if (!userLike) return fallback;

    if (typeof userLike === 'string' || typeof userLike === 'number') {
      return fallback;
    }

    const fullName = [userLike?.firstName, userLike?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      userLike?.name ||
      userLike?.fullName ||
      userLike?.displayName ||
      fullName ||
      userLike?.username ||
      userLike?.email ||
      fallback
    );
  }

  private buildAvatarUrl(userLike: any): string | null {
    if (!userLike || typeof userLike !== 'object') return null;

    return (
      userLike?.avatarUrl ||
      userLike?.profilePicture ||
      userLike?.avatar ||
      userLike?.photoUrl ||
      userLike?.imageUrl ||
      userLike?.profile?.avatarUrl ||
      userLike?.profile?.photoUrl ||
      null
    );
  }

  private unwrapProjectMemberUser(member: any): any {
    if (!member) return null;

    if (member?.userId && typeof member.userId === 'object') return member.userId;
    if (member?.user && typeof member.user === 'object') return member.user;
    if (member?.member && typeof member.member === 'object') return member.member;

    return member;
  }

  private findProjectMemberUserById(project: any, candidateId: any): any {
    const id = this.extractAnyId(candidateId);
    if (!id || !project) return null;

    const ownerId = this.extractAnyId(project?.ownerId || project?.owner);
    if (ownerId && ownerId === id) {
      return project?.ownerId || project?.owner;
    }

    const members = Array.isArray(project?.members) ? project.members : [];
    const matchedMember = members.find((member: any) => {
      const memberUser = this.unwrapProjectMemberUser(member);
      return this.extractAnyId(memberUser || member?.userId || member?.user) === id;
    });

    return matchedMember ? this.unwrapProjectMemberUser(matchedMember) : null;
  }

  private buildActivityActorSnapshot(task: any, project: any): any {
    const candidateUserObjects = [
      task?.updatedBy,
      task?.completedBy,
      task?.createdBy,
      task?.assignedTo,
      task?.assignee,
      task?.user,
      task?.owner,
    ].filter((value) => value && typeof value === 'object');

    const directUser = candidateUserObjects.find((value) => this.extractAnyId(value));
    if (directUser) {
      const actorId = this.extractAnyId(directUser);
      return {
        id: actorId,
        _id: actorId,
        name: this.buildDisplayName(directUser),
        username: directUser?.username || '',
        email: directUser?.email || '',
        avatarUrl: this.buildAvatarUrl(directUser),
        profilePicture: this.buildAvatarUrl(directUser),
      };
    }

    const candidateIds = [
      task?.updatedBy,
      task?.updatedById,
      task?.completedBy,
      task?.completedById,
      task?.createdBy,
      task?.createdById,
      task?.assigneeId,
      task?.assignedToId,
      task?.userId,
      task?.ownerId,
    ];

    for (const candidateId of candidateIds) {
      const matchedUser = this.findProjectMemberUserById(project, candidateId);
      if (matchedUser) {
        const actorId = this.extractAnyId(matchedUser);
        return {
          id: actorId,
          _id: actorId,
          name: this.buildDisplayName(matchedUser),
          username: matchedUser?.username || '',
          email: matchedUser?.email || '',
          avatarUrl: this.buildAvatarUrl(matchedUser),
          profilePicture: this.buildAvatarUrl(matchedUser),
        };
      }
    }

    const ownerLike = project?.ownerId || project?.owner || null;
    const ownerId = this.extractAnyId(ownerLike);

    return {
      id: ownerId || '',
      _id: ownerId || '',
      name: this.buildDisplayName(ownerLike, 'Project member'),
      username: ownerLike?.username || '',
      email: ownerLike?.email || '',
      avatarUrl: this.buildAvatarUrl(ownerLike),
      profilePicture: this.buildAvatarUrl(ownerLike),
    };
  }


  // PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE
  // Live Activity is derived from tasks, but the card needs a real actor object
  // so it can display the correct user name and avatar instead of falling back
  // to "Project member".
  private projectOverviewNormalizeActorId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (value?._id) return this.projectOverviewNormalizeActorId(value._id);
    if (value?.id) return this.projectOverviewNormalizeActorId(value.id);
    if (value?.userId) return this.projectOverviewNormalizeActorId(value.userId);
    if (value?.user) return this.projectOverviewNormalizeActorId(value.user);

    if (typeof value?.toString === 'function') {
      const raw = value.toString();
      if (raw && raw !== '[object Object]') return raw;
    }

    return '';
  }

  private projectOverviewGetActorDisplayName(value: any): string {
    if (!value || typeof value !== 'object') return '';

    const fullName = [value.firstName, value.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      value.name ||
      value.displayName ||
      fullName ||
      value.username ||
      value.email ||
      ''
    );
  }

  private projectOverviewGetActorAvatar(value: any): string {
    if (!value || typeof value !== 'object') return '';

    return (
      value.avatarUrl ||
      value.profilePicture ||
      value.profileImage ||
      value.avatar ||
      value.imageUrl ||
      value.picture ||
      value.photoURL ||
      ''
    );
  }

  private projectOverviewSerializeActivityActor(value: any, fallbackLabel = 'Project member'): any {
    const id = this.projectOverviewNormalizeActorId(value);
    const name = this.projectOverviewGetActorDisplayName(value) || fallbackLabel;
    const avatarUrl = this.projectOverviewGetActorAvatar(value);

    return {
      _id: id || undefined,
      id: id || undefined,
      name,
      displayName: name,
      username: value?.username || undefined,
      email: value?.email || undefined,
      avatarUrl: avatarUrl || undefined,
      profilePicture: avatarUrl || undefined,
      profileImage: avatarUrl || undefined,
      avatar: avatarUrl || undefined,
    };
  }

  private projectOverviewBuildActorLookup(project: any): Map<string, any> {
    const actors = new Map<string, any>();

    const addActor = (candidate: any) => {
      if (!candidate) return;

      const actor = candidate?.userId || candidate?.user || candidate?.member || candidate;
      const id = this.projectOverviewNormalizeActorId(actor);

      if (!id) return;

      actors.set(id, actor);
    };

    addActor(project?.ownerId);
    addActor(project?.owner);
    addActor((project as any)?.createdBy);
    addActor((project as any)?.createdById);

    const members = Array.isArray(project?.members) ? project.members : [];
    for (const member of members) {
      addActor(member);
    }

    return actors;
  }

  private projectOverviewResolveActivityActor(task: any, project: any, fallbackUserId?: string): any {
    const actors = this.projectOverviewBuildActorLookup(project);

    const candidates = [
      task?.completedBy,
      task?.completedById,
      task?.lastUpdatedBy,
      task?.updatedBy,
      task?.updatedById,
      task?.modifiedBy,
      task?.modifiedById,
      task?.actor,
      task?.actorId,
      task?.user,
      task?.userId,
      task?.assignee,
      task?.assigneeId,
      task?.assignedTo,
      task?.assignedToId,
      task?.createdBy,
      task?.createdById,
      fallbackUserId,
      project?.ownerId,
      project?.owner,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (typeof candidate === 'object') {
        const directName = this.projectOverviewGetActorDisplayName(candidate);
        const directAvatar = this.projectOverviewGetActorAvatar(candidate);

        if (directName || directAvatar) {
          return candidate;
        }
      }

      const id = this.projectOverviewNormalizeActorId(candidate);
      if (id && actors.has(id)) {
        return actors.get(id);
      }
    }

    return null;
  }

  private buildRecentActivity(tasks: any[], project?: any, fallbackUserId?: string): any[] {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    return [...tasks]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 8)
      .map((task) => {
        const actor = this.projectOverviewResolveActivityActor(task, project, fallbackUserId);
        const serializedActor = this.projectOverviewSerializeActivityActor(actor, 'Project member');

        const normalizedStatus = String(task?.status || '').toLowerCase();
        const taskIsDone = this.isTaskDone(task);
        const taskIsInProgress =
          normalizedStatus === 'in_progress' ||
          normalizedStatus === 'in-progress' ||
          normalizedStatus === 'progress' ||
          normalizedStatus === 'doing';

        const type = taskIsDone
          ? 'task_completed'
          : taskIsInProgress
            ? 'task_in_progress'
            : 'task_updated';

        const action = taskIsDone
          ? 'completed'
          : taskIsInProgress
            ? 'started'
            : 'updated';

        const target = task?.title || task?.name || 'Task';
        const timestamp = task?.updatedAt || task?.createdAt || new Date().toISOString();

        return {
          id: task?._id?.toString?.() || task?.id,
          taskId: task?._id?.toString?.() || task?.id,
          type,
          action,
          target,
          title: target,
          message: `${serializedActor.name} ${action} ${target}`,
          text: `${serializedActor.name} ${action} ${target}`,
          actor: serializedActor,
          actorId: serializedActor.id,
          actorName: serializedActor.name,
          actorAvatar: serializedActor.avatarUrl,
          avatarUrl: serializedActor.avatarUrl,
          profilePicture: serializedActor.profilePicture,
          profileImage: serializedActor.profileImage,
          createdAt: timestamp,
          updatedAt: timestamp,
          status: task?.status || 'todo',
        };
      });
  }


  private normalizeStoredProjectActivity(item: any): any {
    const payload = item?.payload || {};
    const details = item?.details || {};
    const metadata = item?.metadata || {};

    const actorCandidate =
      item?.actor ||
      item?.user ||
      item?.userId ||
      item?.actorId ||
      payload?.actor ||
      payload?.user ||
      payload?.userId ||
      payload?.actorId;

    const serializedActor = this.projectOverviewSerializeActivityActor(
      actorCandidate,
      item?.actorName || item?.userName || 'Project member',
    );

    const target =
      item?.targetTitle ||
      details?.targetTitle ||
      details?.taskTitle ||
      metadata?.taskTitle ||
      payload?.targetTitle ||
      payload?.taskTitle ||
      payload?.snapshot?.title ||
      details?.milestoneTitle ||
      metadata?.milestoneTitle ||
      payload?.milestoneTitle ||
      details?.eventTitle ||
      metadata?.eventTitle ||
      payload?.eventTitle ||
      details?.fileName ||
      metadata?.fileName ||
      payload?.fileName ||
      details?.folderName ||
      metadata?.folderName ||
      payload?.folderName ||
      details?.announcementTitle ||
      metadata?.announcementTitle ||
      payload?.announcementTitle ||
      item?.title ||
      item?.name ||
      '';

    const type = String(item?.type || item?.action || 'project_activity');
    const action = String(item?.action || type).replace(/\./g, '_');
    const createdAt = item?.createdAt || item?.updatedAt || new Date().toISOString();

    const message =
      item?.message ||
      item?.text ||
      payload?.message ||
      details?.message ||
      (target
        ? `${serializedActor.name} updated ${target}`
        : `${serializedActor.name} updated the project`);

    return {
      ...item,
      id: item?._id?.toString?.() || item?.id || `${type}-${createdAt}`,
      _id: item?._id,
      type,
      action,
      target,
      targetTitle: target,
      title: target || item?.title || item?.name || 'Project activity',
      message,
      text: message,
      actor: serializedActor,
      user: serializedActor,
      actorId: serializedActor.id || serializedActor._id,
      userId: serializedActor.id || serializedActor._id || item?.userId,
      actorName: serializedActor.name,
      userName: serializedActor.name,
      displayName: serializedActor.name,
      actorAvatar: serializedActor.avatarUrl,
      avatarUrl: serializedActor.avatarUrl,
      profilePicture: serializedActor.profilePicture,
      profileImage: serializedActor.profileImage,
      createdAt,
      updatedAt: item?.updatedAt || createdAt,
    };
  }

  private async buildProjectOverviewActivity(
    projectId: string,
    userId: string,
    fallbackActivity: any[],
  ): Promise<any[]> {
    if (!this.activities?.listProject) {
      return fallbackActivity;
    }

    try {
      const result = await this.activities.listProject({
        projectId,
        userId,
        limit: 12,
        cursor: null,
        type: null,
        entityId: null,
      });

      const items = Array.isArray((result as any)?.items)
        ? (result as any).items
        : Array.isArray(result)
          ? result
          : [];

      const normalized = items
        .filter(Boolean)
        .map((item) => this.normalizeStoredProjectActivity(item));

      return normalized.length > 0 ? normalized : fallbackActivity;
    } catch (err: any) {
      this.logger.warn(
        `Project overview activity fallback used for ${projectId}: ${err?.message || err}`,
      );
      return fallbackActivity;
    }
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


  /* finish-line-milestone-backend-v1
   * Moves represent execution work.
   * Milestones represent major project stages.
   * Linked milestone tasks are not duplicated here.
   */
  private isMilestoneDone(milestone: any): boolean {
    if (!milestone) return false;

    const status = String(
      milestone?.status ||
        milestone?.state ||
        '',
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    const progress = Number(milestone?.progress || 0);

    return (
      Boolean(milestone?.completedAt) ||
      (Number.isFinite(progress) && progress >= 100) ||
      [
        'completed',
        'complete',
        'done',
        'shipped',
      ].includes(status)
    );
  }

  private async loadProjectMilestones(
    projectId: string | Types.ObjectId,
  ): Promise<any[]> {
    const rawProjectId = String(projectId || '');

    if (!Types.ObjectId.isValid(rawProjectId)) {
      return [];
    }

    const pid = new Types.ObjectId(rawProjectId);

    return this.projectModel.db
      .collection('milestones')
      .find({ projectId: pid })
      .sort({
        order: 1,
        targetDate: 1,
        createdAt: 1,
      })
      .toArray();
  }

  private buildClosureReadiness(
    project: any,
    tasks: any[],
    goals: any[],
    milestones: any[] = [],
  ): ProjectClosureReadinessResult {
    const openTasks = Array.isArray(tasks)
      ? tasks.filter(
          (task) => !this.isTaskDone(task),
        )
      : [];

    const openCriticalTasks = openTasks.filter(
      (task) =>
        this.priorityRank(task?.priority) >= 3,
    );

    const blockedTasks = openTasks.filter(
      (task) => this.isTaskBlocked(task),
    );

    const activeGoals = Array.isArray(goals)
      ? goals.filter(
          (goal) => goal?.status !== 'completed',
        )
      : [];

    const completedGoals = Array.isArray(goals)
      ? goals.filter(
          (goal) => goal?.status === 'completed',
        )
      : [];

    const milestoneItems = Array.isArray(milestones)
      ? milestones.filter(Boolean)
      : [];

    const completedMilestones =
      milestoneItems.filter(
        (milestone) =>
          this.isMilestoneDone(milestone),
      );

    const remainingMilestones =
      milestoneItems.filter(
        (milestone) =>
          !this.isMilestoneDone(milestone),
      );

    const hasActiveSprint = Boolean(
      (project as any)?.metrics?.activeSprintId,
    );

    const checklist =
      (project as any)?.closureChecklist || {};

    const blockingReasons: string[] = [];
    const warnings: string[] = [];

    if (openTasks.length > 0) {
      blockingReasons.push(
        `${openTasks.length} move${
          openTasks.length === 1 ? '' : 's'
        } remaining`,
      );
    }

    if (blockedTasks.length > 0) {
      blockingReasons.push(
        `${blockedTasks.length} blocked move${
          blockedTasks.length === 1 ? '' : 's'
        } unresolved`,
      );
    }

    if (remainingMilestones.length > 0) {
      blockingReasons.push(
        `${remainingMilestones.length} milestone${
          remainingMilestones.length === 1 ? '' : 's'
        } remaining`,
      );
    }

    if (activeGoals.length > 0) {
      blockingReasons.push(
        `${activeGoals.length} goal${
          activeGoals.length === 1 ? '' : 's'
        } remaining`,
      );
    }

    if (hasActiveSprint) {
      blockingReasons.push(
        'Active sprint still running',
      );
    }

    if (!checklist.primaryGoalConfirmed) {
      warnings.push(
        'Primary outcome not yet confirmed',
      );
    }

    if (!checklist.summaryWritten) {
      warnings.push(
        'Closure summary not yet written',
      );
    }

    if (!checklist.stakeholderSignoff) {
      warnings.push(
        'Stakeholder signoff not yet recorded',
      );
    }

    let readinessScore = 100;

    /*
     * All unfinished Moves affect closeout readiness.
     */
    readinessScore -= Math.min(
      35,
      openTasks.length * 7,
    );

    /*
     * Blocked Moves receive an additional urgency penalty.
     */
    readinessScore -= Math.min(
      20,
      blockedTasks.length * 10,
    );

    /*
     * Priority remains an internal risk signal rather
     * than a separate user-facing Finish Line category.
     */
    readinessScore -= Math.min(
      10,
      openCriticalTasks.length * 5,
    );

    /*
     * Milestone penalty is separate from linked Moves.
     */
    readinessScore -= Math.min(
      15,
      remainingMilestones.length * 5,
    );

    readinessScore -= Math.min(
      15,
      activeGoals.length * 5,
    );

    readinessScore -= hasActiveSprint ? 10 : 0;

    readinessScore -= Math.min(
      15,
      warnings.length * 5,
    );

    readinessScore = Math.max(
      0,
      Math.min(100, readinessScore),
    );

    return {
      isReadyToClose:
        blockingReasons.length === 0,

      readinessScore,
      blockingReasons,
      warnings,

      openTaskCount: openTasks.length,

      openCriticalTaskCount:
        openCriticalTasks.length,

      blockedTaskCount:
        blockedTasks.length,

      activeGoalCount:
        activeGoals.length,

      completedGoalCount:
        completedGoals.length,

      remainingMilestoneCount:
        remainingMilestones.length,

      completedMilestoneCount:
        completedMilestones.length,

      totalMilestoneCount:
        milestoneItems.length,

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

    const milestones =
      await this.loadProjectMilestones(pid);

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
    const fallbackActivity = this.buildRecentActivity(tasks, project, userId);
    const activity = await this.buildProjectOverviewActivity(projectId, userId, fallbackActivity);

    const normalizedGoals = this.buildGoalSnapshots(project, tasks);
    const activeGoals = normalizedGoals.filter((goal) => goal.status !== 'completed');
    const closureReadiness =
        this.buildClosureReadiness(
          project,
          tasks,
          normalizedGoals,
          milestones,
        );

    return {
      project,
      tasks,
      milestones,
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
  private getPublicDiscoverableProjectFilter() {
    return {
      $and: [
        {
          $or: [
            { visibility: ProjectVisibility.PUBLIC },
            { visibility: ProjectVisibility.LISTED },
            { isPublic: true },
            { 'settings.isPublic': true },
          ],
        },
        {
          $or: [
            { isListed: true },
            { discoverable: true },
            { 'settings.isListed': true },
            { 'settings.discoverable': true },
          ],
        },
        { status: { $ne: ProjectStatus.ARCHIVED } },
        { isArchived: { $ne: true } },
      ],
    };
  }



  async getFeaturedProjects(limit: number = 6): Promise<ProjectDocument[]> {
    return this.projectModel
      .find(this.getPublicDiscoverableProjectFilter())
      .sort({
        'metrics.totalShips': -1,
        'metrics.lastActivityAt': -1,
      })
      .limit(limit)
      .exec();
  }

  private normalizeAccessUserId(value: any): string {
    return String(value || '').trim();
  }

  private getProjectOwnerId(project: ProjectDocument): string {
    return this.normalizeAccessUserId(
      project?.ownerId ||
        (project as any)?.owner ||
        (project as any)?.createdBy ||
        (project as any)?.createdById,
    );
  }

  private getProjectMemberUserId(member: any): string {
    return this.normalizeAccessUserId(
      member?.userId ||
        member?.user ||
        member?._id ||
        member?.id ||
        member,
    );
  }

  private isProjectArchivedForAccess(project: ProjectDocument): boolean {
    const status = String(project?.status || '').trim().toLowerCase();

    return (
      (project as any)?.isArchived === true ||
      status === String(ProjectStatus.ARCHIVED).toLowerCase() ||
      status === 'archived' ||
      status === 'deleted'
    );
  }

  private isPublicProjectForAccess(project: ProjectDocument): boolean {
    if (!project || this.isProjectArchivedForAccess(project)) {
      return false;
    }

    const visibility = String(project?.visibility || '').trim().toLowerCase();
    const settings = (project as any)?.settings || {};

    return (
      visibility === String(ProjectVisibility.PUBLIC).toLowerCase() ||
      visibility === String(ProjectVisibility.LISTED).toLowerCase() ||
      visibility === 'public' ||
      visibility === 'listed' ||
      (project as any)?.isPublic === true ||
      (project as any)?.public === true ||
      settings?.isPublic === true
    );
  }

  private isProjectOwner(project: ProjectDocument, userId: string): boolean {
    const normalizedUserId = this.normalizeAccessUserId(userId);
    if (!normalizedUserId) return false;

    return this.getProjectOwnerId(project) === normalizedUserId;
  }

  private isProjectMember(project: ProjectDocument, userId: string): boolean {
    const normalizedUserId = this.normalizeAccessUserId(userId);
    if (!normalizedUserId) return false;

    const members = Array.isArray(project?.members) ? project.members : [];

    return members.some((member: any) => (
      this.getProjectMemberUserId(member) === normalizedUserId
    ));
  }

  private hasAccess(project: ProjectDocument, userId: string): boolean {
    // Owner/member access remains full project access.
    if (this.isProjectOwner(project, userId)) return true;
    if (this.isProjectMember(project, userId)) return true;

    // Public projects are readable by non-members so ProjectHome can render
    // spectator/read-only mode. Mutating methods still call canEdit(),
    // canManageMembers(), or owner checks after this, so this does not grant
    // write permissions.
    return this.isPublicProjectForAccess(project);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {
    if (this.isProjectOwner(project, userId)) return true;

    const normalizedUserId = this.normalizeAccessUserId(userId);
    const members = Array.isArray(project?.members) ? project.members : [];
    const member = members.find((m: any) => (
      this.getProjectMemberUserId(m) === normalizedUserId
    ));

    return member?.role === MemberRole.ADMIN;
  }

  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    if (this.isProjectOwner(project, userId)) return true;

    const normalizedUserId = this.normalizeAccessUserId(userId);
    const members = Array.isArray(project?.members) ? project.members : [];
    const member = members.find((m: any) => (
      this.getProjectMemberUserId(m) === normalizedUserId
    ));

    return member?.role === MemberRole.ADMIN;
  }
}

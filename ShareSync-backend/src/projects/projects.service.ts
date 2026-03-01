// src/projects/projects.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SERVICE: Business Logic for Project Management
// - SAFE PATCH: updateMetrics() now merges instead of overwriting metrics object
// - SAFE PATCH: create() normalizes emoji/icon + ensures settings/goals defaults
// - SAFE PATCH: create() now handles privacy→visibility, title, category, members
// - PHASE 3: helper triggers for follower notifications (ship updates / milestones)
// - PHASE 4: Discovery feed support
// - PRIORITY 1: createFromTemplate + getFeaturedProjects (Zero-State Revolution)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Project,
  ProjectDocument,
  ProjectStatus,
  ProjectVisibility,
  MemberRole,
  ProjectMember,
} from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';

// ✅ Phase 3: follower notifications (optional injection)
import { NotificationsService } from '../notifications/notifications.service';

// ✅ Priority 1: project templates
import { getProjectTemplate, TemplateType, ProjectTemplate } from './templates/project-templates';

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

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly eventEmitter: EventEmitter2,

    // ✅ Optional so we don't create circular/module boot traps
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPATIBILITY METHODS (for old ProjectService API)
  // ─────────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBUG SUPPORT
  // ─────────────────────────────────────────────────────────────────────────────

  async findAllNoFilter(): Promise<ProjectDocument[]> {
    return this.projectModel.find({}).exec();
  }

  async findByUser(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    return result.projects;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC SHARE (minimal implementation so share.controller.ts compiles)
  // ─────────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // FIELD NORMALIZATION (handles frontend→backend field mapping)
    // ═══════════════════════════════════════════════════════════════════════════

    // ✅ Normalize emoji/icon safely:
    const emoji = (dto.emoji || dto.icon || '📁').trim();

    // ✅ Normalize visibility from privacy field
    // Frontend sends: "Private" | "Public" | "Listed"
    // Backend expects: ProjectVisibility enum
    let visibility: ProjectVisibility = ProjectVisibility.PRIVATE;
    
    if (dto.visibility) {
      visibility = dto.visibility;
    } else if (dto.privacy) {
      const privacyLower = String(dto.privacy).toLowerCase();
      if (privacyLower === 'public') {
        visibility = ProjectVisibility.PUBLIC;
      } else if (privacyLower === 'listed') {
        visibility = ProjectVisibility.LISTED;
      } else {
        visibility = ProjectVisibility.PRIVATE;
      }
    }

    // ✅ Use title as name fallback (frontend sends both)
    const projectName = dto.name || dto.title || 'Untitled Project';

    // ✅ Handle isPublic flag from frontend
    const isPublic = dto.isPublic === true || 
                     visibility === ProjectVisibility.PUBLIC || 
                     visibility === ProjectVisibility.LISTED;

    // ✅ Merge settings with isPublic/isListed from various sources
    const settings = {
      ...(dto.settings || {}),
      isPublic: dto.settings?.isPublic ?? isPublic,
      isListed: dto.settings?.isListed ?? (visibility === ProjectVisibility.LISTED),
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE PROJECT DOCUMENT
    // ═══════════════════════════════════════════════════════════════════════════

    const project = new this.projectModel({
      // Core fields from DTO
      name: projectName,
      description: dto.description,
      emoji,
      icon: dto.icon || emoji,
      color: dto.color || '#7C3AED',
      visibility,
      tags: dto.tags || [],
      
      // Category and status from frontend
      category: dto.category || null,
      status: dto.status ? this.normalizeStatus(dto.status) : ProjectStatus.ACTIVE,

      // Ownership
      ownerId: new Types.ObjectId(userId),
      members: [],

      // Nested objects
      goals: dto.goals || [],
      settings,

      // Ensure full metrics object exists for Pulse / sorting
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
        memberCount: 1, // Owner counts as 1
        likes: 0,
        comments: 0,
      },

      // Phase 3: safe default
      followersCount: 0,

      // Phase 4: Discover fields
      streakDays: 0,
      trendingScore: 0,
    });

    const saved = await project.save();

    // ═══════════════════════════════════════════════════════════════════════════
    // POST-CREATION: Handle member invites (if provided)
    // ═══════════════════════════════════════════════════════════════════════════
    if (dto.members && Array.isArray(dto.members) && dto.members.length > 0) {
      this.logger.log(`Processing ${dto.members.length} member invites for project ${saved._id}`);
      
      this.eventEmitter.emit('project.members.invited', {
        projectId: saved._id,
        invitedBy: userId,
        members: dto.members,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMIT EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    this.eventEmitter.emit('project.created', {
      projectId: saved._id,
      userId,
      projectName: saved.name,
      visibility: saved.visibility,
      isPublic,
    });

    this.logger.log(`Project created: ${saved._id} (visibility: ${visibility})`);
    return saved;
  }

  // ✅ Helper to normalize status string from frontend
  // Uses string literals that match the enum values for safety
  private normalizeStatus(status: string): ProjectStatus {
    const statusLower = String(status).toLowerCase().replace(/\s+/g, '_');
    
    // Map common frontend values to enum
    // Using explicit enum values to avoid TypeScript errors
    switch (statusLower) {
      case 'active':
      case 'in_progress':
      case 'in progress':
        return ProjectStatus.ACTIVE;
      
      case 'planning':
        // If PLANNING exists, use it; otherwise fall back to ACTIVE
        return (ProjectStatus as any).PLANNING || ProjectStatus.ACTIVE;
      
      case 'on_hold':
      case 'on hold':
      case 'paused':
        // If ON_HOLD exists, use it; otherwise fall back to ACTIVE
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
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  async findByIdWithAccess(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.findById(projectId);
    if (!this.hasAccess(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async findUserProjects(
    userId: string,
    options: ProjectQueryOptions = {},
  ): Promise<{ projects: ProjectDocument[]; total: number }> {
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

    return { projects, total };
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

  async update(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to edit this project');
    }

    // Status timestamps
    if (dto.status) {
      if (dto.status === ProjectStatus.ARCHIVED) project.archivedAt = new Date();
      else if (dto.status === ProjectStatus.COMPLETED) project.completedAt = new Date();
    }

    // Merge settings safely (don't overwrite object)
    if ((dto as any).settings) {
      (project as any).settings = { ...(project as any).settings, ...(dto as any).settings };
      delete (dto as any).settings;
    }

    // Goals overwrite
    if ((dto as any).goals) {
      (project as any).goals = (dto as any).goals;
      delete (dto as any).goals;
    }

    // Emoji/icon normalization if provided
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

  // ✅ SAFETY FIX: patch nested metrics fields instead of overwriting whole object
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

    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, update);
  }

  async decrementTaskCount(projectId: string, wasCompleted: boolean = false): Promise<void> {
    const update: any = { $inc: { 'metrics.totalTasks': -1 } };
    if (wasCompleted) update.$inc['metrics.completedTasks'] = -1;

    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, update);
  }

  async markTaskCompleted(projectId: string): Promise<void> {
    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      {
        $inc: { 'metrics.completedTasks': 1, 'metrics.weeklyShips': 1 },
        $set: { 'metrics.lastActivityAt': new Date() },
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: SHIP + MILESTONE TRIGGERS
  // ─────────────────────────────────────────────────────────────────────────────

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
        $inc: { 'metrics.weeklyShips': 1, 'metrics.totalShips': 1 },
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
      {
        $set: { 'metrics.lastActivityAt': new Date() },
      },
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

  async archive(projectId: string, userId: string): Promise<ProjectDocument> {
    return this.update(projectId, userId, { status: ProjectStatus.ARCHIVED });
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectModel.deleteOne({ _id: project._id });

    this.eventEmitter.emit('project.deleted', { projectId: project._id, userId });

    this.logger.log(`Project deleted: ${projectId}`);
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

    // Update member count
    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length + 1 } }, // +1 for owner
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

  async removeMember(
    projectId: string,
    userId: string,
    memberUserId: string,
  ): Promise<ProjectDocument> {
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

    // Update member count
    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length + 1 } }, // +1 for owner
    );

    const updated = await project.save();

    this.eventEmitter.emit('project.member.removed', {
      projectId: updated._id,
      memberId: memberUserId,
      removedBy: userId,
    });

    return updated;
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    memberUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<ProjectDocument> {
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

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === userId);
    if (memberIndex === -1) {
      throw new BadRequestException('You are not a member of this project');
    }

    project.members[memberIndex].preferences = {
      ...project.members[memberIndex].preferences,
      ...preferences
    };

    project.markModified(`members.${memberIndex}.preferences`);
    return project.save();
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() === userId) {
      throw new BadRequestException('Owner cannot leave project. Transfer ownership first.');
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === userId);
    if (memberIndex === -1) {
      throw new BadRequestException('You are not a member of this project');
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    this.eventEmitter.emit('project.member.left', { projectId: project._id, userId });
  }

  async getPulseData(projectId: string, userId: string): Promise<PulseData> {
    const project = await this.findByIdWithAccess(projectId, userId);

    const metrics = (project as any).metrics || {
      momentum: 0,
      velocity: 0,
      weeklyShips: 0,
      momentumTrend: 0,
      totalTasks: 0,
      completedTasks: 0,
    };

    return {
      project,
      metrics: {
        momentum: metrics.momentum || 0,
        velocity: metrics.velocity || 0,
        weeklyShips: metrics.weeklyShips || 0,
        momentumTrend: metrics.momentumTrend || 0,
        completionRate:
          (metrics.totalTasks || 0) > 0
            ? Math.round(((metrics.completedTasks || 0) / (metrics.totalTasks || 0)) * 100)
            : 0,
      },
      criticalMoves: [],
      objectives: [],
      sprint: null,
      activity: [],
    };
  }

  private hasAccess(project: ProjectDocument, userId: string): boolean {
    if (project.ownerId.toString() === userId) return true;
    return project.members.some((m) => m.userId.toString() === userId);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {
    if (project.ownerId.toString() === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }

  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    if (project.ownerId.toString() === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ PRIORITY 1: TEMPLATE & FEATURED PROJECTS (Zero-State Revolution)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /projects/from-template
   * Creates a project from a predefined template (personal, team, learning).
   * Returns the created project. Tasks are created via event emission so
   * the tasks service handles them (avoids circular dependency).
   */
  async createFromTemplate(
    userId: string,
    templateType: TemplateType,
  ): Promise<{ project: ProjectDocument; taskCount: number }> {
    const template: ProjectTemplate = getProjectTemplate(templateType);

    this.logger.log(`Creating project from template "${templateType}" for user ${userId}`);

    // Create the project using the existing create() method
    // This ensures all normalization, events, and metrics init happen correctly
    const project = await this.create(userId, {
      name: template.name,
      description: template.description,
      emoji: template.emoji,
      icon: template.emoji,
      color: template.color,
      category: template.category,
      tags: [templateType, 'template'],
      visibility: ProjectVisibility.PRIVATE,
    } as any);

    // Emit event with template tasks so TasksService can create them
    // This avoids injecting TasksService here (which would be circular)
    this.eventEmitter.emit('project.template.tasks.create', {
      projectId: project._id.toString(),
      userId,
      tasks: template.tasks,
    });

    this.logger.log(`Template project created: ${project._id} with ${template.tasks.length} tasks queued`);

    return {
      project,
      taskCount: template.tasks.length,
    };
  }

  /**
   * GET /projects/featured
   * Returns public projects sorted by momentum/activity for the Discover empty state.
   * Falls back to seed data descriptions if no public projects exist.
   */
  async getFeaturedProjects(limit: number = 6): Promise<any[]> {
    // Try to find real public projects first
    const publicProjects = await this.projectModel
      .find({
        $or: [
          { visibility: ProjectVisibility.PUBLIC },
          { visibility: ProjectVisibility.LISTED },
          { 'settings.isPublic': true },
        ],
        status: { $ne: ProjectStatus.ARCHIVED },
      })
      .sort({ 'metrics.momentum': -1, 'metrics.lastActivityAt': -1 })
      .limit(limit)
      .lean()
      .exec();

    if (publicProjects.length > 0) {
      return publicProjects.map((p: any) => ({
        id: p._id,
        name: p.name,
        description: p.description || '',
        emoji: p.emoji || '📁',
        color: p.color || '#7C3AED',
        category: p.category || null,
        metrics: {
          momentum: p.metrics?.momentum || 0,
          totalTasks: p.metrics?.totalTasks || 0,
          completedTasks: p.metrics?.completedTasks || 0,
          memberCount: p.metrics?.memberCount || 1,
          weeklyShips: p.metrics?.weeklyShips || 0,
        },
        tags: p.tags || [],
        updatedAt: p.updatedAt,
      }));
    }

    // Fallback: return seed data so Discover page never looks empty
    return [
      {
        id: 'seed-1',
        name: 'OpenShare Core',
        description: 'Building the future of project management',
        emoji: '🚀',
        color: '#7C3AED',
        category: 'Job',
        metrics: { momentum: 85, totalTasks: 47, completedTasks: 38, memberCount: 3, weeklyShips: 12 },
        tags: ['engineering', 'product'],
        isSeed: true,
      },
      {
        id: 'seed-2',
        name: 'Design System v2',
        description: 'Unified component library and design tokens',
        emoji: '🎨',
        color: '#EC4899',
        category: 'Job',
        metrics: { momentum: 72, totalTasks: 23, completedTasks: 18, memberCount: 2, weeklyShips: 6 },
        tags: ['design', 'ui'],
        isSeed: true,
      },
      {
        id: 'seed-3',
        name: 'Learn TypeScript',
        description: 'From zero to confident in 30 days',
        emoji: '📚',
        color: '#3B82F6',
        category: 'School',
        metrics: { momentum: 64, totalTasks: 15, completedTasks: 10, memberCount: 1, weeklyShips: 4 },
        tags: ['learning', 'typescript'],
        isSeed: true,
      },
    ];
  }
}

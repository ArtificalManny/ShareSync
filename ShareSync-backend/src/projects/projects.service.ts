// src/projects/projects.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SERVICE: Business Logic for Project Management
// - SAFE PATCH: Replaced ALL project.save() memory mutations with atomic $set/$push
// - SAFE PATCH: Bypasses legacy Mongoose validation traps for older DB records
// - SAFE PATCH: Bulletproofed all member lookups against undefined/legacy user IDs
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

import { NotificationsService } from '../notifications/notifications.service';

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
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPATIBILITY METHODS
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

  async findAllNoFilter(): Promise<ProjectDocument[]> {
    return this.projectModel.find({}).exec();
  }

  async findByUser(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    return result.projects;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC SHARE
  // ─────────────────────────────────────────────────────────────────────────────

  async enablePublic(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && (project.ownerId || (project as any).owner)?.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to enable public sharing');
    }

    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    await this.projectModel.findByIdAndUpdate(projectId, { $set: { publicEnabled: true, publicToken } }, { runValidators: false });
    return { publicToken };
  }

  async disablePublic(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && (project.ownerId || (project as any).owner)?.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to disable public sharing');
    }

    await this.projectModel.findByIdAndUpdate(projectId, { $set: { publicEnabled: false, publicToken: null } }, { runValidators: false });
  }

  async regeneratePublicToken(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId) && (project.ownerId || (project as any).owner)?.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to regenerate public token');
    }

    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    await this.projectModel.findByIdAndUpdate(projectId, { $set: { publicEnabled: true, publicToken } }, { runValidators: false });
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

    const emoji = (dto.emoji || dto.icon || '📁').trim();

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

    const projectName = dto.name || dto.title || 'Untitled Project';

    const isPublic = dto.isPublic === true || 
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
      this.logger.log(`Processing ${dto.members.length} member invites for project ${saved._id}`);
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
    const project = await this.projectModel.findById(projectId)
      .populate("ownerId", "firstName lastName username email avatarUrl")
      .populate("members.userId", "firstName lastName username email avatarUrl");
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

  async findUserProjects(
    userId: string,
    options: ProjectQueryOptions = {},
  ): Promise<{ projects: ProjectDocument[]; total: number }> {
    const { status, search, tags, limit = 50, offset = 0, sortBy = 'metrics.lastActivityAt', sortOrder = 'desc' } = options;

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

  // ✅ ATOMIC DATABASE UPDATE - BYPASSES LEGACY VALIDATION CRASHES
  async update(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to edit this project');
    }

    const updateData: any = { $set: {} };

    if (dto.name !== undefined) updateData.$set.name = dto.name;
    if (dto.description !== undefined) updateData.$set.description = dto.description;
    
    if (dto.status) {
      updateData.$set.status = dto.status;
      if (dto.status === ProjectStatus.ARCHIVED) updateData.$set.archivedAt = new Date();
      else if (dto.status === ProjectStatus.COMPLETED) updateData.$set.completedAt = new Date();
    }

    if ((dto as any).settings) {
      for (const [key, val] of Object.entries((dto as any).settings)) {
        updateData.$set[`settings.${key}`] = val;
      }
    }

    if ((dto as any).goals) {
      updateData.$set.goals = (dto as any).goals;
    }

    if ((dto as any).emoji || (dto as any).icon) {
      const nextEmoji = ((dto as any).emoji || (dto as any).icon || project.emoji || project.icon || '��').trim();
      updateData.$set.emoji = nextEmoji;
      updateData.$set.icon = (dto as any).icon || nextEmoji;
    }

    // Safety fallback if no changes
    if (Object.keys(updateData.$set).length === 0) {
      return project;
    }

    const updated = await this.projectModel.findByIdAndUpdate(
      projectId,
      updateData,
      { new: true, runValidators: false } 
    );

    if (!updated) throw new NotFoundException('Project not found during update');

    this.eventEmitter.emit('project.updated', { projectId: updated._id, userId, changes: dto });

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

    this.eventEmitter.emit('project.ship.posted', { projectId: args.projectId, projectName, shipTitle: args.shipTitle, triggeredBy: args.userId });

    if (this.notifications?.notifyFollowersShipUpdate) {
      await this.notifications.notifyFollowersShipUpdate({ projectId: args.projectId, projectName, shipTitle: args.shipTitle, triggeredBy: args.userId });
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

    this.eventEmitter.emit('project.milestone.reached', { projectId: args.projectId, projectName, milestoneName: args.milestoneName, triggeredBy: args.userId });

    if (this.notifications?.notifyFollowersMilestoneReached) {
      await this.notifications.notifyFollowersMilestoneReached({ projectId: args.projectId, projectName, milestoneName: args.milestoneName, triggeredBy: args.userId });
    }

    return { success: true };
  }

  async archive(projectId: string, userId: string): Promise<ProjectDocument> {
    return this.update(projectId, userId, { status: ProjectStatus.ARCHIVED });
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if ((project.ownerId || (project as any).owner)?.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectModel.deleteOne({ _id: project._id });
    this.eventEmitter.emit('project.deleted', { projectId: project._id, userId });
    this.logger.log(`Project deleted: ${projectId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBER MANAGEMENT (ATOMIC UPDATES)
  // ─────────────────────────────────────────────────────────────────────────────

  async addMember(projectId: string, userId: string, dto: AddMemberDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    const existingMember = (project.members || []).find((m) => (m.userId || (m as any).user)?.toString() === dto.userId);
    if (existingMember) throw new BadRequestException('User is already a member of this project');

    if ((project.ownerId || (project as any).owner)?.toString() === dto.userId) {
      throw new BadRequestException('Cannot add project owner as a member');
    }

    const newMember = {
      userId: new Types.ObjectId(dto.userId),
      role: dto.role || MemberRole.MEMBER,
      joinedAt: new Date(),
      invitedBy: new Types.ObjectId(userId),
    };

    const updated = await this.projectModel.findByIdAndUpdate(
      projectId,
      { 
        $push: { members: newMember as any },
        $set: { 'metrics.memberCount': (project.members || []).length + 2 } 
      },
      { new: true, runValidators: false }
    );

    this.eventEmitter.emit('project.member.added', { projectId: updated._id, memberId: dto.userId, role: dto.role || MemberRole.MEMBER, addedBy: userId });

    return updated;
  }

  async removeMember(projectId: string, userId: string, memberUserId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    if ((project.ownerId || (project as any).owner)?.toString() === memberUserId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    const memberIndex = (project.members || []).findIndex((m) => (m.userId || (m as any).user)?.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    const updated = await this.projectModel.findByIdAndUpdate(
      projectId,
      { 
        $pull: { members: { $or: [{ userId: new Types.ObjectId(memberUserId) }, { user: new Types.ObjectId(memberUserId) }] } },
        $set: { 'metrics.memberCount': Math.max(1, (project.members || []).length) }
      },
      { new: true, runValidators: false }
    );

    this.eventEmitter.emit('project.member.removed', { projectId: updated._id, memberId: memberUserId, removedBy: userId });

    return updated;
  }

  async updateMemberRole(projectId: string, userId: string, memberUserId: string, dto: UpdateMemberRoleDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if ((project.ownerId || (project as any).owner)?.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can change member roles');
    }

    if ((project.ownerId || (project as any).owner)?.toString() === memberUserId) {
      throw new BadRequestException('Cannot change owner role');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
    }

    const memberIndex = (project.members || []).findIndex((m) => (m.userId || (m as any).user)?.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    const updatePath = `members.${memberIndex}.role`;

    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $set: { [updatePath]: dto.role } },
      { new: true, runValidators: false }
    );
  }

  // ✅ ATOMIC DATABASE UPDATE - SAFELY EXTRACTS PREFERENCES & HANDLES THE OWNER EXCEPTION
  async updateMemberPreferences(projectId: string, userId: string, preferences: any): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    const prefsToSave = preferences?.preferences ? preferences.preferences : preferences;
    const memberIndex = (project.members || []).findIndex((m) => (m.userId || (m as any).user)?.toString() === userId);

    if (memberIndex === -1) {
      const ownerRaw = project.ownerId || (project as any).owner;
    const ownerId = (ownerRaw?._id || ownerRaw)?.toString();
      if (ownerId === userId) {
        const newMember = {
          userId: new Types.ObjectId(userId),
          role: (MemberRole as any).OWNER || 'owner',
          joinedAt: new Date(),
          preferences: prefsToSave
        };
        
        return this.projectModel.findByIdAndUpdate(
          projectId,
          { $push: { members: newMember as any } },
          { new: true, runValidators: false }
        );
      }
      throw new BadRequestException('You are not a member of this project');
    }

    const updatePath = `members.${memberIndex}.preferences`;
    const currentPrefs = project.members[memberIndex].preferences || {};
    const mergedPrefs = { ...currentPrefs, ...prefsToSave };

    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $set: { [updatePath]: mergedPrefs } },
      { new: true, runValidators: false }
    );
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if ((project.ownerId || (project as any).owner)?.toString() === userId) {
      throw new BadRequestException('Owner cannot leave project. Transfer ownership first.');
    }

    const memberIndex = (project.members || []).findIndex((m) => (m.userId || (m as any).user)?.toString() === userId);
    if (memberIndex === -1) {
      throw new BadRequestException('You are not a member of this project');
    }

    await this.projectModel.findByIdAndUpdate(
      projectId,
      { $pull: { members: { $or: [{ userId: new Types.ObjectId(userId) }, { user: new Types.ObjectId(userId) }] } } },
      { runValidators: false }
    );

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
      .sort({ 'metrics.totalShips': -1, 'metrics.lastActivityAt': -1 })
      .limit(limit)
      .exec();
  }

  // ✅ SAFELY HANDLES LEGACY "USER" FIELD OR MISSING IDS
  private hasAccess(project: ProjectDocument, userId: string): boolean {
    const ownerRaw = project.ownerId || (project as any).owner;
    const ownerId = (ownerRaw?._id || ownerRaw)?.toString();
    if (ownerId === userId) return true;
    return (project.members || []).some((m) => (m.userId || (m as any).user)?.toString() === userId);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {
    const ownerRaw = project.ownerId || (project as any).owner;
    const ownerId = (ownerRaw?._id || ownerRaw)?.toString();
    if (ownerId === userId) return true;
    const member = (project.members || []).find((m) => (m.userId || (m as any).user)?.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }

  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    const ownerRaw = project.ownerId || (project as any).owner;
    const ownerId = (ownerRaw?._id || ownerRaw)?.toString();
    if (ownerId === userId) return true;
    const member = (project.members || []).find((m) => (m.userId || (m as any).user)?.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }
}

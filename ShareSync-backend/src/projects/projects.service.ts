// src/projects/projects.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SERVICE: Business Logic for Project Management
// - SAFE PATCH: updateMetrics() now merges instead of overwriting metrics object
// - SAFE PATCH: create() normalizes emoji/icon + ensures settings/goals defaults
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
import {
  Project,
  ProjectDocument,
  ProjectStatus,
  MemberRole,
  ProjectMember,
} from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';

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

    // ✅ Normalize emoji/icon safely:
    // - preferred: dto.emoji
    // - fallback: dto.icon
    // - default: 📁
    const emoji = (dto.emoji || dto.icon || '📁').trim();

    const project = new this.projectModel({
      ...dto,
      emoji,
      icon: dto.icon || emoji, // keep legacy icon populated
      ownerId: new Types.ObjectId(userId),
      members: [],
      goals: dto.goals || [],
      settings: dto.settings || {},

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
      },
    });

    const saved = await project.save();

    this.eventEmitter.emit('project.created', {
      projectId: saved._id,
      userId,
      projectName: saved.name,
    });

    this.logger.log(`Project created: ${saved._id}`);
    return saved;
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

    // Merge settings safely (don’t overwrite object)
    if ((dto as any).settings) {
      (project as any).settings = { ...(project as any).settings, ...(dto as any).settings };
      delete (dto as any).settings;
    }

    // Goals overwrite (simple + safe). If you want patch-by-id later, we can add.
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

    // Ensure metrics object exists even for legacy docs
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
}

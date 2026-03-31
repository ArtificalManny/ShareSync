// src/projects/projects.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SERVICE: Business Logic for Project Management
// Phase K: Added real-time event emission to recordShipUpdate for global analytics sync
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project, ProjectDocument, ProjectStatus, ProjectVisibility, MemberRole, ProjectMember } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { NotificationsService } from '../notifications/notifications.service';

export interface ProjectQueryOptions { status?: ProjectStatus; visibility?: string; search?: string; tags?: string[]; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; }
export interface PulseData { project: ProjectDocument; metrics: { momentum: number; velocity: number; weeklyShips: number; momentumTrend: number; completionRate: number; }; criticalMoves: any[]; objectives: any[]; sprint: any; activity: any[]; }

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
    try { return await this.findByIdWithAccess(projectId, userId); } catch { return null; }
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

  async enablePublic(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) throw new ForbiddenException('You do not have permission to enable public sharing');
    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    (project as any).publicEnabled = true; (project as any).publicToken = publicToken;
    await project.save();
    return { publicToken };
  }

  async disablePublic(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) throw new ForbiddenException('You do not have permission to disable public sharing');
    (project as any).publicEnabled = false; (project as any).publicToken = null;
    await project.save();
  }

  async regeneratePublicToken(projectId: string, userId: string): Promise<{ publicToken: string }> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canManageMembers(project, userId) && project.ownerId.toString() !== userId) throw new ForbiddenException('You do not have permission to regenerate public token');
    const publicToken = `${new Types.ObjectId().toString()}${new Types.ObjectId().toString()}`;
    (project as any).publicEnabled = true; (project as any).publicToken = publicToken;
    await project.save();
    return { publicToken };
  }

  async getPublicSnapshotByToken(token: string): Promise<any | null> {
    const project = await this.projectModel.findOne({ publicToken: token, publicEnabled: true }).lean().exec();
    if (!project) return null;
    return { id: project._id, name: project.name, description: (project as any).description || null, status: project.status, category: (project as any).category || null, tags: project.tags || [], metrics: project.metrics || {}, updatedAt: project.updatedAt, createdAt: project.createdAt };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);
    const emoji = (dto.emoji || dto.icon || '📁').trim();
    let visibility: ProjectVisibility = ProjectVisibility.PRIVATE;
    
    if (dto.visibility) { visibility = dto.visibility; }
    else if (dto.privacy) {
      const privacyLower = String(dto.privacy).toLowerCase();
      if (privacyLower === 'public') visibility = ProjectVisibility.PUBLIC;
      else if (privacyLower === 'listed') visibility = ProjectVisibility.LISTED;
      else visibility = ProjectVisibility.PRIVATE;
    }

    const projectName = dto.name || dto.title || 'Untitled Project';
    const isPublic = dto.isPublic === true || visibility === ProjectVisibility.PUBLIC || visibility === ProjectVisibility.LISTED;
    const settings = { ...(dto.settings || {}), isPublic: dto.settings?.isPublic ?? isPublic, isListed: dto.settings?.isListed ?? (visibility === ProjectVisibility.LISTED) };

    const project = new this.projectModel({
      name: projectName, description: dto.description, emoji, icon: dto.icon || emoji, color: dto.color || '#7C3AED', visibility, tags: dto.tags || [], category: dto.category || null,
      status: dto.status ? this.normalizeStatus(dto.status) : ProjectStatus.ACTIVE, ownerId: new Types.ObjectId(userId), members: [], goals: dto.goals || [], settings,
      metrics: { momentum: 0, velocity: 0, totalTasks: 0, completedTasks: 0, totalXP: 0, lastActivityAt: new Date(), weeklyShips: 0, momentumTrend: 0, activeSprintId: null, totalShips: 0, memberCount: 1, likes: 0, comments: 0 },
      followersCount: 0, streakDays: 0, trendingScore: 0,
    });

    const saved = await project.save();

    if (dto.members && Array.isArray(dto.members) && dto.members.length > 0) {
      this.eventEmitter.emit('project.members.invited', { projectId: saved._id, invitedBy: userId, members: dto.members });
    }

    this.eventEmitter.emit('project.created', { projectId: saved._id, userId, projectName: saved.name, visibility: saved.visibility, isPublic });
    return saved;
  }

  private normalizeStatus(status: string): ProjectStatus {
    const statusLower = String(status).toLowerCase().replace(/\s+/g, '_');
    switch (statusLower) {
      case 'active': case 'in_progress': case 'in progress': return ProjectStatus.ACTIVE;
      case 'planning': return (ProjectStatus as any).PLANNING || ProjectStatus.ACTIVE;
      case 'on_hold': case 'on hold': case 'paused': return (ProjectStatus as any).ON_HOLD || (ProjectStatus as any).PAUSED || ProjectStatus.ACTIVE;
      case 'completed': case 'done': return ProjectStatus.COMPLETED;
      case 'archived': return ProjectStatus.ARCHIVED;
      default: return ProjectStatus.ACTIVE;
    }
  }

  async findById(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  async findByIdWithAccess(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.findById(projectId);
    if (!this.hasAccess(project, userId)) throw new ForbiddenException('You do not have access to this project');
    return project;
  }

  async findUserProjects(userId: string, options: ProjectQueryOptions = {}): Promise<{ projects: ProjectDocument[]; total: number }> {
    const { status, search, tags, limit = 50, offset = 0, sortBy = 'metrics.lastActivityAt', sortOrder = 'desc' } = options;
    const query: any = { $or: [ { ownerId: new Types.ObjectId(userId) }, { owner: new Types.ObjectId(userId) }, { 'members.userId': new Types.ObjectId(userId) }, { 'members.user': new Types.ObjectId(userId) } ], isArchived: { $ne: true } };
    if (status) query.status = status; else query.status = { $ne: ProjectStatus.ARCHIVED };
    if (search) query.$text = { $search: search };
    if (tags && tags.length > 0) query.tags = { $in: tags };
    const [projects, total] = await Promise.all([ this.projectModel.find(query).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(offset).limit(limit), this.projectModel.countDocuments(query) ]);
    return { projects, total };
  }

  async findStarred(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ ownerId: new Types.ObjectId(userId), isStarred: true, status: { $ne: ProjectStatus.ARCHIVED } }).sort({ 'metrics.lastActivityAt': -1 });
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canEdit(project, userId)) throw new ForbiddenException('You do not have permission to edit this project');

    if (dto.status) {
      if (dto.status === ProjectStatus.ARCHIVED) project.archivedAt = new Date();
      else if (dto.status === ProjectStatus.COMPLETED) project.completedAt = new Date();
    }

    if ((dto as any).settings) { (project as any).settings = { ...(project as any).settings, ...(dto as any).settings }; delete (dto as any).settings; }
    if ((dto as any).goals) { (project as any).goals = (dto as any).goals; delete (dto as any).goals; }
    if ((dto as any).emoji || (dto as any).icon) {
      const nextEmoji = ((dto as any).emoji || (dto as any).icon || project.emoji || project.icon || '📁').trim();
      project.emoji = nextEmoji; project.icon = (dto as any).icon || nextEmoji; delete (dto as any).emoji; delete (dto as any).icon;
    }

    Object.assign(project, dto);
    const updated = await project.save();
    this.eventEmitter.emit('project.updated', { projectId: updated._id, userId, changes: dto });
    return updated;
  }

  async updateMetrics(projectId: string, metrics: Partial<Project['metrics']>): Promise<void> {
    const set: Record<string, any> = {};
    for (const [key, value] of Object.entries(metrics || {})) { set[`metrics.${key}`] = value; }
    set['metrics.lastActivityAt'] = new Date();
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, { $set: set });
  }

  async incrementTaskCount(projectId: string, completed: boolean = false): Promise<void> {
    const update: any = { $inc: { 'metrics.totalTasks': 1 }, $set: { 'metrics.lastActivityAt': new Date() } };
    if (completed) update.$inc['metrics.completedTasks'] = 1;
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, update);
  }

  async decrementTaskCount(projectId: string, wasCompleted: boolean = false): Promise<void> {
    const update: any = { $inc: { 'metrics.totalTasks': -1 } };
    if (wasCompleted) update.$inc['metrics.completedTasks'] = -1;
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, update);
  }

  async markTaskCompleted(projectId: string): Promise<void> {
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, { $inc: { 'metrics.completedTasks': 1, 'metrics.weeklyShips': 1 }, $set: { 'metrics.lastActivityAt': new Date() } });
  }

  async recordShipUpdate(args: { projectId: string; userId: string; shipTitle: string; projectNameOverride?: string; }): Promise<{ success: true }> {
    const project = await this.findByIdWithAccess(args.projectId, args.userId);
    if (!this.canEdit(project, args.userId)) throw new ForbiddenException('You do not have permission to post updates for this project');

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(args.projectId) },
      { $inc: { 'metrics.weeklyShips': 1, 'metrics.totalShips': 1 }, $set: { 'metrics.lastActivityAt': new Date(), lastShip: args.shipTitle, lastShipAt: new Date() } }
    );

    const projectName = args.projectNameOverride || project.name;

    // 🔥 This is the critical Global Sync Event that the Analytics Engine hooks into
    this.eventEmitter.emit('project.ship.posted', { projectId: args.projectId, projectName, shipTitle: args.shipTitle, triggeredBy: args.userId });

    if (this.notifications?.notifyFollowersShipUpdate) {
      await this.notifications.notifyFollowersShipUpdate({ projectId: args.projectId, projectName, shipTitle: args.shipTitle, triggeredBy: args.userId });
    }

    return { success: true };
  }

  async recordMilestoneReached(args: { projectId: string; userId: string; milestoneName: string; projectNameOverride?: string; }): Promise<{ success: true }> {
    const project = await this.findByIdWithAccess(args.projectId, args.userId);
    if (!this.canEdit(project, args.userId)) throw new ForbiddenException('You do not have permission to post milestones for this project');
    await this.projectModel.updateOne({ _id: new Types.ObjectId(args.projectId) }, { $set: { 'metrics.lastActivityAt': new Date() } });
    const projectName = args.projectNameOverride || project.name;
    this.eventEmitter.emit('project.milestone.reached', { projectId: args.projectId, projectName, milestoneName: args.milestoneName, triggeredBy: args.userId });
    if (this.notifications?.notifyFollowersMilestoneReached) { await this.notifications.notifyFollowersMilestoneReached({ projectId: args.projectId, projectName, milestoneName: args.milestoneName, triggeredBy: args.userId }); }
    return { success: true };
  }

  async archive(projectId: string, userId: string): Promise<ProjectDocument> { return this.update(projectId, userId, { status: ProjectStatus.ARCHIVED }); }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (project.ownerId.toString() !== userId) throw new ForbiddenException('Only the project owner can delete this project');
    await this.projectModel.deleteOne({ _id: project._id });
    this.eventEmitter.emit('project.deleted', { projectId: project._id, userId });
  }

  async addMember(projectId: string, userId: string, dto: AddMemberDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canManageMembers(project, userId)) throw new ForbiddenException('You do not have permission to add members');
    const existingMember = project.members.find((m) => m.userId.toString() === dto.userId);
    if (existingMember) throw new BadRequestException('User is already a member of this project');
    if (project.ownerId.toString() === dto.userId) throw new BadRequestException('Cannot add project owner as a member');

    project.members.push({ userId: new Types.ObjectId(dto.userId), role: dto.role || MemberRole.MEMBER, joinedAt: new Date(), invitedBy: new Types.ObjectId(userId) } as ProjectMember);
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, { $set: { 'metrics.memberCount': project.members.length + 1 } });
    const updated = await project.save();
    this.eventEmitter.emit('project.member.added', { projectId: updated._id, memberId: dto.userId, role: dto.role || MemberRole.MEMBER, addedBy: userId });
    return updated;
  }

  async removeMember(projectId: string, userId: string, memberUserId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (!this.canManageMembers(project, userId)) throw new ForbiddenException('You do not have permission to remove members');
    if (project.ownerId.toString() === memberUserId) throw new BadRequestException('Cannot remove project owner');
    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    project.members.splice(memberIndex, 1);
    await this.projectModel.updateOne({ _id: new Types.ObjectId(projectId) }, { $set: { 'metrics.memberCount': project.members.length + 1 } });
    const updated = await project.save();
    this.eventEmitter.emit('project.member.removed', { projectId: updated._id, memberId: memberUserId, removedBy: userId });
    return updated;
  }

  async updateMemberRole(projectId: string, userId: string, memberUserId: string, dto: UpdateMemberRoleDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (project.ownerId.toString() !== userId) throw new ForbiddenException('Only the project owner can change member roles');
    if (project.ownerId.toString() === memberUserId) throw new BadRequestException('Cannot change owner role');
    if (dto.role === MemberRole.OWNER) throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
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
      project.members.push({ userId: new Types.ObjectId(userId), role: MemberRole.OWNER || 'owner', joinedAt: project.createdAt || new Date() } as ProjectMember);
      memberIndex = project.members.length - 1;
    }
    project.members[memberIndex].preferences = { ...project.members[memberIndex].preferences, ...preferences };
    project.markModified(`members.${memberIndex}.preferences`);
    return project.save();
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    const project = await this.findByIdWithAccess(projectId, userId);
    if (project.ownerId.toString() === userId) throw new BadRequestException('Owner cannot leave project. Transfer ownership first.');
    const memberIndex = project.members.findIndex((m) => m.userId.toString() === userId);
    if (memberIndex === -1) throw new BadRequestException('You are not a member of this project');
    project.members.splice(memberIndex, 1);
    await project.save();
    this.eventEmitter.emit('project.member.left', { projectId: project._id, userId });
  }

  async getPulseData(projectId: string, userId: string): Promise<PulseData> {
    const project = await this.findByIdWithAccess(projectId, userId);
    const storedMetrics = (project as any).metrics || {};
    const pid = new Types.ObjectId(projectId);

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); weekStart.setHours(0, 0, 0, 0);

    const [ totalTasks, completedTasks, completedToday, completedThisWeek, inProgress, blocked ] = await Promise.all([
      this.taskModel.countDocuments({ projectId: pid }),
      this.taskModel.countDocuments({ projectId: pid, status: 'done' }),
      this.taskModel.countDocuments({ projectId: pid, status: 'done', completedAt: { $gte: todayStart } }),
      this.taskModel.countDocuments({ projectId: pid, status: 'done', completedAt: { $gte: weekStart } }),
      this.taskModel.countDocuments({ projectId: pid, status: 'in_progress' }),
      this.taskModel.countDocuments({ projectId: pid, isBlocking: true, status: { $ne: 'done' } }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const weeklyShips = completedThisWeek > 0 ? completedThisWeek : (storedMetrics.weeklyShips || 0);

    return { project, metrics: { momentum: storedMetrics.momentum || 0, velocity: storedMetrics.velocity || 0, weeklyShips, momentumTrend: storedMetrics.momentumTrend || 0, completionRate }, completedToday, completedThisWeek, inProgress, blocked, totalTasks, completedTasks, criticalMoves: [], objectives: [], sprint: null, activity: [] } as any;
  }

  async createFromTemplate(userId: string, templateType: string): Promise<{ project: ProjectDocument; taskCount: number }> {
    this.logger.warn(`createFromTemplate called but not yet implemented. templateType=${templateType}`);
    const project = await this.create(userId, { name: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Project`, description: `Created from ${templateType} template` } as CreateProjectDto);
    return { project, taskCount: 0 };
  }

  async getFeaturedProjects(limit: number = 6): Promise<ProjectDocument[]> {
    return this.projectModel.find({ visibility: ProjectVisibility.PUBLIC, status: { $ne: ProjectStatus.ARCHIVED } }).sort({ 'metrics.totalShips': -1, 'metrics.lastActivityAt': -1 }).limit(limit).exec();
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

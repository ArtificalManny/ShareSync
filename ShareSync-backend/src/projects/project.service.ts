// backend/src/projects/project.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Project,
  ProjectDocument,
  ProjectMember,
} from './schemas/project.schema';
import { randomBytes } from 'crypto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MomentumService } from '../momentum/momentum.service';

type Role = ProjectMember['role'];
const VALID_ROLES: Role[] = ['owner', 'member', 'viewer'];

function toRole(input: any): Role {
  const r = String(input ?? '').toLowerCase() as Role;
  return (VALID_ROLES as string[]).includes(r) ? (r as Role) : 'member';
}

function normalizeMembers(input?: any[]): ProjectMember[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((m) => ({
      userId: m?.userId ?? undefined,
      email: m?.email ?? undefined,
      role: toRole(m?.role),
      addedAt: m?.addedAt ? new Date(m.addedAt) : new Date(),
    }))
    .filter((m) => m.userId || m.email);
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly realtime: RealtimeGateway,
    private readonly momentum: MomentumService,
  ) {}

  async create(data: Partial<Project> & { userId: string }) {
    const normalizedMembers = normalizeMembers((data as any).members);

    const hasOwnerEntry = normalizedMembers.some(
      (m) => m.userId && String(m.userId) === String(data.userId),
    );
    if (!hasOwnerEntry && data.userId) {
      normalizedMembers.unshift({
        userId: String(data.userId),
        role: 'owner',
        addedAt: new Date(),
      } as ProjectMember);
    }

    const created = new this.projectModel({
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? '',
      status: data.status ?? 'Not Started',
      privacy: data.privacy ?? 'Private',
      icon: data.icon ?? null,
      userId: data.userId,
      members: normalizedMembers,
      tasks: [],
      metrics: {
        openTasks: 0,
        onTimePct: 0,
        throughputPerWeek: 0,
      },
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    const doc = await created.save();
    await this.updateKPIs(doc._id.toString());
    return doc;
  }

  async list(userId: string, filters: any = {}) {
    const q: FilterQuery<ProjectDocument> = {
      $or: [{ userId }, { 'members.userId': userId }],
    };

    if (filters.q) {
      q.$text = { $search: filters.q };
    }
    if (filters.status && filters.status !== 'all') {
      q.status = filters.status;
    }
    if (filters.owner === 'me') {
      q.userId = userId;
    } else if (filters.owner === 'team') {
      q.userId = { $ne: userId };
    }

    const items = await this.projectModel
      .find(q)
      .sort({ updatedAt: -1 })
      .lean();

    return items.map(p => this.withKPIs(p));
  }

  async findAll(userId: string) {
    return this.list(userId);
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel.findById(id).lean();
    return doc ? this.withKPIs(doc) : null;
  }

  async findOneOwned(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel.findOne({ _id: id, userId }).lean();
    return doc ? this.withKPIs(doc) : null;
  }

  async findOneForUser(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel
      .findOne({
        _id: id,
        $or: [{ userId }, { 'members.userId': userId }],
      })
      .lean();
    return doc ? this.withKPIs(doc) : null;
  }

  async update(id: string, userId: string, patch: Partial<Project>) {
    const proj = await this.findOneOwned(userId, id);
    if (!proj) throw new NotFoundException();

    const update: any = { ...patch, updatedAt: new Date() };
    if (patch.title) update.title = patch.title.trim();
    if (patch.description !== undefined) update.description = patch.description?.trim() ?? '';

    const updated = await this.projectModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .lean();

    await this.updateKPIs(id);
    return this.withKPIs(updated);
  }

  async updateMembers(
    projectId: string,
    actingUserId: string,
    rawMembers: ProjectMember[],
  ) {
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException();
    if (String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can manage members');
    }

    const members = normalizeMembers(rawMembers);
    if (!members.some(m => String(m.userId) === String(actingUserId))) {
      members.unshift({
        userId: String(actingUserId),
        role: 'owner',
        addedAt: new Date(),
      });
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { members, updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    return this.withKPIs(updated);
  }

  async updateIcon(
    projectId: string,
    actingUserId: string,
    icon: { kind: 'emoji' | 'svg'; value: string } | null,
  ) {
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException();
    if (String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can change the icon');
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { icon: icon ?? null, updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    return this.withKPIs(updated);
  }

  async shipProject(projectId: string, userId: string) {
    const project = await this.findOneForUser(userId, projectId);
    if (!project) throw new NotFoundException();

    if (String(project.userId) !== String(userId)) {
      throw new ForbiddenException('Only the owner can ship the project');
    }

    if (project.shippedAt) {
      return { alreadyShipped: true, shippedAt: project.shippedAt };
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { shippedAt: new Date(), updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    await this.momentum.shipProject(projectId, userId);
    await this.updateKPIs(projectId);

    return this.withKPIs(updated);
  }

  async delete(projectId: string, userId: string) {
    const project = await this.findOneForUser(userId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (String(project.userId) !== String(userId)) {
      throw new ForbiddenException('Only project owner can delete the project');
    }

    const deleted = await this.projectModel.findByIdAndDelete(projectId);
    return deleted;
  }

  private async updateKPIs(projectId: string) {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) return;

    const tasks = project.tasks || [];
    const now = new Date();

    const openTasks = tasks.filter(t => !t.completedAt).length;

    const completed = tasks.filter(t => t.completedAt);
    const onTime = completed.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    }).length;

    const onTimePct = completed.length > 0 ? (onTime / completed.length) * 100 : 0;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const throughputPerWeek = completed.filter(t => new Date(t.completedAt) > weekAgo).length;

    const metrics = {
      openTasks,
      onTimePct: Math.round(onTimePct),
      throughputPerWeek,
    };

    await this.projectModel.updateOne(
      { _id: projectId },
      { $set: { metrics, updatedAt: new Date() } },
    );

    this.realtime.emitToProject(projectId, 'project:statsUpdated', {
      projectId,
      metrics,
    });
  }

  private withKPIs(doc: any) {
    if (!doc) return doc;
    const m = doc.metrics || {};
    return {
      ...doc,
      openTasks: m.openTasks ?? 0,
      onTimePct: m.onTimePct ?? 0,
      throughputPerWeek: m.throughputPerWeek ?? 0,
    };
  }

  private generatePublicToken() {
    return randomBytes(16).toString('hex');
  }

  async enablePublic(projectId: string, actingUserId?: string) {
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException();

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException();
    }

    const token = proj.publicToken || this.generatePublicToken();
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $set: {
            publicEnabled: true,
            publicToken: token,
            publicLastEnabledAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    this.realtime.emitToProject(projectId, 'project:publicChanged', {
      projectId,
      publicEnabled: true,
      publicToken: token,
    });

    return { publicEnabled: true, publicToken: token, project: updated };
  }

  async disablePublic(projectId: string, actingUserId?: string) {
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException();

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException();
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $set: {
            publicEnabled: false,
            publicToken: null,
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    this.realtime.emitToProject(projectId, 'project:publicChanged', {
      projectId,
      publicEnabled: false,
    });

    return { publicEnabled: false, project: updated };
  }

  async regeneratePublicToken(projectId: string, actingUserId?: string) {
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException();

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException();
    }

    const token = this.generatePublicToken();
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $set: {
            publicEnabled: true,
            publicToken: token,
            publicLastEnabledAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    this.realtime.emitToProject(projectId, 'project:publicChanged', {
      projectId,
      publicEnabled: true,
      publicToken: token,
    });

    return { publicEnabled: true, publicToken: token, project: updated };
  }

  async getPublicSnapshotByToken(token: string) {
    const proj = await this.projectModel
      .findOne({ publicToken: token, publicEnabled: true })
      .lean();

    if (!proj) return null;

    return {
      title: proj.title || 'Untitled Project',
      icon: proj.icon ?? null,
      lastUpdatedAt: proj.updatedAt || proj.createdAt,
      kpis: proj.metrics || {},
    };
  }
}

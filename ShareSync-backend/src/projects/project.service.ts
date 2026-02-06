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

/**
 * NOTE:
 * - Your schema defines MemberRole (via ProjectMember['role']), which is NOT necessarily the string union
 *   'owner' | 'member' | 'viewer'. So we treat roles as ProjectMember['role'] and cast carefully.
 * - Your schema requires ProjectMember.joinedAt (and userId is ObjectId). This service now normalizes that.
 * - We keep .lean() (for your perf choice), but we use .lean<any>() to avoid FlattenMaps typing issues.
 */

type Role = ProjectMember['role'];

// We keep your canonical roles, but do not assume Role is a string union.
// We validate with strings, then cast to Role only after validation.
const VALID_ROLE_STRINGS = ['owner', 'member', 'viewer'] as const;
type ValidRoleString = (typeof VALID_ROLE_STRINGS)[number];

function isValidRoleString(input: any): input is ValidRoleString {
  const r = String(input ?? '').toLowerCase();
  return (VALID_ROLE_STRINGS as readonly string[]).includes(r);
}

function toRole(input: any): Role {
  const r = String(input ?? '').toLowerCase();
  const normalized: ValidRoleString = isValidRoleString(r) ? r : 'member';
  // Cast into Role because Role may be an enum / other union defined in schema
  return normalized as unknown as Role;
}

function toObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const s = String(value);
  return Types.ObjectId.isValid(s) ? new Types.ObjectId(s) : undefined;
}

function normalizeMembers(input?: any[]): ProjectMember[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((m) => {
      const userId = toObjectId(m?.userId);
      const email = m?.email ? String(m.email) : undefined;

      // Schema requires joinedAt; we also preserve addedAt if caller passes it,
      // but joinedAt is the canonical required field.
      const joinedAt = m?.joinedAt
        ? new Date(m.joinedAt)
        : m?.addedAt
          ? new Date(m.addedAt)
          : new Date();

      // Preserve addedAt (non-breaking) in case other code uses it,
      // but the schema-required field is joinedAt.
      const addedAt = m?.addedAt ? new Date(m.addedAt) : joinedAt;

      // Build a ProjectMember shape; extra fields won't break Mongoose,
      // but joinedAt must exist.
      return {
        userId: userId as any,
        email,
        role: toRole(m?.role),
        joinedAt,
        // preserve legacy field for compatibility (won't be required by schema)
        addedAt,
      } as unknown as ProjectMember;
    })
    .filter((m) => (m as any).userId || (m as any).email);
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

    const hasOwnerEntry = normalizedMembers.some((m: any) => {
      const mid = m?.userId ? String(m.userId) : '';
      return mid && String(mid) === String(data.userId);
    });

    if (!hasOwnerEntry && data.userId) {
      normalizedMembers.unshift({
        userId: toObjectId(data.userId) as any,
        role: toRole('owner'),
        joinedAt: new Date(),
        // preserve legacy field too
        addedAt: new Date(),
      } as unknown as ProjectMember);
    }

    const created = new this.projectModel({
      title: (data as any).title,
      description: (data as any).description ?? '',
      category: (data as any).category ?? '',
      status: (data as any).status ?? 'Not Started',
      privacy: (data as any).privacy ?? 'Private',
      icon: (data as any).icon ?? null,
      userId: (data as any).userId,
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
      .lean<any>();

    return items.map((p: any) => this.withKPIs(p));
  }

  async findAll(userId: string) {
    return this.list(userId);
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel.findById(id).lean<any>();
    return doc ? this.withKPIs(doc) : null;
  }

  async findOneOwned(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel.findOne({ _id: id, userId }).lean<any>();
    return doc ? this.withKPIs(doc) : null;
  }

  async findOneForUser(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.projectModel
      .findOne({
        _id: id,
        $or: [{ userId }, { 'members.userId': userId }],
      })
      .lean<any>();
    return doc ? this.withKPIs(doc) : null;
  }

  async update(id: string, userId: string, patch: Partial<Project>) {
    const proj = await this.findOneOwned(userId, id);
    if (!proj) throw new NotFoundException();

    const update: any = { ...patch, updatedAt: new Date() };
    if ((patch as any).title) update.title = String((patch as any).title).trim();
    if ((patch as any).description !== undefined) {
      update.description = String((patch as any).description ?? '').trim();
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .lean<any>();

    await this.updateKPIs(id);
    return this.withKPIs(updated);
  }

  async updateMembers(
    projectId: string,
    actingUserId: string,
    rawMembers: ProjectMember[],
  ) {
    const proj = await this.projectModel.findById(projectId).lean<any>();
    if (!proj) throw new NotFoundException();
    if (String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can manage members');
    }

    const members = normalizeMembers(rawMembers as any);

    // Ensure acting user stays owner
    const actingOid = toObjectId(actingUserId);
    const hasActing = members.some((m: any) => String(m.userId) === String(actingOid));
    if (!hasActing) {
      members.unshift({
        userId: actingOid as any,
        role: toRole('owner'),
        joinedAt: new Date(),
        addedAt: new Date(),
      } as unknown as ProjectMember);
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { members, updatedAt: new Date() } },
        { new: true },
      )
      .lean<any>();

    return this.withKPIs(updated);
  }

  async updateIcon(
    projectId: string,
    actingUserId: string,
    icon: { kind: 'emoji' | 'svg'; value: string } | null,
  ) {
    const proj = await this.projectModel.findById(projectId).lean<any>();
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
      .lean<any>();

    return this.withKPIs(updated);
  }

  async shipProject(projectId: string, userId: string) {
    const project = await this.findOneForUser(userId, projectId);
    if (!project) throw new NotFoundException();

    if (String((project as any).userId) !== String(userId)) {
      throw new ForbiddenException('Only the owner can ship the project');
    }

    if ((project as any).shippedAt) {
      return { alreadyShipped: true, shippedAt: (project as any).shippedAt };
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { shippedAt: new Date(), updatedAt: new Date() } },
        { new: true },
      )
      .lean<any>();

    await this.momentum.shipProject(projectId, userId);
    await this.updateKPIs(projectId);

    return this.withKPIs(updated);
  }

  async delete(projectId: string, userId: string) {
    const project = await this.findOneForUser(userId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (String((project as any).userId) !== String(userId)) {
      throw new ForbiddenException('Only project owner can delete the project');
    }

    const deleted = await this.projectModel.findByIdAndDelete(projectId);
    return deleted;
  }

  private async updateKPIs(projectId: string) {
    const project = await this.projectModel.findById(projectId).lean<any>();
    if (!project) return;

    const tasks = project.tasks || [];
    const now = new Date();

    const openTasks = tasks.filter((t: any) => !t.completedAt).length;

    const completed = tasks.filter((t: any) => t.completedAt);
    const onTime = completed.filter((t: any) => {
      if (!t.dueDate) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    }).length;

    const onTimePct = completed.length > 0 ? (onTime / completed.length) * 100 : 0;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const throughputPerWeek = completed.filter((t: any) => new Date(t.completedAt) > weekAgo).length;

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
    const proj = await this.projectModel.findById(projectId).lean<any>();
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
      .lean<any>();

    this.realtime.emitToProject(projectId, 'project:publicChanged', {
      projectId,
      publicEnabled: true,
      publicToken: token,
    });

    return { publicEnabled: true, publicToken: token, project: updated };
  }

  async disablePublic(projectId: string, actingUserId?: string) {
    const proj = await this.projectModel.findById(projectId).lean<any>();
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
      .lean<any>();

    this.realtime.emitToProject(projectId, 'project:publicChanged', {
      projectId,
      publicEnabled: false,
    });

    return { publicEnabled: false, project: updated };
  }

  async regeneratePublicToken(projectId: string, actingUserId?: string) {
    const proj = await this.projectModel.findById(projectId).lean<any>();
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
      .lean<any>();

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
      .lean<any>();

    if (!proj) return null;

    return {
      title: proj.title || 'Untitled Project',
      icon: proj.icon ?? null,
      lastUpdatedAt: proj.updatedAt || proj.createdAt,
      kpis: proj.metrics || {},
    };
  }
}

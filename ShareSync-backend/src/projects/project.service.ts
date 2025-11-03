// src/projects/project.service.ts
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
export class ProjectsService {
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
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    return created.save();
  }

  async findAll(userId: string) {
    const q: FilterQuery<ProjectDocument> = {
      $or: [{ userId }, { 'members.userId': userId }],
    };
    return this.projectModel.find(q).sort({ updatedAt: -1 }).lean();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.projectModel.findById(id).lean();
  }

  async findOneOwned(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.projectModel.findOne({ _id: id, userId }).lean();
  }

  async findOneForUser(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.projectModel
      .findOne({
        _id: id,
        $or: [{ userId }, { 'members.userId': userId }],
      })
      .lean();
  }

  async updateMembers(
    projectId: string,
    actingUserId: string,
    rawMembers: ProjectMember[],
  ) {
    if (!Types.ObjectId.isValid(projectId)) return null;

    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) return null;
    if (String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can manage members');
    }

    const members: ProjectMember[] = (rawMembers || [])
      .filter((m) => m && (m.userId || m.email))
      .map((m) => ({
        userId: m.userId ?? undefined,
        email: m.email ?? undefined,
        role: (['owner', 'member', 'viewer'] as const).includes(m.role || 'member')
          ? (m.role as Role)
          : 'member',
        addedAt: m?.addedAt ? new Date(m.addedAt) : new Date(),
      }));

    if (!members.some((m) => String(m.userId) === String(actingUserId))) {
      members.unshift({
        userId: String(actingUserId),
        role: 'owner',
        addedAt: new Date(),
      });
    } else {
      members.forEach((m) => {
        if (String(m.userId) === String(actingUserId)) m.role = 'owner';
      });
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { members, updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    return updated;
  }

  async updateIcon(
    projectId: string,
    actingUserId: string,
    icon: { kind: 'emoji' | 'svg'; value: string } | null,
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }

    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException('Project not found');

    if (String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can change the icon');
    }

    if (icon) {
      const kind = icon.kind;
      const value = String(icon.value || '').trim();
      if (!['emoji', 'svg'].includes(kind)) {
        throw new BadRequestException('icon.kind must be emoji or svg');
      }
      if (!value) {
        throw new BadRequestException('icon.value is required');
      }
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: { icon: icon ?? null, updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    return updated;
  }

  // NEW: Ship project
  async shipProject(projectId: string, userId: string) {
    const project = await this.findOneForUser(userId, projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (String(project.userId) !== String(userId)) {
      throw new ForbiddenException('Only the owner can ship the project');
    }

    return this.momentum.shipProject(projectId, userId);
  }

  // Public transparency methods (unchanged)
  private generatePublicToken() {
    return randomBytes(16).toString('hex');
  }

  async enablePublic(projectId: string, actingUserId?: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException('Project not found');

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can change public status');
    }

    const token = proj.publicToken || this.generatePublicToken();
    const patch = {
      publicEnabled: true,
      publicToken: token,
      publicLastEnabledAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await this.projectModel
      .findByIdAndUpdate(projectId, { $set: patch }, { new: true })
      .lean();

    this.realtime.emitProjectPublicChanged(String(projectId), {
      projectId: String(projectId),
      publicEnabled: true,
      publicToken: !!token,
    });

    return { publicEnabled: true, publicToken: token, project: updated };
  }

  async disablePublic(projectId: string, actingUserId?: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException('Project not found');

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can change public status');
    }

    const patch = {
      publicEnabled: false,
      publicToken: null,
      updatedAt: new Date(),
    };

    const updated = await this.projectModel
      .findByIdAndUpdate(projectId, { $set: patch }, { new: true })
      .lean();

    this.realtime.emitProjectPublicChanged(String(projectId), {
      projectId: String(projectId),
      publicEnabled: false,
      publicToken: false,
    });

    return { publicEnabled: false, publicToken: null, project: updated };
  }

  async regeneratePublicToken(projectId: string, actingUserId?: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const proj = await this.projectModel.findById(projectId).lean();
    if (!proj) throw new NotFoundException('Project not found');

    if (actingUserId && String(proj.userId) !== String(actingUserId)) {
      throw new ForbiddenException('Only the owner can change public status');
    }

    const token = this.generatePublicToken();
    const patch = {
      publicEnabled: true,
      publicToken: token,
      publicLastEnabledAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await this.projectModel
      .findByIdAndUpdate(projectId, { $set: patch }, { new: true })
      .lean();

    this.realtime.emitProjectPublicChanged(String(projectId), {
      projectId: String(projectId),
      publicEnabled: true,
      publicToken: true,
    });

    return { publicEnabled: true, publicToken: token, project: updated };
  }

  async getPublicSnapshotByToken(token: string) {
    if (!token) return null;
    const proj = await this.projectModel
      .findOne({ publicToken: token, publicEnabled: true })
      .lean();

    if (!proj) return null;

    return {
      title: proj.title || 'Untitled Project',
      icon: proj.icon ?? null,
      lastUpdatedAt: proj.updatedAt || proj.createdAt,
      kpis: {},
      activity: [],
    };
  }
}
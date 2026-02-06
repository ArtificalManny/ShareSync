import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { randomBytes } from 'crypto';

import {
  Project,
  ProjectDocument,
  ProjectInvite,
  ProjectRole,
  MemberRole,
} from './schemas/project.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type InviteRole = Exclude<ProjectRole, MemberRole.OWNER>;

export interface CreateInviteDto {
  email: string;
  role: InviteRole; // 'admin' | 'member' | 'viewer' (owner excluded)
}

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly realtime: RealtimeGateway,
  ) {}

  private static genToken() {
    return randomBytes(24).toString('hex');
  }

  private assertOwnerOrThrow(project: ProjectDocument, actingUserId: string) {
    const acting = String(actingUserId);

    // ownerId is the canonical owner field in your schema
    if (String(project.ownerId) === acting) return;

    // You *can* choose to allow ADMINs too; for now, keep strict "owner only"
    const isOwnerMember =
      (project.members || []).some(
        (m) => String(m.userId) === acting && m.role === MemberRole.OWNER,
      );

    if (!isOwnerMember) {
      throw new ForbiddenException('Only owners can manage invites.');
    }
  }

  async createInvite(projectId: string, actingUserId: string, dto: CreateInviteDto) {
    const { email, role } = dto || ({} as CreateInviteDto);
    if (!email || !role) throw new BadRequestException('email and role are required');

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes('@')) throw new BadRequestException('Invalid email');

    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    this.assertOwnerOrThrow(project, actingUserId);

    const now = Date.now();
    const expiresAt = new Date(now + INVITE_TTL_MS);

    // Reuse existing pending invite for this email
    const existing = (project.invites || []).find(
      (inv) => String(inv.email || '').toLowerCase() === normalizedEmail && inv.status === 'pending',
    );

    if (existing) {
      existing.role = role as any;
      existing.invitedBy = new Types.ObjectId(actingUserId);
      existing.createdAt = new Date(now);
      existing.expiresAt = expiresAt;
    } else {
      const token = InvitesService.genToken();

      const invite: ProjectInvite = {
        email: normalizedEmail,
        role: role as any,
        token,
        status: 'pending',
        invitedBy: new Types.ObjectId(actingUserId),
        createdAt: new Date(now),
        expiresAt,
      };

      project.invites = project.invites || [];
      project.invites.push(invite);
    }

    await project.save();

    return {
      projectId: project.id,
      invites: project.invites,
    };
  }

  async listInvites(projectId: string, _actingUserId: string) {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) throw new NotFoundException('Project not found');

    return (project.invites || []).map((i: any) => ({
      email: i.email,
      role: i.role,
      status: i.status,
      token: i.token,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      invitedBy: i.invitedBy,
      acceptedByUserId: i.acceptedByUserId,
    }));
  }

  async revokeInvite(projectId: string, token: string, actingUserId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    this.assertOwnerOrThrow(project, actingUserId);

    const inv = (project.invites || []).find((i) => i.token === token);
    if (!inv) throw new NotFoundException('Invite not found');

    if (inv.status !== 'pending') {
      throw new BadRequestException('Only pending invites can be revoked.');
    }

    inv.status = 'revoked';
    await project.save();

    this.realtime.emitToProject(project.id, 'project:membersUpdated', {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    });

    return { ok: true };
  }

  async acceptInvite(token: string, userId: string, userEmail?: string) {
    if (!token) throw new BadRequestException('token is required');

    const query: FilterQuery<ProjectDocument> = { 'invites.token': token };
    const project = await this.projectModel.findOne(query);
    if (!project) throw new NotFoundException('Invite not found');

    const invite = (project.invites || []).find((i) => i.token === token);
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException(`Invite is ${invite.status} and cannot be accepted.`);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await project.save();
      throw new BadRequestException('Invite has expired.');
    }

    const alreadyMember =
      String(project.ownerId) === String(userId) ||
      (project.members || []).some((m) => String(m.userId) === String(userId));

    if (!alreadyMember) {
      project.members.push({
        userId: new Types.ObjectId(userId),
        role: invite.role as any,
        joinedAt: new Date(),
        invitedBy: invite.invitedBy,
      } as any);
    }

    invite.status = 'accepted';
    invite.acceptedByUserId = new Types.ObjectId(userId);

    // Optional: if you want to keep the email somewhere, store it in invite.email (already exists)
    // userEmail is unused because your ProjectMember doesn't have email (by design)

    await project.save();

    this.realtime.emitToProject(project.id, 'project:membersUpdated', {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    });

    return {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    };
  }
}

import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model, FilterQuery } from 'mongoose';
  import { randomBytes } from 'crypto';
  
  import {
    Project,
    ProjectDocument,
    ProjectInvite,
    ProjectRole,
  } from './schemas/project.schema';
  import { RealtimeGateway } from '../realtime/realtime.gateway';
  
  type InviteRole = Exclude<ProjectRole, 'owner'>;
  
  export interface CreateInviteDto {
    email: string;
    role: InviteRole; // 'member' | 'viewer'
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
      const isOwner =
        String(project.userId) === String(actingUserId) ||
        (project.members || []).some(
          (m) => String(m.userId) === String(actingUserId) && m.role === 'owner',
        );
      if (!isOwner) throw new ForbiddenException('Only owners can manage invites.');
    }
  
    async createInvite(
      projectId: string,
      actingUserId: string,
      dto: CreateInviteDto,
    ) {
      const { email, role } = dto || ({} as CreateInviteDto);
      if (!email || !role)
        throw new BadRequestException('email and role are required');
      const normalizedEmail = String(email).trim().toLowerCase();
  
      const project = await this.projectModel.findById(projectId);
      if (!project) throw new NotFoundException('Project not found');
  
      this.assertOwnerOrThrow(project, actingUserId);
  
      // Reject if that email is already a member on this project
      const alreadyMember = (project.members || []).some(
        (m) => String(m.email || '').toLowerCase() === normalizedEmail,
      );
      if (alreadyMember)
        throw new BadRequestException(
          'That email is already a member of this project.',
        );
  
      // Reuse existing pending invite for that email or create a fresh one
      const now = Date.now();
      const expiresAt = new Date(now + INVITE_TTL_MS);
  
      const existing = (project.invites || []).find(
        (inv) =>
          String(inv.email || '').toLowerCase() === normalizedEmail &&
          inv.status === 'pending',
      );
  
      if (existing) {
        existing.role = role;
        existing.invitedBy = actingUserId;
        existing.createdAt = new Date(now);
        existing.expiresAt = expiresAt as any;
      } else {
        const token = InvitesService.genToken();
        const invite: ProjectInvite = {
          email: normalizedEmail,
          role,
          token,
          status: 'pending',
          invitedBy: actingUserId as any,
          createdAt: new Date(now) as any,
          expiresAt: expiresAt as any,
        };
        project.invites = project.invites || [];
        project.invites.push(invite);
      }
  
      await project.save();
  
      // (Optional) send email here
  
      return {
        projectId: project.id,
        invites: project.invites,
      };
    }
  
    async listInvites(projectId: string, _actingUserId: string) {
      const project = await this.projectModel.findById(projectId).lean();
      if (!project) throw new NotFoundException('Project not found');
  
      // You can restrict to owners by calling assertOwnerOrThrow with a hydrated doc if desired
  
      return (project.invites || []).map((i) => ({
        email: i.email,
        role: i.role,
        status: i.status,
        token: i.token,
        createdAt: i.createdAt,
        expiresAt: (i as any).expiresAt,
        invitedBy: (i as any).invitedBy,
      }));
    }
  
    async revokeInvite(projectId: string, token: string, actingUserId: string) {
      const project = await this.projectModel.findOne({ _id: projectId });
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
  
      // Find the project containing this invite
      const query: FilterQuery<ProjectDocument> = { 'invites.token': token };
      const project = await this.projectModel.findOne(query);
      if (!project) throw new NotFoundException('Invite not found');
  
      const invite = (project.invites || []).find((i) => i.token === token);
      if (!invite) throw new NotFoundException('Invite not found');
  
      if (invite.status !== 'pending') {
        throw new BadRequestException(
          `Invite is ${invite.status} and cannot be accepted.`,
        );
      }
      if ((invite as any).expiresAt && (invite as any).expiresAt.getTime?.() < Date.now()) {
        (invite as any).status = 'expired';
        await project.save();
        throw new BadRequestException('Invite has expired.');
      }
  
      // If user is already a member, just mark accepted
      const alreadyMember = (project.members || []).some(
        (m) => String(m.userId) === String(userId),
      );
      if (!alreadyMember) {
        project.members.push({
          userId: userId as any,
          email: userEmail || invite.email,
          role: invite.role,
          addedAt: new Date() as any,
        } as any);
      }
  
      invite.status = 'accepted';
      (invite as any).acceptedByUserId = userId;
  
      await project.save();
  
      // Realtime fanout
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
  
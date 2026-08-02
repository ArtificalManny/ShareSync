import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types, Connection } from 'mongoose';
import { randomBytes } from 'crypto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  Project,
  ProjectDocument,
  ProjectInvite,
  ProjectRole,
  MemberRole,
} from './schemas/project.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailService } from '../notifications/email.service';

type InviteRole = Exclude<ProjectRole, MemberRole.OWNER>;

export interface CreateInviteDto {
  email: string;
  role: InviteRole; // 'admin' | 'member' | 'viewer' (owner excluded)
}

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days



@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly realtime: RealtimeGateway,
    private readonly eventEmitter: EventEmitter2,
      private readonly subscriptionsService: SubscriptionsService,
      private readonly emailService: EmailService,
  ) {}

  private static genToken() {
    return randomBytes(24).toString('hex');
  }

  private getId(ref: any): string {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    return (ref._id || ref.id || ref)?.toString() || '';
  }

  private getProjectMemberRole(project: any, actingUserId: string): string {
    const acting = String(actingUserId || '');

    const member = (project.members || []).find((m: any) => {
      const memberUserId = this.getId(m?.userId || m?.user || m?.memberId || m);
      return memberUserId === acting;
    });

    return String(member?.role || '').toLowerCase();
  }

  private canManageInvites(project: any, actingUserId: string): boolean {
    const acting = String(actingUserId || '');

    if (!acting) return false;

    // Support both current and legacy ownership fields.
    const ownerLikeRefs = [
      project.ownerId,
      project.owner,
      project.createdBy,
      project.createdById,
      project.creatorId,
      project.userId,
    ];

    const isOwnerLike = ownerLikeRefs.some((ref) => this.getId(ref) === acting);

    if (isOwnerLike) {
      return true;
    }

    const role = this.getProjectMemberRole(project, acting);

    // owner-admin-invite-policy-v1
    return ['owner', 'admin'].includes(role);
  }

  private assertCanManageInvitesOrThrow(project: ProjectDocument, actingUserId: string) {
    if (this.canManageInvites(project, actingUserId)) {
      return;
    }

    throw new ForbiddenException('Only project owners or admins can manage invites.');
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildInviteUrl(inviteToken?: string): string {
    const frontendBase = String(process.env.FRONTEND_URL || 'https://openshare.ca').replace(/\/+$/, '');
    return `${frontendBase}/invite/${inviteToken || ''}`;
  }


  private async getInviterDisplayName(userId: string): Promise<string> {
    try {
      if (!userId || !Types.ObjectId.isValid(userId)) return 'Someone';

      const user = await this.connection.collection('users').findOne(
        { _id: new Types.ObjectId(userId) },
        {
          projection: {
            displayName: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            email: 1,
          },
        },
      );

      const firstLast = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      return (
        String(user?.displayName || '').trim() ||
        firstLast ||
        String(user?.username || '').trim() ||
        String(user?.email || '').trim() ||
        'Someone'
      );
    } catch (err: any) {
      this.logger.warn(`Could not resolve invite sender name: ${err?.message || err}`);
      return 'Someone';
    }
  }

  private async sendProjectInviteEmail(args: {
    to: string;
    projectName: string;
    role: string;
    inviteToken?: string;
    message?: string;
    invitedByName?: string;
  }): Promise<void> {
    const inviteUrl = this.buildInviteUrl(args.inviteToken);

    await this.emailService.sendProjectInviteEmail({
      to: args.to,
      projectName: args.projectName,
      role: args.role,
      inviteUrl,
      message: args.message,
      invitedByName: args.invitedByName,
    });
  }

  async createInvite(projectId: string, actingUserId: string, dto: CreateInviteDto) {
    const { email, role } = dto || ({} as CreateInviteDto);
    if (!email || !role) throw new BadRequestException('email and role are required');

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes('@')) throw new BadRequestException('Invalid email');

    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
      this.assertCanManageInvitesOrThrow(project, actingUserId);

      const workspaceOwnerId = this.getId(
        (project as any).ownerId ||
        (project as any).owner ||
        (project as any).createdBy ||
        (project as any).createdById ||
        (project as any).creatorId ||
        actingUserId,
      );

      const memberUsageCheck = await this.subscriptionsService.checkWorkspaceMemberLimit(
        workspaceOwnerId || actingUserId,
        { email: normalizedEmail },
      );

      if (!memberUsageCheck.allowed) {
        throw new ForbiddenException(
          `Workspace member limit reached. Your current plan allows ${memberUsageCheck.limit} active workspace members.`,
        );
      }

      const now = Date.now();
    const expiresAt = new Date(now + INVITE_TTL_MS);
    let inviteToken: string | undefined;

    // Reuse existing pending invite for this email
    const existing = (project.invites || []).find(
      (inv) => String(inv.email || '').toLowerCase() === normalizedEmail && inv.status === 'pending',
    );

    if (existing) {
      // invite-delivery-refresh-v1
      const token = InvitesService.genToken();

      existing.role = role as any;
      existing.token = token;
      existing.invitedBy = new Types.ObjectId(actingUserId);
      existing.createdAt = new Date(now);
      existing.expiresAt = expiresAt;
      inviteToken = token;
    } else {
      const token = InvitesService.genToken();
      inviteToken = token;

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

    // ✅ Emit event so NotificationsService can send invite notification to invitee
    await this.eventEmitter
      .emitAsync('project.invite.created', {
        projectId: project.id,
        projectName: project.name,
        inviteeEmail: normalizedEmail,
        inviteToken,
        role,
        invitedBy: actingUserId,
      })
      .catch((err: any) => {
        this.logger.warn(
          `Project invite notification failed for ${normalizedEmail}: ${
            err?.message || err
          }`,
        );
      });

    const inviterDisplayName = await this.getInviterDisplayName(actingUserId);

    await this.sendProjectInviteEmail({
      to: normalizedEmail,
      projectName: String((project as any)?.name || (project as any)?.title || 'Project'),
      role: String(role || 'member'),
      inviteToken,
      invitedByName: inviterDisplayName,
      message: String((dto as any)?.message || ''),
    }).catch((err: any) => {
      this.logger.warn(`Project invite email failed for ${normalizedEmail}: ${err?.message || err}`);
    });

    this.logger.log(`Invite sent to ${normalizedEmail} for project ${project.name} (role: ${role})`);

    // 🚀 Print the invite link directly to the terminal for local testing!
    console.log(`\n✉️  LOCAL DEV: Invite Link generated -> http://localhost:54693/invite/${inviteToken}\n`);

    return {
      projectId: project.id,
      invites: project.invites,
    };
  }

  // 🚀 NEW: Listen for invites created during the ProjectsCreate.jsx flow!
  @OnEvent('project.members.invited')
  async handleProjectCreationInvites(payload: { projectId: string; invitedBy: string; members: any[] }) {
    this.logger.log(`Caught creation event! Generating invites for ${payload.members.length} users...`);
    for (const member of payload.members) {
      const email = typeof member === 'string' ? member : (member.email || member.value);
      if (email) {
        try {
          // Fixed: Cast 'member' to any to bypass strict InviteRole enum checking
          await this.createInvite(payload.projectId, payload.invitedBy, { email, role: 'member' as any });
        } catch (e) {
          this.logger.error(`Failed to auto-generate invite for ${email}: ${e.message}`);
        }
      }
    }
  }

  async listInvites(projectId: string, actingUserId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    this.assertCanManageInvitesOrThrow(project, actingUserId);

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


  async declineInvite(token: string, userId: string, userEmail?: string) {
    if (!token) throw new BadRequestException('token is required');

    const query: FilterQuery<ProjectDocument> = { 'invites.token': token };
    const project = await this.projectModel.findOne(query);
    if (!project) throw new NotFoundException('Invite not found');

    const invite = (project.invites || []).find((i) => i.token === token);
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException(`Invite is ${invite.status} and cannot be declined.`);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await project.save();
      throw new BadRequestException('Invite has expired.');
    }

    const inviteEmail = String((invite as any).email || '').trim().toLowerCase();
    const accountEmail = String(userEmail || '').trim().toLowerCase();

    if (inviteEmail && !accountEmail) {
      throw new ForbiddenException('You must be logged in as the invited email address to decline this invite.');
    }

    if (inviteEmail && accountEmail && inviteEmail !== accountEmail) {
      throw new ForbiddenException('This invite was sent to a different email address.');
    }

    invite.status = 'declined' as any;
    (invite as any).declinedByUserId = new Types.ObjectId(userId);
    (invite as any).respondedAt = new Date();

    await project.save();

    this.realtime.emitToProject(project.id, 'project:membersUpdated', {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    });

    this.eventEmitter.emit('project.invite.declined', {
      projectId: project.id,
      projectName: project.name,
      declinedBy: userId,
      role: invite.role,
      ownerId: this.getId(project.ownerId || project.owner),
    });

    this.logger.log(`Invite declined by user ${userId} for project ${project.name}`);

    return {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    };
  }

  async revokeInvite(projectId: string, token: string, actingUserId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    this.assertCanManageInvitesOrThrow(project, actingUserId);

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

    const inviteEmail = String((invite as any).email || '').trim().toLowerCase();
    const accountEmail = String(userEmail || '').trim().toLowerCase();

    if (inviteEmail && !accountEmail) {
      throw new ForbiddenException('You must be logged in as the invited email address to accept this invite.');
    }

    if (inviteEmail && accountEmail && inviteEmail !== accountEmail) {
      throw new ForbiddenException('This invite was sent to a different email address.');
    }

    const alreadyMember =
      this.getId(project.ownerId) === String(userId) ||
      (project.members || []).some((m) => this.getId(m.userId) === String(userId));
      if (!alreadyMember) {
        const workspaceOwnerId = this.getId(
          (project as any).ownerId ||
          (project as any).owner ||
          (project as any).createdBy ||
          (project as any).createdById ||
          (project as any).creatorId ||
          invite.invitedBy,
        );

        const memberUsageCheck = await this.subscriptionsService.checkWorkspaceMemberLimit(
          workspaceOwnerId || String(invite.invitedBy || ''),
          { userId },
        );

        if (!memberUsageCheck.allowed) {
          throw new ForbiddenException(
            `Workspace member limit reached. Your current plan allows ${memberUsageCheck.limit} active workspace members.`,
          );
        }

        project.members.push({
        userId: new Types.ObjectId(userId),
        role: invite.role as any,
        joinedAt: new Date(),
        invitedBy: invite.invitedBy,
      } as any);
    }

    invite.status = 'accepted';
    invite.acceptedByUserId = new Types.ObjectId(userId);

    await project.save();

    this.realtime.emitToProject(project.id, 'project:membersUpdated', {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    });

    // ✅ Emit event so NotificationsService can notify the project owner
    this.eventEmitter.emit('project.invite.accepted', {
      projectId: project.id,
      projectName: project.name,
      acceptedBy: userId,
      role: invite.role,
      ownerId: this.getId(project.ownerId),
      memberAdded: !alreadyMember,
    });

    this.logger.log(`Invite accepted by user ${userId} for project ${project.name}`);

    return {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    };
  }
}

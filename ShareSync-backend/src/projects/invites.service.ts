// src/projects/invites.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectInvite, ProjectMember } from './schemas/project.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotifyService } from '../notifications/notify.service';

type Role = Exclude<ProjectMember['role'], 'owner'>; // 'member' | 'viewer'

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly realtime: RealtimeGateway,
    private readonly notify: NotifyService,
  ) {}

  private ensureObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Project not found');
  }

  private assertOwnerOrThrow(project: Project, actingUserId: string) {
    const isOwner = String(project.userId) === String(actingUserId) ||
      (Array.isArray(project.members) &&
       project.members.some(m => m.userId && String(m.userId) === String(actingUserId) && m.role === 'owner'));
    if (!isOwner) throw new ForbiddenException('Only the owner can manage invites');
  }

  /** Create an invite (owner-only). */
  async createInvite(
    projectId: string,
    actingUserId: string,
    email: string,
    role: Role = 'member',
  ): Promise<{ invite: ProjectInvite }> {
    this.ensureObjectId(projectId);
    const doc = await this.projectModel.findById(projectId).exec();
    if (!doc) throw new NotFoundException('Project not found');

    this.assertOwnerOrThrow(doc, actingUserId);

    const inviteEmail = normalizeEmail(email);
    if (!inviteEmail) throw new BadRequestException('Valid email is required');
    if (!['member', 'viewer'].includes(role)) role = 'member';

    // If already a member, bail early
    const alreadyMember = (doc.members || []).some(m =>
      (m.email && normalizeEmail(m.email) === inviteEmail) ||
      (m.userId && String(m.userId))
    );
    if (alreadyMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    // Prevent duplicate pending invite to same email
    const pending = (doc.invites || []).find(i =>
      i.status === 'pending' && normalizeEmail(i.email) === inviteEmail,
    );
    if (pending) {
      return { invite: pending };
    }

    const token = randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30d

    const invite: ProjectInvite = {
      email: inviteEmail,
      role,
      token,
      status: 'pending',
      invitedBy: String(actingUserId),
      createdAt: now,
      expiresAt,
    };

    doc.invites = [...(doc.invites || []), invite];
    await doc.save();

    // Optional: send email/stub
    try {
      await this.notify.queueEmail({
        to: inviteEmail,
        subject: `You're invited to join "${doc.title}" on ShareSync`,
        html: `
          <p>You were invited to the project <b>${doc.title}</b> as a <b>${role}</b>.</p>
          <p>Click to accept: <a href="${process.env.APP_ORIGIN || 'http://localhost:5173'}/accept-invite?projectId=${doc._id}&token=${token}">Accept invite</a></p>
          <p>If you didn’t expect this, you can ignore it.</p>
        `,
      } as any);
    } catch {
      // Non-fatal; ignore email errors in MVP
    }

    return { invite };
  }

  /** Accept an invite (auth required, but not yet a member). */
  async acceptInvite(
    projectId: string,
    token: string,
    acceptUserId: string,
    acceptUserEmail?: string,
  ): Promise<{ members: ProjectMember[] }> {
    this.ensureObjectId(projectId);
    const doc = await this.projectModel.findById(projectId).exec();
    if (!doc) throw new NotFoundException('Project not found');

    const inv = (doc.invites || []).find(i => i.token === token);
    if (!inv) throw new NotFoundException('Invite not found');
    if (inv.status !== 'pending') throw new BadRequestException(`Invite is ${inv.status}`);
    if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
      inv.status = 'expired';
      await doc.save();
      throw new BadRequestException('Invite has expired');
    }

    // If the user is already member, mark accepted and return
    const alreadyMember = (doc.members || []).some(m => m.userId && String(m.userId) === String(acceptUserId));
    if (!alreadyMember) {
      // Add new member using invite role
      doc.members = [
        ...(doc.members || []),
        {
          userId: String(acceptUserId),
          email: normalizeEmail(acceptUserEmail || inv.email),
          role: inv.role,
          addedAt: new Date(),
        } as ProjectMember,
      ];
    }

    inv.status = 'accepted';
    inv.acceptedByUserId = String(acceptUserId);
    await doc.save();

    // Fan-out: members updated
    this.realtime.emitToProject(String(doc._id), 'project:membersUpdated', {
      projectId: String(doc._id),
      members: (doc.members || []).map(m => ({
        userId: m.userId,
        email: m.email,
        role: m.role,
        addedAt: m.addedAt,
      })),
    });

    return { members: doc.members || [] };
  }

  /** (Optional) List invites (owner-only). */
  async listInvites(projectId: string, actingUserId: string) {
    this.ensureObjectId(projectId);
    const doc = await this.projectModel.findById(projectId).lean();
    if (!doc) throw new NotFoundException('Project not found');
    this.assertOwnerOrThrow(doc as any, actingUserId);
    return (doc.invites || []).map(i => ({
      email: i.email,
      role: i.role,
      status: i.status,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      invitedBy: i.invitedBy,
    }));
  }

  /** (Optional) Revoke an invite (owner-only). */
  async revokeInvite(projectId: string, actingUserId: string, token: string) {
    this.ensureObjectId(projectId);
    const doc = await this.projectModel.findById(projectId).exec();
    if (!doc) throw new NotFoundException('Project not found');
    this.assertOwnerOrThrow(doc, actingUserId);

    const inv = (doc.invites || []).find(i => i.token === token);
    if (!inv) throw new NotFoundException('Invite not found');

    inv.status = 'revoked';
    await doc.save();
    return { ok: true };
  }
}

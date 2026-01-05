import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectMember } from '../projects/schemas/project.schema';
import { Invitation, InvitationDocument, generateInviteToken } from './schemas/invitation.schema';
import { CreateInvitationDto } from './dto/create-invitation.dto';

type Role = ProjectMember['role'];
const VALID_ROLES: Role[] = ['owner', 'member', 'viewer'];

function toRole(input: any): Role {
  const r = String(input ?? '').toLowerCase() as Role;
  return (VALID_ROLES as string[]).includes(r) ? (r as Role) : 'member';
}

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation.name) private readonly inviteModel: Model<InvitationDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid id');
    return new Types.ObjectId(id);
  }

  /**
   * ✅ Shape A permissions:
   * - Project "owner" is `project.userId`
   * - Members are `members.userId`
   * - Only owner (or member.role === 'owner') can manage invites
   */
  private canManage(project: any, userId: string): boolean {
    const uid = String(userId);

    // owner field in your schema is `userId`
    if (String(project.userId) === uid) return true;

    const member = Array.isArray(project.members)
      ? project.members.find((m: any) => String(m.userId) === uid)
      : null;

    return !!member && member.role === 'owner';
  }

  async list(projectId: string, userId: string) {
    const pid = this.toObjectId(projectId);

    const project = await this.projectModel.findById(pid).lean();
    if (!project) throw new NotFoundException('Project not found');
    if (!this.canManage(project, userId)) throw new ForbiddenException('Not allowed');

    return this.inviteModel.find({ project: pid }).sort({ createdAt: -1 }).lean();
  }

  async create(projectId: string, userId: string, dto: CreateInvitationDto) {
    const pid = this.toObjectId(projectId);
    const invitedBy = this.toObjectId(userId);

    const project = await this.projectModel.findById(pid).lean();
    if (!project) throw new NotFoundException('Project not found');
    if (!this.canManage(project, userId)) throw new ForbiddenException('Not allowed');

    const email = String(dto.email).trim().toLowerCase();
    const role: Role = toRole(dto.role);

    const existing = await this.inviteModel.findOne({ project: pid, email, status: 'pending' });
    if (existing) return existing;

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.inviteModel.create({
      project: pid,
      email,
      role,
      status: 'pending',
      token,
      invitedBy,
      expiresAt,
    });
  }

  async revoke(projectId: string, invitationId: string, userId: string) {
    const pid = this.toObjectId(projectId);
    const iid = this.toObjectId(invitationId);

    const project = await this.projectModel.findById(pid).lean();
    if (!project) throw new NotFoundException('Project not found');
    if (!this.canManage(project, userId)) throw new ForbiddenException('Not allowed');

    const updated = await this.inviteModel.findOneAndUpdate(
      { _id: iid, project: pid, status: 'pending' },
      { $set: { status: 'revoked' } },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Invitation not found');
    return updated;
  }

  async accept(token: string, userId: string, userEmail?: string) {
    const uid = this.toObjectId(userId);
    const now = new Date();

    const invite = await this.inviteModel.findOne({ token }).exec();
    if (!invite) throw new NotFoundException('Invitation not found');

    if (invite.status !== 'pending') throw new ForbiddenException('Invitation is not pending');

    if (invite.expiresAt && invite.expiresAt < now) {
      invite.status = 'expired';
      await invite.save();
      throw new ForbiddenException('Invitation expired');
    }

    if (userEmail && invite.email !== String(userEmail).toLowerCase().trim()) {
      throw new ForbiddenException('Invitation email mismatch');
    }

    const project = await this.projectModel.findById(invite.project);
    if (!project) throw new NotFoundException('Project not found');

    // ✅ Shape A membership check
    const alreadyMember =
      String((project as any).userId) === String(uid) ||
      (project as any).members?.some((m: any) => String(m.userId) === String(uid));

    if (!alreadyMember) {
      (project as any).members = (project as any).members ?? [];
      (project as any).members.push({
        userId: uid,
        role: invite.role,
        addedAt: new Date(),
      });
      await project.save();
    }

    invite.status = 'accepted';
    await invite.save();

    return { ok: true, projectId: String(project._id), role: invite.role };
  }
}

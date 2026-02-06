// src/projects/schemas/project-invite.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT INVITE SCHEMA: Pending invitations
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MemberRole } from './project.schema';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export type ProjectInviteDocument = HydratedDocument<ProjectInvite>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      (ret as any).id = (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class ProjectInvite {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  invitedUserId?: Types.ObjectId;

  @Prop({ index: true })
  invitedEmail?: string;

  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: String, enum: InviteStatus, default: InviteStatus.PENDING, index: true })
  status: InviteStatus;

  @Prop({ maxlength: 500 })
  message?: string;

  @Prop({ unique: true, sparse: true })
  inviteToken?: string;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  respondedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectInviteSchema = SchemaFactory.createForClass(ProjectInvite);

ProjectInviteSchema.index({ inviteToken: 1 }, { sparse: true });
ProjectInviteSchema.index({ projectId: 1, status: 1 });
ProjectInviteSchema.index({ invitedUserId: 1, status: 1 });
ProjectInviteSchema.index({ invitedEmail: 1, status: 1 });

ProjectInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

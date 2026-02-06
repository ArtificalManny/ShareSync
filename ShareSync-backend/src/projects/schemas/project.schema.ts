// src/projects/schemas/project.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SCHEMA: Core entity for organizing work + Invites
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  PUBLIC = 'public',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * ✅ Compatibility exports (so invites.service.ts can import the names it expects)
 */
export type ProjectRole = MemberRole;

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

@Schema({ _id: false })
export class ProjectInvite {
  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, enum: MemberRole, required: true })
  role: MemberRole;

  @Prop({ required: true, index: true })
  token: string;

  @Prop({ type: String, enum: ['pending', 'accepted', 'revoked', 'expired'], default: 'pending' })
  status: InviteStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;
}

@Schema({ _id: false })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;
}

@Schema({ _id: false })
export class ProjectSettings {
  @Prop({ type: Boolean, default: true })
  notificationsEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  allowMemberInvites: boolean;

  @Prop({ type: Boolean, default: false })
  requireTaskApproval: boolean;

  @Prop({ type: Number, default: 14 })
  defaultSprintDuration: number;

  @Prop({
    type: [String],
    default: ['backlog', 'todo', 'in_progress', 'review', 'done'],
  })
  taskStatuses: string[];

  @Prop({ type: [String], default: ['low', 'medium', 'high', 'critical'] })
  taskPriorities: string[];
}

@Schema({ _id: false })
export class ProjectMetrics {
  @Prop({ type: Number, default: 0 })
  momentum: number;

  @Prop({ type: Number, default: 0 })
  velocity: number;

  @Prop({ type: Number, default: 0 })
  totalTasks: number;

  @Prop({ type: Number, default: 0 })
  completedTasks: number;

  @Prop({ type: Number, default: 0 })
  totalXP: number;

  @Prop({ type: Number, default: 0 })
  activeSprintId?: Types.ObjectId;

  @Prop({ type: Date })
  lastActivityAt?: Date;

  @Prop({ type: Number, default: 0 })
  weeklyShips: number;

  @Prop({ type: Number, default: 0 })
  momentumTrend: number;
}

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Project {
  @ApiProperty({ description: 'Project name', example: 'ShareSync MVP' })
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Building the best project management tool',
  })
  @Prop({ trim: true, maxlength: 2000, default: '' })
  description: string;

  @ApiProperty({ description: 'Project icon (emoji)', example: '🚀' })
  @Prop({ default: '📁' })
  icon: string;

  @ApiProperty({ description: 'Project color (hex)', example: '#7C3AED' })
  @Prop({ default: '#7C3AED' })
  color: string;

  @ApiProperty({ description: 'Project owner user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @ApiProperty({ description: 'Project members with roles' })
  @Prop({ type: [ProjectMember], default: [] })
  members: ProjectMember[];

  /**
   * ✅ Invites (new)
   */
  @ApiProperty({ description: 'Pending/accepted invites (email-based)', required: false })
  @Prop({ type: [ProjectInvite], default: [] })
  invites: ProjectInvite[];

  @ApiProperty({ enum: ProjectStatus, description: 'Project status' })
  @Prop({
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
    index: true,
  })
  status: ProjectStatus;

  @ApiProperty({ enum: ProjectVisibility, description: 'Project visibility' })
  @Prop({ type: String, enum: ProjectVisibility, default: ProjectVisibility.PRIVATE })
  visibility: ProjectVisibility;

  @ApiProperty({ description: 'Project settings' })
  @Prop({ type: ProjectSettings, default: () => ({}) })
  settings: ProjectSettings;

  @ApiProperty({ description: 'Project metrics (calculated)' })
  @Prop({ type: ProjectMetrics, default: () => ({}) })
  metrics: ProjectMetrics;

  @ApiProperty({ description: 'Project tags', example: ['startup', 'saas'] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'Is project starred by owner' })
  @Prop({ type: Boolean, default: false })
  isStarred: boolean;

  @ApiProperty({ description: 'When project was archived' })
  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1, status: 1 });
ProjectSchema.index({ name: 'text', description: 'text' });
ProjectSchema.index({ 'metrics.lastActivityAt': -1 });
ProjectSchema.index({ 'invites.token': 1 }, { sparse: true });
ProjectSchema.index({ 'invites.email': 1 }, { sparse: true });

ProjectSchema.virtual('memberCount').get(function () {
  return this.members.length + 1;
});

ProjectSchema.virtual('completionRate').get(function () {
  if (this.metrics.totalTasks === 0) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.totalTasks) * 100);
});

ProjectSchema.virtual('isActive').get(function () {
  return this.status === ProjectStatus.ACTIVE;
});

ProjectSchema.methods.isMember = function (userId: Types.ObjectId | string): boolean {
  const userIdStr = userId.toString();
  if (this.ownerId.toString() === userIdStr) return true;
  return this.members.some((m: ProjectMember) => m.userId.toString() === userIdStr);
};

ProjectSchema.methods.getMemberRole = function (
  userId: Types.ObjectId | string,
): MemberRole | null {
  const userIdStr = userId.toString();
  if (this.ownerId.toString() === userIdStr) return MemberRole.OWNER;
  const member = this.members.find((m: ProjectMember) => m.userId.toString() === userIdStr);
  return member ? member.role : null;
};

ProjectSchema.methods.canEdit = function (userId: Types.ObjectId | string): boolean {
  const role = this.getMemberRole(userId);
  return role === MemberRole.OWNER || role === MemberRole.ADMIN;
};

ProjectSchema.methods.canManageMembers = function (userId: Types.ObjectId | string): boolean {
  const role = this.getMemberRole(userId);
  return role === MemberRole.OWNER || role === MemberRole.ADMIN;
};

ProjectSchema.statics.findUserProjects = function (userId: Types.ObjectId | string) {
  return this.find({
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
    status: { $ne: ProjectStatus.ARCHIVED },
  }).sort({ 'metrics.lastActivityAt': -1 });
};

ProjectSchema.statics.findByIdWithAccess = async function (
  projectId: string,
  userId: Types.ObjectId | string,
) {
  const project = await this.findById(projectId);
  if (!project) return null;
  if (!project.isMember(userId)) return null;
  return project;
};

ProjectSchema.pre('save', function (next) {
  if (this.isModified() && this.metrics) {
    this.metrics.lastActivityAt = new Date();
  }
  next();
});

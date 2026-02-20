// src/projects/schemas/project.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SCHEMA: Core entity for organizing work + Invites + Goals + Metrics
// - Adds goals + richer metrics/settings structure (seed/frontend compatible)
// - Preserves backwards compatibility for:
//   • existing invites.service.ts imports/types
//   • icon as emoji string (legacy) while supporting icon object
//   • ownerId field while adding owner field
//
// PHASE 0/2 ADDITIONS (SAFE):
//   • isListed (Discover/Search)
//   • spectatorMode (view | suggest)
//   • moderationStatus (draft | pending | approved | rejected)
//   • moderationReason
//   • publicSlug (optional later)
//
// PHASE 3 ADDITION (SAFE):
//   • followersCount (stored counter, default 0)
//
// ✅ REQUIRED (SAFE):
//   • public: boolean (default false)  ← used for spectator stream gating
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
 * ✅ Phase 0/2: Spectator + Moderation (frontend-safe)
 */
export enum ProjectSpectatorMode {
  VIEW = 'view',
  SUGGEST = 'suggest',
}

export enum ProjectModerationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * ✅ Compatibility exports (so invites.service.ts can import the names it expects)
 */
export type ProjectRole = MemberRole;
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectInvite {
  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  token: string;

  @Prop({ type: String, enum: MemberRole, required: true })
  role: MemberRole;

  @Prop({ type: String, enum: ['pending', 'accepted', 'revoked', 'expired'], default: 'pending' })
  status: InviteStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;
}

@Schema({ _id: false })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Some parts of the code/seed use `user` instead of `userId`
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop({ required: true, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  // Optional: fine-grained permissions array
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // Legacy/optional field still used in some flows
  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  // ✅ ADDED: User-specific preferences (Notifications)
  @Prop({
    type: Object,
    default: {
      taskAssigned: true,
      taskCompleted: true,
      announcements: true,
      mentions: true,
      deadlines: true,
      weeklyDigest: false
    }
  })
  preferences?: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    announcements: boolean;
    mentions: boolean;
    deadlines: boolean;
    weeklyDigest: boolean;
  };
}

@Schema({ _id: false })
export class ProjectSettings {
  @Prop({ default: 'pulse' })
  defaultView: string;

  @Prop({ default: true })
  enableGamification: boolean;

  @Prop({ default: true })
  enableAI: boolean;

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
  @Prop({ default: 0 })
  momentum: number;

  @Prop({ default: 0 })
  velocity: number;

  @Prop({ default: 0 })
  totalTasks: number;

  @Prop({ default: 0 })
  completedTasks: number;

  @Prop({ default: 0 })
  totalXP: number;

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date;

  @Prop({ default: 0 })
  weeklyShips: number;

  @Prop({ default: 0 })
  momentumTrend: number;

  // IMPORTANT: ObjectId ref, nullable
  @Prop({ type: Types.ObjectId, ref: 'Sprint', default: null })
  activeSprintId: Types.ObjectId | null;
}

@Schema({ _id: true })
export class ProjectGoal {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  targetDate?: Date;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ default: 'normal', enum: ['normal', 'at_risk', 'achieved'] })
  status: 'normal' | 'at_risk' | 'achieved';

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  linkedTasks: Types.ObjectId[];
}

// Optional: richer icon representation for future UI (while keeping legacy icon string)
export type ProjectIconObject = { kind: string; value: string };

export type ProjectDocument = Project &
  Document & {
    isMember(userId: Types.ObjectId | string): boolean;
    getMemberRole(userId: Types.ObjectId | string): MemberRole | null;
    canEdit(userId: Types.ObjectId | string): boolean;
    canManageMembers(userId: Types.ObjectId | string): boolean;
  };

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

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

  // ✅ Preferred emoji field (seed/frontend spec)
  @ApiProperty({ description: 'Project emoji', example: '🚀' })
  @Prop({ default: '📁' })
  emoji: string;

  // ✅ Optional icon object for future use
  @Prop({ type: Object, default: null })
  iconObj?: ProjectIconObject | null;

  // ✅ Legacy icon string (many parts of app already use this)
  @ApiProperty({ description: 'Legacy project icon (emoji)', example: '🚀' })
  @Prop({ default: '📁' })
  icon: string;

  @ApiProperty({ description: 'Project color (hex)', example: '#7C3AED' })
  @Prop({ default: '#7C3AED' })
  color: string;

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

  // ✅ REQUIRED: explicit boolean gate for spectator/public stream (safe default)
  @Prop({ type: Boolean, default: false, index: true })
  public: boolean;

  /**
   * ✅ Phase 0/2: Public listing + spectator + moderation (SAFE defaults)
   */
  @Prop({ type: Boolean, default: false, index: true })
  isListed: boolean;

  @Prop({ type: String, enum: ProjectSpectatorMode, default: ProjectSpectatorMode.VIEW })
  spectatorMode: ProjectSpectatorMode;

  @Prop({ type: String, enum: ProjectModerationStatus, default: ProjectModerationStatus.APPROVED, index: true })
  moderationStatus: ProjectModerationStatus;

  @Prop({ type: String, default: '', trim: true })
  moderationReason: string;

  @Prop({ type: String, default: null, index: true, sparse: true })
  publicSlug?: string | null;

  // ✅ Phase 3: stored follower count (safe default)
  @Prop({ type: Number, default: 0, index: true })
  followersCount: number;

  // Ownership (dual fields for compatibility)
  @ApiProperty({ description: 'Project owner user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  // Some queries/seed use `owner` instead of `ownerId`
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  owner?: Types.ObjectId | null;

  @ApiProperty({ description: 'Project members with roles' })
  @Prop({ type: [ProjectMember], default: [] })
  members: ProjectMember[];

  /**
   * ✅ Invites (email-based)
   */
  @ApiProperty({ description: 'Pending/accepted invites (email-based)', required: false })
  @Prop({ type: [ProjectInvite], default: [] })
  invites: ProjectInvite[];

  @ApiProperty({ description: 'Project settings' })
  @Prop({ type: ProjectSettings, default: () => ({}) })
  settings: ProjectSettings;

  @ApiProperty({ description: 'Project metrics (calculated)' })
  @Prop({ type: ProjectMetrics, default: () => ({}) })
  metrics: ProjectMetrics;

  /**
   * ✅ Goals (structured)
   */
  @Prop({ type: [ProjectGoal], default: [] })
  goals: ProjectGoal[];

  @ApiProperty({ description: 'Project tags', example: ['startup', 'saas'] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'Is project starred by owner' })
  @Prop({ type: Boolean, default: false })
  isStarred: boolean;

  // ✅ Explicit archive flag used by queries
  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @ApiProperty({ description: 'When project was archived' })
  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1, status: 1 });
ProjectSchema.index({ name: 'text', description: 'text' });
ProjectSchema.index({ 'metrics.lastActivityAt': -1 });
ProjectSchema.index({ 'invites.token': 1 }, { sparse: true });
ProjectSchema.index({ 'invites.email': 1 }, { sparse: true });

// ✅ Phase 0/2 indexes (Discover/Search + moderation queries)
ProjectSchema.index({ visibility: 1, isListed: 1, moderationStatus: 1 });
ProjectSchema.index({ isListed: 1, 'metrics.lastActivityAt': -1 });

// ✅ Phase 3 index (optional)
ProjectSchema.index({ followersCount: -1 });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.virtual('memberCount').get(function () {
  return (this.members?.length || 0) + 1;
});

ProjectSchema.virtual('completionRate').get(function () {
  if (!this.metrics || this.metrics.totalTasks === 0) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.totalTasks) * 100);
});

ProjectSchema.virtual('isActive').get(function () {
  return this.status === ProjectStatus.ACTIVE;
});

// ═══════════════════════════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.methods.isMember = function (userId: Types.ObjectId | string): boolean {
  const userIdStr = userId.toString();
  if (this.ownerId?.toString?.() === userIdStr) return true;
  if (this.owner?.toString?.() === userIdStr) return true;
  return (this.members || []).some((m: ProjectMember) => m.userId?.toString?.() === userIdStr);
};

ProjectSchema.methods.getMemberRole = function (
  userId: Types.ObjectId | string,
): MemberRole | null {
  const userIdStr = userId.toString();
  if (this.ownerId?.toString?.() === userIdStr) return MemberRole.OWNER;
  if (this.owner?.toString?.() === userIdStr) return MemberRole.OWNER;
  const member = (this.members || []).find((m: ProjectMember) => m.userId?.toString?.() === userIdStr);
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

// ═══════════════════════════════════════════════════════════════════════════════
// STATICS
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.statics.findUserProjects = function (userId: Types.ObjectId | string) {
  return this.find({
    $or: [{ ownerId: userId }, { owner: userId }, { 'members.userId': userId }, { 'members.user': userId }],
    isArchived: { $ne: true },
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

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.pre('save', function (next) {
  if (this.isModified() && this.metrics) {
    this.metrics.lastActivityAt = new Date();
  }
  // Keep legacy icon/emoji in sync (safe)
  if (this.emoji && (!this.icon || this.icon === '📁')) {
    this.icon = this.emoji;
  } else if (this.icon && (!this.emoji || this.emoji === '📁')) {
    this.emoji = this.icon;
  }
  next();
});

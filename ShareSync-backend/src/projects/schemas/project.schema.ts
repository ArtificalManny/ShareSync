// src/projects/schemas/project.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SCHEMA - MongoDB/Mongoose schema for projects
// Phase 4: Includes invites support for invites.service.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum ProjectStatus {
  ACTIVE = 'active',
  PLANNING = 'planning',
  ON_HOLD = 'on_hold',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  LISTED = 'listed',
  TEAM = 'team',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

// Alias for invites.service.ts compatibility
export type ProjectRole = MemberRole;

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

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

  @Prop({ type: Object, default: {} })
  preferences?: {
    notifications?: boolean;
    emailDigest?: 'none' | 'daily' | 'weekly';
    mentionsOnly?: boolean;
  };
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT INVITE SCHEMA (for invites.service.ts)
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectInvite {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: String, enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus | 'pending' | 'accepted' | 'revoked' | 'expired';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;
}

export const ProjectInviteSchema = SchemaFactory.createForClass(ProjectInvite);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT METRICS
// ═══════════════════════════════════════════════════════════════════════════════

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

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date;

  @Prop({ type: Number, default: 0 })
  weeklyShips: number;

  @Prop({ type: Number, default: 0 })
  momentumTrend: number;

  @Prop({ type: Types.ObjectId, ref: 'Sprint', default: null })
  activeSprintId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  totalShips: number;

  @Prop({ type: Number, default: 0 })
  memberCount: number;

  @Prop({ type: Number, default: 0 })
  likes: number;

  @Prop({ type: Number, default: 0 })
  comments: number;
}

export const ProjectMetricsSchema = SchemaFactory.createForClass(ProjectMetrics);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectSettings {
  @Prop({ type: String, default: 'stack' })
  defaultView?: string;

  @Prop({ type: Boolean, default: true })
  enableGamification?: boolean;

  @Prop({ type: Boolean, default: true })
  enableAI?: boolean;

  @Prop({ type: Boolean, default: true })
  notificationsEnabled?: boolean;

  @Prop({ type: Boolean, default: true })
  allowMemberInvites?: boolean;

  @Prop({ type: Boolean, default: false })
  requireTaskApproval?: boolean;

  @Prop({ type: Number, default: 14 })
  defaultSprintDuration?: number;

  @Prop({ type: [String], default: ['todo', 'in_progress', 'review', 'done'] })
  taskStatuses?: string[];

  @Prop({ type: [String], default: ['low', 'medium', 'high', 'critical'] })
  taskPriorities?: string[];

  @Prop({ type: Boolean, default: false })
  isPublic?: boolean;

  @Prop({ type: Boolean, default: false })
  isListed?: boolean;
}

export const ProjectSettingsSchema = SchemaFactory.createForClass(ProjectSettings);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT GOAL
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectGoal {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date })
  targetDate?: Date;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress?: number;

  @Prop({ type: String, enum: ['normal', 'at_risk', 'achieved'], default: 'normal' })
  status?: 'normal' | 'at_risk' | 'achieved';
}

export const ProjectGoalSchema = SchemaFactory.createForClass(ProjectGoal);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROJECT SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  collection: 'projects',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Project {
  // ─────────────────────────────────────────────────────────────────────────────
  // CORE FIELDS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ type: String, default: '📁' })
  emoji: string;

  @Prop({ type: String, default: '📁' })
  icon: string;

  @Prop({ type: String, default: '#7C3AED' })
  color: string;

  @Prop({ type: String })
  category?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // ─────────────────────────────────────────────────────────────────────────────
  // STATUS & VISIBILITY
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Prop({ type: String, enum: ProjectVisibility, default: ProjectVisibility.PRIVATE })
  visibility: ProjectVisibility;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @Prop({ type: Boolean, default: false })
  isStarred: boolean;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  // ─────────────────────────────────────────────────────────────────────────────
  // OWNERSHIP & MEMBERS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  owner?: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members: ProjectMember[];

  // ─────────────────────────────────────────────────────────────────────────────
  // INVITES (for invites.service.ts)
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: [ProjectInviteSchema], default: [] })
  invites: ProjectInvite[];

  // ─────────────────────────────────────────────────────────────────────────────
  // NESTED OBJECTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: ProjectMetricsSchema, default: () => ({}) })
  metrics: ProjectMetrics;

  @Prop({ type: ProjectSettingsSchema, default: () => ({}) })
  settings: ProjectSettings;

  @Prop({ type: [ProjectGoalSchema], default: [] })
  goals: ProjectGoal[];

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC SHARING
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Boolean, default: false })
  publicEnabled: boolean;

  @Prop({ type: String })
  publicToken?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: FOLLOWS / SPECTATORS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  followersCount: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: DISCOVER FEED FIELDS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  streakDays: number;

  @Prop({ type: String })
  lastShip?: string;

  @Prop({ type: Date })
  lastShipAt?: Date;

  @Prop({ type: Number, default: 0 })
  trendingScore: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // TIMESTAMPS (auto-managed by Mongoose)
  // ─────────────────────────────────────────────────────────────────────────────

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ visibility: 1, 'settings.isListed': 1 });
ProjectSchema.index({ status: 1, updatedAt: -1 });
ProjectSchema.index({ trendingScore: -1, updatedAt: -1 });
ProjectSchema.index({ streakDays: -1 });
ProjectSchema.index({ publicToken: 1 }, { sparse: true });
ProjectSchema.index({ 'invites.token': 1 }, { sparse: true });

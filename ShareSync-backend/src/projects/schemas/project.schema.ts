// src/projects/schemas/project.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SCHEMA - MongoDB/Mongoose schema for projects
// Phase 4: Includes invites support for invites.service.ts
// Lifecycle pass: adds project completion / closeout / reopen support
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
  READY_TO_CLOSE = 'ready_to_close',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  LISTED = 'listed',
  TEAM = 'team',
}

export enum ProjectPublicAccessMode {
  NONE = 'none',
  VIEW_ONLY = 'view_only',
  SUGGESTIONS = 'suggestions',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export enum ProjectOutcomeStatus {
  ACHIEVED = 'achieved',
  PARTIALLY_ACHIEVED = 'partially_achieved',
  CANCELED = 'canceled',
}

export enum ProjectClosureDecision {
  BACKLOG = 'backlog',
  DEFER = 'defer',
  CANCEL = 'cancel',
  FOLLOW_UP = 'follow_up',
}

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

  // Human-facing project role label shown in the UI.
  // This is NOT a permission role. Permissions still come from `role`.
  // Examples: "Manager", "Boss", "Developer", "Frontend Lead".
  @Prop({ type: String, trim: true, maxlength: 40, default: '' })
  displayRole?: string;

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
  status: InviteStatus | 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  respondedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  declinedByUserId?: Types.ObjectId;
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

  @Prop({ type: Boolean, default: false })
  discoverable?: boolean;

  @Prop({
    type: String,
    enum: ProjectPublicAccessMode,
    default: ProjectPublicAccessMode.NONE,
  })
  publicAccessMode?: ProjectPublicAccessMode;

  @Prop({
    type: String,
    enum: ProjectPublicAccessMode,
    default: ProjectPublicAccessMode.NONE,
  })
  spectatorMode?: ProjectPublicAccessMode;

  @Prop({ type: Boolean, default: false })
  suggestionsEnabled?: boolean;
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

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId;

  @Prop({ type: String })
  ownerName?: string;

  @Prop({ type: Date })
  targetDate?: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress?: number;

  @Prop({
    type: String,
    enum: ['normal', 'planned', 'in_progress', 'at_risk', 'blocked', 'achieved', 'deferred'],
    default: 'normal',
  })
  status?: 'normal' | 'planned' | 'in_progress' | 'at_risk' | 'blocked' | 'achieved' | 'deferred';

  @Prop({ type: Boolean, default: false })
  blocked?: boolean;

  @Prop({ type: [String], default: [] })
  taskIds?: string[];

  @Prop({ type: Number, default: 0 })
  linkedTaskCount?: number;

  @Prop({ type: Number, default: 0 })
  completedTaskCount?: number;
}

export const ProjectGoalSchema = SchemaFactory.createForClass(ProjectGoal);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CLOSURE CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectClosureChecklist {
  @Prop({ type: Boolean, default: false })
  primaryGoalConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  openWorkResolved: boolean;

  @Prop({ type: Boolean, default: false })
  blockersReviewed: boolean;

  @Prop({ type: Boolean, default: false })
  handoffPrepared: boolean;

  @Prop({ type: Boolean, default: false })
  summaryWritten: boolean;

  @Prop({ type: Boolean, default: false })
  stakeholderSignoff: boolean;
}

export const ProjectClosureChecklistSchema = SchemaFactory.createForClass(ProjectClosureChecklist);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CLOSURE READINESS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectClosureReadiness {
  @Prop({ type: Boolean, default: false })
  isReadyToClose: boolean;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  readinessScore: number;

  @Prop({ type: [String], default: [] })
  blockingReasons: string[];

  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop({ type: Date })
  lastEvaluatedAt?: Date;
}

export const ProjectClosureReadinessSchema = SchemaFactory.createForClass(ProjectClosureReadiness);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT COMPLETION SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class ProjectCompletionSnapshot {
  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String, enum: ProjectOutcomeStatus, default: ProjectOutcomeStatus.ACHIEVED })
  outcomeStatus: ProjectOutcomeStatus;

  @Prop({ type: Number, default: 0 })
  completedTaskCount: number;

  @Prop({ type: Number, default: 0 })
  openTaskCount: number;

  @Prop({ type: Number, default: 0 })
  blockedTaskCount: number;

  @Prop({ type: Number, default: 0 })
  goalsAchievedCount: number;

  @Prop({ type: Number, default: 0 })
  goalsTotalCount: number;

  @Prop({ type: [String], default: [] })
  deferredTaskIds: string[];

  @Prop({ type: [String], default: [] })
  canceledTaskIds: string[];

  @Prop({ type: String, enum: ProjectClosureDecision })
  leftoverDecision?: ProjectClosureDecision;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  followUpProjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const ProjectCompletionSnapshotSchema = SchemaFactory.createForClass(ProjectCompletionSnapshot);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT BRANDING
  // ─────────────────────────────────────────────────────────────────────────────
  // logoUrl is the image/profile-style project logo shown in ProjectAvatar.
  // bannerUrl is the wide visual banner shown on ProjectHome / settings.
  // These are stored as relative upload URLs such as /uploads/project-branding-...
  // so the frontend can resolve them against the backend asset origin.
  @Prop({ type: String, default: '' })
  logoUrl?: string;

  @Prop({ type: String, default: '' })
  bannerUrl?: string;

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

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop({ type: String, maxlength: 5000 })
  closureSummary?: string;

  @Prop({ type: String, enum: ProjectOutcomeStatus })
  outcomeStatus?: ProjectOutcomeStatus;

  @Prop({ type: ProjectClosureChecklistSchema, default: () => ({}) })
  closureChecklist: ProjectClosureChecklist;

  @Prop({ type: ProjectClosureReadinessSchema, default: () => ({}) })
  closureReadiness: ProjectClosureReadiness;

  @Prop({ type: ProjectCompletionSnapshotSchema })
  completionSnapshot?: ProjectCompletionSnapshot;

  @Prop({ type: Date })
  reopenedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reopenedBy?: Types.ObjectId;

  @Prop({ type: String, maxlength: 2000 })
  reopenReason?: string;

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
ProjectSchema.index({ visibility: 1, 'settings.discoverable': 1, status: 1 });
ProjectSchema.index({ status: 1, updatedAt: -1 });
ProjectSchema.index({ trendingScore: -1, updatedAt: -1 });
ProjectSchema.index({ streakDays: -1 });
ProjectSchema.index({ publicToken: 1 }, { sparse: true });
ProjectSchema.index({ 'invites.token': 1 }, { sparse: true });
ProjectSchema.index({ 'closureReadiness.isReadyToClose': 1, status: 1 });

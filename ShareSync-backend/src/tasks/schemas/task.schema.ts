// src/tasks/schemas/task.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK SCHEMA: Core work unit with gamification integration
// - Adds spec-required fields: assignee/reporter dual fields, createdBy, storyPoints,
//   startDate, subtasks, labels as record, richer attachments, etc.
// - Preserves backwards compatibility with existing code/methods/statics
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskType {
  TASK = 'task',
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  SUBTASK = 'subtask',
}

/**
 * CeremonyTier compatibility:
 * - Legacy tiers used in your code: micro/standard/blocking/sprint_goal/project_ship
 * - Spec tiers: none/minor/standard/major/legendary
 *
 * We allow both sets to coexist to avoid migration pain.
 */
export enum CeremonyTier {
  // Legacy
  MICRO = 'micro',
  STANDARD = 'standard',
  BLOCKING = 'blocking',
  SPRINT_GOAL = 'sprint_goal',
  PROJECT_SHIP = 'project_ship',

  // Spec-compatible additions
  NONE = 'none',
  MINOR = 'minor',
  MAJOR = 'major',
  LEGENDARY = 'legendary',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Attachments compatibility:
 * - Legacy fields: fileId/fileName/fileUrl/fileType/fileSize
 * - Spec fields: name/url/type/size
 *
 * We store both. Existing callers keep working.
 */
@Schema({ _id: false })
export class TaskAttachment {
  // Legacy
  @Prop()
  fileId?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileType?: string;

  @Prop()
  fileSize?: number;

  // Spec
  @Prop()
  name?: string;

  @Prop()
  url?: string;

  @Prop()
  type?: string;

  @Prop()
  size?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;
}

@Schema({ _id: false })
export class TaskComment {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;
}

@Schema({ _id: false })
export class TaskTimeLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  minutes: number;

  @Prop()
  description?: string;

  @Prop({ type: Date, default: Date.now })
  loggedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

// Tell TS about our instance methods
export interface TaskMethods {
  calculateXP(): number;
  determineCeremonyTier(): CeremonyTier;
}

// HydratedDocument includes Mongoose doc + our methods
export type TaskDocument = HydratedDocument<Task, TaskMethods>;

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
export class Task {
  // ─────────────────────────────────────────────────────────────────────────────
  // RELATIONSHIPS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Project this task belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'Sprint this task is part of' })
  @Prop({ type: Types.ObjectId, ref: 'Sprint', index: true })
  sprintId?: Types.ObjectId;

  @ApiProperty({ description: 'Milestone/objective this contributes to' })
  @Prop({ type: Types.ObjectId, ref: 'Milestone' })
  milestoneId?: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // BASIC INFO
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Task title', example: 'Implement user authentication' })
  @Prop({ required: true, trim: true, maxlength: 500 })
  title: string;

  @ApiProperty({ description: 'Task description (markdown supported)' })
  @Prop({ trim: true, maxlength: 10000, default: '' })
  description: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // STATUS & CLASSIFICATION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ enum: TaskStatus })
  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.BACKLOG, index: true })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  @Prop({ type: String, enum: TaskPriority, default: TaskPriority.MEDIUM, index: true })
  priority: TaskPriority;

  @ApiProperty({ enum: TaskType })
  @Prop({ type: String, enum: TaskType, default: TaskType.TASK })
  type: TaskType;

  // ─────────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT (DUAL FIELDS FOR COMPATIBILITY)
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Assigned user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assigneeId?: Types.ObjectId;

  // Some code/seed uses `assignee` instead of `assigneeId`
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @ApiProperty({ description: 'Reporter/creator user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  // Some code/seed uses `reporter` instead of `reporterId`
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;

  // Spec-required: createdBy
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULING
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Due date' })
  @Prop({ type: Date, index: true })
  dueDate?: Date;

  @Prop({ type: Date })
  startDate?: Date;

  @ApiProperty({ description: 'Estimated hours' })
  @Prop({ type: Number, default: 0, min: 0 })
  estimatedHours: number;

  @ApiProperty({ description: 'Actual hours spent' })
  @Prop({ type: Number, default: 0, min: 0 })
  actualHours: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // HIERARCHY
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Parent task ID (for subtasks)' })
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  parentId?: Types.ObjectId;

  // Spec wants subtasks as ObjectId array (even if you also use virtual populate)
  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  subtasks: Types.ObjectId[];

  // ─────────────────────────────────────────────────────────────────────────────
  // BLOCKING / DEPENDENCIES
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Is this task blocking others?' })
  @Prop({ type: Boolean, default: false })
  isBlocking: boolean;

  @ApiProperty({ description: 'Number of people/tasks this blocks' })
  @Prop({ type: Number, default: 0 })
  blockingCount: number;

  @ApiProperty({ description: 'Tasks that must be completed before this one' })
  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  blockedBy: Types.ObjectId[];

  @ApiProperty({ description: 'Tasks that this task blocks' })
  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  blocks: Types.ObjectId[];

  // ─────────────────────────────────────────────────────────────────────────────
  // GAMIFICATION (SPEC-COMPATIBLE)
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 1, min: 0 })
  storyPoints: number;

  @ApiProperty({ description: 'XP value for completing this task' })
  @Prop({ type: Number, default: 25, min: 0 })
  xpValue: number;

  @ApiProperty({ description: 'Bonus XP awarded (from variable rewards)' })
  @Prop({ type: Number, default: 0, min: 0 })
  bonusXP: number;

  @ApiProperty({ description: 'Was this a legendary completion?' })
  @Prop({ type: Boolean, default: false })
  isLegendary: boolean;

  /**
   * We accept both legacy tiers and spec tiers.
   * Default stays STANDARD.
   */
  @ApiProperty({ description: 'Ceremony tier when completed' })
  @Prop({
    type: String,
    enum: Object.values(CeremonyTier),
    default: CeremonyTier.STANDARD,
  })
  ceremonyTier: CeremonyTier;

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  /**
   * Spec wants labels: Record<string,string>
   * Keep Map storage but expose as plain object on JSON (fine for frontend)
   */
  @ApiProperty({ description: 'Custom labels (color-coded)' })
  @Prop({ type: Map, of: String, default: {} })
  labels: Map<string, string>;

  @ApiProperty({ description: 'Attachments' })
  @Prop({ type: [TaskAttachment], default: [] })
  attachments: TaskAttachment[];

  @ApiProperty({ description: 'Comments' })
  @Prop({ type: [TaskComment], default: [] })
  comments: TaskComment[];

  @ApiProperty({ description: 'Time logs' })
  @Prop({ type: [TaskTimeLog], default: [] })
  timeLogs: TaskTimeLog[];

  // ─────────────────────────────────────────────────────────────────────────────
  // ORDERING
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Order within status column' })
  @Prop({ type: Number, default: 0 })
  order: number;

  @ApiProperty({ description: 'Order in priority stack' })
  @Prop({ type: Number, default: 0 })
  stackOrder: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPLETION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'When task was completed' })
  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @ApiProperty({ description: 'Who completed the task' })
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  completedBy?: Types.ObjectId | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

// Compound indexes for common queries
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1 });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ sprintId: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });
TaskSchema.index({ projectId: 1, priority: -1, isBlocking: -1, dueDate: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  if (this.status === TaskStatus.DONE) return false;
  return new Date() > this.dueDate;
});

TaskSchema.virtual('isCompleted').get(function () {
  return this.status === TaskStatus.DONE;
});

TaskSchema.virtual('totalXP').get(function () {
  return (this.xpValue || 0) + (this.bonusXP || 0);
});

TaskSchema.virtual('commentCount').get(function () {
  return this.comments?.length || 0;
});

TaskSchema.virtual('attachmentCount').get(function () {
  return this.attachments?.length || 0;
});

// Keep your populate-based subtasks pattern too (optional)
TaskSchema.virtual('subtasksPopulated', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentId',
});

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.methods.calculateXP = function (): number {
  let xp = this.xpValue || 0;

  const priorityMultipliers: Record<string, number> = {
    [TaskPriority.CRITICAL]: 2.0,
    [TaskPriority.HIGH]: 1.5,
    [TaskPriority.MEDIUM]: 1.0,
    [TaskPriority.LOW]: 0.75,
  };
  xp *= priorityMultipliers[this.priority] || 1;

  if (this.isBlocking && this.blockingCount > 0) {
    xp += this.blockingCount * 10;
  }

  if (this.dueDate && this.completedAt && this.completedAt <= this.dueDate) {
    xp *= 1.1;
  }

  // If storyPoints exist, lightly scale (optional but safe)
  if (typeof this.storyPoints === 'number' && this.storyPoints > 1) {
    xp += (this.storyPoints - 1) * 5;
  }

  return Math.round(xp);
};

TaskSchema.methods.determineCeremonyTier = function (): CeremonyTier {
  // Respect explicit tiers if already set to special legacy types
  if (this.ceremonyTier === CeremonyTier.PROJECT_SHIP) return CeremonyTier.PROJECT_SHIP;
  if (this.ceremonyTier === CeremonyTier.SPRINT_GOAL) return CeremonyTier.SPRINT_GOAL
  if (this.ceremonyTier === CeremonyTier.LEGENDARY) return CeremonyTier.LEGENDARY;

  if (this.isLegendary) return CeremonyTier.LEGENDARY;

  if (this.isBlocking && this.blockingCount >= 2) return CeremonyTier.BLOCKING;
  if (this.priority === TaskPriority.CRITICAL) return CeremonyTier.BLOCKING;
  if (this.estimatedHours && this.estimatedHours < 0.5) return CeremonyTier.MICRO;

  return CeremonyTier.STANDARD;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC METHODS (kept from your prior file)
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.statics.findPriorityStack = function (
  projectId: string,
  assigneeId?: string,
  limit: number = 10,
) {
  const query: any = {
    projectId: new Types.ObjectId(projectId),
    status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
  };

  if (assigneeId) query.assigneeId = new Types.ObjectId(assigneeId);

  return this.find(query)
    .sort({ priority: -1, isBlocking: -1, stackOrder: 1, dueDate: 1 })
    .limit(limit);
};

TaskSchema.statics.findKanbanBoard = function (projectId: string, sprintId?: string) {
  const query: any = { projectId: new Types.ObjectId(projectId) };
  if (sprintId) query.sprintId = new Types.ObjectId(sprintId);
  return this.find(query).sort({ order: 1 });
};

TaskSchema.statics.findBlockingTasks = function (projectId: string) {
  return this.find({
    projectId: new Types.ObjectId(projectId),
    isBlocking: true,
    status: { $ne: TaskStatus.DONE },
  }).sort({ blockingCount: -1 });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.pre('save', function (next) {
  const doc = this as any;

  // Ensure dual-field assignment compatibility if only one is set
  if (doc.assigneeId && !doc.assignee) doc.assignee = doc.assigneeId;
  if (doc.assignee && !doc.assigneeId) doc.assigneeId = doc.assignee;

  if (doc.reporterId && !doc.reporter) doc.reporter = doc.reporterId;
  if (doc.reporter && !doc.reporterId) doc.reporterId = doc.reporter;

  // Keep ceremony tier + XP derived values consistent
  if (doc.isModified('status') || doc.isModified('priority') || doc.isModified('isBlocking') || doc.isModified('blockingCount') || doc.isModified('isLegendary')) {
    doc.ceremonyTier = doc.determineCeremonyTier();
  }

  if (doc.isModified('priority') || doc.isModified('isBlocking') || doc.isModified('blockingCount') || doc.isModified('storyPoints') || doc.isModified('xpValue')) {
    doc.xpValue = doc.calculateXP();
  }

  // Auto-complete timestamp when moved to DONE
  if (doc.isModified('status') && doc.status === TaskStatus.DONE && !doc.completedAt) {
    doc.completedAt = new Date();
  }

  next();
});

// src/tasks/schemas/task.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK SCHEMA: Core work unit with gamification integration
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

export enum CeremonyTier {
  MICRO = 'micro',
  STANDARD = 'standard',
  BLOCKING = 'blocking',
  SPRINT_GOAL = 'sprint_goal',
  PROJECT_SHIP = 'project_ship',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class TaskAttachment {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  fileType: string;

  @Prop()
  fileSize: number;

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
      // ret is typed narrowly by Mongoose; use any to safely add fields
      (ret as any).id = (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Task {
  // ─────────────────────────────────────────────────────────────────────────────
  // BASIC INFO
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Task title', example: 'Implement user authentication' })
  @Prop({ required: true, trim: true, maxlength: 500 })
  title: string;

  @ApiProperty({ description: 'Task description (markdown supported)' })
  @Prop({ trim: true, maxlength: 10000, default: '' })
  description: string;

  @ApiProperty({ description: 'Project this task belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

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
  // ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Assigned user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assigneeId?: Types.ObjectId;

  @ApiProperty({ description: 'Reporter/creator user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // HIERARCHY
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Parent task ID (for subtasks)' })
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  parentId?: Types.ObjectId;

  @ApiProperty({ description: 'Sprint this task is part of' })
  @Prop({ type: Types.ObjectId, ref: 'Sprint', index: true })
  sprintId?: Types.ObjectId;

  @ApiProperty({ description: 'Milestone/objective this contributes to' })
  @Prop({ type: Types.ObjectId, ref: 'Milestone' })
  milestoneId?: Types.ObjectId;

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
  // TIME TRACKING
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Due date' })
  @Prop({ type: Date })
  dueDate?: Date;

  @ApiProperty({ description: 'Estimated hours' })
  @Prop({ type: Number, min: 0 })
  estimatedHours?: number;

  @ApiProperty({ description: 'Actual hours spent' })
  @Prop({ type: Number, default: 0, min: 0 })
  actualHours: number;

  @ApiProperty({ description: 'Time logs' })
  @Prop({ type: [TaskTimeLog], default: [] })
  timeLogs: TaskTimeLog[];

  // ─────────────────────────────────────────────────────────────────────────────
  // GAMIFICATION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'XP value for completing this task' })
  @Prop({ type: Number, default: 25, min: 0 })
  xpValue: number;

  @ApiProperty({ description: 'Ceremony tier when completed', enum: CeremonyTier })
  @Prop({ type: String, enum: CeremonyTier, default: CeremonyTier.STANDARD })
  ceremonyTier: CeremonyTier;

  @ApiProperty({ description: 'Bonus XP awarded (from variable rewards)' })
  @Prop({ type: Number, default: 0 })
  bonusXP: number;

  @ApiProperty({ description: 'Was this a legendary completion?' })
  @Prop({ type: Boolean, default: false })
  isLegendary: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'Custom labels (color-coded)' })
  @Prop({ type: Map, of: String, default: {} })
  labels: Map<string, string>;

  @ApiProperty({ description: 'Attachments' })
  @Prop({ type: [TaskAttachment], default: [] })
  attachments: TaskAttachment[];

  @ApiProperty({ description: 'Comments' })
  @Prop({ type: [TaskComment], default: [] })
  comments: TaskComment[];

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
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiProperty({ description: 'Who completed the task' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.index({ projectId: 1, status: 1 }); // Kanban board
TaskSchema.index({ projectId: 1, assigneeId: 1 }); // My tasks in project
TaskSchema.index({ projectId: 1, priority: -1, stackOrder: 1 }); // Priority stack
TaskSchema.index({ projectId: 1, sprintId: 1, status: 1 }); // Sprint board
TaskSchema.index({ assigneeId: 1, status: 1 }); // user's tasks across projects
TaskSchema.index({ dueDate: 1, status: 1 }); // due date queries
TaskSchema.index({ title: 'text', description: 'text' }); // full-text search
TaskSchema.index({ projectId: 1, isBlocking: 1, status: 1 }); // blocking tasks

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
  return this.xpValue + this.bonusXP;
});

TaskSchema.virtual('commentCount').get(function () {
  return this.comments?.length || 0;
});

TaskSchema.virtual('attachmentCount').get(function () {
  return this.attachments?.length || 0;
});

TaskSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentId',
});

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

TaskSchema.methods.calculateXP = function (): number {
  let xp = this.xpValue;

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

  return Math.round(xp);
};

TaskSchema.methods.determineCeremonyTier = function (): CeremonyTier {
  if (this.ceremonyTier === CeremonyTier.PROJECT_SHIP) return CeremonyTier.PROJECT_SHIP;
  if (this.ceremonyTier === CeremonyTier.SPRINT_GOAL) return CeremonyTier.SPRINT_GOAL;

  if (this.isBlocking && this.blockingCount >= 2) return CeremonyTier.BLOCKING;
  if (this.priority === TaskPriority.CRITICAL) return CeremonyTier.BLOCKING;
  if (this.estimatedHours && this.estimatedHours < 0.5) return CeremonyTier.MICRO;

  return CeremonyTier.STANDARD;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC METHODS
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
  // `this` is a Mongoose document at runtime
  const doc = this as any;

  if (doc.isModified('status') || doc.isModified('priority') || doc.isModified('isBlocking')) {
    doc.ceremonyTier = doc.determineCeremonyTier();
  }

  if (doc.isModified('priority') || doc.isModified('isBlocking') || doc.isModified('blockingCount')) {
    doc.xpValue = doc.calculateXP();
  }

  if (doc.isModified('status') && doc.status === TaskStatus.DONE && !doc.completedAt) {
    doc.completedAt = new Date();
  }

  next();
});

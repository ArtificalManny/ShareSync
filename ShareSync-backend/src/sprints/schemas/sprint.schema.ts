// src/sprints/schemas/sprint.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum SprintStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class SprintGoal {
  @Prop({ required: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  isAchieved: boolean;

  @Prop({ type: Number, default: 0 })
  progress: number;
}

@Schema({ _id: false })
export class SprintMetrics {
  @Prop({ type: Number, default: 0 })
  plannedPoints: number;

  @Prop({ type: Number, default: 0 })
  completedPoints: number;

  @Prop({ type: Number, default: 0 })
  plannedTasks: number;

  @Prop({ type: Number, default: 0 })
  completedTasks: number;

  @Prop({ type: Number, default: 0 })
  addedPoints: number;

  @Prop({ type: Number, default: 0 })
  addedTasks: number;

  @Prop({ type: Number, default: 0 })
  removedPoints: number;

  @Prop({ type: Number, default: 0 })
  velocity: number;

  @Prop({ type: Number, default: 0 })
  capacityUtilization: number;

  @Prop({ type: Number, default: 0 })
  avgTaskCompletionTime: number;

  @Prop({ type: Number, default: 0 })
  blockedTaskCount: number;
}

@Schema({ _id: false })
export class BurndownPoint {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Number, default: 0 })
  remainingPoints: number;

  @Prop({ type: Number, default: 0 })
  remainingTasks: number;

  @Prop({ type: Number, default: 0 })
  completedPoints: number;

  @Prop({ type: Number, default: 0 })
  completedTasks: number;

  @Prop({ type: Number, default: 0 })
  addedPoints: number;

  @Prop({ type: Number, default: 0 })
  addedTasks: number;
}

@Schema({ _id: false })
export class SprintRetrospective {
  @Prop({ type: [String], default: [] })
  wentWell: string[];

  @Prop({ type: [String], default: [] })
  needsImprovement: string[];

  @Prop({ type: [String], default: [] })
  actionItems: string[];

  @Prop({ type: Number, min: 1, max: 5 })
  teamMorale?: number;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  completedAt?: Date;
}

/**
 * ✅ Additive meta: optional helpers for burndown/projection without changing logic.
 * Safe to populate from service or computed later.
 */
@Schema({ _id: false })
export class SprintBurndownMeta {
  @Prop({ type: Date })
  lastCalculatedAt?: Date;

  @Prop({ type: Date })
  projectedCompletion?: Date;

  @Prop({ type: Number, default: 0 })
  projectedDaysRemaining?: number;
}

/**
 * ✅ Additive meta: optional summary field for retro.
 * (Use later for AI summary or team-written summary.)
 */
@Schema({ _id: false })
export class SprintRetrospectiveSummary {
  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  keyWins?: string[];

  @Prop({ type: [String], default: [] })
  keyRisks?: string[];
}

export type SprintDocument = Sprint & Document & {
  addTask(taskId: Types.ObjectId): boolean;
  removeTask(taskId: Types.ObjectId): boolean;
  addBurndownPoint(point: Partial<BurndownPoint>): void;
  updateGoalProgress(goalIndex: number, progress: number): void;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Sprint {
  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ type: Number, required: true })
  sprintNumber: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @ApiProperty({ enum: SprintStatus })
  @Prop({ type: String, enum: SprintStatus, default: SprintStatus.PLANNING, index: true })
  status: SprintStatus;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Date })
  actualStartDate?: Date;

  @Prop({ type: Date })
  actualEndDate?: Date;

  @Prop({ type: [SprintGoal], default: [] })
  goals: SprintGoal[];

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  taskIds: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  capacityHours: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  teamMembers: Types.ObjectId[];

  @Prop({ type: SprintMetrics, default: () => ({}) })
  metrics: SprintMetrics;

  @Prop({ type: [BurndownPoint], default: [] })
  burndown: BurndownPoint[];

  @Prop({ type: SprintBurndownMeta, default: () => ({}) })
  burndownMeta?: SprintBurndownMeta;

  @Prop({ type: SprintRetrospective })
  retrospective?: SprintRetrospective;

  @Prop({ type: SprintRetrospectiveSummary, default: () => ({}) })
  retrospectiveSummary?: SprintRetrospectiveSummary;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);

// Indexes
SprintSchema.index({ projectId: 1, status: 1 });
SprintSchema.index({ projectId: 1, sprintNumber: 1 }, { unique: true });
SprintSchema.index({ projectId: 1, startDate: 1 });
SprintSchema.index({ status: 1, endDate: 1 });

// Virtuals
SprintSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
});

SprintSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate || this.status === SprintStatus.COMPLETED) return 0;
  const remaining = Math.ceil((this.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
});

SprintSchema.virtual('progress').get(function () {
  if (!this.metrics?.plannedTasks) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.plannedTasks) * 100);
});

SprintSchema.virtual('isOverdue').get(function () {
  return this.status === SprintStatus.ACTIVE && this.endDate < new Date();
});

SprintSchema.virtual('taskCount').get(function () {
  return this.taskIds?.length || 0;
});

// Instance Methods
SprintSchema.methods.addTask = function (taskId: Types.ObjectId): boolean {
  if (!this.taskIds.some((id: Types.ObjectId) => id.equals(taskId))) {
    this.taskIds.push(taskId);
    return true;
  }
  return false;
};

SprintSchema.methods.removeTask = function (taskId: Types.ObjectId): boolean {
  const index = this.taskIds.findIndex((id: Types.ObjectId) => id.equals(taskId));
  if (index > -1) {
    this.taskIds.splice(index, 1);
    return true;
  }
  return false;
};

SprintSchema.methods.addBurndownPoint = function (point: Partial<BurndownPoint>): void {
  this.burndown.push({
    date: point.date || new Date(),
    remainingPoints: point.remainingPoints || 0,
    remainingTasks: point.remainingTasks || 0,
    completedPoints: point.completedPoints || 0,
    completedTasks: point.completedTasks || 0,
    addedPoints: point.addedPoints || 0,
    addedTasks: point.addedTasks || 0,
  });
};

SprintSchema.methods.updateGoalProgress = function (goalIndex: number, progress: number): void {
  if (this.goals && this.goals[goalIndex]) {
    this.goals[goalIndex].progress = Math.min(100, Math.max(0, progress));
    this.goals[goalIndex].isAchieved = progress >= 100;
  }
};

// Static Methods
SprintSchema.statics.findActiveSprint = function (projectId: Types.ObjectId) {
  return this.findOne({ projectId, status: SprintStatus.ACTIVE });
};

SprintSchema.statics.getNextSprintNumber = async function (projectId: Types.ObjectId): Promise<number> {
  const lastSprint = await this.findOne({ projectId }).sort({ sprintNumber: -1 });
  return (lastSprint?.sprintNumber || 0) + 1;
};

SprintSchema.statics.getProjectVelocity = async function (projectId: Types.ObjectId, count: number = 5) {
  const sprints = await this.find({
    projectId,
    status: SprintStatus.COMPLETED,
  })
    .sort({ endDate: -1 })
    .limit(count);

  if (sprints.length === 0) return 0;

  const totalVelocity = sprints.reduce((sum: number, s: any) => sum + (s.metrics?.velocity || 0), 0);
  return Math.round(totalVelocity / sprints.length);
};

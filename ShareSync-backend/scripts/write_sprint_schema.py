#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/sprints/schemas/sprint.schema.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

SPRINT_SCHEMA = r'''// src/sprints/schemas/sprint.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT SCHEMA
// Backend source of truth for project execution cycles.
//
// Safe first-pass purpose:
// - Store one or more sprints per project.
// - Support "current sprint" and "active sprint" queries.
// - Track goals, task membership, burndown data, and summary metrics.
// - Keep the schema additive and isolated from tasks/projects for now.
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Model, Types } from 'mongoose';

export enum SprintStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class SprintGoal {
  @ApiPropertyOptional()
  @Prop({ trim: true })
  title?: string;

  @ApiPropertyOptional()
  @Prop({ trim: true })
  description?: string;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  isAchieved: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress: number;

  @ApiPropertyOptional()
  @Prop({ type: String, default: 'active', trim: true })
  status?: string;
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

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Date })
  completedAt?: Date;
}

@Schema({ _id: false })
export class SprintBurndownMeta {
  @Prop({ type: Date })
  lastCalculatedAt?: Date;

  @Prop({ type: Date })
  projectedCompletion?: Date;

  @Prop({ type: Number, default: 0 })
  projectedDaysRemaining?: number;
}

@Schema({ _id: false })
export class SprintRetrospectiveSummary {
  @Prop({ trim: true })
  summary?: string;

  @Prop({ type: [String], default: [] })
  keyWins?: string[];

  @Prop({ type: [String], default: [] })
  keyRisks?: string[];
}

export type SprintDocument = Sprint &
  Document & {
    addTask(taskId: Types.ObjectId): boolean;
    removeTask(taskId: Types.ObjectId): boolean;
    addBurndownPoint(point: Partial<BurndownPoint>): void;
    updateGoalProgress(goalIndex: number, progress: number): void;
  };

export interface SprintModel extends Model<SprintDocument> {
  findActiveSprint(projectId: Types.ObjectId): Promise<SprintDocument | null>;
  getNextSprintNumber(projectId: Types.ObjectId): Promise<number>;
  getProjectVelocity(projectId: Types.ObjectId, count?: number): Promise<number>;
}

@Schema({
  timestamps: true,
  collection: 'sprints',
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
})
export class Sprint {
  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ type: Number, required: true, min: 1 })
  sprintNumber: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @ApiProperty({ enum: SprintStatus })
  @Prop({
    type: String,
    enum: SprintStatus,
    default: SprintStatus.PLANNING,
    index: true,
  })
  status: SprintStatus;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  startDate: Date;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  endDate: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  actualStartDate?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  actualEndDate?: Date;

  @ApiPropertyOptional({ type: [SprintGoal] })
  @Prop({ type: [SprintGoal], default: [] })
  goals: SprintGoal[];

  @ApiPropertyOptional()
  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  taskIds: Types.ObjectId[];

  @ApiPropertyOptional()
  @Prop({ type: Number, default: 0, min: 0 })
  capacityHours: number;

  @ApiPropertyOptional()
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  teamMembers: Types.ObjectId[];

  @ApiPropertyOptional()
  @Prop({ type: SprintMetrics, default: () => ({}) })
  metrics: SprintMetrics;

  @ApiPropertyOptional({ type: [BurndownPoint] })
  @Prop({ type: [BurndownPoint], default: [] })
  burndown: BurndownPoint[];

  @ApiPropertyOptional()
  @Prop({ type: SprintBurndownMeta, default: () => ({}) })
  burndownMeta?: SprintBurndownMeta;

  @ApiPropertyOptional()
  @Prop({ type: SprintRetrospective })
  retrospective?: SprintRetrospective;

  @ApiPropertyOptional()
  @Prop({ type: SprintRetrospectiveSummary, default: () => ({}) })
  retrospectiveSummary?: SprintRetrospectiveSummary;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({ trim: true })
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

SprintSchema.index({ projectId: 1, status: 1 });
SprintSchema.index({ projectId: 1, sprintNumber: 1 }, { unique: true });
SprintSchema.index({ projectId: 1, startDate: 1 });
SprintSchema.index({ status: 1, endDate: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────────────────────────────────────

SprintSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;

  return Math.ceil(
    (this.endDate.getTime() - this.startDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );
});

SprintSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate || this.status === SprintStatus.COMPLETED) return 0;

  const remaining = Math.ceil(
    (this.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(0, remaining);
});

SprintSchema.virtual('progress').get(function () {
  if (!this.metrics?.plannedTasks) return 0;

  return Math.round(
    (this.metrics.completedTasks / this.metrics.plannedTasks) * 100,
  );
});

SprintSchema.virtual('isOverdue').get(function () {
  return this.status === SprintStatus.ACTIVE && this.endDate < new Date();
});

SprintSchema.virtual('taskCount').get(function () {
  return this.taskIds?.length || 0;
});

// ─────────────────────────────────────────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────────────────────────────────────────

SprintSchema.methods.addTask = function (taskId: Types.ObjectId): boolean {
  if (!this.taskIds.some((id: Types.ObjectId) => id.equals(taskId))) {
    this.taskIds.push(taskId);
    return true;
  }

  return false;
};

SprintSchema.methods.removeTask = function (taskId: Types.ObjectId): boolean {
  const index = this.taskIds.findIndex((id: Types.ObjectId) =>
    id.equals(taskId),
  );

  if (index > -1) {
    this.taskIds.splice(index, 1);
    return true;
  }

  return false;
};

SprintSchema.methods.addBurndownPoint = function (
  point: Partial<BurndownPoint>,
): void {
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

SprintSchema.methods.updateGoalProgress = function (
  goalIndex: number,
  progress: number,
): void {
  if (this.goals && this.goals[goalIndex]) {
    const safeProgress = Math.min(100, Math.max(0, progress));

    this.goals[goalIndex].progress = safeProgress;
    this.goals[goalIndex].isAchieved = safeProgress >= 100;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Static Methods
// ─────────────────────────────────────────────────────────────────────────────

SprintSchema.statics.findActiveSprint = function (projectId: Types.ObjectId) {
  return this.findOne({
    projectId,
    status: SprintStatus.ACTIVE,
  });
};

SprintSchema.statics.getNextSprintNumber = async function (
  projectId: Types.ObjectId,
): Promise<number> {
  const lastSprint = await this.findOne({ projectId }).sort({
    sprintNumber: -1,
  });

  return (lastSprint?.sprintNumber || 0) + 1;
};

SprintSchema.statics.getProjectVelocity = async function (
  projectId: Types.ObjectId,
  count: number = 5,
): Promise<number> {
  const sprints = await this.find({
    projectId,
    status: SprintStatus.COMPLETED,
  })
    .sort({ endDate: -1 })
    .limit(count);

  if (sprints.length === 0) return 0;

  const totalVelocity = sprints.reduce(
    (sum: number, sprint: SprintDocument) =>
      sum + (sprint.metrics?.velocity || 0),
    0,
  );

  return Math.round(totalVelocity / sprints.length);
};
'''

def fail(message: str):
    print(f"\n[write_sprint_schema] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[write_sprint_schema] starting")

    if not ROOT.exists():
        fail(f"Backend root does not exist: {ROOT}")

    TARGET.parent.mkdir(parents=True, exist_ok=True)

    if TARGET.exists():
        backup_path = TARGET.with_name(f"{TARGET.name}.bak-sprint-schema-{STAMP}")
        backup_path.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"[write_sprint_schema] backup created: {backup_path}")

    TARGET.write_text(SPRINT_SCHEMA, encoding="utf-8")
    print(f"[write_sprint_schema] wrote: {TARGET}")

    required = [
        "export enum SprintStatus",
        "export class SprintGoal",
        "export class SprintMetrics",
        "export type SprintDocument",
        "export interface SprintModel",
        "export const SprintSchema = SchemaFactory.createForClass(Sprint)",
        "SprintSchema.statics.findActiveSprint",
        "SprintSchema.statics.getNextSprintNumber",
        "SprintSchema.statics.getProjectVelocity",
    ]

    written = TARGET.read_text(encoding="utf-8")
    for marker in required:
        if marker not in written:
            fail(f"Safety check failed. Missing marker: {marker}")

    print("")
    print("[write_sprint_schema] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SprintStatus|SprintModel|SprintSchema|findActiveSprint|getNextSprintNumber|getProjectVelocity\" src/sprints/schemas/sprint.schema.ts -C 4")
    print("  git diff -- src/sprints/schemas/sprint.schema.ts")

if __name__ == "__main__":
    main()

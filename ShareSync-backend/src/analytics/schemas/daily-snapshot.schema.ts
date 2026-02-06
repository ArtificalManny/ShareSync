// src/analytics/schemas/daily-snapshot.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DAILY SNAPSHOT SCHEMA: Point-in-time project metrics
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DailySnapshotDocument = DailySnapshot & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class DailySnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  // Task metrics
  @Prop({ type: Number, default: 0 })
  totalTasks: number;

  @Prop({ type: Number, default: 0 })
  completedTasks: number;

  @Prop({ type: Number, default: 0 })
  inProgressTasks: number;

  @Prop({ type: Number, default: 0 })
  blockedTasks: number;

  @Prop({ type: Number, default: 0 })
  overdueTasks: number;

  @Prop({ type: Number, default: 0 })
  tasksCreated: number;

  @Prop({ type: Number, default: 0 })
  tasksCompleted: number;

  // Points/effort metrics
  @Prop({ type: Number, default: 0 })
  totalPoints: number;

  @Prop({ type: Number, default: 0 })
  completedPoints: number;

  @Prop({ type: Number, default: 0 })
  remainingPoints: number;

  // Team metrics
  @Prop({ type: Number, default: 0 })
  activeMembers: number;

  @Prop({ type: Number, default: 0 })
  totalXPEarned: number;

  // Sprint metrics (if active)
  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  activeSprintId?: Types.ObjectId;

  @Prop({ type: Number })
  sprintProgress?: number;

  @Prop({ type: Number })
  sprintDaysRemaining?: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DailySnapshotSchema = SchemaFactory.createForClass(DailySnapshot);

// Unique constraint: one snapshot per project per day
DailySnapshotSchema.index({ projectId: 1, date: 1 }, { unique: true });

// Query indexes
DailySnapshotSchema.index({ projectId: 1, date: -1 });

// TTL: Keep 365 days of data
DailySnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

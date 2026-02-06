// src/analytics/schemas/event-log.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LOG SCHEMA: Detailed activity tracking for analytics
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventType {
  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_ASSIGNED = 'task.assigned',
  TASK_MOVED = 'task.moved',
  TASK_BLOCKED = 'task.blocked',
  TASK_UNBLOCKED = 'task.unblocked',

  // Sprint events
  SPRINT_STARTED = 'sprint.started',
  SPRINT_COMPLETED = 'sprint.completed',
  SPRINT_GOAL_ACHIEVED = 'sprint.goal_achieved',

  // Project events
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_COMPLETED = 'project.completed',
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',

  // Gamification events
  XP_EARNED = 'xp.earned',
  LEVEL_UP = 'level.up',
  BADGE_EARNED = 'badge.earned',
  STREAK_MILESTONE = 'streak.milestone',
  LEGENDARY_HIT = 'legendary.hit',

  // Focus events
  FOCUS_SESSION_STARTED = 'focus.started',
  FOCUS_SESSION_ENDED = 'focus.ended',
}

export type EventLogDocument = EventLog & Document;

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
export class EventLog {
  @Prop({ type: String, enum: EventType, required: true, index: true })
  type: EventType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  sprintId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Number })
  value?: number; // For numeric events (XP earned, points, etc.)

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);

// Indexes for analytics queries
EventLogSchema.index({ projectId: 1, type: 1, timestamp: -1 });
EventLogSchema.index({ userId: 1, type: 1, timestamp: -1 });
EventLogSchema.index({ timestamp: -1, type: 1 });

// TTL: Keep 90 days of detailed logs
EventLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

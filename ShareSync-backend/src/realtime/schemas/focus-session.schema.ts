/**
 * focus-session.schema.ts
 * MongoDB schema for focus sessions (deep work tracking)
 * 
 * Tracks:
 * - Session duration and breaks
 * - Tasks worked on during focus
 * - Interruptions and quality metrics
 * - XP earned from focused work
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FocusSessionDocument = FocusSession & Document & FocusSessionMethods;

/**
 * Session Status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Session Type
 */
export enum SessionType {
  POMODORO = 'pomodoro',      // 25 min work, 5 min break
  DEEP_WORK = 'deep_work',    // 90 min deep focus
  SPRINT = 'sprint',          // Time-boxed sprint
  CUSTOM = 'custom',          // User-defined duration
}

/**
 * Instance Methods Interface (for TypeScript)
 */
export interface FocusSessionMethods {
  start(): Promise<FocusSessionDocument>;
  pause(): Promise<FocusSessionDocument>;
  resume(): Promise<FocusSessionDocument>;
  complete(data?: {
    qualityRating?: number;
    focusLevel?: number;
    goalAchieved?: boolean;
    notes?: string;
  }): Promise<FocusSessionDocument>;
  cancel(reason?: string): Promise<FocusSessionDocument>;
  recordInterruption(): Promise<FocusSessionDocument>;
  addTask(taskId: Types.ObjectId): Promise<FocusSessionDocument>;
  completeTask(): Promise<FocusSessionDocument>;
  calculateXP(): number;
  getDuration(): number;
  getRemainingTime(): number;
  isExpired(): boolean;
}

/**
 * Focus Session Schema
 */
@Schema({ 
  timestamps: true,
  collection: 'focus_sessions',
})
export class FocusSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ type: String, enum: SessionType, default: SessionType.DEEP_WORK })
  type: SessionType;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.ACTIVE, index: true })
  status: SessionStatus;

  // ============================================
  // TIMING
  // ============================================

  @Prop({ type: Date, required: true, default: Date.now })
  startTime: Date;

  @Prop({ type: Date })
  endTime?: Date;

  @Prop({ type: Number, required: true }) // Duration in minutes
  plannedDuration: number;

  @Prop({ type: Number, default: 0 }) // Actual work time in minutes
  actualDuration: number;

  @Prop({ type: Date })
  pausedAt?: Date;

  @Prop({ type: Number, default: 0 }) // Total pause time in minutes
  totalPauseTime: number;

  // ============================================
  // WORK TRACKING
  // ============================================

  @Prop({ type: String })
  goal?: string; // What user wants to accomplish

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  tasksWorkedOn: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  tasksCompleted: number;

  @Prop({ type: [String], default: [] })
  notes: string[];

  // ============================================
  // QUALITY METRICS
  // ============================================

  @Prop({ type: Number, default: 0 })
  interruptions: number;

  @Prop({ type: Number, min: 1, max: 5 })
  qualityRating?: number; // 1-5 stars

  @Prop({ type: Number, min: 1, max: 10 })
  focusLevel?: number; // 1-10 self-assessment

  @Prop({ type: Boolean, default: false })
  goalAchieved: boolean;

  // ============================================
  // GAMIFICATION
  // ============================================

  @Prop({ type: Number, default: 0 })
  xpEarned: number;

  @Prop({ type: String })
  badge?: string; // e.g., "Deep Work Champion"

  // ============================================
  // METADATA
  // ============================================

  @Prop({ type: Object })
  metadata?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    environment?: string;
    energyLevel?: number; // 1-10
    [key: string]: any;
  };
}

export const FocusSessionSchema = SchemaFactory.createForClass(FocusSession);

// ============================================
// INDEXES
// ============================================

FocusSessionSchema.index({ userId: 1, startTime: -1 });
FocusSessionSchema.index({ status: 1, userId: 1 });
FocusSessionSchema.index({ projectId: 1, startTime: -1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Start the session
 */
FocusSessionSchema.methods.start = function(this: FocusSessionDocument) {
  this.status = SessionStatus.ACTIVE;
  this.startTime = new Date();
  return this.save();
};

/**
 * Pause the session
 */
FocusSessionSchema.methods.pause = function(this: FocusSessionDocument) {
  if (this.status !== SessionStatus.ACTIVE) {
    throw new Error('Cannot pause a session that is not active');
  }
  
  this.status = SessionStatus.PAUSED;
  this.pausedAt = new Date();
  return this.save();
};

/**
 * Resume the session
 */
FocusSessionSchema.methods.resume = function(this: FocusSessionDocument) {
  if (this.status !== SessionStatus.PAUSED) {
    throw new Error('Cannot resume a session that is not paused');
  }
  
  if (this.pausedAt) {
    const pauseDuration = (Date.now() - this.pausedAt.getTime()) / (1000 * 60);
    this.totalPauseTime += pauseDuration;
  }
  
  this.status = SessionStatus.ACTIVE;
  this.pausedAt = undefined;
  return this.save();
};

/**
 * Complete the session
 */
FocusSessionSchema.methods.complete = function(
  this: FocusSessionDocument,
  data?: {
    qualityRating?: number;
    focusLevel?: number;
    goalAchieved?: boolean;
    notes?: string;
  }
) {
  this.status = SessionStatus.COMPLETED;
  this.endTime = new Date();
  
  // Calculate actual duration (minus pauses)
  const totalTime = (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
  this.actualDuration = Math.max(0, totalTime - this.totalPauseTime);
  
  // Calculate XP based on duration and quality
  this.xpEarned = this.calculateXP();
  
  // Apply user feedback
  if (data) {
    if (data.qualityRating) this.qualityRating = data.qualityRating;
    if (data.focusLevel) this.focusLevel = data.focusLevel;
    if (data.goalAchieved !== undefined) this.goalAchieved = data.goalAchieved;
    if (data.notes) this.notes.push(data.notes);
  }
  
  return this.save();
};

/**
 * Cancel the session
 */
FocusSessionSchema.methods.cancel = function(this: FocusSessionDocument, reason?: string) {
  this.status = SessionStatus.CANCELLED;
  this.endTime = new Date();
  
  if (reason) {
    this.notes.push(`Cancelled: ${reason}`);
  }
  
  return this.save();
};

/**
 * Record an interruption
 */
FocusSessionSchema.methods.recordInterruption = function(this: FocusSessionDocument) {
  this.interruptions += 1;
  return this.save();
};

/**
 * Add a task to the session
 */
FocusSessionSchema.methods.addTask = function(this: FocusSessionDocument, taskId: Types.ObjectId) {
  if (!this.tasksWorkedOn.includes(taskId)) {
    this.tasksWorkedOn.push(taskId);
  }
  return this.save();
};

/**
 * Mark task as completed in this session
 */
FocusSessionSchema.methods.completeTask = function(this: FocusSessionDocument) {
  this.tasksCompleted += 1;
  return this.save();
};

/**
 * Calculate XP earned
 */
FocusSessionSchema.methods.calculateXP = function(this: FocusSessionDocument): number {
  let xp = 0;
  
  // Base XP: 10 XP per 15 minutes of focused work
  xp += Math.floor(this.actualDuration / 15) * 10;
  
  // Bonus for completing planned duration
  if (this.actualDuration >= this.plannedDuration) {
    xp += 25; // Completion bonus
  }
  
  // Bonus for quality
  if (this.qualityRating) {
    xp += this.qualityRating * 5; // Up to +25 XP
  }
  
  // Bonus for goal achievement
  if (this.goalAchieved) {
    xp += 50;
  }
  
  // Bonus for tasks completed
  xp += this.tasksCompleted * 15;
  
  // Penalty for interruptions
  xp -= this.interruptions * 5;
  
  // Minimum 5 XP
  return Math.max(5, xp);
};

/**
 * Get session duration in minutes
 */
FocusSessionSchema.methods.getDuration = function(this: FocusSessionDocument): number {
  if (this.status === SessionStatus.COMPLETED) {
    return this.actualDuration;
  }
  
  const now = this.status === SessionStatus.PAUSED && this.pausedAt 
    ? this.pausedAt.getTime() 
    : Date.now();
    
  const elapsed = (now - this.startTime.getTime()) / (1000 * 60);
  return Math.max(0, elapsed - this.totalPauseTime);
};

/**
 * Get remaining time in minutes
 */
FocusSessionSchema.methods.getRemainingTime = function(this: FocusSessionDocument): number {
  const duration = this.getDuration();
  return Math.max(0, this.plannedDuration - duration);
};

/**
 * Check if session is expired
 */
FocusSessionSchema.methods.isExpired = function(this: FocusSessionDocument): boolean {
  if (this.status !== SessionStatus.ACTIVE) return false;
  return this.getRemainingTime() <= 0;
};

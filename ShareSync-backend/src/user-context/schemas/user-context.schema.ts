// src/user-context/schemas/user-context.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTEXT SCHEMA: "Welcome Back" Feature
// Tracks user state for seamless session continuity
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class UnfinishedAction {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  context: string;

  @Prop({ type: Types.ObjectId })
  taskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  projectId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

@Schema({ _id: false })
export class RecentCollaborator {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  lastInteraction: Date;

  @Prop({ type: Number, default: 1 })
  interactionCount: number;
}

@Schema({ _id: false })
export class WorkspaceState {
  @Prop({ type: [String], default: [] })
  openTabs: string[];

  // ✅ Use Record for JSON friendliness (avoids Map vs object mismatch)
  @Prop({ type: Object, default: {} })
  scrollPositions: Record<string, number>;

  @Prop()
  activePanel?: string;

  @Prop()
  sidebarExpanded?: boolean;
}

@Schema({ _id: false })
export class FocusSessionRecord {
  @Prop({ type: Date, required: true })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt?: Date;

  @Prop({ type: Number, default: 0 })
  duration: number; // minutes

  @Prop({ type: Number, default: 0 })
  tasksCompleted: number;

  @Prop({ type: Number, default: 0 })
  xpEarned: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE METHOD TYPES (so TS knows schema methods exist)
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserContextMethods {
  addUnfinishedAction(
    action: string,
    context: string,
    taskId?: Types.ObjectId,
    projectId?: Types.ObjectId,
    priority?: number,
  ): void;

  completeUnfinishedAction(action: string): boolean;

  updateCollaborator(userId: Types.ObjectId): void;

  startFocusSession(): void;

  endFocusSession(tasksCompleted?: number, xpEarned?: number): void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type UserContextDocument = HydratedDocument<UserContext, UserContextMethods>;

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
export class UserContext {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop()
  currentView?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  currentProjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  currentTaskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  currentSprintId?: Types.ObjectId;

  @Prop({ type: [UnfinishedAction], default: [] })
  unfinishedActions: UnfinishedAction[];

  @Prop({ type: [RecentCollaborator], default: [] })
  recentCollaborators: RecentCollaborator[];

  @Prop({ type: WorkspaceState, default: () => ({}) })
  workspaceState: WorkspaceState;

  @Prop({ type: Boolean, default: false })
  isInFocusMode: boolean;

  @Prop({ type: Date })
  focusModeStartedAt?: Date;

  @Prop({ type: [FocusSessionRecord], default: [] })
  recentFocusSessions: FocusSessionRecord[];

  @Prop({ type: Number, default: 0 })
  totalFocusMinutesToday: number;

  @Prop({ type: Date, default: Date.now })
  lastActiveAt: Date;

  @Prop({ type: Date })
  sessionStartedAt?: Date;

  @Prop({ type: Number, default: 0 })
  sessionDuration: number;

  @Prop({ type: Number, default: 0 })
  contextSwitches: number;

  @Prop({ type: String, default: 'comfortable' })
  densityPreference: string;

  @Prop({ type: Boolean, default: true })
  soundEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  celebrationsEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UserContextSchema = SchemaFactory.createForClass(UserContext);

// INDEXES
UserContextSchema.index({ userId: 1 }, { unique: true });
UserContextSchema.index({ lastActiveAt: -1 });
UserContextSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// VIRTUALS
UserContextSchema.virtual('hasUnfinishedWork').get(function () {
  return this.unfinishedActions?.length > 0;
});

UserContextSchema.virtual('isActiveSession').get(function () {
  if (!this.lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActiveAt > fiveMinutesAgo;
});

UserContextSchema.virtual('sessionDurationMinutes').get(function () {
  return Math.round(this.sessionDuration / 60);
});

// INSTANCE METHODS
UserContextSchema.methods.addUnfinishedAction = function (
  action: string,
  context: string,
  taskId?: Types.ObjectId,
  projectId?: Types.ObjectId,
  priority: number = 0,
): void {
  if (this.unfinishedActions.length >= 5) {
    this.unfinishedActions.shift();
  }

  this.unfinishedActions.push({
    action,
    context,
    taskId,
    projectId,
    priority,
    timestamp: new Date(),
  });
};

UserContextSchema.methods.completeUnfinishedAction = function (action: string): boolean {
  const index = this.unfinishedActions.findIndex(
    (a: UnfinishedAction) => a.action === action,
  );
  if (index !== -1) {
    this.unfinishedActions.splice(index, 1);
    return true;
  }
  return false;
};

UserContextSchema.methods.updateCollaborator = function (userId: Types.ObjectId): void {
  const existing = this.recentCollaborators.find(
    (c: RecentCollaborator) => c.userId.toString() === userId.toString(),
  );

  if (existing) {
    existing.lastInteraction = new Date();
    existing.interactionCount += 1;
  } else {
    if (this.recentCollaborators.length >= 10) {
      this.recentCollaborators.shift();
    }
    this.recentCollaborators.push({
      userId,
      lastInteraction: new Date(),
      interactionCount: 1,
    });
  }
};

UserContextSchema.methods.startFocusSession = function (): void {
  this.isInFocusMode = true;
  this.focusModeStartedAt = new Date();
};

UserContextSchema.methods.endFocusSession = function (
  tasksCompleted: number = 0,
  xpEarned: number = 0,
): void {
  if (!this.isInFocusMode || !this.focusModeStartedAt) return;

  const duration = Math.round(
    (Date.now() - this.focusModeStartedAt.getTime()) / 60000,
  );

  if (this.recentFocusSessions.length >= 10) {
    this.recentFocusSessions.shift();
  }

  this.recentFocusSessions.push({
    startedAt: this.focusModeStartedAt,
    endedAt: new Date(),
    duration,
    tasksCompleted,
    xpEarned,
  });

  this.totalFocusMinutesToday += duration;
  this.isInFocusMode = false;
  this.focusModeStartedAt = undefined;
};

// STATIC METHODS
UserContextSchema.statics.findOrCreate = async function (
  userId: Types.ObjectId | string,
): Promise<UserContextDocument> {
  let context = await this.findOne({ userId: new Types.ObjectId(userId) });

  if (!context) {
    context = new this({ userId: new Types.ObjectId(userId) });
    await context.save();
  }

  return context;
};

UserContextSchema.statics.findActiveContexts = function (minutes: number = 5) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return this.find({ lastActiveAt: { $gte: cutoff } });
};

UserContextSchema.statics.findWithUnfinishedWork = function () {
  return this.find({ 'unfinishedActions.0': { $exists: true } });
};

// PRE-SAVE HOOKS
UserContextSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();

  if (this.recentFocusSessions.length > 10) {
    this.recentFocusSessions = this.recentFocusSessions.slice(-10);
  }

  if (this.unfinishedActions.length > 5) {
    this.unfinishedActions = this.unfinishedActions.slice(-5);
  }

  if (this.recentCollaborators.length > 10) {
    this.recentCollaborators = this.recentCollaborators.slice(-10);
  }

  next();
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

/**
 * User Context Document Type
 * Extends the UserContext class with Mongoose Document properties
 */
export type UserContextDocument = UserContext & Document;

/**
 * View Types Enum
 * Defines all possible view contexts a user can be in
 */
export enum ViewType {
  HOME = 'home',
  PROJECT = 'project',
  TASK = 'task',
  TEAM = 'team',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  MESSAGES = 'messages',
}

/**
 * Action Priority Enum
 * Categorizes unfinished actions by urgency
 */
export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Unfinished Action Interface
 * Tracks incomplete user actions leveraging the Zeigarnik Effect
 */
export interface UnfinishedAction {
  action: string;           // e.g., "editing-task-title", "composing-message"
  context: string;          // Human-readable context: "Update Q1 Roadmap"
  contextId?: string;       // Optional ID reference (taskId, projectId, etc.)
  priority: ActionPriority; // Urgency level
  timestamp: Date;          // When action was interrupted
  estimatedCompletion?: number; // Estimated minutes to complete
}

/**
 * Focus Session Interface
 * Captures details about user's deep work sessions
 */
export interface FocusSession {
  startedAt: Date;
  endedAt?: Date;
  duration: number;         // in minutes
  taskId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  interruptions: number;    // How many times focus was broken
  completed: boolean;       // Did user finish what they intended?
}

/**
 * Open Tab Interface
 * Tracks user's workspace state
 */
export interface OpenTab {
  route: string;            // e.g., "/projects/123/tasks/456"
  label: string;            // Human-readable: "Design Sprint - Week 2"
  timestamp: Date;          // When tab was opened
  scrollPosition?: number;  // Scroll position on this tab
}

/**
 * Collaboration Context Interface
 * Tracks recent team interactions
 */
export interface CollaboratorContext {
  userId: Types.ObjectId;
  lastInteractionType: 'message' | 'task-assignment' | 'comment' | 'mention';
  lastInteractionAt: Date;
  projectId?: Types.ObjectId;
}

/**
 * UserContext Schema
 * 
 * Comprehensive context tracking for seamless user experience continuity.
 * Implements "Welcome Back" killer feature with zero context-switching friction.
 * 
 * Key Features:
 * - Last active view/project/task restoration
 * - Focus session history and state preservation
 * - Unfinished actions tracking (Zeigarnik Effect)
 * - Recent collaborators and team context
 * - Workspace state (open tabs, scroll positions)
 * - Session analytics and duration tracking
 * 
 * Performance Optimizations:
 * - Indexed on userId (unique, fast lookups)
 * - Indexed on lastActiveAt (TTL for cleanup)
 * - Compound indexes for common queries
 * - Lean documents with selective population
 * 
 * @version 1.0.0
 * @author OpenShare Team
 */
@Schema({ 
  timestamps: true,
  collection: 'user_contexts',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserContext {
  /**
   * User Reference
   * One-to-one relationship with User model
   */
  @ApiProperty({ 
    description: 'User ID reference',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true,
    index: true, // Fast user lookups
  })
  userId: Types.ObjectId;

  // ============================================
  // LAST ACTIVE CONTEXT
  // ============================================

  /**
   * Last Active View
   * The primary view the user was in when they left
   */
  @ApiProperty({ 
    description: 'Last active view type',
    enum: ViewType,
    example: ViewType.PROJECT,
  })
  @Prop({ 
    type: String, 
    enum: Object.values(ViewType), 
    default: ViewType.HOME,
    index: true, // Analytics queries by view type
  })
  lastActiveView: ViewType;

  /**
   * Last Active Project
   * The project the user was working on
   */
  @ApiProperty({ 
    description: 'Last active project ID',
    type: String,
    required: false,
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Project',
    sparse: true, // Allows null values with index
    index: true,  // Fast project context queries
  })
  lastActiveProjectId?: Types.ObjectId;

  /**
   * Last Active Task
   * The specific task the user was engaged with
   */
  @ApiProperty({ 
    description: 'Last active task ID',
    type: String,
    required: false,
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Task',
    sparse: true,
    index: true,
  })
  lastActiveTaskId?: Types.ObjectId;

  /**
   * Last Active Route
   * Full route path for precise restoration
   */
  @ApiProperty({ 
    description: 'Last active route path',
    example: '/projects/123/tasks/456',
  })
  @Prop({ type: String, default: '/home' })
  lastActiveRoute: string;

  // ============================================
  // FOCUS SESSION TRACKING
  // ============================================

  /**
   * Focus Mode State
   * Whether user was in deep work mode when they left
   */
  @ApiProperty({ 
    description: 'Was user in focus mode',
    example: false,
  })
  @Prop({ type: Boolean, default: false })
  wasInFocusMode: boolean;

  /**
   * Current Focus Session
   * Active focus session (if in progress)
   */
  @Prop({ 
    type: {
      startedAt: Date,
      endedAt: Date,
      duration: Number,
      taskId: MongooseSchema.Types.ObjectId,
      projectId: MongooseSchema.Types.ObjectId,
      interruptions: Number,
      completed: Boolean,
    },
    default: null,
  })
  currentFocusSession?: FocusSession;

  /**
   * Focus Session History
   * Last 10 focus sessions for analytics
   */
  @Prop({ 
    type: [{
      startedAt: Date,
      endedAt: Date,
      duration: Number,
      taskId: MongooseSchema.Types.ObjectId,
      projectId: MongooseSchema.Types.ObjectId,
      interruptions: Number,
      completed: Boolean,
    }],
    default: [],
  })
  focusSessionHistory: FocusSession[];

  /**
   * Total Focus Time (Today)
   * Cumulative focus minutes for current day
   */
  @ApiProperty({ 
    description: 'Total focus minutes today',
    example: 120,
  })
  @Prop({ type: Number, default: 0, min: 0 })
  totalFocusMinutesToday: number;

  /**
   * Focus Streak
   * Consecutive days with focus sessions
   */
  @ApiProperty({ 
    description: 'Consecutive days with focus sessions',
    example: 7,
  })
  @Prop({ type: Number, default: 0, min: 0 })
  focusStreak: number;

  // ============================================
  // COLLABORATION CONTEXT
  // ============================================

  /**
   * Recent Collaborators
   * Team members user interacted with recently (max 10)
   */
  @ApiProperty({ 
    description: 'Recent collaborator contexts',
    type: 'array',
  })
  @Prop({ 
    type: [{
      userId: MongooseSchema.Types.ObjectId,
      lastInteractionType: String,
      lastInteractionAt: Date,
      projectId: MongooseSchema.Types.ObjectId,
    }],
    default: [],
  })
  recentCollaborators: CollaboratorContext[];

  /**
   * Active Team Chat
   * Current team conversation context
   */
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Chat',
    sparse: true,
  })
  activeTeamChatId?: Types.ObjectId;

  // ============================================
  // WORKSPACE STATE
  // ============================================

  /**
   * Open Tabs
   * User's workspace tabs (max 10)
   */
  @ApiProperty({ 
    description: 'Open workspace tabs',
    type: 'array',
  })
  @Prop({ 
    type: [{
      route: String,
      label: String,
      timestamp: Date,
      scrollPosition: Number,
    }],
    default: [],
  })
  openTabs: OpenTab[];

  /**
   * Primary Scroll Position
   * Main view scroll position
   */
  @ApiProperty({ 
    description: 'Last scroll position',
    example: 1250,
  })
  @Prop({ type: Number, default: 0, min: 0 })
  lastScrollPosition: number;

  /**
   * Sidebar State
   * Whether sidebar was open/collapsed
   */
  @Prop({ type: Boolean, default: true })
  sidebarOpen: boolean;

  // ============================================
  // UNFINISHED ACTIONS (ZEIGARNIK EFFECT)
  // ============================================

  /**
   * Unfinished Actions
   * Incomplete tasks that create cognitive tension
   * Leverages Zeigarnik Effect for re-engagement
   * Max 5 most recent unfinished actions
   */
  @ApiProperty({ 
    description: 'Unfinished actions awaiting completion',
    type: 'array',
  })
  @Prop({
    type: [{
      action: { type: String, required: true },
      context: { type: String, required: true },
      contextId: String,
      priority: { 
        type: String, 
        enum: Object.values(ActionPriority), 
        default: ActionPriority.MEDIUM,
      },
      timestamp: { type: Date, default: Date.now },
      estimatedCompletion: Number,
    }],
    default: [],
  })
  unfinishedActions: UnfinishedAction[];

  // ============================================
  // SESSION ANALYTICS
  // ============================================

  /**
   * Last Activity Timestamp
   * When user was last active (for TTL cleanup)
   */
  @ApiProperty({ 
    description: 'Last activity timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  @Prop({ 
    type: Date, 
    default: Date.now,
    index: true, // TTL index for cleanup
  })
  lastActiveAt: Date;

  /**
   * Current Session Duration
   * Time spent in current session (seconds)
   */
  @ApiProperty({ 
    description: 'Current session duration in seconds',
    example: 3600,
  })
  @Prop({ type: Number, default: 0, min: 0 })
  sessionDuration: number;

  /**
   * Session Start Time
   * When current session began
   */
  @Prop({ type: Date, default: Date.now })
  sessionStartedAt: Date;

  /**
   * Daily Sessions Count
   * Number of sessions today
   */
  @Prop({ type: Number, default: 0, min: 0 })
  dailySessionsCount: number;

  /**
   * Context Switch Count
   * How many times user switched contexts today
   */
  @Prop({ type: Number, default: 0, min: 0 })
  contextSwitchCount: number;

  // ============================================
  // METADATA
  // ============================================

  /**
   * Device Information
   * Track context per device
   */
  @Prop({ 
    type: {
      platform: String,  // 'web', 'ios', 'android'
      browser: String,
      version: String,
    },
    default: null,
  })
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };

  /**
   * Restore Count
   * How many times context has been restored
   */
  @Prop({ type: Number, default: 0, min: 0 })
  restoreCount: number;

  /**
   * Last Restored At
   * When context was last successfully restored
   */
  @Prop({ type: Date })
  lastRestoredAt?: Date;
}

/**
 * Create Mongoose Schema
 */
export const UserContextSchema = SchemaFactory.createForClass(UserContext);

// ============================================
// INDEXES
// ============================================

/**
 * Compound Indexes for Common Queries
 */
UserContextSchema.index({ userId: 1, lastActiveAt: -1 });
UserContextSchema.index({ lastActiveProjectId: 1, lastActiveAt: -1 });
UserContextSchema.index({ wasInFocusMode: 1, lastActiveAt: -1 });

/**
 * TTL Index - Auto-delete contexts after 90 days of inactivity
 * Keeps database lean and respects user privacy
 */
UserContextSchema.index(
  { lastActiveAt: 1 }, 
  { expireAfterSeconds: 7776000 } // 90 days
);

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Is Active Session
 * Virtual field to check if session is currently active
 */
UserContextSchema.virtual('isActiveSession').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActiveAt > fiveMinutesAgo;
});

/**
 * Has Unfinished Work
 * Virtual field to check if user has pending actions
 */
UserContextSchema.virtual('hasUnfinishedWork').get(function() {
  return this.unfinishedActions && this.unfinishedActions.length > 0;
});

/**
 * Session Duration Minutes
 * Convert session duration to minutes
 */
UserContextSchema.virtual('sessionDurationMinutes').get(function() {
  return Math.floor(this.sessionDuration / 60);
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add Unfinished Action
 * Maintains max 5 most recent unfinished actions
 */
UserContextSchema.methods.addUnfinishedAction = function(
  action: Omit<UnfinishedAction, 'timestamp'>
): void {
  this.unfinishedActions.unshift({
    ...action,
    timestamp: new Date(),
  });
  
  // Keep only 5 most recent
  if (this.unfinishedActions.length > 5) {
    this.unfinishedActions = this.unfinishedActions.slice(0, 5);
  }
};

/**
 * Complete Unfinished Action
 * Remove action from unfinished list
 */
UserContextSchema.methods.completeUnfinishedAction = function(
  actionType: string
): void {
  this.unfinishedActions = this.unfinishedActions.filter(
    (a) => a.action !== actionType
  );
};

/**
 * Update Collaborator Context
 * Add or update recent collaborator (max 10)
 */
UserContextSchema.methods.updateCollaborator = function(
  collaborator: CollaboratorContext
): void {
  const existingIndex = this.recentCollaborators.findIndex(
    (c) => c.userId.toString() === collaborator.userId.toString()
  );
  
  if (existingIndex >= 0) {
    // Update existing collaborator
    this.recentCollaborators[existingIndex] = collaborator;
  } else {
    // Add new collaborator
    this.recentCollaborators.unshift(collaborator);
  }
  
  // Keep only 10 most recent
  if (this.recentCollaborators.length > 10) {
    this.recentCollaborators = this.recentCollaborators.slice(0, 10);
  }
};

/**
 * Start Focus Session
 * Begin tracking a focus session
 */
UserContextSchema.methods.startFocusSession = function(
  taskId?: Types.ObjectId,
  projectId?: Types.ObjectId
): void {
  this.wasInFocusMode = true;
  this.currentFocusSession = {
    startedAt: new Date(),
    duration: 0,
    taskId,
    projectId,
    interruptions: 0,
    completed: false,
  };
};

/**
 * End Focus Session
 * Complete focus session and add to history
 */
UserContextSchema.methods.endFocusSession = function(
  completed: boolean = true
): void {
  if (!this.currentFocusSession) return;
  
  const endTime = new Date();
  const durationMinutes = Math.floor(
    (endTime.getTime() - this.currentFocusSession.startedAt.getTime()) / 60000
  );
  
  const session: FocusSession = {
    ...this.currentFocusSession,
    endedAt: endTime,
    duration: durationMinutes,
    completed,
  };
  
  // Add to history (keep last 10)
  this.focusSessionHistory.unshift(session);
  if (this.focusSessionHistory.length > 10) {
    this.focusSessionHistory = this.focusSessionHistory.slice(0, 10);
  }
  
  // Update totals
  this.totalFocusMinutesToday += durationMinutes;
  
  // Clear current session
  this.wasInFocusMode = false;
  this.currentFocusSession = undefined;
};

/**
 * Update Session Activity
 * Heartbeat to track active session duration
 */
UserContextSchema.methods.updateSessionActivity = function(): void {
  const now = new Date();
  const elapsed = Math.floor(
    (now.getTime() - this.lastActiveAt.getTime()) / 1000
  );
  
  // Only count if within 5 minutes (prevent idle time)
  if (elapsed <= 300) {
    this.sessionDuration += elapsed;
  }
  
  this.lastActiveAt = now;
};

/**
 * Reset Daily Counters
 * Called by cron job at midnight
 */
UserContextSchema.methods.resetDailyCounters = function(): void {
  this.totalFocusMinutesToday = 0;
  this.dailySessionsCount = 0;
  this.contextSwitchCount = 0;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find Active Contexts
 * Get all contexts active in last 5 minutes
 */
UserContextSchema.statics.findActiveContexts = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.find({ lastActiveAt: { $gte: fiveMinutesAgo } });
};

/**
 * Find Contexts With Unfinished Work
 * Get contexts that have pending actions
 */
UserContextSchema.statics.findWithUnfinishedWork = function() {
  return this.find({ 
    'unfinishedActions.0': { $exists: true } 
  });
};

/**
 * Get User Context with Populated Refs
 * Convenience method for common population pattern
 */
UserContextSchema.statics.findByUserIdPopulated = function(userId: Types.ObjectId) {
  return this.findOne({ userId })
    .populate('lastActiveProjectId', 'name icon color')
    .populate('lastActiveTaskId', 'title status priority')
    .populate('recentCollaborators.userId', 'username displayName avatar')
    .populate('activeTeamChatId', 'name participants')
    .exec();
};

// ============================================
// PRE-SAVE HOOKS
// ============================================

/**
 * Pre-save: Validate session duration
 */
UserContextSchema.pre('save', function(next) {
  // Cap session duration at 12 hours (prevent runaway values)
  if (this.sessionDuration > 43200) {
    this.sessionDuration = 43200;
  }
  
  // Cap focus time at 8 hours per day
  if (this.totalFocusMinutesToday > 480) {
    this.totalFocusMinutesToday = 480;
  }
  
  next();
});

/**
 * Pre-save: Track context switches
 */
UserContextSchema.pre('save', function(next) {
  if (this.isModified('lastActiveView') || this.isModified('lastActiveProjectId')) {
    this.contextSwitchCount += 1;
  }
  next();
});

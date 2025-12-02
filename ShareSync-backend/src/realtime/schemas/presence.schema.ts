/**
 * presence.schema.ts
 * MongoDB schema for user presence tracking
 * 
 * Used for:
 * - Online/offline status
 * - Activity tracking
 * - Focus mode state
 * - Project participation
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PresenceDocument = Presence & Document;

/**
 * User Status Type
 */
export enum UserStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  FOCUS = 'focus',
  OFFLINE = 'offline',
}

/**
 * User Mode Type
 */
export enum UserMode {
  TEAM = 'team', // Normal collaborative mode
  GHOST = 'ghost', // Invisible mode
  FOCUS = 'focus', // Deep work mode
  AWAY = 'away', // Away from keyboard
}

/**
 * Presence Schema
 * 
 * Tracks user presence state, activity, and project participation
 */
@Schema({
  timestamps: true,
  collection: 'presence',
})
export class Presence {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: false })
  userAvatar?: string;

  // ============================================
  // STATUS
  // ============================================

  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.ONLINE,
    index: true,
  })
  status: UserStatus;

  @Prop({
    required: true,
    enum: UserMode,
    default: UserMode.TEAM,
    index: true,
  })
  mode: UserMode;

  // ============================================
  // ACTIVITY
  // ============================================

  @Prop({ required: true, default: Date.now, index: true })
  lastActive: Date;

  @Prop({ required: false })
  lastActivityType?: string; // 'cursor' | 'typing' | 'click' | etc.

  @Prop({ required: false, default: 0 })
  activityScore?: number; // 0-100 activity score

  // ============================================
  // LOCATION
  // ============================================

  @Prop({ required: false, type: Types.ObjectId, ref: 'Project' })
  currentProject?: Types.ObjectId;

  @Prop({ required: false })
  currentPage?: string; // URL or page identifier

  @Prop({ required: false })
  currentPageTitle?: string;

  // ============================================
  // SESSION
  // ============================================

  @Prop({ required: false })
  socketId?: string; // Current WebSocket connection ID

  @Prop({ required: false })
  sessionId?: string; // Current session identifier

  @Prop({ required: false })
  connectionCount?: number; // Number of active connections

  // ============================================
  // DEVICE INFO
  // ============================================

  @Prop({ required: false, type: Object })
  device?: {
    type?: string; // 'desktop' | 'mobile' | 'tablet'
    os?: string; // 'macos' | 'windows' | 'linux' | 'ios' | 'android'
    browser?: string; // 'chrome' | 'firefox' | 'safari' | 'edge'
    viewport?: {
      width: number;
      height: number;
    };
  };

  // ============================================
  // PRIVACY SETTINGS
  // ============================================

  @Prop({ required: false, type: Object, default: {} })
  privacySettings?: {
    visibility?: 'everyone' | 'team' | 'nobody'; // Who can see cursor
    showActivity?: boolean; // Show typing/clicking
    showLocation?: boolean; // Show current page
    allowProximity?: boolean; // Allow proximity detection
    allowFocus?: boolean; // Allow focus together
  };

  // ============================================
  // STATISTICS
  // ============================================

  @Prop({ required: false, type: Object })
  stats?: {
    totalSessions?: number;
    totalTimeOnline?: number; // Milliseconds
    averageSessionLength?: number; // Milliseconds
    lastSessionStart?: Date;
    cursorMovements?: number;
    interactions?: number;
  };

  // ============================================
  // METADATA
  // ============================================

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>;

  // ============================================
  // TTL
  // ============================================

  @Prop({
    required: false,
    expires: 60 * 60 * 24 * 7, // Auto-delete after 7 days of inactivity
  })
  expiresAt?: Date;
}

export const PresenceSchema = SchemaFactory.createForClass(Presence);

// ============================================
// INDEXES
// ============================================

PresenceSchema.index({ status: 1, lastActive: -1 });
PresenceSchema.index({ currentProject: 1, status: 1 });
PresenceSchema.index({ mode: 1 });
PresenceSchema.index({ lastActive: -1 });
PresenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ============================================
// VIRTUAL PROPERTIES
// ============================================

PresenceSchema.virtual('isOnline').get(function () {
  return this.status !== UserStatus.OFFLINE;
});

PresenceSchema.virtual('isActive').get(function () {
  const now = Date.now();
  const lastUpdate = this.lastActive.getTime();
  return now - lastUpdate < 300000; // Active within last 5 minutes
});

PresenceSchema.virtual('idleTime').get(function () {
  return Date.now() - this.lastActive.getTime();
});

PresenceSchema.virtual('isVisible').get(function () {
  return this.mode !== UserMode.GHOST;
});

// ============================================
// METHODS
// ============================================

PresenceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  delete obj.socketId; // Don't expose socket ID
  return obj;
};

PresenceSchema.methods.updateActivity = function (activityType?: string) {
  this.lastActive = new Date();
  this.lastActivityType = activityType;
  
  // Update activity score (decay over time)
  const timeSinceLastActivity = Date.now() - this.lastActive.getTime();
  const decayFactor = Math.max(0, 1 - timeSinceLastActivity / 300000); // 5 min decay
  this.activityScore = Math.min(100, (this.activityScore || 0) * decayFactor + 10);
  
  return this.save();
};

PresenceSchema.methods.setOnline = function (socketId?: string, sessionId?: string) {
  this.status = UserStatus.ONLINE;
  this.lastActive = new Date();
  if (socketId) this.socketId = socketId;
  if (sessionId) this.sessionId = sessionId;
  this.connectionCount = (this.connectionCount || 0) + 1;
  
  // Update stats
  if (!this.stats) this.stats = {};
  this.stats.lastSessionStart = new Date();
  this.stats.totalSessions = (this.stats.totalSessions || 0) + 1;
  
  return this.save();
};

PresenceSchema.methods.setOffline = function () {
  const wasOnline = this.status !== UserStatus.OFFLINE;
  this.status = UserStatus.OFFLINE;
  this.socketId = undefined;
  
  // Update session stats
  if (wasOnline && this.stats?.lastSessionStart) {
    const sessionLength = Date.now() - this.stats.lastSessionStart.getTime();
    this.stats.totalTimeOnline = (this.stats.totalTimeOnline || 0) + sessionLength;
    
    const totalSessions = this.stats.totalSessions || 1;
    this.stats.averageSessionLength = this.stats.totalTimeOnline / totalSessions;
  }
  
  return this.save();
};

// ============================================
// STATICS
// ============================================

PresenceSchema.statics = {
  /**
   * Find all online users
   */
  async findOnlineUsers(): Promise<PresenceDocument[]> {
    return this.find({
      status: { $ne: UserStatus.OFFLINE },
    })
      .sort({ lastActive: -1 })
      .exec();
  },

  /**
   * Find users in a project
   */
  async findInProject(projectId: Types.ObjectId): Promise<PresenceDocument[]> {
    return this.find({
      currentProject: projectId,
      status: { $ne: UserStatus.OFFLINE },
    })
      .sort({ lastActive: -1 })
      .exec();
  },

  /**
   * Find visible users (not in ghost mode)
   */
  async findVisibleUsers(projectId?: Types.ObjectId): Promise<PresenceDocument[]> {
    const query: any = {
      status: { $ne: UserStatus.OFFLINE },
      mode: { $ne: UserMode.GHOST },
    };

    if (projectId) {
      query.currentProject = projectId;
    }

    return this.find(query).sort({ lastActive: -1 }).exec();
  },

  /**
   * Get presence statistics
   */
  async getStats(): Promise<any> {
    return this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  },

  /**
   * Clean up stale presence records
   */
  async cleanupStale(thresholdMinutes = 30): Promise<any> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    
    return this.updateMany(
      {
        status: { $ne: UserStatus.OFFLINE },
        lastActive: { $lt: threshold },
      },
      {
        $set: { status: UserStatus.OFFLINE },
      },
    );
  },

  /**
   * Get user by socket ID
   */
  async findBySocketId(socketId: string): Promise<PresenceDocument | null> {
    return this.findOne({ socketId }).exec();
  },
};

// ============================================
// HOOKS
// ============================================

PresenceSchema.pre('save', function (next) {
  // Update expiresAt based on last activity
  if (this.status === UserStatus.OFFLINE) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  } else {
    this.expiresAt = undefined; // Don't expire while online
  }

  next();
});

// Auto-update status based on idle time
PresenceSchema.pre('find', function (next) {
  const now = Date.now();
  const idleThreshold = 5 * 60 * 1000; // 5 minutes

  this.where('lastActive').lt(new Date(now - idleThreshold));
  this.update({}, { $set: { status: UserStatus.IDLE } }, { multi: true });

  next();
});

// ============================================
// EXPORT
// ============================================

export interface PresenceModel extends Document {
  findOnlineUsers(): Promise<PresenceDocument[]>;
  findInProject(projectId: Types.ObjectId): Promise<PresenceDocument[]>;
  findVisibleUsers(projectId?: Types.ObjectId): Promise<PresenceDocument[]>;
  getStats(): Promise<any>;
  cleanupStale(thresholdMinutes?: number): Promise<any>;
  findBySocketId(socketId: string): Promise<PresenceDocument | null>;
}
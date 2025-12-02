/**
 * cursor.schema.ts
 * MongoDB schema for cursor position persistence
 * 
 * Used for:
 * - Historical cursor tracking
 * - Analytics and insights
 * - Playback of past sessions
 * - Cursor activity logs
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CursorDocument = Cursor & Document;

/**
 * Cursor Activity Type
 */
export enum CursorActivity {
  IDLE = 'idle',
  TYPING = 'typing',
  CLICKING = 'clicking',
  DRAGGING = 'dragging',
  SCROLLING = 'scrolling',
}

/**
 * Cursor Position Schema
 * 
 * Stores cursor positions with timestamps for historical tracking
 * and playback functionality
 */
@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'cursors',
})
export class Cursor {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  userName: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Project', index: true })
  projectId: Types.ObjectId;

  @Prop({ required: false })
  roomId?: string;

  // ============================================
  // CURSOR POSITION
  // ============================================

  @Prop({ required: true, min: 0, max: 100 })
  x: number; // Viewport percentage (0-100)

  @Prop({ required: true, min: 0, max: 100 })
  y: number; // Viewport percentage (0-100)

  // ============================================
  // ACTIVITY STATE
  // ============================================

  @Prop({
    required: true,
    enum: CursorActivity,
    default: CursorActivity.IDLE,
    index: true,
  })
  activity: CursorActivity;

  @Prop({ required: false })
  targetElement?: string; // CSS selector of element under cursor

  @Prop({ required: false })
  targetText?: string; // Text content under cursor (first 100 chars)

  // ============================================
  // VISUAL PROPERTIES
  // ============================================

  @Prop({ required: true, default: '#8B5CF6' })
  color: string;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ required: false })
  customization?: {
    size?: number;
    shape?: string;
    trail?: boolean;
    effects?: string[];
  };

  // ============================================
  // CONTEXT
  // ============================================

  @Prop({ required: false })
  pageUrl?: string; // Current page URL

  @Prop({ required: false })
  pageTitle?: string; // Current page title

  @Prop({ required: false })
  sessionId?: string; // Session identifier

  @Prop({ required: false, type: Object })
  viewport?: {
    width: number;
    height: number;
  };

  // ============================================
  // METADATA
  // ============================================

  @Prop({ required: true, default: Date.now, index: true })
  timestamp: Date;

  @Prop({ required: false })
  eventType?: string; // 'move' | 'click' | 'scroll' | etc.

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>; // Flexible metadata field

  // ============================================
  // TTL (Time To Live)
  // ============================================

  @Prop({
    required: false,
    expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days
  })
  expiresAt?: Date;
}

export const CursorSchema = SchemaFactory.createForClass(Cursor);

// ============================================
// INDEXES
// ============================================

CursorSchema.index({ userId: 1, timestamp: -1 });
CursorSchema.index({ projectId: 1, timestamp: -1 });
CursorSchema.index({ sessionId: 1, timestamp: 1 });
CursorSchema.index({ timestamp: -1 }); // For cleanup queries
CursorSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ============================================
// VIRTUAL PROPERTIES
// ============================================

CursorSchema.virtual('isActive').get(function () {
  const now = Date.now();
  const lastUpdate = this.timestamp.getTime();
  return now - lastUpdate < 30000; // Active within last 30 seconds
});

CursorSchema.virtual('age').get(function () {
  return Date.now() - this.timestamp.getTime();
});

// ============================================
// METHODS
// ============================================

CursorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

// ============================================
// STATICS
// ============================================

CursorSchema.statics = {
  /**
   * Find recent cursors for a project
   */
  async findRecentByProject(
    projectId: Types.ObjectId,
    limit = 100,
  ): Promise<CursorDocument[]> {
    return this.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  },

  /**
   * Find cursor history for a user
   */
  async findUserHistory(
    userId: Types.ObjectId,
    startTime?: Date,
    endTime?: Date,
  ): Promise<CursorDocument[]> {
    const query: any = { userId };

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = startTime;
      if (endTime) query.timestamp.$lte = endTime;
    }

    return this.find(query).sort({ timestamp: 1 }).exec();
  },

  /**
   * Find cursors in a session
   */
  async findBySession(sessionId: string): Promise<CursorDocument[]> {
    return this.find({ sessionId }).sort({ timestamp: 1 }).exec();
  },

  /**
   * Get cursor activity stats
   */
  async getActivityStats(
    projectId: Types.ObjectId,
    timeWindow = 3600000, // 1 hour
  ): Promise<any> {
    const since = new Date(Date.now() - timeWindow);

    return this.aggregate([
      {
        $match: {
          projectId,
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$activity',
          count: { $sum: 1 },
        },
      },
    ]);
  },

  /**
   * Get active users in project
   */
  async getActiveUsers(
    projectId: Types.ObjectId,
    threshold = 30000, // 30 seconds
  ): Promise<any[]> {
    const since = new Date(Date.now() - threshold);

    return this.aggregate([
      {
        $match: {
          projectId,
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          lastActivity: { $max: '$timestamp' },
          cursorCount: { $sum: 1 },
        },
      },
      {
        $sort: { lastActivity: -1 },
      },
    ]);
  },

  /**
   * Clean up old cursor records
   */
  async cleanupOld(daysOld = 30): Promise<any> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.deleteMany({ timestamp: { $lt: cutoff } });
  },
};

// ============================================
// HOOKS
// ============================================

CursorSchema.pre('save', function (next) {
  // Set expiresAt if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Ensure coordinates are within bounds
  if (this.x < 0) this.x = 0;
  if (this.x > 100) this.x = 100;
  if (this.y < 0) this.y = 0;
  if (this.y > 100) this.y = 100;

  next();
});

// ============================================
// EXPORT
// ============================================

export interface CursorModel extends Document {
  findRecentByProject(
    projectId: Types.ObjectId,
    limit?: number,
  ): Promise<CursorDocument[]>;
  findUserHistory(
    userId: Types.ObjectId,
    startTime?: Date,
    endTime?: Date,
  ): Promise<CursorDocument[]>;
  findBySession(sessionId: string): Promise<CursorDocument[]>;
  getActivityStats(projectId: Types.ObjectId, timeWindow?: number): Promise<any>;
  getActiveUsers(projectId: Types.ObjectId, threshold?: number): Promise<any[]>;
  cleanupOld(daysOld?: number): Promise<any>;
}
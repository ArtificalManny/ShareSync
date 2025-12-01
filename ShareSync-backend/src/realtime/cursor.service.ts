/**
 * cursor.service.ts
 * Business logic for cursor state management
 * 
 * Handles:
 * - Cursor position persistence (for heatmaps)
 * - Cursor analytics (where do people work?)
 * - Cursor history (time-travel debugging)
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// ============================================
// SCHEMAS (Create these in cursor.schema.ts)
// ============================================

export interface CursorPosition {
  userId: string;
  projectId: string;
  x: number;
  y: number;
  activity: 'typing' | 'clicking' | 'dragging' | 'idle';
  timestamp: Date;
  sessionId: string;
}

export interface CursorSession {
  userId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  totalMoves: number;
  activities: {
    typing: number;
    clicking: number;
    dragging: number;
  };
}

@Injectable()
export class CursorService {
  // Batch buffer for cursor positions (write every 5 seconds)
  private positionBuffer: CursorPosition[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor(
    // Uncomment when you create the schemas
    // @InjectModel('CursorPosition') private cursorPositionModel: Model<CursorPosition>,
    // @InjectModel('CursorSession') private cursorSessionModel: Model<CursorSession>,
  ) {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  // ============================================
  // CURSOR POSITION PERSISTENCE
  // ============================================

  /**
   * Record cursor position (buffered for performance)
   */
  async recordPosition(data: {
    userId: string;
    projectId: string;
    x: number;
    y: number;
    activity: 'typing' | 'clicking' | 'dragging' | 'idle';
    sessionId: string;
  }) {
    // Add to buffer
    this.positionBuffer.push({
      ...data,
      timestamp: new Date(),
    });

    // Flush if buffer is full
    if (this.positionBuffer.length >= this.BATCH_SIZE) {
      await this.flushPositions();
    }
  }

  /**
   * Flush cursor positions to database
   */
  private async flushPositions() {
    if (this.positionBuffer.length === 0) return;

    try {
      const positions = [...this.positionBuffer];
      this.positionBuffer = [];

      // Batch insert to database
      // await this.cursorPositionModel.insertMany(positions);

      console.log(`💾 Flushed ${positions.length} cursor positions`);
    } catch (error) {
      console.error('Failed to flush cursor positions:', error);
      // Add back to buffer on error (retry)
      this.positionBuffer.unshift(...this.positionBuffer);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush() {
    setInterval(() => {
      this.flushPositions();
    }, this.FLUSH_INTERVAL);
  }

  // ============================================
  // CURSOR SESSIONS
  // ============================================

  /**
   * Start a new cursor session
   */
  async startSession(userId: string, projectId: string): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`;

    // Create session record
    // const session = await this.cursorSessionModel.create({
    //   userId,
    //   projectId,
    //   startTime: new Date(),
    //   totalMoves: 0,
    //   activities: {
    //     typing: 0,
    //     clicking: 0,
    //     dragging: 0,
    //   },
    // });

    console.log(`🎬 Started cursor session: ${sessionId}`);
    return sessionId;
  }

  /**
   * End cursor session
   */
  async endSession(sessionId: string) {
    try {
      // await this.cursorSessionModel.findOneAndUpdate(
      //   { _id: sessionId },
      //   { endTime: new Date() },
      // );

      console.log(`🏁 Ended cursor session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Increment activity counter for session
   */
  async recordActivity(
    sessionId: string,
    activity: 'typing' | 'clicking' | 'dragging',
  ) {
    try {
      // await this.cursorSessionModel.findOneAndUpdate(
      //   { _id: sessionId },
      //   {
      //     $inc: {
      //       totalMoves: 1,
      //       [`activities.${activity}`]: 1,
      //     },
      //   },
      // );
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }

  // ============================================
  // CURSOR ANALYTICS
  // ============================================

  /**
   * Get cursor heatmap data for a project
   * Returns: Array of {x, y, intensity} for visualization
   */
  async getHeatmap(projectId: string, timeRange: {
    start: Date;
    end: Date;
  }) {
    try {
      // Aggregate cursor positions into grid buckets
      // const heatmapData = await this.cursorPositionModel.aggregate([
      //   {
      //     $match: {
      //       projectId,
      //       timestamp: { $gte: timeRange.start, $lte: timeRange.end },
      //     },
      //   },
      //   {
      //     $bucket: {
      //       groupBy: { x: '$x', y: '$y' },
      //       boundaries: [...Array(21).keys()].map(i => i * 5), // 5% buckets
      //       default: 100,
      //       output: {
      //         count: { $sum: 1 },
      //         avgX: { $avg: '$x' },
      //         avgY: { $avg: '$y' },
      //       },
      //     },
      //   },
      // ]);

      // Mock data for now
      const heatmapData = Array.from({ length: 20 }, (_, i) => ({
        x: (i % 5) * 20,
        y: Math.floor(i / 5) * 20,
        intensity: Math.random() * 100,
      }));

      return heatmapData;
    } catch (error) {
      console.error('Failed to generate heatmap:', error);
      return [];
    }
  }

  /**
   * Get cursor activity timeline for a user
   * Returns: Array of {timestamp, activity, duration}
   */
  async getUserTimeline(userId: string, projectId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // const timeline = await this.cursorPositionModel.aggregate([
      //   {
      //     $match: {
      //       userId,
      //       projectId,
      //       timestamp: { $gte: startOfDay, $lte: endOfDay },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: {
      //         hour: { $hour: '$timestamp' },
      //         activity: '$activity',
      //       },
      //       count: { $sum: 1 },
      //     },
      //   },
      //   {
      //     $sort: { '_id.hour': 1 },
      //   },
      // ]);

      // Mock data for now
      const timeline = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        typing: Math.floor(Math.random() * 100),
        clicking: Math.floor(Math.random() * 50),
        dragging: Math.floor(Math.random() * 30),
      }));

      return timeline;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      return [];
    }
  }

  /**
   * Get cursor density (cursors per hour) for a project
   */
  async getCursorDensity(projectId: string, timeRange: {
    start: Date;
    end: Date;
  }) {
    try {
      // const density = await this.cursorSessionModel.aggregate([
      //   {
      //     $match: {
      //       projectId,
      //       startTime: { $gte: timeRange.start, $lte: timeRange.end },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: { $hour: '$startTime' },
      //       uniqueUsers: { $addToSet: '$userId' },
      //       totalSessions: { $sum: 1 },
      //     },
      //   },
      //   {
      //     $project: {
      //       hour: '$_id',
      //       cursorCount: { $size: '$uniqueUsers' },
      //       sessions: '$totalSessions',
      //     },
      //   },
      //   {
      //     $sort: { hour: 1 },
      //   },
      // ]);

      // Mock data for now
      const density = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        cursorCount: Math.floor(Math.random() * 10),
        sessions: Math.floor(Math.random() * 20),
      }));

      return density;
    } catch (error) {
      console.error('Failed to get cursor density:', error);
      return [];
    }
  }

  /**
   * Get most active areas in a project
   * Returns: Top 10 hotspots where people work most
   */
  async getHotspots(projectId: string, limit = 10) {
    try {
      // const hotspots = await this.cursorPositionModel.aggregate([
      //   { $match: { projectId } },
      //   {
      //     $bucket: {
      //       groupBy: { x: '$x', y: '$y' },
      //       boundaries: [...Array(21).keys()].map(i => i * 5),
      //       default: 100,
      //       output: {
      //         count: { $sum: 1 },
      //         avgX: { $avg: '$x' },
      //         avgY: { $avg: '$y' },
      //         activities: {
      //           $push: '$activity',
      //         },
      //       },
      //     },
      //   },
      //   { $sort: { count: -1 } },
      //   { $limit: limit },
      // ]);

      // Mock data for now
      const hotspots = Array.from({ length: limit }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        count: Math.floor(Math.random() * 500),
        activities: ['typing', 'clicking'],
      }));

      return hotspots;
    } catch (error) {
      console.error('Failed to get hotspots:', error);
      return [];
    }
  }

  // ============================================
  // CURSOR PLAYBACK (Time-travel debugging)
  // ============================================

  /**
   * Get cursor replay data for a session
   * Returns: Array of cursor positions over time
   */
  async getSessionReplay(sessionId: string) {
    try {
      // const replay = await this.cursorPositionModel
      //   .find({ sessionId })
      //   .sort({ timestamp: 1 })
      //   .select('x y activity timestamp')
      //   .lean();

      // Mock data for now
      const replay = Array.from({ length: 100 }, (_, i) => ({
        x: 50 + Math.sin(i / 10) * 30,
        y: 50 + Math.cos(i / 10) * 30,
        activity: ['typing', 'clicking', 'idle'][i % 3],
        timestamp: new Date(Date.now() - (100 - i) * 1000),
      }));

      return replay;
    } catch (error) {
      console.error('Failed to get session replay:', error);
      return [];
    }
  }

  /**
   * Get all cursors at a specific timestamp
   * Used for "Go back in time" feature
   */
  async getCursorsAtTime(projectId: string, timestamp: Date) {
    try {
      // Find the most recent cursor position for each user before timestamp
      // const cursors = await this.cursorPositionModel.aggregate([
      //   {
      //     $match: {
      //       projectId,
      //       timestamp: { $lte: timestamp },
      //     },
      //   },
      //   {
      //     $sort: { timestamp: -1 },
      //   },
      //   {
      //     $group: {
      //       _id: '$userId',
      //       latestPosition: { $first: '$$ROOT' },
      //     },
      //   },
      // ]);

      // Mock data for now
      const cursors = [];

      return cursors;
    } catch (error) {
      console.error('Failed to get cursors at time:', error);
      return [];
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Clean up old cursor positions (older than 30 days)
   */
  async cleanupOldPositions() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // const result = await this.cursorPositionModel.deleteMany({
      //   timestamp: { $lt: thirtyDaysAgo },
      // });

      console.log(`🧹 Cleaned up old cursor positions`);
    } catch (error) {
      console.error('Failed to cleanup positions:', error);
    }
  }
}
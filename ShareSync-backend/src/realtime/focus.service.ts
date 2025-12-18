/**
 * focus.service.ts
 * Business logic for focus sessions
 * 
 * Handles:
 * - Session creation and lifecycle
 * - Statistics and analytics
 * - XP calculation
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FocusSession, FocusSessionDocument, SessionStatus, SessionType } from './schemas/focus-session.schema';

@Injectable()
export class FocusService {
  constructor(
    @InjectModel(FocusSession.name)
    private focusSessionModel: Model<FocusSessionDocument>,
  ) {}

  // ============================================
  // SESSION CREATION
  // ============================================

  /**
   * Start a new focus session
   */
  async startSession(
    userId: string,
    data: {
      type: SessionType;
      duration: number;
      projectId?: string;
      goal?: string;
    },
  ): Promise<FocusSessionDocument> {
    // Check if user already has an active session
    const existingSession = await this.getActiveSession(userId);
    if (existingSession) {
      throw new BadRequestException('User already has an active focus session');
    }

    const session = new this.focusSessionModel({
      userId: new Types.ObjectId(userId),
      projectId: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
      type: data.type,
      plannedDuration: data.duration,
      goal: data.goal,
      startTime: new Date(),
      status: SessionStatus.ACTIVE,
      metadata: {
        timeOfDay: this.getTimeOfDay(),
      },
    });

    await session.save();
    
    console.log(`🔥 Focus session started: ${userId} (${data.duration} min)`);
    
    return session;
  }

  // ============================================
  // SESSION CONTROL
  // ============================================

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.pause();
    
    console.log(`⏸️ Session paused: ${sessionId}`);
    
    return session;
  }

  /**
   * Resume a session
   */
  async resumeSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.resume();
    
    console.log(`▶️ Session resumed: ${sessionId}`);
    
    return session;
  }

  /**
   * Complete a session
   */
  async completeSession(
    sessionId: string,
    userId: string,
    feedback?: {
      qualityRating?: number;
      focusLevel?: number;
      goalAchieved?: boolean;
      notes?: string;
    },
  ): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.complete(feedback);
    
    console.log(`✅ Session completed: ${sessionId} (+${session.xpEarned} XP)`);
    
    return session;
  }

  /**
   * Cancel a session
   */
  async cancelSession(
    sessionId: string,
    userId: string,
    reason?: string,
  ): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.cancel(reason);
    
    console.log(`❌ Session cancelled: ${sessionId}`);
    
    return session;
  }

  // ============================================
  // SESSION UPDATES
  // ============================================

  /**
   * Record an interruption
   */
  async recordInterruption(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.recordInterruption();
    
    return session;
  }

  /**
   * Add a task to the session
   */
  async addTask(sessionId: string, userId: string, taskId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.addTask(new Types.ObjectId(taskId));
    
    return session;
  }

  /**
   * Mark task as completed
   */
  async completeTask(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.completeTask();
    
    return session;
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get user's active session
   */
  async getActiveSession(userId: string): Promise<FocusSessionDocument | null> {
    return this.focusSessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.ACTIVE, SessionStatus.PAUSED] },
      })
      .exec();
  }

  /**
   * Get user's session history
   */
  async getSessionHistory(
    userId: string,
    limit = 20,
  ): Promise<FocusSessionDocument[]> {
    return this.focusSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ startTime: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get sessions for a project
   */
  async getProjectSessions(projectId: string): Promise<FocusSessionDocument[]> {
    return this.focusSessionModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ startTime: -1 })
      .exec();
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get user's focus statistics
   */
  async getUserStats(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.focusSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        startTime: { $gte: startDate },
      })
      .exec();

    const completed = sessions.filter(s => s.status === SessionStatus.COMPLETED);

    const totalMinutes = completed.reduce((sum, s) => sum + s.actualDuration, 0);
    const totalXP = completed.reduce((sum, s) => sum + s.xpEarned, 0);
    const avgQuality = completed.filter(s => s.qualityRating).reduce((sum, s) => sum + (s.qualityRating || 0), 0) / completed.length || 0;

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      totalFocusTime: Math.round(totalMinutes),
      totalXP,
      avgSessionDuration: completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0,
      avgQualityRating: Math.round(avgQuality * 10) / 10,
      completionRate: sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) / 100 : 0,
      streak: await this.calculateStreak(userId),
    };
  }

  /**
   * Calculate focus streak (consecutive days)
   */
  async calculateStreak(userId: string): Promise<number> {
    const sessions = await this.focusSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        status: SessionStatus.COMPLETED,
      })
      .sort({ startTime: -1 })
      .exec();

    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    let checkDate = today;

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime).setHours(0, 0, 0, 0);
      
      if (sessionDate === checkDate) {
        streak++;
        checkDate -= 24 * 60 * 60 * 1000; // Previous day
      } else if (sessionDate < checkDate) {
        break; // Gap in streak
      }
    }

    return streak;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Find session with permission check
   */
  private async findSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.focusSessionModel.findById(sessionId).exec();
    
    if (!session) {
      throw new NotFoundException('Focus session not found');
    }
    
    if (session.userId.toString() !== userId) {
      throw new BadRequestException('Not authorized to modify this session');
    }
    
    return session;
  }

  /**
   * Get time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

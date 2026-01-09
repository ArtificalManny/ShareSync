/**
 * focus.service.ts
 * Business logic for focus sessions
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

  async startSession(
    userId: string,
    data: {
      type: SessionType;
      duration: number;
      projectId?: string;
      goal?: string;
    },
  ): Promise<FocusSessionDocument> {
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
    
    // FIX: Cast after save
    return session as any as FocusSessionDocument;
  }

  async pauseSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.pause();
    
    console.log(`⏸️ Session paused: ${sessionId}`);
    
    return session as any as FocusSessionDocument;
  }

  async resumeSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.resume();
    
    console.log(`▶️ Session resumed: ${sessionId}`);
    
    return session as any as FocusSessionDocument;
  }

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
    
    return session as any as FocusSessionDocument;
  }

  async cancelSession(
    sessionId: string,
    userId: string,
    reason?: string,
  ): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.cancel(reason);
    
    console.log(`❌ Session cancelled: ${sessionId}`);
    
    return session as any as FocusSessionDocument;
  }

  async recordInterruption(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.recordInterruption();
    
    return session as any as FocusSessionDocument;
  }

  async addTask(sessionId: string, userId: string, taskId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.addTask(new Types.ObjectId(taskId));
    
    return session as any as FocusSessionDocument;
  }

  async completeTask(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = await this.findSession(sessionId, userId);
    await session.completeTask();
    
    return session as any as FocusSessionDocument;
  }

  async getActiveSession(userId: string): Promise<FocusSessionDocument | null> {
    return (await this.focusSessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.ACTIVE, SessionStatus.PAUSED] },
      })
      .exec()) as any as FocusSessionDocument | null;
  }

  async getSessionHistory(
    userId: string,
    limit = 20,
  ): Promise<FocusSessionDocument[]> {
    return (await this.focusSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ startTime: -1 })
      .limit(limit)
      .exec()) as any as FocusSessionDocument[];
  }

  async getProjectSessions(projectId: string): Promise<FocusSessionDocument[]> {
    return (await this.focusSessionModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ startTime: -1 })
      .exec()) as any as FocusSessionDocument[];
  }

  async getUserStats(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = (await this.focusSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        startTime: { $gte: startDate },
      })
      .exec()) as any as FocusSessionDocument[];

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

  async calculateStreak(userId: string): Promise<number> {
    const sessions = (await this.focusSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        status: SessionStatus.COMPLETED,
      })
      .sort({ startTime: -1 })
      .exec()) as any as FocusSessionDocument[];

    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    let checkDate = today;

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime).setHours(0, 0, 0, 0);
      
      if (sessionDate === checkDate) {
        streak++;
        checkDate -= 24 * 60 * 60 * 1000;
      } else if (sessionDate < checkDate) {
        break;
      }
    }

    return streak;
  }

  private async findSession(sessionId: string, userId: string): Promise<FocusSessionDocument> {
    const session = (await this.focusSessionModel.findById(sessionId).exec()) as any as FocusSessionDocument | null;
    
    if (!session) {
      throw new NotFoundException('Focus session not found');
    }
    
    if (session.userId.toString() !== userId) {
      throw new BadRequestException('Not authorized to modify this session');
    }
    
    return session;
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

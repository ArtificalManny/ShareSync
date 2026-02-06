// src/user-context/user-context.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTEXT SERVICE: "Welcome Back" Feature Logic
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserContext,
  UserContextDocument,
} from './schemas/user-context.schema';
import {
  SaveContextDto,
  UpdateContextDto,
  AddUnfinishedActionDto,
  EndFocusSessionDto,
  ContextSummaryResponseDto,
} from './dto/user-context.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  constructor(
    @InjectModel(UserContext.name)
    private readonly contextModel: Model<UserContextDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET CONTEXT
  // ─────────────────────────────────────────────────────────────────────────────

  async getContext(userId: string): Promise<UserContextDocument> {
    let context = await this.contextModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!context) {
      context = new this.contextModel({
        userId: new Types.ObjectId(userId),
      });
      await context.save();
      this.logger.log(`Created new context for user ${userId}`);
    }

    return context;
  }

  async getContextSummary(userId: string): Promise<ContextSummaryResponseDto> {
    const context = await this.getContext(userId);

    // TODO: Populate project and task names from their services
    // For now, return IDs only

    const summary: ContextSummaryResponseDto = {
      hasUnfinishedWork: context.unfinishedActions.length > 0,
      unfinishedActionsCount: context.unfinishedActions.length,
      unfinishedActions: context.unfinishedActions.map((a) => ({
        action: a.action,
        context: a.context,
        taskId: a.taskId?.toString(),
        projectId: a.projectId?.toString(),
        priority: a.priority,
      })),
      currentView: context.currentView,
      currentProjectId: context.currentProjectId?.toString(),
      currentTaskId: context.currentTaskId?.toString(),
      isInFocusMode: context.isInFocusMode,
      totalFocusMinutesToday: context.totalFocusMinutesToday,
      sessionDurationMinutes: Math.round(context.sessionDuration / 60),
      lastActiveAt: context.lastActiveAt,
    };

    return summary;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SAVE/UPDATE CONTEXT
  // ─────────────────────────────────────────────────────────────────────────────

  async saveContext(
    userId: string,
    dto: SaveContextDto,
  ): Promise<UserContextDocument> {
    const context = await this.getContext(userId);

    if (dto.currentView !== undefined) {
      // Track context switch
      if (context.currentView && context.currentView !== dto.currentView) {
        context.contextSwitches += 1;
      }
      context.currentView = dto.currentView;
    }

    if (dto.currentProjectId !== undefined) {
      context.currentProjectId = dto.currentProjectId
        ? new Types.ObjectId(dto.currentProjectId)
        : undefined;
    }

    if (dto.currentTaskId !== undefined) {
      context.currentTaskId = dto.currentTaskId
        ? new Types.ObjectId(dto.currentTaskId)
        : undefined;
    }

    if (dto.currentSprintId !== undefined) {
      context.currentSprintId = dto.currentSprintId
        ? new Types.ObjectId(dto.currentSprintId)
        : undefined;
    }

    if (dto.workspaceState) {
      context.workspaceState = {
        ...context.workspaceState,
        ...dto.workspaceState,
      };
    }

    context.lastActiveAt = new Date();

    return context.save();
  }

  async updateContext(
    userId: string,
    dto: UpdateContextDto,
  ): Promise<UserContextDocument> {
    const context = await this.getContext(userId);

    // Handle nullable fields
    if (dto.currentProjectId === null) {
      context.currentProjectId = undefined;
    } else if (dto.currentProjectId) {
      context.currentProjectId = new Types.ObjectId(dto.currentProjectId);
    }

    if (dto.currentTaskId === null) {
      context.currentTaskId = undefined;
    } else if (dto.currentTaskId) {
      context.currentTaskId = new Types.ObjectId(dto.currentTaskId);
    }

    if (dto.currentSprintId === null) {
      context.currentSprintId = undefined;
    } else if (dto.currentSprintId) {
      context.currentSprintId = new Types.ObjectId(dto.currentSprintId);
    }

    if (dto.currentView !== undefined) {
      context.currentView = dto.currentView;
    }

    if (dto.workspaceState) {
      context.workspaceState = {
        ...context.workspaceState,
        ...dto.workspaceState,
      };
    }

    if (dto.densityPreference !== undefined) {
      context.densityPreference = dto.densityPreference;
    }

    if (dto.soundEnabled !== undefined) {
      context.soundEnabled = dto.soundEnabled;
    }

    if (dto.celebrationsEnabled !== undefined) {
      context.celebrationsEnabled = dto.celebrationsEnabled;
    }

    return context.save();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFINISHED ACTIONS (Zeigarnik Effect)
  // ─────────────────────────────────────────────────────────────────────────────

  async addUnfinishedAction(
    userId: string,
    dto: AddUnfinishedActionDto,
  ): Promise<UserContextDocument> {
    const context = await this.getContext(userId);

    context.addUnfinishedAction(
      dto.action,
      dto.context,
      dto.taskId ? new Types.ObjectId(dto.taskId) : undefined,
      dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      dto.priority || 0,
    );

    return context.save();
  }

  async completeAction(
    userId: string,
    action: string,
  ): Promise<{ completed: boolean; context: UserContextDocument }> {
    const context = await this.getContext(userId);
    const completed = context.completeUnfinishedAction(action);
    
    if (completed) {
      await context.save();
    }

    return { completed, context };
  }

  async getUnfinishedActions(userId: string): Promise<any[]> {
    const context = await this.getContext(userId);
    return context.unfinishedActions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOCUS SESSIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async startFocusSession(userId: string): Promise<UserContextDocument> {
    const context = await this.getContext(userId);
    context.startFocusSession();
    this.logger.log(`Focus session started for user ${userId}`);
    return context.save();
  }

  async endFocusSession(
    userId: string,
    dto: EndFocusSessionDto = {},
  ): Promise<UserContextDocument> {
    const context = await this.getContext(userId);
    
    context.endFocusSession(
      dto.tasksCompleted || 0,
      dto.xpEarned || 0,
    );
    
    this.logger.log(`Focus session ended for user ${userId}`);
    return context.save();
  }

  async getFocusSessions(userId: string): Promise<any[]> {
    const context = await this.getContext(userId);
    return context.recentFocusSessions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLABORATORS
  // ─────────────────────────────────────────────────────────────────────────────

  async updateCollaborator(
    userId: string,
    collaboratorId: string,
  ): Promise<UserContextDocument> {
    const context = await this.getContext(userId);
    context.updateCollaborator(new Types.ObjectId(collaboratorId));
    return context.save();
  }

  async getRecentCollaborators(userId: string): Promise<any[]> {
    const context = await this.getContext(userId);
    return context.recentCollaborators;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION TRACKING
  // ─────────────────────────────────────────────────────────────────────────────

  async heartbeat(userId: string): Promise<void> {
    await this.contextModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: { lastActiveAt: new Date() },
        $inc: { sessionDuration: 30 }, // Assume 30-second heartbeat interval
      },
      { upsert: true },
    );
  }

  async startSession(userId: string): Promise<UserContextDocument> {
    const context = await this.getContext(userId);
    context.sessionStartedAt = new Date();
    context.sessionDuration = 0;
    context.contextSwitches = 0;
    return context.save();
  }

  async endSession(userId: string): Promise<void> {
    const context = await this.getContext(userId);
    
    // Calculate final session duration
    if (context.sessionStartedAt) {
      const duration = Math.round(
        (Date.now() - context.sessionStartedAt.getTime()) / 1000,
      );
      context.sessionDuration = duration;
    }

    // End any active focus session
    if (context.isInFocusMode) {
      context.endFocusSession(0, 0);
    }

    await context.save();
    this.logger.log(`Session ended for user ${userId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY RESET
  // ─────────────────────────────────────────────────────────────────────────────

  async resetDailyCounters(userId: string): Promise<void> {
    await this.contextModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          totalFocusMinutesToday: 0,
          contextSwitches: 0,
        },
      },
    );
  }

  // Called by a cron job at midnight
  async resetAllDailyCounters(): Promise<number> {
    const result = await this.contextModel.updateMany(
      {},
      {
        $set: {
          totalFocusMinutesToday: 0,
        },
      },
    );
    this.logger.log(`Reset daily counters for ${result.modifiedCount} users`);
    return result.modifiedCount;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYTICS HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  async getActiveUsers(minutesAgo: number = 5): Promise<number> {
    const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
    return this.contextModel.countDocuments({
      lastActiveAt: { $gte: cutoff },
    });
  }

  async getUsersInFocusMode(): Promise<UserContextDocument[]> {
    return this.contextModel.find({ isInFocusMode: true });
  }

  async getUsersWithUnfinishedWork(): Promise<UserContextDocument[]> {
    return this.contextModel.find({
      'unfinishedActions.0': { $exists: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────

  async cleanupStaleContexts(daysInactive: number = 90): Promise<number> {
    const cutoff = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
    const result = await this.contextModel.deleteMany({
      lastActiveAt: { $lt: cutoff },
    });
    this.logger.log(`Cleaned up ${result.deletedCount} stale contexts`);
    return result.deletedCount;
  }
}

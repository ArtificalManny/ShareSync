import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  UserContext, 
  UserContextDocument,
  ViewType,
  ActionPriority,
  UnfinishedAction,
  FocusSession,
  CollaboratorContext,
} from '../schemas/user-context.schema';
import {
  SaveContextDto,
  UpdateContextDto,
  AddUnfinishedActionDto,
  StartFocusSessionDto,
  EndFocusSessionDto,
  UpdateCollaboratorDto,
  UpdateWorkspaceStateDto,
  ContextSummaryResponseDto,
} from '../dto/user-context.dto';

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  private readonly MAX_UNFINISHED_ACTIONS = 5;
  private readonly MAX_COLLABORATORS = 10;
  private readonly MAX_OPEN_TABS = 10;
  private readonly MAX_FOCUS_HISTORY = 10;
  private readonly WELCOME_BACK_THRESHOLD_MS = 3600000;
  private readonly SESSION_TIMEOUT_MS = 300000;

  constructor(
    @InjectModel(UserContext.name)
    private contextModel: Model<UserContextDocument>,
  ) {}

  async getContext(userId: string | Types.ObjectId): Promise<any> {
    try {
      this.logger.debug(`Fetching context for user: ${userId}`);

      const context = await this.contextModel
        .findOne({ userId: this.toObjectId(userId) })
        .populate('lastActiveProjectId', 'name icon color')
        .populate('lastActiveTaskId', 'title status priority dueDate')
        .populate('recentCollaborators.userId', 'username displayName avatar email')
        .populate('activeTeamChatId', 'name participants lastMessage')
        .exec();

      if (!context) {
        this.logger.debug(`No context found for user: ${userId}`);
        return null;
      }

      this.logger.debug(`Context retrieved for user: ${userId}`);
      return context;
    } catch (error) {
      this.logger.error(
        `Error fetching context for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve user context');
    }
  }

  async getContextSummary(userId: string | Types.ObjectId): Promise<ContextSummaryResponseDto> {
    try {
      this.logger.debug(`Fetching context summary for user: ${userId}`);

      const context = await this.contextModel
        .findOne({ userId: this.toObjectId(userId) })
        .select(
          'lastActiveView lastActiveAt wasInFocusMode currentFocusSession ' +
          'unfinishedActions recentCollaborators lastActiveProjectId lastActiveTaskId'
        )
        .populate('lastActiveProjectId', 'name icon color')
        .populate('lastActiveTaskId', 'title status')
        .populate('recentCollaborators.userId', 'username displayName avatar')
        .exec();

      if (!context) {
        return this.getEmptySummary();
      }

      const timeSinceLastActive = Date.now() - new Date(context.lastActiveAt).getTime();
      const showWelcomeBack = timeSinceLastActive > this.WELCOME_BACK_THRESHOLD_MS;

      const sortedActions = this.sortUnfinishedActionsByPriority(
        context.unfinishedActions || []
      ).slice(0, 3);

      const recentCollaborators = (context.recentCollaborators || []).slice(0, 3);

      return {
        showWelcomeBack,
        timeSinceLastActive,
        timeSinceLastActiveFormatted: this.formatDuration(timeSinceLastActive),
        lastView: context.lastActiveView,
        lastProject: context.lastActiveProjectId as any,
        lastTask: context.lastActiveTaskId as any,
        wasInFocus: context.wasInFocusMode || false,
        currentFocusSession: context.currentFocusSession,
        topUnfinishedActions: sortedActions,
        recentCollaborators: recentCollaborators as any,
        hasUnfinishedWork: sortedActions.length > 0,
      };
    } catch (error) {
      this.logger.error(`Error fetching context summary: ${error.message}`, error.stack);
      return this.getEmptySummary();
    }
  }

  async contextExists(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      const count = await this.contextModel
        .countDocuments({ userId: this.toObjectId(userId) })
        .exec();
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking context existence: ${error.message}`);
      return false;
    }
  }

  async saveContext(userId: string | Types.ObjectId, contextData: SaveContextDto): Promise<any> {
    try {
      this.logger.debug(`Saving context for user: ${userId}`);

      const updateData: any = {
        ...contextData,
        lastActiveAt: new Date(),
      };

      if (contextData.lastActiveProjectId) {
        updateData.lastActiveProjectId = this.toObjectId(contextData.lastActiveProjectId);
      }
      if (contextData.lastActiveTaskId) {
        updateData.lastActiveTaskId = this.toObjectId(contextData.lastActiveTaskId);
      }

      if (contextData.deviceInfo) {
        updateData.deviceInfo = contextData.deviceInfo;
      }

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $set: updateData,
            $inc: { contextSwitchCount: 1 },
          },
          { 
            upsert: true, 
            new: true,
            runValidators: true,
          },
        )
        .exec();

      this.logger.debug(`Context saved for user: ${userId}`);
      return context;
    } catch (error) {
      this.logger.error(`Error saving context: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to save user context');
    }
  }

  async updateContext(userId: string | Types.ObjectId, updateData: UpdateContextDto): Promise<any> {
    try {
      this.logger.debug(`Updating context for user: ${userId}`);

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          { $set: updateData },
          { new: true, runValidators: true },
        )
        .exec();

      if (!context) {
        throw new NotFoundException('User context not found');
      }

      return context;
    } catch (error) {
      this.logger.error(`Error updating context: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to update context');
    }
  }

  async deleteContext(userId: string | Types.ObjectId): Promise<void> {
    try {
      this.logger.log(`Deleting context for user: ${userId}`);

      await this.contextModel
        .deleteOne({ userId: this.toObjectId(userId) })
        .exec();

      this.logger.log(`Context deleted for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting context: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete context');
    }
  }

  async addUnfinishedAction(userId: string | Types.ObjectId, actionData: AddUnfinishedActionDto): Promise<any> {
    try {
      this.logger.debug(`Adding unfinished action for user: ${userId}`);

      const action: UnfinishedAction = {
        action: actionData.action,
        context: actionData.context,
        contextId: actionData.contextId,
        priority: actionData.priority || ActionPriority.MEDIUM,
        timestamp: new Date(),
        estimatedCompletion: actionData.estimatedCompletion,
      };

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $push: {
              unfinishedActions: {
                $each: [action],
                $position: 0,
                $slice: this.MAX_UNFINISHED_ACTIONS,
              },
            },
            $set: { lastActiveAt: new Date() },
          },
          { upsert: true, new: true },
        )
        .exec();

      this.logger.debug(`Unfinished action added for user: ${userId}`);
      return context;
    } catch (error) {
      this.logger.error(`Error adding unfinished action: ${error.message}`);
      throw new InternalServerErrorException('Failed to add unfinished action');
    }
  }

  async completeAction(userId: string | Types.ObjectId, action: string): Promise<any> {
    try {
      this.logger.debug(`Completing action for user ${userId}: ${action}`);

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $pull: { unfinishedActions: { action } } as any,
            $set: { lastActiveAt: new Date() },
          },
          { new: true },
        )
        .exec();

      if (!context) {
        throw new NotFoundException('User context not found');
      }

      this.logger.debug(`Action completed for user: ${userId}`);
      return context;
    } catch (error) {
      this.logger.error(`Error completing action: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to complete action');
    }
  }

  async clearUnfinishedActions(userId: string | Types.ObjectId): Promise<void> {
    try {
      await this.contextModel
        .updateOne(
          { userId: this.toObjectId(userId) },
          { $set: { unfinishedActions: [] } },
        )
        .exec();
    } catch (error) {
      this.logger.error(`Error clearing unfinished actions: ${error.message}`);
      throw new InternalServerErrorException('Failed to clear unfinished actions');
    }
  }

  async startFocusSession(userId: string | Types.ObjectId, sessionData: StartFocusSessionDto): Promise<any> {
    try {
      this.logger.log(`Starting focus session for user: ${userId}`);

      const focusSession: FocusSession = {
        startedAt: new Date(),
        duration: 0,
        taskId: sessionData.taskId ? this.toObjectId(sessionData.taskId) : undefined,
        projectId: sessionData.projectId ? this.toObjectId(sessionData.projectId) : undefined,
        interruptions: 0,
        completed: false,
      };

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $set: {
              wasInFocusMode: true,
              currentFocusSession: focusSession,
              lastActiveAt: new Date(),
            },
            $inc: { dailySessionsCount: 1 },
          },
          { upsert: true, new: true },
        )
        .exec();

      this.logger.log(`Focus session started for user: ${userId}`);
      return context;
    } catch (error) {
      this.logger.error(`Error starting focus session: ${error.message}`);
      throw new InternalServerErrorException('Failed to start focus session');
    }
  }

  async endFocusSession(userId: string | Types.ObjectId, sessionData: EndFocusSessionDto): Promise<any> {
    try {
      this.logger.log(`Ending focus session for user: ${userId}`);

      const currentContext = await this.contextModel
        .findOne({ userId: this.toObjectId(userId) })
        .exec();

      if (!currentContext?.currentFocusSession) {
        throw new BadRequestException('No active focus session to end');
      }

      const endTime = new Date();
      const startTime = new Date(currentContext.currentFocusSession.startedAt);
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

      const completedSession: FocusSession = {
        ...currentContext.currentFocusSession,
        endedAt: endTime,
        duration: durationMinutes,
        interruptions: sessionData.interruptions || 0,
        completed: sessionData.completed ?? true,
      };

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $set: {
              wasInFocusMode: false,
              currentFocusSession: null,
              lastActiveAt: new Date(),
            },
            $inc: {
              totalFocusMinutesToday: durationMinutes,
            },
            $push: {
              focusSessionHistory: {
                $each: [completedSession],
                $position: 0,
                $slice: this.MAX_FOCUS_HISTORY,
              },
            },
          },
          { new: true },
        )
        .exec();

      if (sessionData.completed) {
        await this.updateFocusStreak(userId);
      }

      this.logger.log(`Focus session ended for user: ${userId} (${durationMinutes} min)`);
      return context;
    } catch (error) {
      this.logger.error(`Error ending focus session: ${error.message}`);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to end focus session');
    }
  }

  async interruptFocusSession(userId: string | Types.ObjectId): Promise<void> {
    try {
      await this.contextModel
        .updateOne(
          { 
            userId: this.toObjectId(userId),
            wasInFocusMode: true,
          },
          { $inc: { 'currentFocusSession.interruptions': 1 } },
        )
        .exec();
    } catch (error) {
      this.logger.error(`Error recording interruption: ${error.message}`);
    }
  }

  private async updateFocusStreak(userId: string | Types.ObjectId): Promise<void> {
    try {
      const context = await this.contextModel
        .findOne({ userId: this.toObjectId(userId) })
        .select('focusSessionHistory focusStreak')
        .exec();

      if (!context) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const hadSessionYesterday = context.focusSessionHistory?.some(session => {
        const sessionDate = new Date(session.startedAt);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === yesterday.getTime() && session.completed;
      });

      if (hadSessionYesterday) {
        await this.contextModel
          .updateOne(
            { userId: this.toObjectId(userId) },
            { $inc: { focusStreak: 1 } },
          )
          .exec();
      } else {
        await this.contextModel
          .updateOne(
            { userId: this.toObjectId(userId) },
            { $set: { focusStreak: 1 } },
          )
          .exec();
      }
    } catch (error) {
      this.logger.error(`Error updating focus streak: ${error.message}`);
    }
  }

  async updateCollaborator(userId: string | Types.ObjectId, collaboratorData: UpdateCollaboratorDto): Promise<any> {
    try {
      this.logger.debug(`Updating collaborator for user: ${userId}`);

      const collaborator: CollaboratorContext = {
        userId: this.toObjectId(collaboratorData.collaboratorUserId),
        lastInteractionType: collaboratorData.interactionType,
        lastInteractionAt: new Date(),
        projectId: collaboratorData.projectId 
          ? this.toObjectId(collaboratorData.projectId) 
          : undefined,
      };

      // First remove existing entry for this collaborator
      await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $pull: {
              recentCollaborators: { 
                userId: this.toObjectId(collaboratorData.collaboratorUserId) 
              } as any,
            },
          },
          { new: true },
        )
        .exec();

      // Then add the updated collaborator
      const result = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $push: {
              recentCollaborators: {
                $each: [collaborator],
                $position: 0,
                $slice: this.MAX_COLLABORATORS,
              },
            },
            $set: { lastActiveAt: new Date() },
          },
          { upsert: true, new: true },
        )
        .exec();

      return result;
    } catch (error) {
      this.logger.error(`Error updating collaborator: ${error.message}`);
      throw new InternalServerErrorException('Failed to update collaborator context');
    }
  }

  async updateWorkspaceState(userId: string | Types.ObjectId, workspaceData: UpdateWorkspaceStateDto): Promise<any> {
    try {
      this.logger.debug(`Updating workspace state for user: ${userId}`);

      const updateData: any = {
        lastActiveAt: new Date(),
      };

      if (workspaceData.openTabs) {
        updateData.openTabs = workspaceData.openTabs.slice(0, this.MAX_OPEN_TABS);
      }

      if (workspaceData.lastScrollPosition !== undefined) {
        updateData.lastScrollPosition = Math.max(0, workspaceData.lastScrollPosition);
      }

      if (workspaceData.sidebarOpen !== undefined) {
        updateData.sidebarOpen = workspaceData.sidebarOpen;
      }

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          { $set: updateData },
          { upsert: true, new: true },
        )
        .exec();

      return context;
    } catch (error) {
      this.logger.error(`Error updating workspace state: ${error.message}`);
      throw new InternalServerErrorException('Failed to update workspace state');
    }
  }

  async updateSessionActivity(userId: string | Types.ObjectId): Promise<any> {
    try {
      const now = new Date();
      
      const currentContext = await this.contextModel
        .findOne({ userId: this.toObjectId(userId) })
        .select('lastActiveAt sessionDuration')
        .exec();

      let sessionIncrement = 0;
      
      if (currentContext?.lastActiveAt) {
        const elapsed = Math.floor((now.getTime() - new Date(currentContext.lastActiveAt).getTime()) / 1000);
        
        if (elapsed <= this.SESSION_TIMEOUT_MS / 1000) {
          sessionIncrement = elapsed;
        }
      }

      const context = await this.contextModel
        .findOneAndUpdate(
          { userId: this.toObjectId(userId) },
          {
            $set: { lastActiveAt: now },
            $inc: { sessionDuration: sessionIncrement },
          },
          { upsert: true, new: true },
        )
        .exec();

      return context;
    } catch (error) {
      this.logger.error(`Error updating session activity: ${error.message}`);
      throw new InternalServerErrorException('Failed to update session activity');
    }
  }

  async resetDailyCounters(userId: string | Types.ObjectId): Promise<void> {
    try {
      await this.contextModel
        .updateOne(
          { userId: this.toObjectId(userId) },
          {
            $set: {
              totalFocusMinutesToday: 0,
              dailySessionsCount: 0,
              contextSwitchCount: 0,
            },
          },
        )
        .exec();

      this.logger.debug(`Daily counters reset for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error resetting daily counters: ${error.message}`);
      throw new InternalServerErrorException('Failed to reset daily counters');
    }
  }

  async resetAllDailyCounters(): Promise<void> {
    try {
      this.logger.log('Resetting daily counters for all users');

      const result = await this.contextModel
        .updateMany(
          {},
          {
            $set: {
              totalFocusMinutesToday: 0,
              dailySessionsCount: 0,
              contextSwitchCount: 0,
            },
          },
        )
        .exec();

      this.logger.log(`Daily counters reset for ${result.modifiedCount} users`);
    } catch (error) {
      this.logger.error(`Error resetting all daily counters: ${error.message}`);
    }
  }

  async getActiveContexts(): Promise<any[]> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - this.SESSION_TIMEOUT_MS);
      
      return await this.contextModel
        .find({ lastActiveAt: { $gte: fiveMinutesAgo } })
        .select('userId lastActiveView lastActiveProjectId wasInFocusMode')
        .exec();
    } catch (error) {
      this.logger.error(`Error getting active contexts: ${error.message}`);
      return [];
    }
  }

  async getContextsWithUnfinishedWork(): Promise<any[]> {
    try {
      return await this.contextModel
        .find({ 'unfinishedActions.0': { $exists: true } })
        .select('userId unfinishedActions lastActiveAt')
        .exec();
    } catch (error) {
      this.logger.error(`Error getting contexts with unfinished work: ${error.message}`);
      return [];
    }
  }

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    if (id instanceof Types.ObjectId) {
      return id;
    }
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ObjectId: ${id}`);
    }
    
    return new Types.ObjectId(id);
  }

  private sortUnfinishedActionsByPriority(actions: UnfinishedAction[]): UnfinishedAction[] {
    const priorityOrder = {
      [ActionPriority.CRITICAL]: 0,
      [ActionPriority.HIGH]: 1,
      [ActionPriority.MEDIUM]: 2,
      [ActionPriority.LOW]: 3,
    };

    return [...actions].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  private getEmptySummary(): ContextSummaryResponseDto {
    return {
      showWelcomeBack: false,
      timeSinceLastActive: 0,
      timeSinceLastActiveFormatted: 'just now',
      lastView: ViewType.HOME,
      lastProject: null,
      lastTask: null,
      wasInFocus: false,
      currentFocusSession: null,
      topUnfinishedActions: [],
      recentCollaborators: [],
      hasUnfinishedWork: false,
    };
  }
}

import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  UseGuards, 
  Req,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserContextService } from './user-context.service';
import { 
  UpdateContextDto,
  SaveContextDto,
  CompleteActionDto,
  StartFocusSessionDto,
  EndFocusSessionDto,
  AddUnfinishedActionDto,
  UpdateCollaboratorDto,
  UpdateWorkspaceStateDto,
  ContextSummaryResponseDto,
} from '../dto/user-context.dto';
import { Request } from 'express';
import { Types } from 'mongoose';

@ApiTags('User Context')
@Controller('user-context')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserContextController {
  private readonly logger = new Logger(UserContextController.name);

  constructor(private readonly contextService: UserContextService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get user context',
    description: 'Retrieves complete context for authenticated user',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Context retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Context not found' })
  async getContext(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Fetching context for user: ${userId}`);
      
      const context = await this.contextService.getContext(userId);
      
      if (!context) {
        throw new NotFoundException('User context not found. This may be your first session.');
      }
      
      return context;
    } catch (error) {
      this.logger.error(`Error fetching context: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to retrieve user context');
    }
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get context summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Context summary retrieved' })
  async getContextSummary(@Req() req: Request): Promise<ContextSummaryResponseDto> {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Fetching context summary for user: ${userId}`);
      
      return await this.contextService.getContextSummary(userId);
    } catch (error) {
      this.logger.error(`Error fetching context summary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve context summary');
    }
  }

  @Get('exists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if context exists' })
  async checkContextExists(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.getContext(userId);
      
      return {
        exists: !!context,
        hasUnfinishedWork: (context?.unfinishedActions?.length || 0) > 0,
      };
    } catch (error) {
      this.logger.error(`Error checking context existence: ${error.message}`);
      return { exists: false, hasUnfinishedWork: false };
    }
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Save user context' })
  @ApiBody({ type: SaveContextDto })
  async saveContext(@Req() req: Request, @Body() contextData: SaveContextDto) {
    try {
      const userId = req.user['userId'];
      this.logger.debug(`Saving context for user: ${userId}`);
      
      if (contextData.lastActiveProjectId && !Types.ObjectId.isValid(contextData.lastActiveProjectId)) {
        throw new BadRequestException('Invalid project ID format');
      }
      if (contextData.lastActiveTaskId && !Types.ObjectId.isValid(contextData.lastActiveTaskId)) {
        throw new BadRequestException('Invalid task ID format');
      }
      
      return await this.contextService.saveContext(userId, contextData);
    } catch (error) {
      this.logger.error(`Error saving context: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to save user context');
    }
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Partial context update' })
  @ApiBody({ type: UpdateContextDto })
  async updateContext(@Req() req: Request, @Body() updateData: UpdateContextDto) {
    try {
      const userId = req.user['userId'];
      return await this.contextService.updateContext(userId, updateData);
    } catch (error) {
      this.logger.error(`Error updating context: ${error.message}`);
      throw new InternalServerErrorException('Failed to update context');
    }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user context' })
  async deleteContext(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Deleting context for user: ${userId}`);
      
      await this.contextService.deleteContext(userId);
      
      return { message: 'User context deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting context: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete context');
    }
  }

  @Post('unfinished-action')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add unfinished action' })
  @ApiBody({ type: AddUnfinishedActionDto })
  async addUnfinishedAction(@Req() req: Request, @Body() actionData: AddUnfinishedActionDto) {
    try {
      const userId = req.user['userId'];
      return await this.contextService.addUnfinishedAction(userId, actionData);
    } catch (error) {
      this.logger.error(`Error adding unfinished action: ${error.message}`);
      throw new InternalServerErrorException('Failed to add unfinished action');
    }
  }

  @Post('action-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete unfinished action' })
  @ApiBody({ type: CompleteActionDto })
  async completeAction(@Req() req: Request, @Body() { action }: CompleteActionDto) {
    try {
      const userId = req.user['userId'];
      this.logger.debug(`Completing action for user ${userId}: ${action}`);
      
      return await this.contextService.completeAction(userId, action);
    } catch (error) {
      this.logger.error(`Error completing action: ${error.message}`);
      throw new InternalServerErrorException('Failed to complete action');
    }
  }

  @Get('unfinished-actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unfinished actions' })
  async getUnfinishedActions(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.getContext(userId);
      
      return {
        unfinishedActions: context?.unfinishedActions || [],
        count: context?.unfinishedActions?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting unfinished actions: ${error.message}`);
      return { unfinishedActions: [], count: 0 };
    }
  }

  @Post('focus/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start focus session' })
  @ApiBody({ type: StartFocusSessionDto })
  async startFocusSession(@Req() req: Request, @Body() sessionData: StartFocusSessionDto) {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Starting focus session for user: ${userId}`);
      
      return await this.contextService.startFocusSession(userId, sessionData);
    } catch (error) {
      this.logger.error(`Error starting focus session: ${error.message}`);
      throw new InternalServerErrorException('Failed to start focus session');
    }
  }

  @Post('focus/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End focus session' })
  @ApiBody({ type: EndFocusSessionDto })
  async endFocusSession(@Req() req: Request, @Body() sessionData: EndFocusSessionDto) {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Ending focus session for user: ${userId}`);
      
      return await this.contextService.endFocusSession(userId, sessionData);
    } catch (error) {
      this.logger.error(`Error ending focus session: ${error.message}`);
      throw new InternalServerErrorException('Failed to end focus session');
    }
  }

  @Get('focus/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get focus session history' })
  async getFocusHistory(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.getContext(userId);
      
      return {
        sessions: context?.focusSessionHistory || [],
        totalMinutesToday: context?.totalFocusMinutesToday || 0,
        streak: context?.focusStreak || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting focus history: ${error.message}`);
      return { sessions: [], totalMinutesToday: 0, streak: 0 };
    }
  }

  @Post('collaborator')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Update collaborator context' })
  @ApiBody({ type: UpdateCollaboratorDto })
  async updateCollaborator(@Req() req: Request, @Body() collaboratorData: UpdateCollaboratorDto) {
    try {
      const userId = req.user['userId'];
      return await this.contextService.updateCollaborator(userId, collaboratorData);
    } catch (error) {
      this.logger.error(`Error updating collaborator: ${error.message}`);
      throw new InternalServerErrorException('Failed to update collaborator context');
    }
  }

  @Get('collaborators')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent collaborators' })
  async getRecentCollaborators(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.getContext(userId);
      
      return {
        collaborators: context?.recentCollaborators || [],
        count: context?.recentCollaborators?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting collaborators: ${error.message}`);
      return { collaborators: [], count: 0 };
    }
  }

  @Patch('workspace')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Update workspace state' })
  @ApiBody({ type: UpdateWorkspaceStateDto })
  async updateWorkspaceState(@Req() req: Request, @Body() workspaceData: UpdateWorkspaceStateDto) {
    try {
      const userId = req.user['userId'];
      return await this.contextService.updateWorkspaceState(userId, workspaceData);
    } catch (error) {
      this.logger.error(`Error updating workspace: ${error.message}`);
      throw new InternalServerErrorException('Failed to update workspace state');
    }
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({ summary: 'Session heartbeat' })
  async heartbeat(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.updateSessionActivity(userId);
      
      return { lastActiveAt: context.lastActiveAt };
    } catch (error) {
      this.logger.error(`Error recording heartbeat: ${error.message}`);
      throw new InternalServerErrorException('Failed to record heartbeat');
    }
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get session analytics' })
  async getSessionAnalytics(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      const context = await this.contextService.getContext(userId);
      
      return {
        sessionDurationMinutes: Math.floor((context?.sessionDuration || 0) / 60),
        totalFocusMinutesToday: context?.totalFocusMinutesToday || 0,
        focusStreak: context?.focusStreak || 0,
        dailySessionsCount: context?.dailySessionsCount || 0,
        contextSwitchCount: context?.contextSwitchCount || 0,
        restoreCount: context?.restoreCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting analytics: ${error.message}`);
      return {
        sessionDurationMinutes: 0,
        totalFocusMinutesToday: 0,
        focusStreak: 0,
        dailySessionsCount: 0,
        contextSwitchCount: 0,
        restoreCount: 0,
      };
    }
  }

  @Post('reset-daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset daily counters' })
  async resetDailyCounters(@Req() req: Request) {
    try {
      const userId = req.user['userId'];
      this.logger.log(`Resetting daily counters for user: ${userId}`);
      
      await this.contextService.resetDailyCounters(userId);
      
      return { message: 'Daily counters reset successfully' };
    } catch (error) {
      this.logger.error(`Error resetting daily counters: ${error.message}`);
      throw new InternalServerErrorException('Failed to reset daily counters');
    }
  }
}

/**
 * focus.controller.ts
 * REST API endpoints for focus sessions
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FocusService } from './focus.service';
import { SessionType } from './schemas/focus-session.schema';

/**
 * Start Session DTO
 */
class StartSessionDto {
  type: SessionType;
  duration: number; // minutes
  projectId?: string;
  goal?: string;
}

/**
 * Complete Session DTO
 */
class CompleteSessionDto {
  qualityRating?: number; // 1-5
  focusLevel?: number; // 1-10
  goalAchieved?: boolean;
  notes?: string;
}

@ApiTags('focus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/focus')
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  // ============================================
  // START SESSION
  // ============================================

  @Post('start')
  @ApiOperation({ summary: 'Start a new focus session' })
  @ApiResponse({ status: 201, description: 'Session started' })
  async startSession(@Body() data: StartSessionDto, @CurrentUser() user: any) {
    return this.focusService.startSession(user.id, data);
  }

  // ============================================
  // SESSION CONTROL
  // ============================================

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a session' })
  @ApiResponse({ status: 200, description: 'Session paused' })
  async pauseSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.focusService.pauseSession(id, user.id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a session' })
  @ApiResponse({ status: 200, description: 'Session resumed' })
  async resumeSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.focusService.resumeSession(id, user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a session' })
  @ApiResponse({ status: 200, description: 'Session completed' })
  async completeSession(
    @Param('id') id: string,
    @Body() feedback: CompleteSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.focusService.completeSession(id, user.id, feedback);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a session' })
  @ApiResponse({ status: 200, description: 'Session cancelled' })
  async cancelSession(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.focusService.cancelSession(id, user.id, body.reason);
  }

  // ============================================
  // SESSION UPDATES
  // ============================================

  @Post(':id/interruption')
  @ApiOperation({ summary: 'Record an interruption' })
  @ApiResponse({ status: 200, description: 'Interruption recorded' })
  async recordInterruption(@Param('id') id: string, @CurrentUser() user: any) {
    return this.focusService.recordInterruption(id, user.id);
  }

  @Post(':id/task')
  @ApiOperation({ summary: 'Add task to session' })
  @ApiResponse({ status: 200, description: 'Task added' })
  async addTask(
    @Param('id') id: string,
    @Body() body: { taskId: string },
    @CurrentUser() user: any,
  ) {
    return this.focusService.addTask(id, user.id, body.taskId);
  }

  @Post(':id/task/complete')
  @ApiOperation({ summary: 'Mark task as completed in session' })
  @ApiResponse({ status: 200, description: 'Task marked complete' })
  async completeTask(@Param('id') id: string, @CurrentUser() user: any) {
    return this.focusService.completeTask(id, user.id);
  }

  // ============================================
  // QUERIES
  // ============================================

  @Get('active')
  @ApiOperation({ summary: 'Get active session' })
  @ApiResponse({ status: 200, description: 'Active session retrieved' })
  async getActiveSession(@CurrentUser() user: any) {
    return this.focusService.getActiveSession(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get session history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getHistory(@Query('limit') limit: string, @CurrentUser() user: any) {
    return this.focusService.getSessionHistory(user.id, parseInt(limit) || 20);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get focus statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@Query('days') days: string, @CurrentUser() user: any) {
    return this.focusService.getUserStats(user.id, parseInt(days) || 30);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get project sessions' })
  @ApiResponse({ status: 200, description: 'Project sessions retrieved' })
  async getProjectSessions(@Param('projectId') projectId: string) {
    return this.focusService.getProjectSessions(projectId);
  }
}

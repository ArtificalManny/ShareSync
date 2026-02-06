// src/user-context/user-context.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTEXT CONTROLLER: "Welcome Back" Feature API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserContextService } from './user-context.service';
import {
  SaveContextDto,
  UpdateContextDto,
  AddUnfinishedActionDto,
  CompleteActionDto,
  StartFocusSessionDto,
  EndFocusSessionDto,
  UpdateCollaboratorDto,
  ContextSummaryResponseDto,
  UserContextResponseDto,
} from './dto/user-context.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('User Context')
@Controller('user-context')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserContextController {
  private readonly logger = new Logger(UserContextController.name);

  constructor(private readonly contextService: UserContextService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT RETRIEVAL
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get full user context' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User context retrieved',
    type: UserContextResponseDto,
  })
  async getContext(@Req() req: any) {
    const context = await this.contextService.getContext(req.user.userId);
    return {
      success: true,
      data: context,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get context summary for "Welcome Back" screen' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Context summary for welcome back experience',
    type: ContextSummaryResponseDto,
  })
  async getContextSummary(@Req() req: any) {
    const summary = await this.contextService.getContextSummary(req.user.userId);
    return {
      success: true,
      data: summary,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT UPDATES
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('save')
  @ApiOperation({ summary: 'Save current context (called on navigation)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Context saved' })
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // High frequency allowed
  async saveContext(@Req() req: any, @Body() dto: SaveContextDto) {
    const context = await this.contextService.saveContext(req.user.userId, dto);
    return {
      success: true,
      data: context,
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update user context and preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Context updated' })
  async updateContext(@Req() req: any, @Body() dto: UpdateContextDto) {
    const context = await this.contextService.updateContext(req.user.userId, dto);
    return {
      success: true,
      data: context,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFINISHED ACTIONS (Zeigarnik Effect)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('unfinished')
  @ApiOperation({ summary: 'Get unfinished actions' })
  async getUnfinishedActions(@Req() req: any) {
    const actions = await this.contextService.getUnfinishedActions(req.user.userId);
    return {
      success: true,
      data: actions,
    };
  }

  @Post('unfinished')
  @ApiOperation({ summary: 'Add an unfinished action' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Action added' })
  async addUnfinishedAction(
    @Req() req: any,
    @Body() dto: AddUnfinishedActionDto,
  ) {
    const context = await this.contextService.addUnfinishedAction(
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: context.unfinishedActions,
    };
  }

  @Post('action-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an unfinished action as complete' })
  async completeAction(@Req() req: any, @Body() dto: CompleteActionDto) {
    const result = await this.contextService.completeAction(
      req.user.userId,
      dto.action,
    );
    return {
      success: true,
      data: {
        completed: result.completed,
        remainingActions: result.context.unfinishedActions,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOCUS SESSIONS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('focus-sessions')
  @ApiOperation({ summary: 'Get recent focus sessions' })
  async getFocusSessions(@Req() req: any) {
    const sessions = await this.contextService.getFocusSessions(req.user.userId);
    return {
      success: true,
      data: sessions,
    };
  }

  @Post('focus/start')
  @ApiOperation({ summary: 'Start a focus session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Focus session started' })
  async startFocusSession(@Req() req: any, @Body() dto: StartFocusSessionDto) {
    const context = await this.contextService.startFocusSession(req.user.userId);
    return {
      success: true,
      data: {
        isInFocusMode: context.isInFocusMode,
        focusModeStartedAt: context.focusModeStartedAt,
      },
    };
  }

  @Post('focus/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a focus session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Focus session ended' })
  async endFocusSession(@Req() req: any, @Body() dto: EndFocusSessionDto) {
    const context = await this.contextService.endFocusSession(
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: {
        isInFocusMode: context.isInFocusMode,
        totalFocusMinutesToday: context.totalFocusMinutesToday,
        recentSession: context.recentFocusSessions[context.recentFocusSessions.length - 1],
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLABORATORS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('collaborators')
  @ApiOperation({ summary: 'Get recent collaborators' })
  async getRecentCollaborators(@Req() req: any) {
    const collaborators = await this.contextService.getRecentCollaborators(
      req.user.userId,
    );
    return {
      success: true,
      data: collaborators,
    };
  }

  @Post('collaborators')
  @ApiOperation({ summary: 'Update collaborator interaction' })
  async updateCollaborator(
    @Req() req: any,
    @Body() dto: UpdateCollaboratorDto,
  ) {
    const context = await this.contextService.updateCollaborator(
      req.user.userId,
      dto.userId,
    );
    return {
      success: true,
      data: context.recentCollaborators,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('session/start')
  @ApiOperation({ summary: 'Start a new session (called on app load)' })
  async startSession(@Req() req: any) {
    const context = await this.contextService.startSession(req.user.userId);
    return {
      success: true,
      data: {
        sessionStartedAt: context.sessionStartedAt,
      },
    };
  }

  @Post('session/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End session (called on app close)' })
  async endSession(@Req() req: any) {
    await this.contextService.endSession(req.user.userId);
    return {
      success: true,
      message: 'Session ended',
    };
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Session heartbeat (called every 30s)' })
  @Throttle({ default: { limit: 120, ttl: 60000 } }) // 2 per second max
  async heartbeat(@Req() req: any) {
    await this.contextService.heartbeat(req.user.userId);
  }
}

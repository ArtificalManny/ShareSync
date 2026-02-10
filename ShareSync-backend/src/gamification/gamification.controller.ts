// src/gamification/gamification.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION CONTROLLER: REST API for XP, badges, streaks, leaderboards
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GamificationService } from './gamification.service';
import { BadgeService } from './services/badge.service';
import { StreakService } from './services/streak.service';
import { LeaderboardService } from './services/leaderboard.service';

// ✅ NEW DTOs (safe additions)
import { AwardXpDto } from './dto/award-xp.dto';
import { StatsResponseDto } from './dto/stats-response.dto';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // USER STATS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get current user gamification stats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User stats retrieved',
    type: StatsResponseDto,
  })
  async getMyStats(@Req() req: any) {
    const stats = await this.gamificationService.getUserStats(req.user.userId);
    return { success: true, data: stats };
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get user gamification stats by ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User stats retrieved',
    type: StatsResponseDto,
  })
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.gamificationService.getUserStats(userId);
    return { success: true, data: stats };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // XP (GENERIC AWARD ENDPOINT)
  // ─────────────────────────────────────────────────────────────────────────────
  // This is intentionally separate from task completion, and uses your existing
  // gamificationService.awardXP() method (no refactor required).
  //
  // POST /api/gamification/xp/award
  // Body: { amount, source, sourceId?, description?, multiplier?, isBonus?, isLegendary?, metadata? }
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('xp/award')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Award XP to the current user (generic non-task awards)' })
  @ApiBody({ type: AwardXpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'XP awarded successfully',
  })
  async awardXp(@Req() req: any, @Body() dto: AwardXpDto) {
    // Keep metadata flexible but structured
    const metadata = {
      sourceId: dto.sourceId,
      description: dto.description,
      multiplier: dto.multiplier,
      isBonus: dto.isBonus,
      isLegendary: dto.isLegendary,
      ...(dto.metadata || {}),
    };

    // Uses your existing method: awardXP(userId, amount, source, metadata?)
    await this.gamificationService.awardXP(req.user.userId, dto.amount, dto.source, metadata);

    // Return your frontend-friendly shape (same as /stats)
    const stats = await this.gamificationService.getUserStats(req.user.userId);
    return { success: true, data: stats };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BADGES
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges(@Req() req: any) {
    const badges = await this.badgeService.getAllBadges(req.user.userId);
    return { success: true, data: badges };
  }

  @Get('badges/earned')
  @ApiOperation({ summary: 'Get user earned badges' })
  async getEarnedBadges(@Req() req: any) {
    const badges = await this.badgeService.getEarnedBadges(req.user.userId);
    return { success: true, data: badges };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAKS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('streak')
  @ApiOperation({ summary: 'Get user streak info' })
  async getStreak(@Req() req: any) {
    const streak = await this.streakService.getStreakStatus(req.user.userId);
    return { success: true, data: streak };
  }

  @Post('streak/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use a streak freeze' })
  async useStreakFreeze(@Req() req: any) {
    const result = await this.streakService.useStreakFreeze(req.user.userId);
    return { success: true, data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LEADERBOARDS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiQuery({
    name: 'type',
    enum: ['all_time', 'weekly', 'monthly', 'streak'],
    required: false,
  })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getLeaderboard(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const leaderboard = await this.leaderboardService.getLeaderboard(
      (type as any) || 'all_time',
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: leaderboard };
  }

  @Get('leaderboard/project/:projectId')
  @ApiOperation({ summary: 'Get project leaderboard' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({
    name: 'type',
    enum: ['all_time', 'weekly', 'monthly', 'streak'],
    required: false,
  })
  async getProjectLeaderboard(
    @Param('projectId') projectId: string,
    @Query('type') type?: string,
  ) {
    const leaderboard = await this.leaderboardService.getProjectLeaderboard(
      projectId,
      (type as any) || 'all_time',
    );
    return { success: true, data: leaderboard };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HALL OF FAME
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('hall-of-fame')
  @ApiOperation({ summary: 'Get Hall of Fame entries' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getHallOfFame(@Query('limit') limit?: string) {
    const entries = await this.leaderboardService.getHallOfFame({
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return { success: true, data: entries };
  }
}

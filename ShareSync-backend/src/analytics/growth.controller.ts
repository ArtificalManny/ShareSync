// src/analytics/growth.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH ANALYTICS CONTROLLER
// Routes: GET /analytics/growth/:userId/(skills|evolution|suggestions|trends)
// Powers the Profile page's Growth Track system with real behavioral data.
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SelfOnlyGuard } from '../common/guards/self-only.guard';
import { GrowthService } from './growth.service';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

const ALLOWED_TREND_METRICS = new Set([
  'all',
  'velocity',
  'quality',
  'collaboration',
  'overall',
]);

@ApiTags('Growth Analytics')
@ApiBearerAuth()
// openshare-self-only-v1 (R52): growth data names your Moves and their projects,
// so only you get yours.
@UseGuards(JwtAuthGuard, SelfOnlyGuard)
@Controller('analytics/growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get(':userId/skills')
  @ApiOperation({ summary: 'Get skill radar chart data from real task patterns' })
  async getSkillProfile(@Param('userId') userId: string) {
    this.validateUserId(userId);
    const data = await this.growthService.getSkillProfile(userId);
    return { success: true, data };
  }

  @Get(':userId/evolution')
  @ApiOperation({ summary: 'Get milestone timeline from completed tasks and achievements' })
  async getEvolution(@Param('userId') userId: string) {
    this.validateUserId(userId);
    const data = await this.growthService.getEvolutionMoments(userId);
    return { success: true, data };
  }

  @Get(':userId/suggestions')
  @ApiOperation({ summary: 'Get AI-generated growth suggestions from behavioral patterns' })
  async getSuggestions(@Param('userId') userId: string) {
    this.validateUserId(userId);
    const data = await this.growthService.getGrowthSuggestions(userId);
    return { success: true, data };
  }

  @Get(':userId/trends')
  @ApiOperation({ summary: 'Get trend lines for velocity, quality, collaboration, and overall growth' })
  async getTrends(
    @Param('userId') userId: string,
    @Query('metric') metric = 'all',
    @Query('weeks') weeks = '12',
  ) {
    this.validateUserId(userId);

    const safeMetric = this.validateTrendMetric(metric);
    const safeWeeks = this.parseWeeks(weeks);

    const data = await this.growthService.getGrowthTrends(userId, safeMetric, safeWeeks);

    return { success: true, data };
  }

  private validateUserId(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }
  }

  private validateTrendMetric(metric: string): string {
    const safeMetric = String(metric || 'all').toLowerCase();

    if (!ALLOWED_TREND_METRICS.has(safeMetric)) {
      throw new BadRequestException(
        'Invalid metric. Use one of: all, velocity, quality, collaboration, overall'
      );
    }

    return safeMetric;
  }

  private parseWeeks(weeks: string): number {
    const parsed = Number.parseInt(String(weeks || '12'), 10);

    if (!Number.isFinite(parsed)) {
      return 12;
    }

    return Math.min(Math.max(parsed, 1), 52);
  }
}

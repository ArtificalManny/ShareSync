// src/analytics/growth.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH ANALYTICS CONTROLLER
// Routes: GET /analytics/growth/:userId/(skills|evolution|suggestions|trends)
// Powers the Profile page's Growth Track system with real behavioral data.
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GrowthService } from './growth.service';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Growth Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({ summary: 'Get 12-week trend lines for velocity, quality, collaboration' })
  async getTrends(
    @Param('userId') userId: string,
    @Query('metric') metric = 'all',
    @Query('weeks') weeks = '12',
  ) {
    this.validateUserId(userId);
    const data = await this.growthService.getGrowthTrends(userId, metric, parseInt(weeks, 10) || 12);
    return { success: true, data };
  }

  private validateUserId(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }
  }
}

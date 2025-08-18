// src/analytics/user-stats.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StatsService } from './stats.service';

// Final route => /api/users/me/stats (global prefix 'api' applied elsewhere)
@Controller('users')
export class UserStatsController {
  constructor(private readonly stats: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getMyStats(
    @Req() req: any,
    @Query('range') range: '7' | '30' | '90' = '30',
    @Query('projectId') projectId?: string, // optional filter
  ) {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    return this.stats.userStats(userId, range, projectId);
  }
}
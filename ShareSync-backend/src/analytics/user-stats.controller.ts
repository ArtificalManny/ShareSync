import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';

@Controller('analytics/user')
export class UserStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get(':userId')
  async get(
    @Param('userId') userId: string,
    @Query('range') range = '30',
    @Query('projectId') projectId?: string,
  ) {
    const r = Math.max(1, parseInt(String(range), 10) || 30);
    return this.stats.getUserStats(userId, { range: r, projectId });
  }
}
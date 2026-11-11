import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectReadAccess, ProjectReadAccessGuard } from '../common/guards/project-read-access.guard';
import { StatsService } from '../stats/stats.service';

// openshare-project-read-access-v1 (R52): needs a signed-in user, and a
// project's numbers only for someone who may read that project.
@Controller('analytics/user')
@UseGuards(JwtAuthGuard, ProjectReadAccessGuard)
@ProjectReadAccess({ query: 'projectId', optional: true })
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
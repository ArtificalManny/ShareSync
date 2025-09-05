import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';

@Controller('analytics/project')
export class ProjectStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Query('range') range = '30',
  ) {
    const r = Math.max(1, parseInt(String(range), 10) || 30);
    return this.stats.getProjectStats(id, { range: r });
  }
}

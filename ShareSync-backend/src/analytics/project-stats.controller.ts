// src/analytics/project-stats.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StatsService } from './stats.service';

// Final route => /api/projects/:id/stats
@Controller('projects')
export class ProjectStatsController {
  constructor(private readonly stats: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  async getProjectStats(
    @Param('id') id: string,
    @Query('range') range: '7' | '30' | '90' = '30',
  ) {
    return this.stats.projectStats(id, range);
  }
}
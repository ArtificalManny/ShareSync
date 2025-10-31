// src/analytics/project-stats.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionGuard, CanViewProject } from '../projects/guards/project-permission.guard';
import { StatsService } from '../stats/stats.service';

@Controller('projects/:id/stats')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class ProjectStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @CanViewProject()
  async getProjectStats(@Param('id') id: string) {
    return this.stats.getProjectStats(id);
  }
}
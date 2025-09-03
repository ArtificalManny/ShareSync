// src/stats/stats.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionGuard, CanViewProject } from '../projects/guards/project-permission.guard';
import { StatsService } from './stats.service';

@Controller('projects/:id/stats')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @CanViewProject()
  async getProjectStats(@Param('id') id: string) {
    // Return KPIs + insights in one payload
    const data = await this.stats.computeProjectStats(id);
    return data;
  }
}

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
    const data = await this.stats.computeProjectStats(id);
    return data;
  }
}

// NEW: Global leaderboard
@Controller('stats')
@UseGuards(JwtAuthGuard)
export class GlobalStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    return this.stats.getTopMomentum(10);
  }
}
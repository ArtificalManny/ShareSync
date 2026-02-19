// src/milestones/project-milestones.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilestonesService } from './milestones.service';

@Controller('projects/:projectId/milestones')
@UseGuards(JwtAuthGuard)
export class ProjectMilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  private now() {
    return new Date().toISOString();
  }

  /**
   * ✅ Roadmap endpoint
   * GET /api/projects/:projectId/milestones
   *
   * Returns milestones with computed progress:
   * progress = doneTasks / totalTasks where tasks have milestoneId
   */
  @Get()
  async list(@Param('projectId') projectId: string) {
    const milestones = await this.milestonesService.findByProjectWithProgress(projectId);
    return { success: true, data: milestones, timestamp: this.now() };
  }
}

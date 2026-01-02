import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ) {
    return this.activitiesService.getProjectActivities(projectId, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      type,
    });
  }

  @Post()
  async createActivity(
    @Param('projectId') projectId: string,
    @Request() req,
    @Body() body: {
      action: string;
      details?: Record<string, any>;
      metadata?: any;
    },
  ) {
    return this.activitiesService.logActivity({
      projectId,
      userId: req.user.userId,
      action: body.action,
      details: body.details,
      metadata: body.metadata,
    });
  }
}

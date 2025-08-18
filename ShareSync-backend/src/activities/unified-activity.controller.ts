// src/activities/unified-activity.controller.ts
import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ActivityQueryService } from './activity.query.service';

@Controller('activity')
export class UnifiedActivityController {
  constructor(private readonly activityQuery: ActivityQueryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getActivity(
    @Req() req: any,
    @Query('scope') scope: 'user' | 'project' = 'user',
    @Query('projectId') projectId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? Number(limitStr) : 20;
    if (Number.isNaN(limit)) {
      throw new BadRequestException('limit must be a number');
    }

    if (scope === 'user') {
      const userId = req.user?.sub || req.user?.id || req.user?._id;
      if (!userId) throw new BadRequestException('Missing user id from auth token');

      return this.activityQuery.getUserActivity({
        userId,
        projectId,
        cursor: cursor || null,
        limit,
      });
    }

    if (scope === 'project') {
      if (!projectId) throw new BadRequestException('projectId is required when scope=project');
      return this.activityQuery.getProjectActivity({
        projectId,
        cursor: cursor || null,
        limit,
      });
    }

    throw new BadRequestException('scope must be "user" or "project"');
  }
}

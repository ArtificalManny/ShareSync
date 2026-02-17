// src/activities/activities.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES CONTROLLER (3.6)
// Routes:
//   GET  /api/projects/:projectId/activity      (read)
//   POST /api/projects/:projectId/activity/test (write - dev smoke test)
// Enforces:
//   • private/team → members only
//   • public → read allowed (non-members), write still members
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from './activities.service';

import { ProjectAccessGuard, ProjectAccess } from '../common/guards/project-access.guard';

@Controller('projects/:projectId/activity')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  @ProjectAccess({ param: 'projectId', intent: 'read', allowPublicRead: true })
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  async listProjectActivity(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursor?: string,
    @Query('type') type?: string,
    @Query('entityId') entityId?: string,
  ) {
    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid projectId');
    }

    if (entityId && !Types.ObjectId.isValid(entityId)) {
      throw new BadRequestException('Invalid entityId');
    }

    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) {
      throw new BadRequestException('Missing user identity');
    }

    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(String(limitRaw ?? '20'), 10) || 20),
    );

    return this.activities.listProject({
      projectId,
      userId,
      limit,
      cursor: cursor || null,
      type: type || null,
      entityId: entityId || null,
    });
  }

  // ✅ Dev-only smoke test: proves writes hit Mongo and show up in GET + mongosh.
  @Post('test')
  @ProjectAccess({ param: 'projectId', intent: 'write' })
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  async createTestActivity(@Req() req: any, @Param('projectId') projectId: string) {
    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid projectId');
    }

    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) {
      throw new BadRequestException('Missing user identity');
    }

    try {
      const saved = await this.activities.record({
        userId: String(userId),
        projectId,
        type: 'debug.test',
        entityType: 'PROJECT',
        entityId: projectId,
        action: 'comment_added',
        details: { message: 'Activity write smoke test' },
        metadata: { via: 'POST /projects/:projectId/activity/test' },
        payload: {},
      });

      return { success: true, data: saved };
    } catch (err: any) {
      const msg = err?.message || String(err);
      throw new InternalServerErrorException(`Activity test failed: ${msg}`);
    }
  }
}

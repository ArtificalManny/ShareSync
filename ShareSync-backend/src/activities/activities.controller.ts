// src/activities/activities.controller.ts
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

@Controller('projects/:projectId/activity')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
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
  @UseGuards(JwtAuthGuard)
  @Post('test')
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
        action: 'comment_added', // keep it inside enum to avoid schema enum rejects
        details: { message: 'Activity write smoke test' },
        metadata: { via: 'POST /projects/:projectId/activity/test' },
        payload: {},
      });

      return { success: true, data: saved };
    } catch (err: any) {
      // Surface the real reason (dev only)
      const msg = err?.message || String(err);
      throw new InternalServerErrorException(`Activity test failed: ${msg}`);
    }
  }
}

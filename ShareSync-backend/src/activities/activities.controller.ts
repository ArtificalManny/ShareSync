// src/activities/activities.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard'; // <- keep this path consistent with your repo
import { ActivitiesService } from './activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateActivityDto } from './dto/create-activity.dto';

type AnyObj = Record<string, any>;

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateActivityDto,
  ) {
    const userId: string = req.user?.sub || req.user?.id || req.user?._id;

    // ✅ Match service signature exactly: (projectId, userId, dto)
    const created = await this.activities.create(dto.projectId, userId, dto);

    const createdAny = created as AnyObj;
    const payload = {
      _id: String(createdAny?._id ?? ''),
      type: createdAny?.type ?? dto.type ?? 'update',
      text: createdAny?.text ?? dto.text ?? '',
      meta: createdAny?.meta ?? dto.meta ?? {},
      userId,
      projectId: String(dto.projectId),
      createdAt: createdAny?.createdAt ?? new Date().toISOString(),
    };

    // Realtime fan-out
    this.realtime.emitToProject(dto.projectId, 'activity:new', payload);
    this.realtime.emitToProject(dto.projectId, 'project:statsUpdated', { projectId: dto.projectId });
    this.realtime.emitToUser(userId, 'user:statsUpdated', { userId });

    return created;
  }
}

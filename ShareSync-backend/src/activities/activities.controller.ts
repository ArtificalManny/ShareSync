// src/activities/activities.controller.ts
import { Body, Controller, Get, Post, UseGuards, Req, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AnyObj = Record<string, any>;

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // POST /api/activities
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateActivityDto) {
    const userId: string = req.user?.sub || req.user?.id || req.user?._id;
    const projectId: string = dto.projectId;

    const created = await this.activities.create(projectId, userId, dto);

    const createdAny = created as AnyObj;
    const payload = {
      _id: String(createdAny?._id ?? ''),
      type: createdAny?.type ?? dto.type ?? 'update',
      text: createdAny?.text ?? dto.text ?? '',
      meta: createdAny?.meta ?? dto.meta ?? {},
      userId,
      projectId,
      createdAt: createdAny?.createdAt ?? new Date().toISOString(),
    };

    this.realtime.emitToProject(projectId, 'activity:new', payload);
    this.realtime.emitToProject(projectId, 'project:statsUpdated', { projectId });
    this.realtime.emitToUser(userId, 'user:statsUpdated', { userId });

    return created;
  }

  // GET /api/activities?scope=user|project&projectId=...&range=30
  // Light stub so charts/feeds don’t error while wiring real data
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any, @Query() q: any) {
    const scope = (q.scope || 'user').toString();
    const projectId = q.projectId ? String(q.projectId) : null;
    const range = Math.min(90, parseInt(q.range || '30', 10) || 30);

    const today = new Date();
    const items = Array.from({ length: range }).map((_, i) => {
      const d = new Date(+today - (range - i - 1) * 24 * 3600 * 1000);
      return { date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 5) };
    });

    return { scope, projectId, items, nextCursor: null };
  }
}
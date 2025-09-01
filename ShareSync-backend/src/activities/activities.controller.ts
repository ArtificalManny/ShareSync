// src/activities/activities.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ActivitiesService, ListParams } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotifyService } from '../notifications/notify.service';

// NEW: permissions
import {
  ProjectPermissionGuard,
  CanEditProject,
  CanViewProject,
} from '../projects/guards/project-permission.guard';

type AnyObj = Record<string, any>;

function coerceRange(input: unknown): '24h' | '7d' | '30d' | 'all' {
  const v = String(input ?? '').trim().toLowerCase();
  if (v === '24h' || v === '7d' || v === '30d' || v === 'all') return v as any;
  if (v === '1' || v === '1d' || v === '24') return '24h';
  if (v === '7' || v === '07' || v === '7d') return '7d';
  if (v === '30' || v === '30d') return '30d';
  return '7d';
}

@Controller('activities')
@UseGuards(JwtAuthGuard) // all routes require auth
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,
    private readonly notify: NotifyService,
  ) {}

  // POST /api/activities  (project-scoped create → must be able to EDIT the project)
  // Guard will read projectId from body (fallbacks to params/query if present).
  @UseGuards(ProjectPermissionGuard)
  @CanEditProject()
  @Post()
  async create(@Req() req: any, @Body() dto: CreateActivityDto) {
    const userId: string = req.user?.sub || req.user?.id || req.user?._id;
    const projectId: string = (dto as AnyObj)?.projectId;

    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const created = await this.activities.create(projectId, userId, dto);

    const payload = {
      _id: String((created as AnyObj)?._id ?? ''),
      type: (created as AnyObj)?.type ?? dto.type ?? 'update',
      text: (created as AnyObj)?.text ?? dto.text ?? '',
      meta: (created as AnyObj)?.meta ?? dto.meta ?? {},
      userId,
      projectId,
      createdAt: (created as AnyObj)?.createdAt ?? new Date().toISOString(),
    };

    // Fan-out to sockets
    this.realtime.emitToProject(projectId, 'activity:new', payload);
    this.realtime.emitToProject(projectId, 'project:statsUpdated', { projectId });
    this.realtime.emitToUser(userId, 'user:statsUpdated', { userId });

    // Mentions → in-app notifications (best-effort; never block the request)
    const text: string = dto?.text || '';
    const metaObj: AnyObj = (dto && typeof dto.meta === 'object' ? dto.meta : {}) || {};
    const mentionedUserIds: string[] = Array.isArray(metaObj.mentions) ? metaObj.mentions : [];

    if (mentionedUserIds.length) {
      for (const uid of mentionedUserIds) {
        if (!uid) continue;
        try {
          this.notify.inApp({
            userId: uid,
            title: 'Mention',
            message: 'You were mentioned in a project update',
            href: `/projects/${projectId}`,
            priority: 'mention',
            meta: { projectId, activityId: (created as AnyObj)?._id },
          });
          this.notify.inApp({
            userId: uid,
            message: `You were mentioned: "${text}"`,
            href: `/projects/${projectId}`,
            priority: 'mention',
          });
        } catch {
          // swallow notify errors; logging can live inside NotifyService
        }
      }
    }

    return created;
  }

  // GET /api/activities?scope=user|project&projectId=&userId=&type=&range=&cursor=&limit=
  // - user scope: just needs auth (already enforced)
  // - project scope: must be able to VIEW the project
  @Get()
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject() // Guard will no-op when there's no projectId (user scope)
  async list(@Req() req: any, @Query() query: AnyObj) {
    const scope = ((query.scope as string) || 'user').toLowerCase();
    if (scope !== 'user' && scope !== 'project') {
      throw new BadRequestException('scope must be "user" or "project"');
    }

    const params: ListParams = {
      scope,
      userId:
        (query.userId as string) ||
        (scope === 'user' ? (req.user?.sub || req.user?.id || req.user?._id) : undefined),
      projectId: (query.projectId as string) || undefined,
      type: (query.type as string) || undefined,
      range: coerceRange(query.range),
      cursor: (query.cursor as string) || null,
      limit: Number.isFinite(Number(query.limit)) ? Number(query.limit) : 20,
    };

    if (scope === 'project' && !params.projectId) {
      throw new BadRequestException('projectId is required when scope=project');
    }

    return this.activities.list(params);
  }

  // GET /api/activities/export.csv?... (same permission rules as list)
  @Get('export.csv')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async export(@Req() req: any, @Query() query: AnyObj, @Res() res: Response) {
    const scope = ((query.scope as string) || 'user').toLowerCase();
    if (scope !== 'user' && scope !== 'project') {
      throw new BadRequestException('scope must be "user" or "project"');
    }

    const params: ListParams = {
      scope,
      userId:
        (query.userId as string) ||
        (scope === 'user' ? (req.user?.sub || req.user?.id || req.user?._id) : undefined),
      projectId: (query.projectId as string) || undefined,
      type: (query.type as string) || undefined,
      range: coerceRange(query.range),
      cursor: (query.cursor as string) || null,
      limit: Number.isFinite(Number(query.limit)) ? Number(query.limit) : 1000,
    };

    if (scope === 'project' && !params.projectId) {
      throw new BadRequestException('projectId is required when scope=project');
    }

    const { items } = await this.activities.list(params);
    const csv = this.activities.toCsv(items);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_export.csv"');
    res.send(csv);
  }
}
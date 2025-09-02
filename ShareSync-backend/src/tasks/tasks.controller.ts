// src/tasks/tasks.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService, CreateTaskDto, PatchTaskDto } from './tasks.service';
import { ProjectPermissionGuard, CanViewProject, CanEditProject } from '../projects/guards/project-permission.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** List tasks for a project (viewer/member/owner) */
  @Get()
  @CanViewProject()
  async list(
    @Param('projectId') projectId: string,
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    const n = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    return this.tasks.list(projectId, n, cursor || null);
  }

  /** Create task (member/owner) */
  @Post()
  @CanEditProject()
  async create(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    if (!dto?.title || !dto.title.trim()) {
      throw new BadRequestException('title is required');
    }
    const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
    const created = await this.tasks.create(projectId, userId, dto);

    // realtime
    this.realtime.emitToProject(projectId, 'tasks:created', {
      projectId,
      task: {
        ...(created?.toObject?.() ?? created),
      },
    });

    return created;
  }

  /** Patch task (member/owner) */
  @Patch(':taskId')
  @CanEditProject()
  async patch(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() patch: PatchTaskDto,
  ) {
    const updated = await this.tasks.patch(projectId, taskId, patch);

    // realtime
    this.realtime.emitToProject(projectId, 'tasks:updated', {
      projectId,
      task: updated,
    });

    return updated;
  }
}

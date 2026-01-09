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
import {
  ProjectPermissionGuard,
  CanViewProject,
  CanEditProject,
} from '../projects/guards/project-permission.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller(['projects/:projectId/tasks', 'projects/:id/tasks'])
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private getProjectParam(params: Record<string, string>) {
    return params.projectId ?? params.id;
  }

  @Get()
  @CanViewProject()
  async list(
    @Param() params: any,
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    const projectId = this.getProjectParam(params);
    const n = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    return this.tasks.list(projectId, n, cursor || null);
  }

  @Post()
  @CanEditProject()
  async create(@Req() req: any, @Param() params: any, @Body() dto: CreateTaskDto) {
    if (!dto?.title || !dto.title.trim()) {
      throw new BadRequestException('title is required');
    }
    const projectId = this.getProjectParam(params);
    const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
    const created = await this.tasks.create(projectId, userId, dto);

    // FIX: Cast to any first to avoid TS2590
    const createdDoc: any = created;
    const taskObject = createdDoc?.toObject?.() ?? createdDoc;

    this.realtime.emitToProject(projectId, 'tasks:created', {
      projectId,
      task: { ...taskObject },
    });

    return created;
  }

  @Patch(':taskId')
  @CanEditProject()
  async patch(
    @Param() params: any,
    @Param('taskId') taskId: string,
    @Body() patch: PatchTaskDto,
  ) {
    const projectId = this.getProjectParam(params);
    const updated = await this.tasks.patch(projectId, taskId, patch);

    this.realtime.emitToProject(projectId, 'tasks:updated', {
      projectId,
      task: updated,
    });

    return updated;
  }
}

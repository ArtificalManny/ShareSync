// src/tasks/project-tasks.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT TASKS CONTROLLER (3.6)
// Owns project-scoped task routes:
//   GET  /api/projects/:projectId/tasks   (read)
//   POST /api/projects/:projectId/tasks  (write)
// Enforces:
//   • private/team → members only
//   • public → read allowed (non-members), write still members
//   • projectId is derived ONLY from URL param (cannot be spoofed via body)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

import { ProjectAccessGuard, ProjectAccess } from '../common/guards/project-access.guard';

@ApiTags('Project Tasks')
@Controller('projects/:projectId/tasks')
@ApiBearerAuth()
export class ProjectTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get tasks for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ProjectAccess({ param: 'projectId', intent: 'read', allowPublicRead: true })
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  async listByProject(
    @Req() req: any,
    @Param('projectId', ParseObjectIdPipe) projectId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    // Keep existing flow (TasksService may already enforce access)
    // Guard enforces Step 3.6 at the edge.
    const result = await this.tasksService.find(userId, { projectId });

    return {
      success: true,
      data: result.tasks,
      meta: {
        total: result.total,
        limit: 50,
        offset: 0,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a task in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created' })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    // Optional role gate if you want it:
    // roles: ['owner', 'admin', 'member'],
  })
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  async createInProject(
    @Req() req: any,
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Body() dto: CreateProjectTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    // 3.2 ENFORCEMENT: projectId cannot be spoofed in body
    const rawBody = (req as any)?.body as any;
    if (rawBody && typeof rawBody === 'object' && rawBody.projectId !== undefined) {
      throw new BadRequestException(
        'Do not send projectId in body. Use the /projects/:projectId/tasks route.',
      );
    }

    const task = await this.tasksService.create(userId, {
      ...(dto as any),
      projectId,
    });

    return {
      success: true,
      data: task,
    };
  }
}

// src/tasks/project-tasks.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT TASKS CONTROLLER
// Owns project-scoped task routes:
//   GET  /api/projects/:projectId/tasks
//   POST /api/projects/:projectId/tasks
// Uses existing TasksService to avoid refactors.
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

@ApiTags('Project Tasks')
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get tasks for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async listByProject(
    @Req() req: any,
    @Param('projectId', ParseObjectIdPipe) projectId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    // Reuse existing service method (ensures access control via ProjectsService)
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
  async createInProject(
    @Req() req: any,
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Body() dto: CreateProjectTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    // Convert to CreateTaskDto shape expected by tasksService.create
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

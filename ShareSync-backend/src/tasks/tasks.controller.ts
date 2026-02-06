// src/tasks/tasks.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS CONTROLLER: REST API with Gamification Events
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService, TaskQueryOptions } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  UpdateTaskDto,
  MoveTaskDto,
  CompleteTaskDto,
  AddCommentDto,
  LogTimeDto,
} from './dto/update-task.dto';
import { TaskStatus, TaskPriority } from './schemas/task.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async create(@Req() req: any, @Body() dto: CreateTaskDto) {
    const task = await this.tasksService.create(req.user.userId, dto);
    return {
      success: true,
      data: task,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get tasks with filters' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'sprintId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'isBlocking', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async find(
    @Req() req: any,
    @Query('projectId') projectId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('sprintId') sprintId?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('isBlocking') isBlocking?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: TaskQueryOptions = {
      projectId,
      assigneeId,
      status,
      priority,
      sprintId,
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      isBlocking: isBlocking ? isBlocking === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    const result = await this.tasksService.find(req.user.userId, options);
    return {
      success: true,
      data: result.tasks,
      meta: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      },
    };
  }

  @Get('board')
  @ApiOperation({ summary: 'Get Kanban board for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'sprintId', required: false })
  async getBoard(
    @Req() req: any,
    @Query('projectId') projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const board = await this.tasksService.getKanbanBoard(
      projectId,
      req.user.userId,
      sprintId,
    );
    return {
      success: true,
      data: board,
    };
  }

  @Get('stack')
  @ApiOperation({ summary: 'Get priority stack for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getStack(
    @Req() req: any,
    @Query('projectId') projectId: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('limit') limit?: string,
  ) {
    const stack = await this.tasksService.getPriorityStack(
      projectId,
      req.user.userId,
      assigneeId,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      data: stack,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const task = await this.tasksService.findByIdWithAccess(id, req.user.userId);
    return {
      success: true,
      data: task,
    };
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks of a task' })
  @ApiParam({ name: 'id', description: 'Parent task ID' })
  async getSubtasks(@Req() req: any, @Param('id') id: string) {
    const subtasks = await this.tasksService.getSubtasks(id, req.user.userId);
    return {
      success: true,
      data: subtasks,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(id, req.user.userId, dto);
    return {
      success: true,
      data: task,
    };
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a task (status/order change)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async move(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ) {
    const task = await this.tasksService.move(id, req.user.userId, dto);
    return {
      success: true,
      data: task,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPLETE (Gamification Trigger!)
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a task (triggers ceremony & XP)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task completed with XP and ceremony data',
  })
  async complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
  ) {
    const result = await this.tasksService.complete(id, req.user.userId, dto);
    return {
      success: true,
      data: {
        task: result.task,
        ceremony: {
          xpAwarded: result.xpAwarded,
          bonusXP: result.bonusXP,
          isLegendary: result.isLegendary,
          tier: result.ceremonyTier,
          unblockedCount: result.unblocked.length,
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.tasksService.delete(id, req.user.userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
  ) {
    const task = await this.tasksService.addComment(id, req.user.userId, dto);
    return {
      success: true,
      data: task,
    };
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  async deleteComment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const task = await this.tasksService.deleteComment(
      id,
      commentId,
      req.user.userId,
    );
    return {
      success: true,
      data: task,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TIME LOGGING
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/time')
  @ApiOperation({ summary: 'Log time on a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async logTime(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: LogTimeDto,
  ) {
    const task = await this.tasksService.logTime(id, req.user.userId, dto);
    return {
      success: true,
      data: task,
    };
  }
}

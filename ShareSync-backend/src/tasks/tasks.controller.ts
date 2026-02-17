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
  Request,
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
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

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
  // PRIORITIES (MUST BE BEFORE ANY :id ROUTES)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('priorities')
  @ApiOperation({ summary: 'Get my priority tasks (top N)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPriorityTasks(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    this.logger.log(`Getting priority tasks for user: ${userId}`);

    const tasks = await this.tasksService.getMyPriorityTasks(
      userId,
      limit ? parseInt(limit, 10) : 3,
    );

    return { success: true, data: tasks };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async create(@Req() req: any, @Body() dto: CreateTaskDto) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.create(userId, dto);
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

    const userId = req.user?.sub || req.user?.userId;
    const result = await this.tasksService.find(userId, options);

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
    @Query('projectId', ParseObjectIdPipe) projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const board = await this.tasksService.getKanbanBoard(projectId, userId, sprintId);
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
    @Query('projectId', ParseObjectIdPipe) projectId: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const stack = await this.tasksService.getPriorityStack(
      projectId,
      userId,
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
  async findOne(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.findByIdWithAccess(id, userId);
    return {
      success: true,
      data: task,
    };
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks of a task' })
  @ApiParam({ name: 'id', description: 'Parent task ID' })
  async getSubtasks(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const subtasks = await this.tasksService.getSubtasks(id, userId);
    return {
      success: true,
      data: subtasks,
    };
  }
    @Patch(':id')
  @ApiOperation({ summary: 'Patch a task (partial update)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async patch(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.update(id, userId, dto);
    return {
      success: true,
      data: task,
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.update(id, userId, dto);
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: MoveTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.move(id, userId, dto);
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CompleteTaskDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.tasksService.complete(id, userId, dto);
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
  async delete(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.tasksService.delete(id, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addComment(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddCommentDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.addComment(id, userId, dto);
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('commentId', ParseObjectIdPipe) commentId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.deleteComment(id, commentId, userId);
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: LogTimeDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const task = await this.tasksService.logTime(id, userId, dto);
    return {
      success: true,
      data: task,
    };
  }
}

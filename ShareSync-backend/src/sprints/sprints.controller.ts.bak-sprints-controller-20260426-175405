// src/sprints/sprints.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS CONTROLLER: REST API
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SprintsService } from './sprints.service';
import {
  CreateSprintDto,
  UpdateSprintDto,
  SprintQueryDto,
  AddTasksToSprintDto,
  UpdateGoalProgressDto,
  SprintRetrospectiveDto,
} from './dto/sprint.dto';
import { SprintStatus } from './schemas/sprint.schema';

@ApiTags('Sprints')
@Controller('sprints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SprintsController {
  private readonly logger = new Logger(SprintsController.name);

  constructor(private readonly sprintsService: SprintsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new sprint' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Sprint created' })
  async create(@Req() req: any, @Body() dto: CreateSprintDto) {
    const sprint = await this.sprintsService.create(req.user.userId, dto);
    return {
      success: true,
      data: sprint,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all sprints for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'status', enum: SprintStatus, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query() query: SprintQueryDto,
  ) {
    const result = await this.sprintsService.findByProject(projectId, query);
    return {
      success: true,
      data: result.sprints,
      meta: {
        total: result.total,
      },
    };
  }

  @Get('project/:projectId/active')
  @ApiOperation({ summary: 'Get active sprint for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findActiveSprint(@Param('projectId') projectId: string) {
    const sprint = await this.sprintsService.findActiveSprint(projectId);
    return {
      success: true,
      data: sprint,
    };
  }

  @Get('project/:projectId/current')
  @ApiOperation({ summary: 'Get current or upcoming sprint' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findCurrentOrUpcoming(@Param('projectId') projectId: string) {
    const sprint = await this.sprintsService.findCurrentOrUpcoming(projectId);
    return {
      success: true,
      data: sprint,
    };
  }

  @Get('project/:projectId/velocity')
  @ApiOperation({ summary: 'Get project velocity' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'sprintCount', type: Number, required: false })
  async getProjectVelocity(
    @Param('projectId') projectId: string,
    @Query('sprintCount') sprintCount?: string,
  ) {
    const velocity = await this.sprintsService.getProjectVelocity(
      projectId,
      sprintCount ? parseInt(sprintCount, 10) : 5,
    );
    return {
      success: true,
      data: velocity,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sprint by ID' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async findById(@Param('id') id: string) {
    const sprint = await this.sprintsService.findById(id);
    return {
      success: true,
      data: sprint,
    };
  }

  @Get(':id/burndown')
  @ApiOperation({ summary: 'Get sprint burndown data' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async getBurndown(@Param('id') id: string) {
    const burndown = await this.sprintsService.getBurndownData(id);
    return {
      success: true,
      data: burndown,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Update a sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    const sprint = await this.sprintsService.update(id, dto);
    return {
      success: true,
      data: sprint,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async startSprint(@Req() req: any, @Param('id') id: string) {
    const sprint = await this.sprintsService.startSprint(id, req.user.userId);
    return {
      success: true,
      data: sprint,
      message: 'Sprint started successfully',
    };
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move sprint to review' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async moveToReview(@Param('id') id: string) {
    const sprint = await this.sprintsService.moveToReview(id);
    return {
      success: true,
      data: sprint,
    };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async completeSprint(
    @Req() req: any,
    @Param('id') id: string,
    @Body() retrospective?: SprintRetrospectiveDto,
  ) {
    const sprint = await this.sprintsService.completeSprint(
      id,
      req.user.userId,
      retrospective,
    );
    return {
      success: true,
      data: sprint,
      message: 'Sprint completed successfully',
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async cancelSprint(@Req() req: any, @Param('id') id: string) {
    const sprint = await this.sprintsService.cancelSprint(id, req.user.userId);
    return {
      success: true,
      data: sprint,
      message: 'Sprint cancelled',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TASKS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add tasks to sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async addTasks(@Param('id') id: string, @Body() dto: AddTasksToSprintDto) {
    const sprint = await this.sprintsService.addTasks(id, dto.taskIds);
    return {
      success: true,
      data: sprint,
    };
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a task from sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  async removeTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    const sprint = await this.sprintsService.removeTask(id, taskId);
    return {
      success: true,
      data: sprint,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GOALS & RETROSPECTIVE
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/goals/:goalIndex/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update goal progress' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  @ApiParam({ name: 'goalIndex', description: 'Goal index' })
  async updateGoalProgress(
    @Param('id') id: string,
    @Param('goalIndex') goalIndex: string,
    @Body() dto: UpdateGoalProgressDto,
  ) {
    const sprint = await this.sprintsService.updateGoalProgress(
      id,
      parseInt(goalIndex, 10),
      dto.progress,
    );
    return {
      success: true,
      data: sprint,
    };
  }

  @Put(':id/retrospective')
  @ApiOperation({ summary: 'Update sprint retrospective' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async updateRetrospective(
    @Param('id') id: string,
    @Body() dto: SprintRetrospectiveDto,
  ) {
    const sprint = await this.sprintsService.updateRetrospective(id, dto);
    return {
      success: true,
      data: sprint,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a sprint' })
  @ApiParam({ name: 'id', description: 'Sprint ID' })
  async delete(@Param('id') id: string) {
    await this.sprintsService.delete(id);
    return {
      success: true,
      message: 'Sprint deleted',
    };
  }
}

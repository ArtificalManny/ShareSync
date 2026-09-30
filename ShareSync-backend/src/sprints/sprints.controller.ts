// src/sprints/sprints.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS CONTROLLER
// REST API for project execution cycles.
//
// Safe first-pass purpose:
// - Expose POST /api/sprints for the ProjectHome "Start Your First Sprint" flow.
// - Expose current/active sprint reads for Project Overview.
// - Only call methods that exist in SprintsService.
// - Avoid broad backend behavior until the base sprint lifecycle compiles.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/create-sprint.dto';

function getUserIdFromRequest(req: any): string {
  const userId =
    req?.user?.sub ||
    req?.user?.userId ||
    req?.user?.id ||
    req?.user?._id;

  if (!userId) {
    throw new UnauthorizedException('Missing authenticated user');
  }

  return String(userId);
}

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sprints')
export class SprintsController {
  // openshare-sprints-actor-propagation-v1
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sprint' })
  async create(@Body() dto: CreateSprintDto, @Req() req: any) {
    const userId = getUserIdFromRequest(req);
    return this.sprintsService.create(dto, userId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'List sprints for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findAllForProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.sprintsService
      .findAllForProject(
        projectId,
        getUserIdFromRequest(req),
      );
  }

  @Get('project/:projectId/current')
  @ApiOperation({ summary: 'Get the current sprint for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findCurrentForProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.sprintsService
      .findCurrentForProject(
        projectId,
        getUserIdFromRequest(req),
      );
  }

  @Get('project/:projectId/active')
  @ApiOperation({ summary: 'Get the active sprint for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findActiveForProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.sprintsService
      .findActiveForProject(
        projectId,
        getUserIdFromRequest(req),
      );
  }

  @Get(':sprintId')
  @ApiOperation({ summary: 'Get a sprint by ID' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async findById(
    @Req() req: any,
    @Param('sprintId') sprintId: string,
  ) {
    return this.sprintsService
      .findById(
        sprintId,
        getUserIdFromRequest(req),
      );
  }

  @Patch(':sprintId')
  @ApiOperation({ summary: 'Update a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async update(
    @Req() req: any,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService
      .update(
        sprintId,
        getUserIdFromRequest(req),
        dto,
      );
  }

  @Post(':sprintId/complete')
  @ApiOperation({ summary: 'Complete a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async complete(
    @Req() req: any,
    @Param('sprintId') sprintId: string,
  ) {
    return this.sprintsService
      .complete(
        sprintId,
        getUserIdFromRequest(req),
      );
  }

  @Post(':sprintId/cancel')
  @ApiOperation({ summary: 'Cancel a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async cancel(
    @Req() req: any,
    @Param('sprintId') sprintId: string,
  ) {
    return this.sprintsService
      .cancel(
        sprintId,
        getUserIdFromRequest(req),
      );
  }
}

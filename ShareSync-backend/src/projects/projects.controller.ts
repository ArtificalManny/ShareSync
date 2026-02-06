// src/projects/projects.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS CONTROLLER: REST API Endpoints
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
import { ProjectsService, ProjectQueryOptions } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto/project-member.dto';
import { ProjectStatus } from './schemas/project.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  async create(@Req() req: any, @Body() dto: CreateProjectDto) {
    this.logger.log(`Creating project: ${dto.name}`);
    const project = await this.projectsService.create(req.user.userId, dto);
    return {
      success: true,
      data: project,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Req() req: any,
    @Query('status') status?: ProjectStatus,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const options: ProjectQueryOptions = {
      status,
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    };

    const result = await this.projectsService.findUserProjects(
      req.user.userId,
      options,
    );

    return {
      success: true,
      data: result.projects,
      meta: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      },
    };
  }

  @Get('starred')
  @ApiOperation({ summary: 'Get starred projects' })
  async findStarred(@Req() req: any) {
    const projects = await this.projectsService.findStarred(req.user.userId);
    return {
      success: true,
      data: projects,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const project = await this.projectsService.findByIdWithAccess(
      id,
      req.user.userId,
    );
    return {
      success: true,
      data: project,
    };
  }

  @Get(':id/pulse')
  @ApiOperation({ summary: 'Get project Pulse dashboard data' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async getPulse(@Req() req: any, @Param('id') id: string) {
    const pulseData = await this.projectsService.getPulseData(
      id,
      req.user.userId,
    );
    return {
      success: true,
      data: pulseData,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.update(
      id,
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/star')
  @ApiOperation({ summary: 'Toggle project starred status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async toggleStar(@Req() req: any, @Param('id') id: string) {
    const project = await this.projectsService.findByIdWithAccess(
      id,
      req.user.userId,
    );
    const updated = await this.projectsService.update(id, req.user.userId, {
      isStarred: !project.isStarred,
    });
    return {
      success: true,
      data: { isStarred: updated.isStarred },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHIVE / DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async archive(@Req() req: any, @Param('id') id: string) {
    const project = await this.projectsService.archive(id, req.user.userId);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore an archived project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async restore(@Req() req: any, @Param('id') id: string) {
    const project = await this.projectsService.update(id, req.user.userId, {
      status: ProjectStatus.ACTIVE,
    });
    return {
      success: true,
      data: project,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Project deleted' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can delete' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.projectsService.delete(id, req.user.userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async addMember(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    const project = await this.projectsService.addMember(
      id,
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: project,
    };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  async removeMember(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
  ) {
    const project = await this.projectsService.removeMember(
      id,
      req.user.userId,
      memberUserId,
    );
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberRole(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const project = await this.projectsService.updateMemberRole(
      id,
      req.user.userId,
      memberUserId,
      dto,
    );
    return {
      success: true,
      data: project,
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async leaveProject(@Req() req: any, @Param('id') id: string) {
    await this.projectsService.leaveProject(id, req.user.userId);
    return {
      success: true,
      message: 'Successfully left the project',
    };
  }
}

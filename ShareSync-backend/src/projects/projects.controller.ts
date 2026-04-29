// src/projects/projects.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS CONTROLLER: REST API Endpoints
// + Phase 3: spectator follows (/projects/:id/follow)
// + Overview route for ProjectHome richer dashboard payload
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
  UseInterceptors,
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
import { ProjectsService, ProjectQueryOptions, CompleteProjectPayload, ReopenProjectPayload } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  UpdateProjectDto,
  UpdateProjectPreferencesDto,
} from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { ProjectStatus } from './schemas/project.schema';

// ✅ Phase 3: follows
import { ProjectFollowService } from '../follows/project-follow.service';
import { FollowProjectDto } from '../follows/dto/follow-project.dto';
import { UpdateFollowPrefsDto } from '../follows/dto/update-follow-prefs.dto';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectFollowService: ProjectFollowService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBUG (TEMPORARY) — MUST BE BEFORE ANY :id ROUTES
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('debug')
  @ApiOperation({ summary: 'DEBUG: Inspect projects in DB vs. user query' })
  async debugProjects(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId;

    const allProjects = await this.projectsService.findAllNoFilter();
    const userProjects = await this.projectsService.findByUser(userId);

    return {
      success: true,
      debug: {
        currentUserId: userId,
        allProjectsCount: allProjects.length,
        allProjects: allProjects.map((p: any) => ({
          id: p._id,
          name: p.name,
          ownerId: p.ownerId?.toString?.() || null,
          owner: p.owner?.toString?.() || null,
          members: (p.members || []).map((m: any) => ({
            userId: m.userId?.toString?.() || null,
            user: m.user?.toString?.() || null,
          })),
        })),
        userProjectsCount: userProjects.length,
        userProjects: userProjects.map((p) => p.name),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  async create(@Req() req: any, @Body() dto: CreateProjectDto) {
    const userId = req.user?.sub || req.user?.userId;
    this.logger.log(`Creating project: ${dto.name}`);
    const project = await this.projectsService.create(userId, dto);
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
    const userId = req.user?.sub || req.user?.userId;

    const options: ProjectQueryOptions = {
      status,
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    };

    const result = await this.projectsService.findUserProjects(userId, options);

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
    const userId = req.user?.sub || req.user?.userId;
    const projects = await this.projectsService.findStarred(userId);
    return {
      success: true,
      data: projects,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OVERVIEW — MUST BE BEFORE :id
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get rich overview data for ProjectHome' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Overview data found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getOverview(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const overview = await this.projectsService.getOverviewData(id, userId);

    if (overview?.project && typeof overview.project.populate === 'function') {
      await overview.project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await overview.project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: overview,
    };
  }


  @Get(':id/closure-readiness')
  @ApiOperation({ summary: 'Evaluate whether a project is ready to close' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Closure readiness evaluated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getClosureReadiness(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const readiness = await this.projectsService.evaluateProjectClosure(id, userId);

    return {
      success: true,
      data: readiness,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findOne(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.findByIdWithAccess(id, userId);

    if (project && typeof project.populate === 'function') {
      await project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: project,
    };
  }

  @Get(':id/pulse')
  @ApiOperation({ summary: 'Get project Pulse dashboard data' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async getPulse(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const pulseData = await this.projectsService.getPulseData(id, userId);

    if (pulseData && pulseData.project && typeof pulseData.project.populate === 'function') {
      await pulseData.project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await pulseData.project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: pulseData,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: FOLLOW ENDPOINTS (spectator subscriptions)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow project updates (spectator subscription)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async followProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: FollowProjectDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const follow = await this.projectFollowService.followProject(id, userId, dto);
    return { success: true, data: follow };
  }

  @Patch(':id/follow')
  @ApiOperation({ summary: 'Update follow preferences' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateFollowPrefs(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFollowPrefsDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const updated = await this.projectFollowService.followProject(id, userId, dto as any);
    return { success: true, data: updated };
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow project updates' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async unfollowProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.projectFollowService.unfollowProject(id, userId);
    return { success: true, data: result };
  }

  @Get(':id/follow-status')
  @ApiOperation({ summary: 'Get follow status for current user' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async followStatus(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const status = await this.projectFollowService.getFollowStatus(id, userId);
    return { success: true, data: status };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async update(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.update(id, userId, dto);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/star')
  @ApiOperation({ summary: 'Toggle project starred status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async toggleStar(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.findByIdWithAccess(id, userId);
    const updated = await this.projectsService.update(id, userId, {
      isStarred: !project.isStarred,
    });

    return {
      success: true,
      data: { isStarred: updated.isStarred },
    };
  }


  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a project through the closeout flow' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project completed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Project not ready to close' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async completeProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() payload: CompleteProjectPayload,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.completeProject(id, userId, payload);

    return {
      success: true,
      data: project,
    };
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a completed project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project reopened successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid reopen request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async reopenProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() payload: ReopenProjectPayload,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.reopenProject(id, userId, payload);

    return {
      success: true,
      data: project,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHIVE / DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async archive(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.archive(id, userId);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore an archived project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async restore(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.restoreArchivedProject(id, userId);
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
  async delete(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.projectsService.delete(id, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async addMember(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.addMember(id, userId, dto);
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.removeMember(id, userId, memberUserId);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member permission role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberRole(
      id,
      userId,
      memberUserId,
      dto,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/display-role')
  @ApiOperation({ summary: 'Update member display role label' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberDisplayRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body('displayRole') displayRole: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberDisplayRole(
      id,
      userId,
      memberUserId,
      displayRole,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/preferences')
  @ApiOperation({ summary: 'Update user-specific notification preferences for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updatePreferences(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() preferences: UpdateProjectPreferencesDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.updateMemberPreferences(id, userId, preferences);
    return {
      success: true,
      data: project,
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async leaveProject(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.projectsService.leaveProject(id, userId);
    return {
      success: true,
      message: 'Successfully left the project',
    };
  }
}

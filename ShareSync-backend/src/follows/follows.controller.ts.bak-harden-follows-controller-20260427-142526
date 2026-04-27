// src/follows/follows.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS CONTROLLER - REST API for Instagram-style project following
//
// POST   /api/follows/:projectId         → Follow a project
// DELETE /api/follows/:projectId         → Unfollow a project
// GET    /api/follows                    → List all followed projects (full data)
// GET    /api/follows/status/:projectId  → Check if following one project
// GET    /api/follows/status?ids=a,b,c   → Bulk check follow status
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Follows')
@Controller('follows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  @Post(':projectId')
  @ApiOperation({ summary: 'Follow a project' })
  @ApiParam({ name: 'projectId', type: String })
  async follow(@Req() req: any, @Param('projectId') projectId: string) {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;
    return this.followsService.follow(userId, projectId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  @Delete(':projectId')
  @ApiOperation({ summary: 'Unfollow a project' })
  @ApiParam({ name: 'projectId', type: String })
  async unfollow(@Req() req: any, @Param('projectId') projectId: string) {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;
    return this.followsService.unfollow(userId, projectId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIST all followed projects (full project data for Projects page)
  // ─────────────────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all followed projects with full data' })
  async getFollowed(@Req() req: any) {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;
    const projects = await this.followsService.getFollowedProjects(userId);
    return { success: true, data: projects };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BULK STATUS CHECK (for Discover feed — check many projects at once)
  // GET /api/follows/status?ids=id1,id2,id3
  // ─────────────────────────────────────────────────────────────────────────────
  @Get('status')
  @ApiOperation({ summary: 'Bulk check follow status for multiple projects' })
  @ApiQuery({ name: 'ids', required: true, type: String, description: 'Comma-separated project IDs' })
  async getBulkStatus(@Req() req: any, @Query('ids') ids: string) {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;
    const projectIds = (ids || '').split(',').filter(Boolean);
    if (projectIds.length === 0) return { success: true, statuses: {} };
    const statuses = await this.followsService.getFollowStatusBulk(
      userId,
      projectIds,
    );
    return { success: true, statuses };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SINGLE STATUS CHECK
  // GET /api/follows/status/:projectId
  // NOTE: This route MUST be registered AFTER /status to avoid conflicts
  // ─────────────────────────────────────────────────────────────────────────────
  @Get('check/:projectId')
  @ApiOperation({ summary: 'Check if following a specific project' })
  @ApiParam({ name: 'projectId', type: String })
  async getStatus(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;
    const following = await this.followsService.isFollowing(userId, projectId);
    return { success: true, following };
  }
}

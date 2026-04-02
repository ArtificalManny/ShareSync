// src/analytics/analytics.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
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
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('project/:projectId/overview')
  @ApiOperation({ summary: 'Get project overview metrics' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectOverview(
    @Param('projectId') projectId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const overview = await this.analyticsService.getProjectOverview(projectId, query);
    return {
      success: true,
      data: overview,
    };
  }

  @Get('project/:projectId/health')
  @ApiOperation({ summary: 'Get project health score and risks' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectHealth(@Param('projectId') projectId: string) {
    const health = await this.analyticsService.getProjectHealth(projectId);
    return {
      success: true,
      data: health,
    };
  }

  @Get('project/:projectId/velocity')
  @ApiOperation({ summary: 'Get velocity trend' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'days', type: Number, required: false })
  async getVelocityTrend(
    @Param('projectId') projectId: string,
    @Query('days') days?: string,
  ) {
    const velocity = await this.analyticsService.getVelocityTrend(
      projectId,
      days ? parseInt(days, 10) : 30,
    );
    return {
      success: true,
      data: velocity,
    };
  }

  @Get('project/:projectId/forecast')
  @ApiOperation({ summary: 'Get completion forecast' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getCompletionForecast(@Param('projectId') projectId: string) {
    const forecast = await this.analyticsService.getCompletionForecast(projectId);
    return {
      success: true,
      data: forecast,
    };
  }

  @Get('project/:projectId/team')
  @ApiOperation({ summary: 'Get team productivity breakdown' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTeamProductivity(
    @Param('projectId') projectId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const team = await this.analyticsService.getTeamProductivity(projectId, query);
    return {
      success: true,
      data: team,
    };
  }

  @Get('project/:projectId/activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getRecentActivity(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const activity = await this.analyticsService.getRecentActivity(
      projectId,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data: activity,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USER ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get personal dashboard stats for Home' })
  async getMyDashboard(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    const userId = req.user.userId || req.user.sub;
    const productivity = await this.analyticsService.getUserProductivity(userId, query);
    return {
      success: true,
      data: productivity,
    };
  }

  @Get('me/profile-stats')
  @ApiOperation({ summary: 'Get personal profile analytics' })
  async getMyProfileStats(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    const stats = await this.analyticsService.getUserProfileAnalytics(userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('user/intelligence')
  @ApiOperation({ summary: 'Get real-time user intelligence and co-working stats' })
  @ApiQuery({ name: 'projectId', required: false })
  async getIntelligence(@Req() req: any, @Query('projectId') projectId?: string) {
    const intelligence = await this.analyticsService.getIntelligence(
      req.user.userId || req.user.sub,
      projectId
    );
    return {
      success: true,
      data: intelligence,
    };
  }

  @Get('user/productivity')
  @ApiOperation({ summary: 'Get current user productivity metrics' })
  async getUserProductivity(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    const productivity = await this.analyticsService.getUserProductivity(
      req.user.userId,
      query,
    );
    return {
      success: true,
      data: productivity,
    };
  }

  @Get('user/activity')
  @ApiOperation({ summary: 'Get current user activity feed' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getUserActivity(@Req() req: any, @Query('limit') limit?: string) {
    const activity = await this.analyticsService.getUserActivity(
      req.user.userId,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data: activity,
    };
  }

  @Get('user/:userId/productivity')
  @ApiOperation({ summary: 'Get specific user productivity metrics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getSpecificUserProductivity(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const productivity = await this.analyticsService.getUserProductivity(userId, query);
    return {
      success: true,
      data: productivity,
    };
  }
}

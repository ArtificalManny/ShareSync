/**
 * cursor.controller.ts
 * REST API endpoints for cursor history and analytics
 *
 * Provides HTTP fallback and historical data access when WebSockets
 * are unavailable or for analytical purposes
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Cursor, CursorDocument } from './schemas/cursor.schema';
import {
  CursorUpdateDto,
  CursorQueryDto,
  CursorResponseDto,
  CursorStatsDto,
  BatchCursorUpdateDto,
} from './dto/cursor-update.dto';

@ApiTags('cursors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/cursors')
export class CursorController {
  constructor(
    @InjectModel(Cursor.name)
    private cursorModel: Model<CursorDocument>,
  ) {}

  // ============================================
  // GET CURSOR HISTORY
  // ============================================

  @Get('history')
  @ApiOperation({ summary: 'Get cursor history' })
  @ApiResponse({
    status: 200,
    description: 'Cursor history retrieved successfully',
    type: [Cursor],
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  async getHistory(
    @Query() query: CursorQueryDto,
    @CurrentUser() user: any,
  ): Promise<any[]> {
    const filter: any = {};

    // Build filter
    if (query.projectId) {
      filter.projectId = new Types.ObjectId(query.projectId);
    }

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.sessionId) {
      filter.sessionId = query.sessionId;
    }

    // Time range
    if (query.startTime || query.endTime) {
      filter.timestamp = {};
      if (query.startTime) {
        filter.timestamp.$gte = new Date(query.startTime);
      }
      if (query.endTime) {
        filter.timestamp.$lte = new Date(query.endTime);
      }
    }

    const cursors = await this.cursorModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(query.limit || 100)
      .skip(query.skip || 0)
      .lean()
      .exec();

    return cursors;
  }

  // ============================================
  // GET USER CURSOR HISTORY
  // ============================================

  @Get('history/user/:userId')
  @ApiOperation({ summary: 'Get cursor history for specific user' })
  @ApiResponse({
    status: 200,
    description: 'User cursor history retrieved',
  })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (startTime || endTime) {
      filter.timestamp = {};
      if (startTime) filter.timestamp.$gte = new Date(startTime);
      if (endTime) filter.timestamp.$lte = new Date(endTime);
    }

    return this.cursorModel
      .find(filter)
      .sort({ timestamp: 1 })
      .limit(limit || 1000)
      .lean()
      .exec();
  }

  // ============================================
  // GET SESSION PLAYBACK
  // ============================================

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get cursor movements for session playback' })
  @ApiResponse({
    status: 200,
    description: 'Session cursor data retrieved',
  })
  async getSession(
    @Param('sessionId') sessionId: string,
  ): Promise<any[]> {
    return this.cursorModel
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .lean()
      .exec();
  }

  // ============================================
  // GET RECENT CURSORS IN PROJECT
  // ============================================

  @Get('project/:projectId/recent')
  @ApiOperation({ summary: 'Get recent cursors in project' })
  @ApiResponse({
    status: 200,
    description: 'Recent cursors retrieved',
  })
  async getRecentInProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.cursorModel
      .find({
        projectId: new Types.ObjectId(projectId),
      })
      .sort({ timestamp: -1 })
      .limit(limit || 100)
      .lean()
      .exec();
  }

  // ============================================
  // GET ACTIVE USERS IN PROJECT
  // ============================================

  @Get('project/:projectId/active')
  @ApiOperation({ summary: 'Get active users in project' })
  @ApiResponse({
    status: 200,
    description: 'Active users retrieved',
  })
  async getActiveUsers(
    @Param('projectId') projectId: string,
    @Query('threshold') threshold?: number,
  ): Promise<any[]> {
    const thresholdMs = (threshold || 30) * 1000; // Default 30 seconds
    const since = new Date(Date.now() - thresholdMs);

    return this.cursorModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          lastActivity: { $max: '$timestamp' },
          lastPosition: { $last: '$$ROOT' },
          movementCount: { $sum: 1 },
        },
      },
      {
        $sort: { lastActivity: -1 },
      },
    ]);
  }

  // ============================================
  // GET CURSOR STATISTICS
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Get cursor statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    type: CursorStatsDto,
  })
  async getStats(
    @Query('projectId') projectId?: string,
    @Query('timeWindow') timeWindow?: number,
  ): Promise<CursorStatsDto> {
    const windowMs = (timeWindow || 3600) * 1000; // Default 1 hour
    const since = new Date(Date.now() - windowMs);

    const filter: any = { timestamp: { $gte: since } };
    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }

    // Total movements
    const totalMovements = await this.cursorModel.countDocuments(filter);

    // Active users
    const activeUsersResult = await this.cursorModel.aggregate([
      { $match: filter },
      { $group: { _id: '$userId' } },
      { $count: 'count' },
    ]);
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Activity breakdown
    const activityResult = await this.cursorModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$activity',
          count: { $sum: 1 },
        },
      },
    ]);

    const activityBreakdown = activityResult.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Average movements per user
    const averageMovementsPerUser = activeUsers > 0 ? totalMovements / activeUsers : 0;

    return {
      totalMovements,
      activeUsers,
      activityBreakdown,
      averageMovementsPerUser,
    };
  }

  // ============================================
  // POST CURSOR UPDATE (HTTP FALLBACK)
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Update cursor position (HTTP fallback)' })
  @ApiResponse({
    status: 201,
    description: 'Cursor updated successfully',
    type: CursorResponseDto,
  })
  async updateCursor(
    @Body() cursorUpdate: CursorUpdateDto,
    @CurrentUser() user: any,
  ): Promise<CursorResponseDto> {
    try {
      if (cursorUpdate.userId !== user.id) {
        throw new HttpException(
          'Cannot update cursor for another user',
          HttpStatus.FORBIDDEN,
        );
      }

      const cursor = new this.cursorModel({
        ...cursorUpdate,
        userId: new Types.ObjectId(cursorUpdate.userId),
        projectId: new Types.ObjectId(cursorUpdate.projectId),
        timestamp: new Date(),
      });

      await cursor.save();

      return {
        success: true,
        message: 'Cursor updated successfully',
        data: cursor,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update cursor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // POST BATCH CURSOR UPDATES
  // ============================================

  @Post('batch')
  @ApiOperation({ summary: 'Batch cursor updates (HTTP fallback)' })
  @ApiResponse({
    status: 201,
    description: 'Cursors updated successfully',
  })
  async batchUpdate(
    @Body() batch: BatchCursorUpdateDto,
    @CurrentUser() user: any,
  ): Promise<CursorResponseDto> {
    try {
      const invalidCursor = batch.cursors.find((c) => c.userId !== user.id);
      if (invalidCursor) {
        throw new HttpException(
          'Cannot update cursors for other users',
          HttpStatus.FORBIDDEN,
        );
      }

      const cursors = batch.cursors.map((c) => ({
        ...c,
        userId: new Types.ObjectId(c.userId),
        projectId: new Types.ObjectId(c.projectId),
        timestamp: new Date(),
      }));

      const result = await this.cursorModel.insertMany(cursors);

      return {
        success: true,
        message: `${result.length} cursors updated`,
        data: { count: result.length },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to batch update cursors',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // DELETE OLD CURSOR DATA
  // ============================================

  // FIXED: Required @CurrentUser first, optional @Query second
  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup old cursor data (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
  })
  async cleanup(
    @CurrentUser() user: any,
    @Query('daysOld') daysOld?: number,
  ): Promise<CursorResponseDto> {
    if (!user.isAdmin) {
      throw new HttpException('Admin access required', HttpStatus.FORBIDDEN);
    }

    const days = daysOld || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.cursorModel.deleteMany({
      timestamp: { $lt: cutoff },
    });

    return {
      success: true,
      message: `Deleted ${result.deletedCount} old cursor records`,
      data: { deletedCount: result.deletedCount },
    };
  }

  // ============================================
  // GET CURSOR HEATMAP DATA
  // ============================================

  @Get('heatmap')
  @ApiOperation({ summary: 'Get cursor heatmap data' })
  @ApiResponse({
    status: 200,
    description: 'Heatmap data retrieved',
  })
  async getHeatmap(
    @Query('projectId') projectId: string,
    @Query('timeWindow') timeWindow?: number,
    @Query('gridSize') gridSize?: number,
  ): Promise<any> {
    const windowMs = (timeWindow || 3600) * 1000;
    const since = new Date(Date.now() - windowMs);
    const grid = gridSize || 10; // 10x10 grid

    const cursors = await this.cursorModel
      .find({
        projectId: new Types.ObjectId(projectId),
        timestamp: { $gte: since },
      })
      .select('x y')
      .lean()
      .exec();

    const heatmap = Array.from({ length: grid }, () => Array(grid).fill(0));

    cursors.forEach((cursor: any) => {
      const gridX = Math.floor((cursor.x / 100) * grid);
      const gridY = Math.floor((cursor.y / 100) * grid);
      if (gridX < grid && gridY < grid) {
        heatmap[gridY][gridX]++;
      }
    });

    return {
      grid: heatmap,
      gridSize: grid,
      totalPoints: cursors.length,
    };
  }
}

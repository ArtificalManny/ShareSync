/**
 * presence.controller.ts
 * REST API endpoints for user presence and status
 * 
 * Provides HTTP access to presence data for when WebSockets
 * are unavailable or for status queries
 */

import {
    Controller,
    Get,
    Post,
    Put,
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
  import { Presence, PresenceDocument, UserStatus, UserMode } from './schemas/presence.schema';
  
  /**
   * Presence Update DTO
   */
  class PresenceUpdateDto {
    status?: UserStatus;
    mode?: UserMode;
    currentProject?: string;
    currentPage?: string;
    currentPageTitle?: string;
    device?: any;
    privacySettings?: any;
    metadata?: any;
  }
  
  /**
   * Privacy Settings DTO
   */
  class PrivacySettingsDto {
    visibility?: 'everyone' | 'team' | 'nobody';
    showActivity?: boolean;
    showLocation?: boolean;
    allowProximity?: boolean;
    allowFocus?: boolean;
  }
  
  @ApiTags('presence')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller('api/presence')
  export class PresenceController {
    constructor(
      @InjectModel(Presence.name)
      private presenceModel: Model<PresenceDocument>,
    ) {}
  
    // ============================================
    // GET OWN PRESENCE
    // ============================================
  
    @Get('me')
    @ApiOperation({ summary: 'Get current user presence' })
    @ApiResponse({
      status: 200,
      description: 'Own presence retrieved',
    })
    async getOwnPresence(@CurrentUser() user: any): Promise<PresenceDocument> {
      let presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      // Create if doesn't exist
      if (!presence) {
        presence = new this.presenceModel({
          userId: new Types.ObjectId(user.id),
          userName: user.name || user.username || 'Unknown',
          userAvatar: user.avatar,
          status: UserStatus.ONLINE,
          mode: UserMode.TEAM,
          lastActive: new Date(),
        });
        await presence.save();
      }
  
      return presence;
    }
  
    // ============================================
    // UPDATE OWN PRESENCE
    // ============================================
  
    @Put('me')
    @ApiOperation({ summary: 'Update current user presence' })
    @ApiResponse({
      status: 200,
      description: 'Presence updated',
    })
    async updateOwnPresence(
      @Body() update: PresenceUpdateDto,
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      let presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        presence = new this.presenceModel({
          userId: new Types.ObjectId(user.id),
          userName: user.name || user.username,
          userAvatar: user.avatar,
        });
      }
  
      // Update fields
      if (update.status) presence.status = update.status;
      if (update.mode) presence.mode = update.mode;
      if (update.currentProject)
        presence.currentProject = new Types.ObjectId(update.currentProject);
      if (update.currentPage) presence.currentPage = update.currentPage;
      if (update.currentPageTitle)
        presence.currentPageTitle = update.currentPageTitle;
      if (update.device) presence.device = update.device;
      if (update.privacySettings)
        presence.privacySettings = update.privacySettings;
      if (update.metadata) presence.metadata = update.metadata;
  
      presence.lastActive = new Date();
  
      await presence.save();
      return presence;
    }
  
    // ============================================
    // SET STATUS
    // ============================================
  
    @Post('status')
    @ApiOperation({ summary: 'Set user status' })
    @ApiResponse({
      status: 200,
      description: 'Status updated',
    })
    async setStatus(
      @Body() body: { status: UserStatus },
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      presence.status = body.status;
      presence.lastActive = new Date();
  
      if (body.status === UserStatus.ONLINE) {
        await presence.setOnline();
      } else if (body.status === UserStatus.OFFLINE) {
        await presence.setOffline();
      } else {
        await presence.save();
      }
  
      return presence;
    }
  
    // ============================================
    // SET MODE
    // ============================================
  
    @Post('mode')
    @ApiOperation({ summary: 'Set user mode' })
    @ApiResponse({
      status: 200,
      description: 'Mode updated',
    })
    async setMode(
      @Body() body: { mode: UserMode },
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      presence.mode = body.mode;
      presence.lastActive = new Date();
      await presence.save();
  
      return presence;
    }
  
    // ============================================
    // UPDATE PRIVACY SETTINGS
    // ============================================
  
    @Put('privacy')
    @ApiOperation({ summary: 'Update privacy settings' })
    @ApiResponse({
      status: 200,
      description: 'Privacy settings updated',
    })
    async updatePrivacy(
      @Body() settings: PrivacySettingsDto,
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      presence.privacySettings = {
        ...presence.privacySettings,
        ...settings,
      };
  
      await presence.save();
      return presence;
    }
  
    // ============================================
    // GET ALL ONLINE USERS
    // ============================================
  
    @Get('online')
    @ApiOperation({ summary: 'Get all online users' })
    @ApiResponse({
      status: 200,
      description: 'Online users retrieved',
    })
    async getOnlineUsers(): Promise<PresenceDocument[]> {
      return this.presenceModel
        .find({
          status: { $ne: UserStatus.OFFLINE },
        })
        .sort({ lastActive: -1 })
        .lean()
        .exec();
    }
  
    // ============================================
    // GET USERS IN PROJECT
    // ============================================
  
    @Get('project/:projectId')
    @ApiOperation({ summary: 'Get users in project' })
    @ApiResponse({
      status: 200,
      description: 'Project users retrieved',
    })
    async getProjectUsers(
      @Param('projectId') projectId: string,
    ): Promise<PresenceDocument[]> {
      return this.presenceModel
        .find({
          currentProject: new Types.ObjectId(projectId),
          status: { $ne: UserStatus.OFFLINE },
        })
        .sort({ lastActive: -1 })
        .lean()
        .exec();
    }
  
    // ============================================
    // GET VISIBLE USERS
    // ============================================
  
    @Get('visible')
    @ApiOperation({ summary: 'Get visible users (not in ghost mode)' })
    @ApiResponse({
      status: 200,
      description: 'Visible users retrieved',
    })
    @ApiQuery({ name: 'projectId', required: false })
    async getVisibleUsers(
      @Query('projectId') projectId?: string,
    ): Promise<PresenceDocument[]> {
      const query: any = {
        status: { $ne: UserStatus.OFFLINE },
        mode: { $ne: UserMode.GHOST },
      };
  
      if (projectId) {
        query.currentProject = new Types.ObjectId(projectId);
      }
  
      return this.presenceModel.find(query).sort({ lastActive: -1 }).lean().exec();
    }
  
    // ============================================
    // GET USER PRESENCE BY ID
    // ============================================
  
    @Get('user/:userId')
    @ApiOperation({ summary: 'Get specific user presence' })
    @ApiResponse({
      status: 200,
      description: 'User presence retrieved',
    })
    async getUserPresence(
      @Param('userId') userId: string,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
  
      if (!presence) {
        throw new HttpException('User presence not found', HttpStatus.NOT_FOUND);
      }
  
      return presence;
    }
  
    // ============================================
    // GET PRESENCE STATISTICS
    // ============================================
  
    @Get('stats')
    @ApiOperation({ summary: 'Get presence statistics' })
    @ApiResponse({
      status: 200,
      description: 'Statistics retrieved',
    })
    async getStats(): Promise<any> {
      const stats = await this.presenceModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const modeStats = await this.presenceModel.aggregate([
        {
          $group: {
            _id: '$mode',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const total = await this.presenceModel.countDocuments();
      const online = await this.presenceModel.countDocuments({
        status: { $ne: UserStatus.OFFLINE },
      });
  
      return {
        total,
        online,
        byStatus: stats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        byMode: modeStats.reduce((acc, m) => {
          acc[m._id] = m.count;
          return acc;
        }, {}),
      };
    }
  
    // ============================================
    // UPDATE ACTIVITY
    // ============================================
  
    @Post('activity')
    @ApiOperation({ summary: 'Update user activity' })
    @ApiResponse({
      status: 200,
      description: 'Activity updated',
    })
    async updateActivity(
      @Body() body: { activityType?: string },
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      await presence.updateActivity(body.activityType);
      return presence;
    }
  
    // ============================================
    // JOIN PROJECT
    // ============================================
  
    @Post('join/:projectId')
    @ApiOperation({ summary: 'Join project' })
    @ApiResponse({
      status: 200,
      description: 'Joined project',
    })
    async joinProject(
      @Param('projectId') projectId: string,
      @Body() body: { pageUrl?: string; pageTitle?: string },
      @CurrentUser() user: any,
    ): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      presence.currentProject = new Types.ObjectId(projectId);
      presence.currentPage = body.pageUrl;
      presence.currentPageTitle = body.pageTitle;
      presence.lastActive = new Date();
  
      await presence.save();
      return presence;
    }
  
    // ============================================
    // LEAVE PROJECT
    // ============================================
  
    @Post('leave')
    @ApiOperation({ summary: 'Leave current project' })
    @ApiResponse({
      status: 200,
      description: 'Left project',
    })
    async leaveProject(@CurrentUser() user: any): Promise<PresenceDocument> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (!presence) {
        throw new HttpException('Presence not found', HttpStatus.NOT_FOUND);
      }
  
      presence.currentProject = undefined;
      presence.currentPage = undefined;
      presence.currentPageTitle = undefined;
  
      await presence.save();
      return presence;
    }
  
    // ============================================
    // CLEANUP STALE PRESENCE
    // ============================================
  
    // FIXED: Required @CurrentUser first, optional @Query second
    @Delete('cleanup')
    @ApiOperation({ summary: 'Cleanup stale presence records (admin only)' })
    @ApiResponse({
      status: 200,
      description: 'Cleanup completed',
    })
    async cleanup(
      @CurrentUser() user: any,
      @Query('thresholdMinutes') thresholdMinutes?: number,
    ): Promise<any> {
      // Check if user is admin
      if (!user.isAdmin) {
        throw new HttpException('Admin access required', HttpStatus.FORBIDDEN);
      }
  
      const threshold = thresholdMinutes || 30;
      const cutoff = new Date(Date.now() - threshold * 60 * 1000);
  
      const result = await this.presenceModel.updateMany(
        {
          status: { $ne: UserStatus.OFFLINE },
          lastActive: { $lt: cutoff },
        },
        {
          $set: { status: UserStatus.OFFLINE },
        },
      );
  
      return {
        success: true,
        message: `Marked ${result.modifiedCount} users as offline`,
        modifiedCount: result.modifiedCount,
      };
    }
  
    // ============================================
    // HEARTBEAT (Keep-Alive)
    // ============================================
  
    @Post('heartbeat')
    @ApiOperation({ summary: 'Send presence heartbeat' })
    @ApiResponse({
      status: 200,
      description: 'Heartbeat received',
    })
    async heartbeat(@CurrentUser() user: any): Promise<any> {
      const presence = await this.presenceModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .exec();
  
      if (presence) {
        presence.lastActive = new Date();
        await presence.save();
      }
  
      return {
        success: true,
        timestamp: new Date(),
      };
    }
  }
  
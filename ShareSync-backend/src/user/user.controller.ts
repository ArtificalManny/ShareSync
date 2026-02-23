// src/user/user.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTROLLER - Profile and settings management
// Phase 7: Added PUT /me, GET/PUT /me/settings endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Optional,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

// ⚠️ If your UploadService lives somewhere else, update this import path.
import { UploadsService } from '../uploads/uploads.service';

// ✅ Phase 3: follows
import { ProjectFollowService } from '../follows/project-follow.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,

    @Optional() private readonly uploadService?: UploadsService,
    @Optional() private readonly follows?: ProjectFollowService,
  ) {}

  // ✅ Never let activity logging break the real endpoint.
  private async safeRecord(payload: any) {
    try {
      // record() should exist after our ActivitiesService patch
      await this.activities.record(payload);
    } catch (err: any) {
      // Keep this loud for now so we can see WHY it fails in the backend terminal.
      // This is the key to diagnosing schema/casting/validation issues.
      // eslint-disable-next-line no-console
      console.error('❌ activities.record failed (non-blocking):', err?.message || err);
      // eslint-disable-next-line no-console
      if (err?.stack) console.error(err.stack);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/me - Get current user profile
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.findById(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/me - Partial update (existing)
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async patchMe(@Req() req: any, @Body() patch: UpdateUserDto) {
    const id = req?.user?.sub || req?.user?.id;

    const before = await this.users.findById(id);
    const updated = await this.users.update(id, patch);

    const fields = ['firstName', 'lastName', 'displayName', 'username', 'profilePicture', 'bio'];
    const changed = fields.some((k) => (before as any)?.[k] !== (updated as any)?.[k]);

    if (changed) {
      this.realtime.emitToUser(id, 'user:updated', {
        userId: id,
        firstName: (updated as any)?.firstName,
        lastName: (updated as any)?.lastName,
        displayName: (updated as any)?.displayName,
        username: (updated as any)?.username,
        profilePicture: (updated as any)?.profilePicture,
        bio: (updated as any)?.bio,
        ts: new Date().toISOString(),
      });
    }

    // 🔥 NON-BLOCKING activity logging
    await this.safeRecord({
      userId: id,
      type: 'user.updated',
      payload: { fields: Object.keys(patch || {}) },
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUT /users/me - Full profile update (Phase 7)
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const id = req?.user?.sub || req?.user?.id;

    const before = await this.users.findById(id);
    const updated = await this.users.update(id, updateUserDto);

    // Emit realtime update
    this.realtime.emitToUser(id, 'user:updated', {
      userId: id,
      firstName: (updated as any)?.firstName,
      lastName: (updated as any)?.lastName,
      displayName: (updated as any)?.displayName,
      username: (updated as any)?.username,
      profilePicture: (updated as any)?.profilePicture,
      bio: (updated as any)?.bio,
      ts: new Date().toISOString(),
    });

    // 🔥 NON-BLOCKING activity logging
    await this.safeRecord({
      userId: id,
      type: 'user.profile.updated',
      payload: { fields: Object.keys(updateUserDto || {}) },
    });

    return {
      success: true,
      data: updated,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/me/settings - Get user settings (Phase 7)
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/settings')
  async getSettings(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    const settings = await this.users.getSettings(id);

    return {
      success: true,
      data: settings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUT /users/me/settings - Update user settings (Phase 7)
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Put('me/settings')
  async updateSettings(@Req() req: any, @Body() settingsDto: UpdateSettingsDto) {
    const id = req?.user?.sub || req?.user?.id;
    const updated = await this.users.updateSettings(id, settingsDto);

    // Emit settings update event
    this.realtime.emitToUser(id, 'user:settingsUpdated', {
      userId: id,
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      data: updated,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/me/follows - Get user's follows
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/follows')
  async myFollows(@Req() req: any) {
    if (!this.follows) {
      throw new BadRequestException(
        'ProjectFollowService not configured. Import ProjectFollowModule into AppModule to enable this endpoint.',
      );
    }

    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    const svc: any = this.follows as any;
    const fn =
      svc.listMyFollows ||
      svc.listForUser ||
      svc.listByUser ||
      svc.listUserFollows ||
      svc.getMyFollows ||
      svc.getFollowsForUser ||
      svc.list ||
      null;

    if (typeof fn !== 'function') {
      throw new BadRequestException(
        'ProjectFollowService is missing a list method. Expected one of: listMyFollows, listForUser, listByUser, listUserFollows, getMyFollows, getFollowsForUser, list.',
      );
    }

    return fn.call(svc, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/me/preferences - Update preferences
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferences(userId, preferences);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/me/preferences/:section - Update preference section
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences/:section')
  async updatePreferenceSection(
    @Req() req: any,
    @Param('section') section: string,
    @Body() values: any,
  ) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferenceSection(userId, section, values);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /users/me/avatar - Upload avatar
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!this.uploadService) {
      throw new BadRequestException(
        'UploadsService not configured. Wire UploadsModule into UserModule to enable avatar uploads.',
      );
    }

    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    const avatarUrl = await this.uploadService.uploadAvatar(file);
    const updated = await this.users.updateAvatar(userId, avatarUrl);

    this.realtime.emitToUser(userId, 'user:updated', {
      userId,
      profilePicture: (updated as any)?.profilePicture ?? avatarUrl,
      ts: new Date().toISOString(),
    });

    // 🔥 NON-BLOCKING activity logging
    await this.safeRecord({
      userId,
      type: 'user.avatar.updated',
      payload: { avatarUrl },
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /users/me/avatar - Delete avatar
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  async deleteAvatar(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const updated = await this.users.updateAvatar(userId, null);

    this.realtime.emitToUser(userId, 'user:updated', {
      userId,
      profilePicture: null,
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Avatar deleted',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/me/export - Export user data (GDPR)
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/export')
  async exportData(@Req() req: any, @Res() res: Response) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const exportData = await this.users.exportUserData(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=my-sharesync-data.json');
    res.send(JSON.stringify(exportData, null, 2));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /users/me - Delete account
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Req() req: any, @Body() body: { confirmation?: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    // Require explicit confirmation
    if (body?.confirmation !== 'DELETE') {
      throw new BadRequestException('Please confirm account deletion by sending { "confirmation": "DELETE" }');
    }

    await this.users.deleteAccount(userId);

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /users/me/change-password - Change password
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/change-password')
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }

    await this.users.changePassword(userId, body.currentPassword, body.newPassword);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/activity-summary - Get activity summary
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  async getActivitySummary(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getActivitySummary(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/me/projects-by-category - Get projects by category
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/projects-by-category')
  async myProjectsByCategory(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getProjectsByCategory(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/leaderboard/streaks - Get streak leaderboard
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('leaderboard/streaks')
  async streakLeaderboard() {
    const top = await this.users.getTopStreaks(20);

    return top.map((u: any) => ({
      id: u._id?.toString?.() ?? u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      streakDays: u.streakDays ?? 0,
      profilePicture: u.profilePicture ?? null,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/search - Search users
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const searchLimit = parseInt(limit || '10', 10);
    const users = await this.users.searchUsers(query, searchLimit);

    return {
      success: true,
      data: users,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/public/:username - Get public user profile
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    return user;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/username/:username - Get user by username
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException('User not found');

    return {
      success: true,
      data: user,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/:id - Get user by ID
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.users.findPublicById(id);
    if (!user) throw new NotFoundException('User not found');

    return {
      success: true,
      data: user,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/:id/activity - Get user activity
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/activity')
  async userActivity(@Param('id') id: string) {
    return this.activities.list({
      scope: 'user',
      userId: id,
      range: '7d',
      limit: 20,
      cursor: null,
    });
  }
}

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
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { UploadsService } from '../uploads/uploads.service';
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

  private async safeRecord(payload: any) {
    try {
      await this.activities.record(payload);
    } catch (err: any) {
      console.error('❌ activities.record failed (non-blocking):', err?.message || err);
      if (err?.stack) console.error(err.stack);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @UseInterceptors(TextModerationInterceptor)
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

    await this.safeRecord({ userId: id, type: 'user.updated', payload: { fields: Object.keys(patch || {}) } });
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @UseInterceptors(TextModerationInterceptor)
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const id = req?.user?.sub || req?.user?.id;
    const updated = await this.users.update(id, updateUserDto);

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

    await this.safeRecord({ userId: id, type: 'user.profile.updated', payload: { fields: Object.keys(updateUserDto || {}) } });
    return { success: true, data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/settings')
  async getSettings(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    const settings = await this.users.getSettings(id);
    return { success: true, data: settings };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUT /users/me/settings - Update user settings
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Put('me/settings')
  async updateSettings(@Req() req: any) { 
    const id = req?.user?.sub || req?.user?.id;
    
    // 🛡️ CRITICAL FIX: Bypass the NestJS ValidationPipe Stripper
    // By reading directly from req.body, we guarantee NO fields are silently deleted 
    // before the service gets to process them.
    const settingsDto = req.body; 

    await this.users.updateSettings(id, settingsDto);
    const mappedSettings = await this.users.getSettings(id);

    this.realtime.emitToUser(id, 'user:settingsUpdated', {
      userId: id,
      ts: new Date().toISOString(),
    });

    return { success: true, data: mappedSettings };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/phone/send-code')
  async sendPhoneCode(@Req() req: any, @Body() body: { phoneNumber: string }) {
    const userId = req?.user?.sub || req?.user?.id;
    if (!body?.phoneNumber) throw new BadRequestException('phoneNumber is required');
    await this.users.requestPhoneVerification(userId, body.phoneNumber);
    return { success: true, message: 'Verification code sent' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/phone/verify-code')
  async verifyPhoneCode(@Req() req: any, @Body() body: { code: string }) {
    const userId = req?.user?.sub || req?.user?.id;
    if (!body?.code) throw new BadRequestException('code is required');
    const verified = await this.users.confirmPhoneVerification(userId, body.code);
    if (!verified) throw new BadRequestException('Invalid or expired verification code');
    return { success: true, message: 'Phone number verified successfully' };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('me/follows')
  async myFollows(@Req() req: any) {
    if (!this.follows) throw new BadRequestException('ProjectFollowService not configured.');
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const svc: any = this.follows as any;
    const fn = svc.listMyFollows || svc.listForUser || svc.listByUser || svc.listUserFollows || svc.getMyFollows || svc.getFollowsForUser || svc.list || null;
    if (typeof fn !== 'function') throw new BadRequestException('ProjectFollowService is missing a list method.');
    return fn.call(svc, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferences(userId, preferences);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences/:section')
  async updatePreferenceSection(@Req() req: any, @Param('section') section: string, @Body() values: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferenceSection(userId, section, values);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!this.uploadService) throw new BadRequestException('UploadsService not configured.');
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const avatarUrl = await this.uploadService.uploadAvatar(file);
    const updated = await this.users.updateAvatar(userId, avatarUrl);

    this.realtime.emitToUser(userId, 'user:updated', {
      userId,
      profilePicture: (updated as any)?.profilePicture ?? avatarUrl,
      ts: new Date().toISOString(),
    });

    await this.safeRecord({ userId, type: 'user.avatar.updated', payload: { avatarUrl } });
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  async deleteAvatar(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    await this.users.updateAvatar(userId, null);
    this.realtime.emitToUser(userId, 'user:updated', { userId, profilePicture: null, ts: new Date().toISOString() });
    return { success: true, message: 'Avatar deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/export')
  async exportData(@Req() req: any, @Res() res: Response) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const exportData = await this.users.exportUserData(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=my-sharesync-data.json');
    res.send(JSON.stringify(exportData, null, 2));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Req() req: any, @Body() body: { confirmation?: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (body?.confirmation !== 'DELETE') throw new BadRequestException('Please confirm account deletion by sending { "confirmation": "DELETE" }');
    await this.users.deleteAccount(userId);
    return { success: true, message: 'Account deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/change-password')
  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!body?.currentPassword || !body?.newPassword) throw new BadRequestException('currentPassword and newPassword are required');
    await this.users.changePassword(userId, body.currentPassword, body.newPassword);
    return { success: true, message: 'Password changed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  async getActivitySummary(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getActivitySummary(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/projects-by-category')
  async myProjectsByCategory(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getProjectsByCategory(id);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const searchLimit = parseInt(limit || '10', 10);
    const users = await this.users.searchUsers(query, searchLimit);
    return { success: true, data: users };
  }

  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    return user;
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.users.findPublicById(id);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  @Get(':id/activity')
  async userActivity(@Param('id') id: string) {
    return this.activities.list({ scope: 'user', userId: id, range: '7d', limit: 20, cursor: null });
  }
}

// src/user/user.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';

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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.findById(id);
  }

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

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferences(userId, preferences);
  }

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

  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    return user;
  }

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

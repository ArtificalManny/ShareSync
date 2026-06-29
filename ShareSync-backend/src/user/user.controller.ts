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
import * as path from 'node:path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { ModerationService, ModerationDecision, ModerationCategory } from '../moderation/moderation.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { policyForUpload } from '../moderation/policy';

// ⚠️ If your UploadService lives somewhere else, update this import path.
import { UploadsService } from '../uploads/uploads.service';

// ✅ Phase 3: follows
import { ProjectFollowService } from '../follows/project-follow.service';


function normalizePublicAvatarUrl(value: any): string | null {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return null;

  const backendBase = String(
    process.env.UPLOADS_BASE_URL ||
      process.env.PUBLIC_BACKEND_URL ||
      process.env.API_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://openshare-backend.onrender.com',
  )
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');

  if (/^https?:\/\/(localhost|127\.0\.0\.1):5050/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5050/i, backendBase);
  }

  if (raw.startsWith('/uploads/')) return `${backendBase}${raw}`;
  if (raw.startsWith('uploads/')) return `${backendBase}/${raw}`;

  return raw;
}

function normalizeUserAvatarPayload(userLike: any): any {
  if (!userLike) return userLike;

  const user =
    typeof userLike.toObject === 'function'
      ? userLike.toObject()
      : { ...userLike };

  const fixed = normalizePublicAvatarUrl(
    user.avatarUrl ||
      user.profilePicture ||
      user.profileImage ||
      user.avatar ||
      user.photoUrl ||
      user.imageUrl ||
      user.picture,
  );

  if (fixed) {
    user.avatarUrl = fixed;
    user.profilePicture = fixed;
    user.profileImage = user.profileImage || fixed;
  }

  return user;
}


const avatarModerationDiskStorage = diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});


@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,

    @Optional() private readonly uploadService?: UploadsService,
    @Optional() private readonly follows?: ProjectFollowService,
    @Optional() private readonly moderationService?: ModerationService,
    @Optional() private readonly imageModerationService?: ImageModerationService,
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
    const id = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const user = await this.users.findById(id);
    const normalized = normalizeUserAvatarPayload(user);

    const currentAvatar =
      (user as any)?.avatarUrl ||
      (user as any)?.profilePicture ||
      (user as any)?.profileImage ||
      '';

    const fixedAvatar =
      normalized?.avatarUrl ||
      normalized?.profilePicture ||
      normalized?.profileImage ||
      '';

    if (
      fixedAvatar &&
      currentAvatar &&
      fixedAvatar !== currentAvatar &&
      (/localhost/i.test(String(currentAvatar)) || /127\.0\.0\.1/.test(String(currentAvatar)))
    ) {
      try {
        await this.users.update(id, {
          profilePicture: fixedAvatar,
          avatarUrl: fixedAvatar,
        } as any);
      } catch {
        // Do not break profile loading if the one-time repair fails.
      }
    }

    return normalized;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/me - Partial update (existing)
  // ─────────────────────────────────────────────────────────────────────────────

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
  @UseInterceptors(TextModerationInterceptor)
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
  // GET /users/me/streak-protection - Backend-authoritative streak protection
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/streak-protection')
  async getStreakProtection(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    const status = await this.users.getStreakProtectionStatus(id);

    return {
      success: true,
      data: status,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /users/me/streak-protection/use-freeze - Consume a freeze if allowed
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/streak-protection/use-freeze')
  async useStreakFreeze(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    const result = await this.users.useStreakFreeze(id);

    // Non-blocking activity log so streak protection use shows up later if desired
    await this.safeRecord({
      userId: id,
      type: 'user.streak.freeze_used',
      payload: {
        freezeCount: result?.freezeCount ?? 0,
        streakDays: result?.streakDays ?? 0,
      },
    });

    this.realtime.emitToUser(id, 'user:streakProtectionUpdated', {
      userId: id,
      freezeCount: result?.freezeCount ?? 0,
      streakDays: result?.streakDays ?? 0,
      isAtRisk: result?.isAtRisk ?? false,
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      data: result,
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
  // POST /users/me/phone/send-code - Request phone verification
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/phone/send-code')
  async sendPhoneCode(
    @Req() req: any,
    @Body() body: { phoneNumber: string },
  ) {
    const userId = req?.user?.sub || req?.user?.id;

    if (!body?.phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }

    await this.users.requestPhoneVerification(userId, body.phoneNumber);

    return {
      success: true,
      message: 'Verification code sent',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /users/me/phone/verify-code - Confirm phone verification
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('me/phone/verify-code')
  async verifyPhoneCode(
    @Req() req: any,
    @Body() body: { code: string },
  ) {
    const userId = req?.user?.sub || req?.user?.id;

    if (!body?.code) {
      throw new BadRequestException('code is required');
    }

    const verified = await this.users.confirmPhoneVerification(userId, body.code);

    if (!verified) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return {
      success: true,
      message: 'Phone number verified successfully',
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

  private async assertAvatarImageAllowed(file: Express.Multer.File) {
    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = Number(file.size || 0);
    const fsPath = (file as any).path || '';

    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image.');
    }

    if (!this.moderationService || !this.imageModerationService) {
      throw new BadRequestException(
        'Image safety moderation is not configured for avatar uploads.',
      );
    }

    const virus = await this.moderationService.virusScan(fsPath);

    const imgResult = await this.imageModerationService.moderateImage(fsPath);

    if (imgResult.action === 'block') {
      throw new BadRequestException(
        imgResult.reason || 'This profile photo is not allowed.',
      );
    }

    const image = {
      decision: (
        imgResult.action === 'allow'
          ? 'ALLOW'
          : imgResult.action === 'review'
            ? 'REVIEW'
            : 'BLOCK'
      ) as ModerationDecision,
      reason: imgResult.reason,
      categories: imgResult.labels.map((label) => label.name) as ModerationCategory[],
    };

    const decision = policyForUpload({
      ext,
      sizeBytes: size,
      mime,
      virus,
      image,
    });

    await this.moderationService.logDecision({
      kind: 'avatar',
      ext,
      size,
      mime,
      decision: decision.decision,
      reason: decision.reason,
      ts: Date.now(),
    });

    if (decision.decision === 'BLOCK') {
      throw new BadRequestException(
        decision.reason || 'This profile photo is not allowed.',
      );
    }

    if (decision.decision === 'REVIEW') {
      throw new BadRequestException(
        decision.reason || 'This profile photo needs review and cannot be used yet.',
      );
    }
  }

  // POST /users/me/avatar - Upload avatar
  // ─────────────────────────────────────────────────────────────────────────────


  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    return {
      success: true,
      data: await this.users.getMyStats(userId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarModerationDiskStorage }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!this.uploadService) {
      throw new BadRequestException(
        'UploadsService not configured. Wire UploadsModule into UserModule to enable avatar uploads.',
      );
    }

    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    await this.assertAvatarImageAllowed(file);

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
  async exportUserData(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const data = await this.users.exportUserData(userId);

    return {
      success: true,
      data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /users/me - Delete account
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(
    @Req() req: any,
    @Body() body: { confirmation?: string },
  ) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

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
  // GET /users/activity-summary - Summary for Home dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  async getActivitySummary(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getActivitySummary(userId);
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  @Get('me/weekly-rhythm')
  async getMyWeeklyRhythm(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getWeeklyRhythm(userId);
  }

  // Backwards-compatible alias in case any client calls /users/weekly-rhythm.
  @UseGuards(JwtAuthGuard)
  @Get('weekly-rhythm')
  async getWeeklyRhythm(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getWeeklyRhythm(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/search?q=...&limit=10
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const lim = Math.min(Math.max(parseInt(limit || '10', 10) || 10, 1), 25);
    const users = await this.users.searchUsers(q, lim);

    return {
      success: true,
      data: users.map((u: any) => ({
        id: u._id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        name:
          u.name ||
          [u.firstName, u.lastName].filter(Boolean).join(' ') ||
          u.username,
        profilePicture: u.profilePicture || null,
        bio: u.bio || '',
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/username/:username - existing helper
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('username/:username')
  async getByUsername(@Param('username') username: string) {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/public/:username - PUBLIC PROFILE ENDPOINT (NEW)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('public/:username')
  async getPublicProfile(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) {
      throw new NotFoundException('Public profile not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/:id
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}

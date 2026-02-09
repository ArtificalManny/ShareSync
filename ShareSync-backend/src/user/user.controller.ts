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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FileInterceptor } from '@nestjs/platform-express';

// ⚠️ If your UploadService lives somewhere else, update this import path.
import { UploadService } from '../upload/upload.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * GET /api/users/me
   * Returns the authenticated user's profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.findById(id);
  }

  /**
   * PATCH /api/users/me
   * Updates profile fields. If display-related fields changed, emit `user:updated`
   * so all tabs/clients refresh avatars/names.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async patchMe(@Req() req: any, @Body() patch: any) {
    const id = req?.user?.sub || req?.user?.id;

    const before = await this.users.findById(id);
    const updated = await this.users.update(id, patch);

    // Detect display-impacting changes
    const fields = ['firstName', 'lastName', 'username', 'profilePicture', 'bio'];
    const changed = fields.some((k) => (before as any)?.[k] !== (updated as any)?.[k]);
    if (changed) {
      this.realtime.emitToUser(id, 'user:updated', {
        userId: id,
        firstName: (updated as any)?.firstName,
        lastName: (updated as any)?.lastName,
        username: (updated as any)?.username,
        profilePicture: (updated as any)?.profilePicture,
        bio: (updated as any)?.bio,
        ts: new Date().toISOString(),
      });
    }

    await this.activities.record({
      userId: id,
      type: 'user.updated',
      payload: { fields: Object.keys(patch || {}) },
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ PHASE 5.1: PREFERENCES + AVATAR ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /api/users/me/preferences
   * Replace/merge preferences blob.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.updatePreferences(userId, preferences);
  }

  /**
   * PATCH /api/users/me/preferences/:section
   * Update a specific preferences section (e.g. "notifications", "privacy", "ui").
   */
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

  /**
   * POST /api/users/me/avatar
   * Upload avatar image and update user profilePicture/avatar URL.
   */
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    // Upload to storage and get URL
    const avatarUrl = await this.uploadService.uploadAvatar(file);

    // Persist to user record
    const updated = await this.users.updateAvatar(userId, avatarUrl);

    // Let all tabs/clients refresh immediately
    this.realtime.emitToUser(userId, 'user:updated', {
      userId,
      profilePicture: (updated as any)?.profilePicture ?? avatarUrl,
      ts: new Date().toISOString(),
    });

    await this.activities.record({
      userId,
      type: 'user.avatar.updated',
      payload: { avatarUrl },
    });

    return updated;
  }

  /**
   * GET /api/users/activity-summary
   * Returns streak + XP + monthly stats for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  async getActivitySummary(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getActivitySummary(id);
  }

  /**
   * GET /api/users/me/projects-by-category
   * Uses UserService.getProjectsByCategory to group projects as School/Job/Personal.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me/projects-by-category')
  async myProjectsByCategory(@Req() req: any) {
    const id = req?.user?.sub || req?.user?.id;
    return this.users.getProjectsByCategory(id);
  }

  /**
   * GET /api/users/leaderboard/streaks
   * Returns top streaks for the streak leaderboard.
   */
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

  /**
   * GET /api/users/public/:username
   * Public profile view honoring the `publicProfile` flag.
   */
  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    return user;
  }

  /**
   * GET /api/users/:id/activity
   * Basic activity listing for a user.
   */
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

  // ============================================
  // 🚀 PHASE 1: MOMENTUM & NARRATIVE ENDPOINTS
  // ============================================

  /**
   * GET /api/users/momentum
   * Calculate momentum index (0-100) based on ships, focus time, streaks
   */
  @UseGuards(JwtAuthGuard)
  @Get('momentum')
  async getMomentumIndex(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;

    // For now, return mock data - you can implement full logic later
    const momentumIndex = 75;
    const status = 'Strong';
    const message = "Solid progress - you're on track";

    return {
      momentumIndex,
      status,
      message,
      comparison: "You're ahead of your usual pace",
      breakdown: {
        shipsToday: 3,
        shipsGoal: 5,
        focusMinutes: 42,
        projectsTouched: 2,
        streakProtected: true,
        currentStreak: 7,
      },
    };
  }

  /**
   * GET /api/users/weekly-narrative
   * Harry Enten-style conversational weekly summary
   */
  @UseGuards(JwtAuthGuard)
  @Get('weekly-narrative')
  async getWeeklyNarrative(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;

    // For now, return mock data - you can implement full logic later
    return {
      shipCount: {
        thisWeek: 7,
        lastWeek: 5,
        delta: 2,
        direction: 'up',
        text: "You've shipped 7 tasks (↑+2 vs last week)",
      },
      peakTime: {
        window: 'Tue 14-15',
        text: 'Most work happened Tue 2-4pm',
      },
      prediction: {
        text: "If you ship 2 more tasks this week, you'll beat your usual average",
        projectedTotal: 9,
        willBeatAverage: true,
      },
    };
  }

  /**
   * GET /api/users/profile-analytics
   * Phase 3: Collaboration style, reliability, and role classification
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile-analytics')
  async getProfileAnalytics(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;

    // Get user's projects and tasks
    const user = await this.users.findById(userId);

    // Placeholder calculations - you can enhance these with real data
    const analytics = {
      collaborationStyle: {
        soloPercentage: 70,
        coWorkingPercentage: 30,
        completionMultiplier: 2.1,
        primaryRole: 'Finisher',
        description: 'You close more tasks than you start',
        strength: 'Teams can rely on you to get things over the line',
        suggestion:
          'Try: Schedule 1 co-working session this week. Your completion rate is 2.1× higher when working alongside teammates',
      },
      reliability: {
        streakDays: (user as any)?.streakDays || 0,
        daysShowedUp: 18,
        totalDays: 20,
        missedDays: 2,
        showUpRate: 90,
        missedReason: 'No tasks scheduled',
        insight: 'You work best when tasks are pre-planned. Try Sunday planning sessions.',
      },
      roleClassification: {
        role: 'Finisher',
        tasksStarted: 12,
        tasksClosed: 18,
        commentsGiven: 8,
        helpRequests: 3,
        confidence: 85,
        traits: ['Closes more tasks than started', 'Reliable for completion', 'Gets things over the line'],
      },
    };

    return analytics;
  }
}

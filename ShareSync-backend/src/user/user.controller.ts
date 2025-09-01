// src/user/user.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
// If your gateway is NotificationsGateway instead, import that and inject it below.
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway, // or NotificationsGateway
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
      // Broadcast to the user’s sockets; clients listen and refresh from /users/me
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

    // Optional: record activity (safe no-op if your ActivitiesService is just a stub)
    await this.activities.record({
      userId: id,
      type: 'user.updated',
      payload: { fields: Object.keys(patch || {}) },
    });

    return updated;
  }

  /**
   * GET /api/users/public/:username
   * Public profile view honoring the `publicProfile` flag.
   */
  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    // Prefer the privacy-aware method you already have.
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    return user;
  }

  /**
   * GET /api/users/:id/activity
   * Basic activity listing for a user (can add auth or privacy gates later).
   * Supports your ActivitiesService cursor listing.
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
}
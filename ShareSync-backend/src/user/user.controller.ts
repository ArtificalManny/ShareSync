// src/api/user/user.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 🔐 Get current user's profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserDetails(@Request() req) {
    const user = await this.userService.findById(req.user.sub);
    return {
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
      notificationPreferences: user.notificationPreferences,
      lastLogin: user.lastLogin,
      streakDays: user.streakDays,
    };
  }

  // 📁 Get all projects for the user
  @UseGuards(JwtAuthGuard)
  @Get('projects')
  async getUserProjects(@Request() req) {
    return this.userService.getProjectsByCategory(req.user.sub);
  }

  // 🖼️ Update profile details
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body()
    profileData: {
      profilePicture?: string;
      bannerPicture?: string;
      school?: string;
      job?: string;
    },
  ) {
    return this.userService.updateProfile(req.user.sub, profileData);
  }

  // 🔔 Update notification preferences
  @UseGuards(JwtAuthGuard)
  @Put('notifications')
  async updateNotificationPreferences(
    @Request() req,
    @Body('preferences') preferences: string[],
  ) {
    return this.userService.updateNotificationPreferences(
      req.user.sub,
      preferences,
    );
  }

  // 🧠 Track login activity
  @UseGuards(JwtAuthGuard)
  @Post('login-activity')
  async updateLoginActivity(@Request() req) {
    return this.userService.trackLoginActivity(req.user.email);
  }

  // 📊 ✅ NEW: Return XP + streak analytics
  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  getActivitySummary(@Request() req) {
    // Replace this mock with actual DB logic later
    return {
      xpHistory: [
        { date: '2025-07-20', amount: 10, type: 'Task Completed' },
        { date: '2025-07-21', amount: 15, type: 'Post Created' },
        { date: '2025-07-22', amount: 20, type: 'Completed Milestone' },
      ],
      streakData: [
        { date: '2025-07-20', count: 1 },
        { date: '2025-07-21', count: 2 },
        { date: '2025-07-22', count: 3 },
      ],
      totalXP: 85,
    };
  }
}
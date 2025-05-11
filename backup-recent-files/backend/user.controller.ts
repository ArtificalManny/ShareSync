import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects')
  async getUserProjects(@Request() req) {
    return this.userService.getProjectsByCategory(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() profileData: { profilePicture?: string; bannerPicture?: string; school?: string; job?: string }) {
    return this.userService.updateProfile(req.user.sub, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Put('notifications')
  async updateNotificationPreferences(@Request() req, @Body('preferences') preferences: string[]) {
    return this.userService.updateNotificationPreferences(req.user.sub, preferences);
  }
}
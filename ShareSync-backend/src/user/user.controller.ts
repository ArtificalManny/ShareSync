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

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  /** GET /api/users/me */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // JwtStrategy typically sets req.user = { sub: <userId>, email, ... }
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException();
    // Optionally strip sensitive fields before returning
    const { password, resetToken, verificationToken, ...safe } = (user as any)._doc || user;
    return safe;
  }

  /** PATCH /api/users/me */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async patchMe(@Req() req: any, @Body() patch: any) {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const updated = await this.users.updateById(userId, patch);
    const { password, resetToken, verificationToken, ...safe } = (updated as any)._doc || updated;
    return safe;
  }

  /** GET /api/users/public/:username */
  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findPublicByUsername(username);
    if (!user) throw new NotFoundException();
    // Public view: already filtered in service, but strip again just in case
    const { password, resetToken, verificationToken, ...safe } = (user as any)._doc || user;
    return safe;
  }
}

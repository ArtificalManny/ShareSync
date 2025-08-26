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
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

function avatarFilename(original = 'avatar.png') {
  const base = Date.now().toString(36);
  return `${base}${extname(original) || '.png'}`;
}

@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly activities: ActivitiesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.users.findById(req.user.sub || req.user.id);
    return user;
  }

  // PATCH /api/users/me  (emit user:updated on avatar/name/bio changes)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async patchMe(@Req() req: any, @Body() patch: any) {
    const id = req.user.sub || req.user.id;
    const prev = await this.users.findById(id);
    const updated = await this.users.update(id, patch);

    // If display fields changed, tell clients to refresh
    const fields = ['firstName', 'lastName', 'username', 'profilePicture', 'bio'];
    const changed = fields.some((k) => (prev as any)?.[k] !== (updated as any)?.[k]);
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
    return updated;
  }

  // POST /api/users/me/avatar  (multer upload + socket fan-out)
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_req, file, cb) => cb(null, avatarFilename(file?.originalname)),
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    }),
  )
  async uploadAvatar(@Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    const userId = req?.user?.sub || req?.user?.id;
    if (!userId) throw new BadRequestException('Unauthorized');
    if (!file) throw new BadRequestException('No file uploaded');

    const url = `/uploads/avatars/${file.filename}`;
    const updated = await this.users.update(userId, { profilePicture: url });

    // Broadcast so UI updates instantly
    this.realtime.emitToUser(userId, 'user:updated', {
      userId,
      profilePicture: url,
      firstName: (updated as any)?.firstName,
      lastName: (updated as any)?.lastName,
      username: (updated as any)?.username,
      ts: new Date().toISOString(),
    });

    return { ok: true, profilePicture: url };
  }

  // GET /api/users/public/:username
  @Get('public/:username')
  async publicUser(@Param('username') username: string) {
    const user = await this.users.findByUsername(username);
    if (!user || (user as any).publicProfile === false) {
      throw new NotFoundException();
    }
    return user;
  }

  // GET /api/users/:id/activity  (public-profile safe; feel free to guard later)
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
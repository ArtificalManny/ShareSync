// src/announcements/announcements.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';

import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects/:projectId/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get()
  async getAnnouncements(@Param('projectId') projectId: string) {
    return this.announcementsService.getProjectAnnouncements(projectId, {
      pinnedOnly: false,
    });
  }

  @Get('pinned')
  async getPinnedAnnouncements(@Param('projectId') projectId: string) {
    return this.announcementsService.getProjectAnnouncements(projectId, {
      pinnedOnly: true,
    });
  }

  @Post()
  @UseInterceptors(TextModerationInterceptor)
  async createAnnouncement(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body()
    body: {
      title: string;
      message: string;
      type?: string;
      pinned?: boolean;
      attachments?: string[];
    },
  ) {
    const authorId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.create({
      projectId,
      authorId,
      ...body,
    });
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.markAsRead(id, userId);
  }

  @Patch(':id/pin')
  async togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(id);
  }

  @Delete(':id')
  async deleteAnnouncement(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }

  @Get(':id/read-status')
  async getReadStatus(@Param('id') id: string) {
    // TODO: replace with real project member IDs
    const memberIds: string[] = [];
    return this.announcementsService.getReadStatus(id, memberIds);
  }
}

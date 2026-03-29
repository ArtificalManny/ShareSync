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

  // NOTE: TextModerationInterceptor remains strictly untouched to preserve moderation functionality
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // NEW: Likes and Comments Routes resolving the 404 Errors
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    const userId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.toggleLike(id, userId);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { text: string; attachments?: string[] },
  ) {
    const userId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.addComment(id, userId, body.text, body.attachments);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    const userId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.deleteComment(id, commentId, userId);
  }
}

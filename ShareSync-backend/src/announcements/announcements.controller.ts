// src/announcements/announcements.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';

import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle({ default: true, short: true, medium: true, long: true })
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
      fileReferences?: Array<
        string | { fileId?: string }
      >;
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

  @Patch(':id')
  async updateAnnouncement(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      message?: string;
      content?: string;
      text?: string;
      type?: string;
      pinned?: boolean;
      attachments?: string[];
      fileReferences?: Array<
        string | { fileId?: string }
      >;
    },
    @Req() req: any,
  ) {
    const rawUserId =
      req?.user?._id ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?.sub ||
      req?.user;

    return this.announcementsService.update(id, {
      projectId,
      userId: rawUserId ? String(rawUserId) : undefined,
      title: body.title,
      message: body.message ?? body.content ?? body.text,
      type: body.type,
      pinned: body.pinned,
      attachments: body.attachments,
      fileReferences:
        body.fileReferences,
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

  @Post(':id/poll/vote')
  async votePoll(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any = {},
  ) {
    const userId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');
    return this.announcementsService.votePoll(id, userId, String(body?.optionId || body?.id || ''));
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any = {},
  ) {
    const isMongoId = (value: any) =>
      typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

    const userCandidates = [
      req?.user?.userId,
      req?.user?.id,
      req?.user?._id,
      req?.user?.sub,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    const userId =
      userCandidates.find(isMongoId) ||
      userCandidates[0] ||
      '';

    const text = String(
      body?.text ??
      body?.content ??
      body?.message ??
      body?.comment ??
      ''
    ).trim();

    const attachments = Array.isArray(body?.attachments) ? body.attachments : [];

    return this.announcementsService.addComment(id, userId, text, attachments);
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

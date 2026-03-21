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

  // Helper: extract userId from JWT payload
  private getUserId(req: any): string {
    return String(
      req?.user?.userId ||
        req?.user?._id ||
        req?.user?.id ||
        req?.user?.sub ||
        '',
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET all announcements (populated with author avatars + comments)
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE announcement (text moderation on title + message)
  // ═══════════════════════════════════════════════════════════════════════════

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
    const authorId = this.getUserId(req);

    return this.announcementsService.create({
      projectId,
      authorId,
      ...body,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARK AS READ
  // ═══════════════════════════════════════════════════════════════════════════

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = this.getUserId(req);
    return this.announcementsService.markAsRead(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE PIN
  // ═══════════════════════════════════════════════════════════════════════════

  @Patch(':id/pin')
  async togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE announcement
  // ═══════════════════════════════════════════════════════════════════════════

  @Delete(':id')
  async deleteAnnouncement(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get(':id/read-status')
  async getReadStatus(@Param('id') id: string) {
    // TODO: replace with real project member IDs
    const memberIds: string[] = [];
    return this.announcementsService.getReadStatus(id, memberIds);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: TOGGLE LIKE
  // ═══════════════════════════════════════════════════════════════════════════

  @Patch(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    const userId = this.getUserId(req);
    return this.announcementsService.toggleLike(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: ADD COMMENT (text moderation on comment text)
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/comments')
  @UseInterceptors(TextModerationInterceptor)
  async addComment(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { text: string; attachments?: string[] },
  ) {
    const authorId = this.getUserId(req);

    return this.announcementsService.addComment({
      announcementId: id,
      authorId,
      text: body.text,
      attachments: body.attachments || [],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: DELETE COMMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.announcementsService.deleteComment(id, commentId);
  }
}

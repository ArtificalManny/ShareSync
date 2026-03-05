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
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // ✅ Needed for file uploads

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
  @UseInterceptors(FileInterceptor('file')) // ✅ Intercept incoming file named 'file'
  async createAnnouncement(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body()
    body: {
      title: string;
      message: string;
      type?: string;
      pinned?: boolean | string;
      attachments?: string[];
    },
    @UploadedFile() file?: Express.Multer.File, // ✅ Extract file from request
  ) {
    const authorId =
      String(req?.user?.userId || req?.user?._id || req?.user?.id || req?.user?.sub || '');

    return this.announcementsService.create({
      projectId,
      authorId,
      ...body,
      file, // ✅ Pass file down to service
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

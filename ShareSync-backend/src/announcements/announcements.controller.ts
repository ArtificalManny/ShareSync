import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Patch,
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/projects/:projectId/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService
  ) {}

  @Get()
  async getAnnouncements(
    @Param('projectId') projectId: string,
  ) {
    return this.announcementsService.getProjectAnnouncements(projectId, {
      pinnedOnly: false,
    });
  }

  @Get('pinned')
  async getPinnedAnnouncements(
    @Param('projectId') projectId: string,
  ) {
    return this.announcementsService.getProjectAnnouncements(projectId, {
      pinnedOnly: true,
    });
  }

  @Post()
  async createAnnouncement(
    @Param('projectId') projectId: string,
    @Request() req,
    @Body() body: {
      title: string;
      message: string;
      type?: string;
      pinned?: boolean;
      attachments?: string[];
    },
  ) {
    return this.announcementsService.create({
      projectId,
      authorId: req.user.userId,
      ...body,
    });
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.announcementsService.markAsRead(id, req.user.userId);
  }

  @Patch(':id/pin')
  async togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(id);
  }

  @Delete(':id')
  async deleteAnnouncement(@Param('id') id: string) {
    await this.announcementsService.delete(id);
    return { success: true };
  }

  @Get(':id/read-status')
  async getReadStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    // TODO: Get project member IDs from ProjectService
    const memberIds = []; // Placeholder
    return this.announcementsService.getReadStatus(id, memberIds);
  }
}
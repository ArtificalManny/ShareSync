import { 
  Controller, 
  Get, 
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards, 
  Request 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.userId,
      { unreadOnly: unreadOnly === 'true' }
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req,
  ) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Request() req,
  ) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
    return { success: true };
  }
}
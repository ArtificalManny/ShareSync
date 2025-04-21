import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from '../schemas/notification.schema';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async getNotifications(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUser(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    const notification = await this.notificationsService.markAsRead(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }
}
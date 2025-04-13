import { Controller, Get, Param, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AppGateway } from '../app.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly appGateway: AppGateway
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string) {
    const notifications = await this.notificationsService.findByUserId(userId);
    return {
      status: 'success',
      data: notifications,
    };
  }

  @Put('mark-as-read/:id')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    this.appGateway.emitNotificationCreated(notification);
    return {
      status: 'success',
      message: 'Notification marked as read',
      data: notification,
    };
  }
}
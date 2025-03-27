import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() createNotificationDto: Partial<Notification>): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUserId(userId);
  }
}
import { Controller, Get, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async findByUser(@Param('userId') userId: string) {
    const notifications = await this.notificationsService.findByUser(userId);
    return { data: notifications };
  }
}
import { Controller, Get, Param, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async findByUser(@Param('userId') userId: string) {
    try {
      return await this.notificationsService.findByUser(userId);
    } catch (error) {
      console.error('Error in findByUser:', error);
      throw error;
    }
  }

  @Put('mark-as-read/:id')
  async markAsRead(@Param('id') id: string) {
    try {
      return await this.notificationsService.markAsRead(id);
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }
}
import { Controller, Get, Delete, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findByUser(@Request() req): Promise<any[]> {
    return this.notificationService.findByUser(req.user.sub);
  }

  @Delete('clear')
  async clear(@Request() req): Promise<void> {
    return this.notificationService.clear(req.user.sub);
  }
}
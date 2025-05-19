import { Controller, Get, Put, Post, Param, Request, UseGuards, Body } from '@nestjs/common'; // Line 1
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Line 2
import { NotificationService } from './notification.service'; // Line 3

@Controller('api/notifications') // Line 5
@UseGuards(JwtAuthGuard) // Line 6
export class NotificationController { // Line 7
  constructor(private readonly notificationService: NotificationService) {} // Line 8

  @Get() // Line 10
  async getNotifications(@Request() req) { // Line 11
    return this.notificationService.getNotifications(req.user.sub); // Line 12
  } // Line 13

  @Put(':id') // Line 15
  async markAsRead(@Param('id') id: string) { // Line 16
    return this.notificationService.markAsRead(id); // Line 17
  } // Line 18

  // New endpoint to create a notification // Line 20
  @Post() // Line 21
  async createNotification(@Request() req, @Body() body: { message: string }) { // Line 22
    return this.notificationService.createNotification(req.user.sub, body.message); // Line 23
  } // Line 24
} // Line 25
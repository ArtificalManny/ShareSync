// src/notifications/notifications.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/query-notifications.dto';
import { NotificationType } from './schemas/notification.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getNotifications(@Req() req: any, @Query() query: NotificationQueryDto) {
    const result = await this.notificationsService.findByUser(req.user.userId, query);
    return {
      success: true,
      data: result.notifications,
      meta: {
        total: result.total,
        unread: result.unread,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    const byType = await this.notificationsService.getCountByType(req.user.userId);

    return {
      success: true,
      data: {
        total: count,
        byType,
      },
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    await this.notificationsService.markAsRead(id, userId);

    // Emit read event (gateway listens and pushes realtime if wired)
    this.eventEmitter.emit('notification.read', { userId, notificationId: id });

    // Emit updated count
    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return { success: true };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.userId;

    const count = await this.notificationsService.markAllAsRead(userId);

    this.eventEmitter.emit('notification.read_all', { userId, markedCount: count });

    // After read-all, unread should be 0 (but we compute to be safe)
    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return {
      success: true,
      data: { markedCount: count },
    };
  }

  @Patch(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as clicked' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsClicked(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    await this.notificationsService.markAsClicked(id, userId);

    // Click implies read in your service; update count
    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return { success: true };
  }

  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async dismiss(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    await this.notificationsService.dismiss(id, userId);

    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    await this.notificationsService.delete(id, userId);

    this.eventEmitter.emit('notification.deleted', { userId, notificationId: id });

    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return { success: true };
  }

  @Delete('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all read notifications' })
  async deleteAllRead(@Req() req: any) {
    const userId = req.user.userId;

    const count = await this.notificationsService.deleteAllRead(userId);

    // Deleting read notifications doesn't change unread, but we can still emit count
    const unread = await this.notificationsService.getUnreadCount(userId);
    this.eventEmitter.emit('notification.count', { userId, unread });

    return {
      success: true,
      data: { deletedCount: count },
    };
  }
}

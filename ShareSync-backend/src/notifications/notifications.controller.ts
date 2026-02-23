// src/notifications/notifications.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTROLLER: REST API for notification management
// Phase 9: Complete endpoint coverage
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /notifications - List notifications for current user
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  async getNotifications(@Req() req: any, @Query() query: NotificationQueryDto) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const result = await this.notificationsService.findByUser(userId, query);

    return {
      success: true,
      data: result,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /notifications/unread-count - Get unread count
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const count = await this.notificationsService.getUnreadCount(userId);

    return {
      success: true,
      data: { unread: count },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /notifications/count-by-type - Get counts grouped by type
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('count-by-type')
  async getCountByType(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const counts = await this.notificationsService.getCountByType(userId);

    return {
      success: true,
      data: counts,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /notifications/:id/read - Mark single notification as read
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    await this.notificationsService.markAsRead(notificationId, userId);

    // Emit event for WebSocket sync
    this.eventEmitter.emit('notification.read', { userId, notificationId });

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /notifications/read-all - Mark all notifications as read
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const markedCount = await this.notificationsService.markAllAsRead(userId);

    // Emit event for WebSocket sync
    this.eventEmitter.emit('notification.read_all', { userId, markedCount });

    return {
      success: true,
      message: `Marked ${markedCount} notifications as read`,
      data: { markedCount },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /notifications/:id/clicked - Mark as clicked (also marks read)
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/clicked')
  @HttpCode(HttpStatus.OK)
  async markAsClicked(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    await this.notificationsService.markAsClicked(notificationId, userId);

    return {
      success: true,
      message: 'Notification marked as clicked',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /notifications/:id/dismiss - Dismiss notification
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismiss(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    await this.notificationsService.dismiss(notificationId, userId);

    return {
      success: true,
      message: 'Notification dismissed',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /notifications/:id - Delete single notification
  // ─────────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    await this.notificationsService.delete(notificationId, userId);

    // Emit event for WebSocket sync
    this.eventEmitter.emit('notification.deleted', { userId, notificationId });

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /notifications/read - Delete all read notifications
  // ─────────────────────────────────────────────────────────────────────────────

  @Delete('read')
  @HttpCode(HttpStatus.OK)
  async deleteAllRead(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    const deletedCount = await this.notificationsService.deleteAllRead(userId);

    return {
      success: true,
      message: `Deleted ${deletedCount} read notifications`,
      data: { deletedCount },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /notifications/test - Create test notification (dev only)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('test')
  @HttpCode(HttpStatus.CREATED)
  async createTestNotification(@Req() req: any, @Body() body: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'Test notifications not available in production',
      };
    }

    const notification = await this.notificationsService.notify({
      userId,
      type: body?.type || 'system',
      title: body?.title || 'Test Notification',
      body: body?.body || 'This is a test notification',
      icon: body?.icon || '🧪',
      priority: body?.priority || 'normal',
      data: body?.data || {},
    });

    return {
      success: true,
      data: notification,
    };
  }
}

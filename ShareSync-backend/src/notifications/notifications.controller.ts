// src/notifications/notifications.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
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
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { NotificationType } from './schemas/notification.schema';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getNotifications(
    @Req() req: any,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.notificationsService.findByUser(
      req.user.userId,
      query,
    );
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
    await this.notificationsService.markAsRead(id, req.user.userId);
    return {
      success: true,
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    const count = await this.notificationsService.markAllAsRead(req.user.userId);
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
    await this.notificationsService.markAsClicked(id, req.user.userId);
    return {
      success: true,
    };
  }

  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async dismiss(@Req() req: any, @Param('id') id: string) {
    await this.notificationsService.dismiss(id, req.user.userId);
    return {
      success: true,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.notificationsService.delete(id, req.user.userId);
    return {
      success: true,
    };
  }

  @Delete('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all read notifications' })
  async deleteAllRead(@Req() req: any) {
    const count = await this.notificationsService.deleteAllRead(req.user.userId);
    return {
      success: true,
      data: { deletedCount: count },
    };
  }
}
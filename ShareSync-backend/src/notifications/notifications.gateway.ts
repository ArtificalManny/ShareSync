// src/notifications/notifications.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS GATEWAY: Real-time WebSocket push
// ═══════════════════════════════════════════════════════════════════════════════

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationDocument } from './schemas/notification.schema';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;

      // Track socket
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      // Join user's room
      client.join(`user:${client.userId}`);

      this.logger.log(`Client connected to notifications: ${client.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.get(client.userId)?.delete(client.id);
      if (this.userSockets.get(client.userId)?.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }
    this.logger.log(`Client disconnected from notifications: ${client.id}`);
  }

  // Listen for notification creation events
  @OnEvent('notification.created')
  handleNotificationCreated(notification: NotificationDocument) {
    const userId = notification.userId.toString();
    this.server.to(`user:${userId}`).emit('notification:new', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      priority: notification.priority,
      data: notification.data,
      actions: notification.actions,
      createdAt: notification.createdAt,
    });
  }

  // Helper to send to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}

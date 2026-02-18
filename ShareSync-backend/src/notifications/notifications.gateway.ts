// src/notifications/notifications.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS GATEWAY: Real-time WebSocket push
// Rooms:
//   user:{userId}
//   project:{projectId}
//   public:project:{projectId}         ✅ NEW (spectator stream)
// Emits:
//   notification:new
//   notification:read
//   notification:count
//   notification:deleted
//   public:project:update              ✅ NEW (spectator stream)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
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
    origin:
      process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
      ],
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

  afterInit(_server: Server) {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      // NOTE: For now we keep auth required (existing behavior).
      // If you later want true anonymous spectators, we can add a separate public namespace.
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;

      if (!client.userId) {
        client.disconnect();
        return;
      }

      // Track socket
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      // Join user's room
      client.join(`user:${client.userId}`);

      this.logger.log(
        `Client connected to notifications: ${client.id} (user:${client.userId})`,
      );
    } catch (_error) {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM JOIN / LEAVE (project:{projectId})
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('project:join')
  handleProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    const projectId = body?.projectId;
    if (!client.userId || !projectId) return;

    client.join(`project:${projectId}`);
    this.logger.log(`user:${client.userId} joined project:${projectId}`);
  }

  @SubscribeMessage('project:leave')
  handleProjectLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    const projectId = body?.projectId;
    if (!client.userId || !projectId) return;

    client.leave(`project:${projectId}`);
    this.logger.log(`user:${client.userId} left project:${projectId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ NEW: PUBLIC SPECTATOR ROOM JOIN / LEAVE (public:project:{projectId})
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('public:project:join')
  handlePublicProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    client.join(`public:project:${projectId}`);
    if (client.userId) {
      this.logger.log(
        `user:${client.userId} joined public:project:${projectId}`,
      );
    } else {
      this.logger.log(`anonymous joined public:project:${projectId}`);
    }
  }

  @SubscribeMessage('public:project:leave')
  handlePublicProjectLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    client.leave(`public:project:${projectId}`);
    if (client.userId) {
      this.logger.log(`user:${client.userId} left public:project:${projectId}`);
    } else {
      this.logger.log(`anonymous left public:project:${projectId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENTS → SOCKET EMITS
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('notification.created')
  handleNotificationCreated(notification: NotificationDocument) {
    const userId = notification.userId.toString();

    // Push new notification to recipient user room
    this.server.to(`user:${userId}`).emit('notification:new', {
      id: (notification as any)._id,
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

  @OnEvent('notification.read')
  handleNotificationRead(payload: { userId: string; notificationId: string }) {
    if (!payload?.userId || !payload?.notificationId) return;

    this.server.to(`user:${payload.userId}`).emit('notification:read', {
      id: payload.notificationId,
    });
  }

  @OnEvent('notification.read_all')
  handleNotificationReadAll(payload: { userId: string; markedCount: number }) {
    if (!payload?.userId) return;

    this.server.to(`user:${payload.userId}`).emit('notification:read', {
      all: true,
      markedCount: payload.markedCount ?? 0,
    });
  }

  @OnEvent('notification.deleted')
  handleNotificationDeleted(payload: { userId: string; notificationId: string }) {
    if (!payload?.userId || !payload?.notificationId) return;

    this.server.to(`user:${payload.userId}`).emit('notification:deleted', {
      id: payload.notificationId,
    });
  }

  @OnEvent('notification.count')
  handleNotificationCount(payload: { userId: string; unread: number }) {
    if (!payload?.userId) return;

    this.server.to(`user:${payload.userId}`).emit('notification:count', {
      unread: payload.unread ?? 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  // ✅ NEW helper
  sendToPublicProject(projectId: string, event: string, data: any) {
    this.server.to(`public:project:${projectId}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}

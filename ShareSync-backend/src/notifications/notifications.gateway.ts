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
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { validateWsSession } from '../auth/ws-session.validator';
import { Project } from '../projects/schemas/project.schema';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationDocument } from './schemas/notification.schema';
import { LiveAccessService } from '../realtime/live-access.service';

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

  constructor(
    private readonly jwtService: JwtService,
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    private readonly live: LiveAccessService,
  ) {}

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
      const session = await validateWsSession(
        this.connection,
        payload,
      );

      client.userId = session.userId;
      // openshare-live-access-v1 (R52b): remembered on the socket so every send
      // can check the session is still current.
      client.data = client.data || {};
      client.data.userId = String(session.userId).toLowerCase();
      client.data.tokenVersion = Number((payload as any)?.tokenVersion ?? 0);

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

  // account-delete-established-socket-revocation-v1
  @OnEvent('account.deleted')
  handleAccountDeleted(payload: { userId?: string }) {
    const userId = String(payload?.userId || '').trim();
    if (!userId) return;

    this.server.in(`user:${userId}`).disconnectSockets(true);

    this.logger.log(
      `Disconnected deleted account from notification sockets: ${userId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM JOIN / LEAVE (project:{projectId})
  // ─────────────────────────────────────────────────────────────────────────────

  // Resolve room access against the current database state.
  // Invalid identifiers, missing projects and database failures deny access.
  private async resolveRoomProject(projectId: unknown): Promise<any | null> {
    if (
      typeof projectId !== 'string' ||
      !/^[a-f0-9]{24}$/i.test(projectId)
    ) {
      return null;
    }

    try {
      return await this.projectModel.findById(projectId).lean();
    } catch {
      return null;
    }
  }

  @SubscribeMessage('project:join')
  async handleProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    const projectId = body?.projectId;
    const userId = client.userId;

    if (!userId) return;

    const project = await this.resolveRoomProject(projectId);
    if (!project) return;

    const ownerIds = [
      project.ownerId,
      project.owner,
      project.createdBy,
      project.createdById,
    ];

    const isOwner = ownerIds.some(
      (id) => id?.toString?.() === userId,
    );

    const isMember =
      Array.isArray(project.members) &&
      project.members.some((member: any) =>
        [member?.userId, member?.memberId, member?.user].some(
          (id) => id?.toString?.() === userId,
        ),
      );

    if (!isOwner && !isMember) return;

    await client.join(`project:${projectId}`);
    this.logger.log(`User ${userId} joined project room ${projectId}`);
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
  async handlePublicProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { projectId?: string },
  ) {
    // This namespace already requires a validated JWT session.
    // Anonymous spectators require a separate, explicit design.
    if (!client.userId) return;

    const projectId = body?.projectId;
    const project = await this.resolveRoomProject(projectId);

    if (
      !project ||
      String(project.visibility ?? '').toLowerCase() !== 'public'
    ) {
      return;
    }

    await client.join(`public:project:${projectId}`);
    this.logger.log(
      `User ${client.userId} joined public project room ${projectId}`,
    );
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
    // openshare-live-access-v1 (R52b): only to that person's current sessions.
    void this.live.sendToUser(this.server, userId, 'notification:new', {
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

    void this.live.sendToUser(this.server, payload.userId, 'notification:read', {
      id: payload.notificationId,
    });
  }

  @OnEvent('notification.read_all')
  handleNotificationReadAll(payload: { userId: string; markedCount: number }) {
    if (!payload?.userId) return;

    void this.live.sendToUser(this.server, payload.userId, 'notification:read', {
      all: true,
      markedCount: payload.markedCount ?? 0,
    });
  }

  @OnEvent('notification.deleted')
  handleNotificationDeleted(payload: { userId: string; notificationId: string }) {
    if (!payload?.userId || !payload?.notificationId) return;

    void this.live.sendToUser(this.server, payload.userId, 'notification:deleted', {
      id: payload.notificationId,
    });
  }

  @OnEvent('notification.count')
  handleNotificationCount(payload: { userId: string; unread: number }) {
    if (!payload?.userId) return;

    void this.live.sendToUser(this.server, payload.userId, 'notification:count', {
      unread: payload.unread ?? 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  sendToUser(userId: string, event: string, data: any) {
    void this.live.sendToUser(this.server, userId, event, data);
  }

  sendToProject(projectId: string, event: string, data: any) {
    void this.live.sendToProject(this.server, projectId, event, data);
  }

  // ✅ NEW helper
  sendToPublicProject(projectId: string, event: string, data: any) {
    void this.live.sendToPublicProject(this.server, projectId, event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}

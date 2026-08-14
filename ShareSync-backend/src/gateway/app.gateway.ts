// src/gateway/app.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC WEBSOCKET GATEWAY
// Handles real-time communication: messages, presence, typing indicators
// ═══════════════════════════════════════════════════════════════════════════════

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { validateWsSession } from '../auth/ws-session.validator';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    username?: string;
    rooms?: Set<string>;
  };
}

interface JoinPayload {
  room: string;
}

interface LeavePayload {
  room: string;
}

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

interface PresencePayload {
  status: 'online' | 'away' | 'busy' | 'offline';
}

// ═══════════════════════════════════════════════════════════════════════════════
// GATEWAY
// ═══════════════════════════════════════════════════════════════════════════════

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  
  // Track online users: Map<userId, Set<socketId>>
  private onlineUsers: Map<string, Set<string>> = new Map();
  
  // Track user sockets: Map<socketId, userId>
  private socketToUser: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from auth or query
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.debug(`Client ${client.id} connected without auth`);
        client.data = { rooms: new Set() };
        return;
      }

      // Verify JWT
      const secret = this.configService.get<string>('JWT_SECRET', 'sharesync-secret');
      const payload = this.jwtService.verify(token, { secret });

      const session = await validateWsSession(
        this.connection,
        payload,
      );

      const userId = session.userId;

      // Store user info on socket
      client.data = {
        userId,
        username: session.user?.username || payload.username,
        rooms: new Set(),
      };

      // Track online status
      this.addOnlineUser(userId, client.id);

      // Auto-join user's personal room
      const userRoom = `user:${userId}`;
      client.join(userRoom);
      client.data.rooms?.add(userRoom);

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);

      // Broadcast presence to friends/team
      this.broadcastPresence(userId, 'online');

    } catch (error: any) {
      // A client that supplied credentials but failed JWT/live-session
      // validation must not be downgraded into an anonymous socket.
      this.logger.debug(
        `Client ${client.id} authentication rejected: ${error?.message || error}`,
      );
      client.data = { rooms: new Set() };
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.userId;

    if (userId) {
      this.removeOnlineUser(userId, client.id);
      
      // Only broadcast offline if user has no other connections
      if (!this.isUserOnline(userId)) {
        this.broadcastPresence(userId, 'offline');
      }

      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    } else {
      this.logger.debug(`Anonymous client ${client.id} disconnected`);
    }

    // Clean up socket mapping
    this.socketToUser.delete(client.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinPayload,
  ) {
    const { room } = payload;

    if (!room || typeof room !== 'string') {
      return { success: false, error: 'Invalid room' };
    }

    // Sanitize room name
    const sanitizedRoom = room.trim().slice(0, 100);
    const userId = client.data?.userId;

    // root-room-access-hardening-v1
    //
    // Anonymous root sockets are intentionally supported for public spectator
    // streams, but they must never be able to join private application rooms.
    const publicProjectPrefix = 'public:project:';
    const isPublicProjectRoom =
      sanitizedRoom.startsWith(publicProjectPrefix) &&
      sanitizedRoom.length > publicProjectPrefix.length;

    if (!userId && !isPublicProjectRoom) {
      this.logger.warn(
        `Anonymous socket ${client.id} rejected from private room: ${sanitizedRoom}`,
      );
      return { success: false, error: 'Authentication required' };
    }

    // A live authenticated account must never subscribe to another user's
    // personal room simply by guessing or supplying the room name.
    if (
      sanitizedRoom.startsWith('user:') &&
      sanitizedRoom !== `user:${userId}`
    ) {
      this.logger.warn(
        `Socket ${client.id} rejected from user room: ${sanitizedRoom}`,
      );
      return { success: false, error: 'Not authorized for room' };
    }

    client.join(sanitizedRoom);
    client.data.rooms?.add(sanitizedRoom);

    this.logger.debug(`Socket ${client.id} joined room: ${sanitizedRoom}`);

    return { success: true, room: sanitizedRoom };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeavePayload,
  ) {
    const { room } = payload;

    if (!room || typeof room !== 'string') {
      return { success: false, error: 'Invalid room' };
    }

    client.leave(room);
    client.data.rooms?.delete(room);

    this.logger.debug(`Socket ${client.id} left room: ${room}`);

    return { success: true, room };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TYPING INDICATORS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    const { conversationId } = payload;
    if (!conversationId) return;

    // Broadcast to conversation room (excluding sender)
    client.to(`conversation:${conversationId}`).emit('typing:user', {
      userId,
      username: client.data.username,
      conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    const { conversationId } = payload;
    if (!conversationId) return;

    client.to(`conversation:${conversationId}`).emit('typing:user', {
      userId,
      username: client.data.username,
      conversationId,
      isTyping: false,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESENCE
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: PresencePayload,
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    this.broadcastPresence(userId, payload.status);

    return { success: true, status: payload.status };
  }

  @SubscribeMessage('presence:get')
  handlePresenceGet(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userIds: string[] },
  ) {
    const { userIds } = payload;
    if (!Array.isArray(userIds)) return { users: [] };

    const presenceMap: Record<string, boolean> = {};
    
    userIds.slice(0, 100).forEach((userId) => {
      presenceMap[userId] = this.isUserOnline(userId);
    });

    return { users: presenceMap };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVER-SIDE EMIT METHODS (called from services)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Emit event to a specific room
   */
  emitToRoom(room: string, event: string, payload: any): void {
    this.server.to(room).emit(event, payload);
  }

  /**
   * Emit event to a specific user (all their connections)
   */
  emitToUser(userId: string, event: string, payload: any): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Emit new message to conversation participants
   */
  emitNewMessage(conversationId: string, message: any): void {
    this.server.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId,
      message,
    });
  }

  /**
   * Emit project activity
   */
  emitProjectActivity(projectId: string, activity: any): void {
    this.server.to(`project:${projectId}`).emit('activity:new', {
      projectId,
      activity,
    });
  }

  /**
   * Emit notification to user
   */
  emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  private addOnlineUser(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)?.add(socketId);
    this.socketToUser.set(socketId, userId);
  }

  private removeOnlineUser(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  private isUserOnline(userId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  private broadcastPresence(userId: string, status: string): void {
    this.server.emit('presence:change', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get count of online users
   */
  getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get list of online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}

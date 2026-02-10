// src/realtime/realtime.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME GATEWAY
// - JWT validation at connection time (disconnect if invalid)
// - Room join/leave handlers
// - Centralized event names via events.constants.ts
// ═══════════════════════════════════════════════════════════════════════════════

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { WsJwtGuard } from './ws-jwt.guard';
import { WS_EVENTS, WS_ROOMS } from './events.constants';

type JwtPayload = {
  sub?: string;
  userId?: string;
  email?: string;
  username?: string;
  roles?: string[];
};

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // TODO: replace for prod
        : true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CONNECTION AUTH + AUTO-ROOMS
  // ─────────────────────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit(WS_EVENTS.AUTH_ERROR, { message: 'Missing auth token' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.userId || payload.sub;

      if (!userId) {
        client.emit(WS_EVENTS.AUTH_ERROR, { message: 'Invalid token payload' });
        client.disconnect(true);
        return;
      }

      // Attach user for decorators/handlers
      (client.data as any).user = {
        userId,
        email: payload.email,
        username: payload.username,
        roles: payload.roles,
      };

      // Auto-join personal room
      client.join(WS_ROOMS.USER(userId));

      client.emit(WS_EVENTS.READY, { userId });
      this.logger.debug(`WS connected: ${client.id} user=${userId}`);
    } catch (_err) {
      client.emit(WS_EVENTS.AUTH_ERROR, { message: 'Invalid/expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client.data as any)?.user;
    this.logger.debug(
      `WS disconnected: ${client.id} user=${user?.userId || 'unknown'}`,
    );
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake as any)?.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();

    const authHeader = client.handshake?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM OPS (guarded: requires authenticated socket)
  // ─────────────────────────────────────────────────────────────────────────────

  // Clients join rooms like: user:{userId}, project:{projectId}
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.JOIN)
  handleJoin(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (!data?.room) return;
    client.join(data.room);
    this.logger.debug(`Client ${client.id} joined ${data.room}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.LEAVE)
  handleLeave(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (!data?.room) return;
    client.leave(data.room);
    this.logger.debug(`Client ${client.id} left ${data.room}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMISSION HELPERS (server-side)
  // ─────────────────────────────────────────────────────────────────────────────

  emitToRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  /** Emit to a specific project room: project:{projectId} */
  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId) return;
    this.emitToRoom(WS_ROOMS.PROJECT(projectId), event, payload);
  }

  /** Emit to a specific user room: user:{userId} */
  emitToUser(userId: string, event: string, payload: any) {
    if (!userId) return;
    this.emitToRoom(WS_ROOMS.USER(userId), event, payload);
  }

  /** Convenience for public status change broadcasts */
  emitProjectPublicChanged(
    projectId: string,
    payload: { projectId: string; publicEnabled: boolean; publicToken: boolean },
  ) {
    this.emitToProject(projectId, WS_EVENTS.PROJECT_PUBLIC_CHANGED, payload);
  }

  /** Convenience specifically for habits UI */
  emitHabitsUpdated(userId: string, projectId?: string) {
    if (!userId) return;
    this.emitToUser(userId, WS_EVENTS.HABITS_UPDATED, { projectId: projectId || null });
  }
}

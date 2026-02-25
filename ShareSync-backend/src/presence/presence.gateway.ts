// src/presence/presence.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE GATEWAY: WebSocket Broadcasts for Live Data Updates
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PresenceService, PresenceStatus } from './presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(PresenceGateway.name);

  constructor(private readonly presenceService: PresenceService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    if (userId) {
      this.presenceService.setOnline(userId as string);
      client.data.userId = userId;
      this.logger.debug(`Client connected to PresenceGateway: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.presenceService.setOffline(userId);
      this.logger.debug(`Client disconnected from PresenceGateway: ${userId}`);
    }
  }

  // Bind to internal EventEmitter and broadcast out to all WebSocket clients
  @OnEvent('presence.changed')
  handlePresenceChanged(payload: { userId: string; status: PresenceStatus }) {
    this.server.emit('presence.updated', payload);
  }

  @OnEvent('task.completed')
  handleTaskCompleted(payload: any) {
    this.server.emit('task.completed', payload);
  }
}

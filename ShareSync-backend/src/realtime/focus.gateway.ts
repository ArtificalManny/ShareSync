/**
 * focus.gateway.ts
 * WebSocket events for focus sessions
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { FocusService } from './focus.service';

@WebSocketGateway({ cors: true })
@UseGuards(WsJwtGuard)
export class FocusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly focusService: FocusService) {}

  handleConnection(client: Socket) {
    console.log(`🔌 Focus: Client connected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Focus: Client disconnected ${client.id}`);
  }

  // ============================================
  // SESSION EVENTS
  // ============================================

  @SubscribeMessage('focus:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const userId = (client as any).user?.id;
    if (!userId) return;

    try {
      const session = await this.focusService.startSession(userId, data);
      
      // Emit to user
      client.emit('focus:started', session);
      
      // Notify project members if applicable
      if (session.projectId) {
        this.server.to(`project:${session.projectId}`).emit('focus:user-started', {
          userId,
          sessionId: session._id,
        });
      }
      
      return { success: true, session };
    } catch (error) {
      client.emit('focus:error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('focus:complete')
  async handleComplete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; feedback?: any },
  ) {
    const userId = (client as any).user?.id;
    if (!userId) return;

    try {
      const session = await this.focusService.completeSession(
        data.sessionId,
        userId,
        data.feedback,
      );
      
      // Emit to user
      client.emit('focus:completed', session);
      
      // Notify project members
      if (session.projectId) {
        this.server.to(`project:${session.projectId}`).emit('focus:user-completed', {
          userId,
          sessionId: session._id,
          xpEarned: session.xpEarned,
        });
      }
      
      return { success: true, session };
    } catch (error) {
      client.emit('focus:error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BROADCAST HELPERS
  // ============================================

  /**
   * Broadcast focus session update to project
   */
  broadcastToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}

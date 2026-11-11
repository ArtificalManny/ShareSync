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
import { LiveAccessService, MEMBER_STANDINGS } from './live-access.service';

@WebSocketGateway({ cors: true })
@UseGuards(WsJwtGuard)
export class FocusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly focusService: FocusService,
    private readonly live: LiveAccessService,
  ) {}

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

    // openshare-live-access-v1 (R52b): a focus session can only be tagged with a
    // project you are the owner or a member of; it is announced to that project.
    const projectId = data?.projectId;
    if (projectId !== undefined && projectId !== null && projectId !== '') {
      const standing = await this.live.standingOf(typeof projectId === 'string' ? projectId : '', String(userId));
      if (!MEMBER_STANDINGS.has(standing)) {
        client.emit('focus:error', { message: 'Not authorized for this project' });
        return { success: false, error: 'Not authorized for this project' };
      }
    }

    try {
      const session = await this.focusService.startSession(userId, data);
      
      // Emit to user
      client.emit('focus:started', session);
      
      // Notify project members if applicable
      if (session.projectId) {
        await this.live.sendToProject(this.server, String(session.projectId), 'focus:user-started', {
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
        await this.live.sendToProject(this.server, String(session.projectId), 'focus:user-completed', {
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
    void this.live.sendToProject(this.server, projectId, event, data);
  }
}

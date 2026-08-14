// src/messages/messages.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES GATEWAY: Real-time WebSocket communication
// ⭐ PATCH: align emitted payloads with current frontend listeners
// ═══════════════════════════════════════════════════════════════════════════════

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { validateWsSession } from '../auth/ws-session.validator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GATEWAY
// ═══════════════════════════════════════════════════════════════════════════════

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private readonly socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value?._id !== 'undefined') return this.normalizeId(value._id);
    if (typeof value?.id !== 'undefined') return this.normalizeId(value.id);
    if (typeof value?.toString === 'function') return value.toString();
    return String(value);
  }

  private getClientDisplayName(client: AuthenticatedSocket): string {
    return (
      client.user?.username ||
      client.user?.firstName ||
      client.user?.email ||
      'Someone'
    );
  }

  private toPlain(value: any): any {
    if (!value) return value;
    return typeof value.toObject === 'function' ? value.toObject() : value;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  afterInit(server: Server) {
    this.logger.log('Messages WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const session = await validateWsSession(
        this.connection,
        payload,
      );

      client.userId = session.userId;
      client.user = {
        ...payload,
        ...session.user,
        sub: session.userId,
        userId: session.userId,
        id: session.userId,
      };

      this.addUserSocket(client.userId, client.id);
      client.join(`user:${client.userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      this.server.emit('user:online', { userId: client.userId });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error?.message || error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeUserSocket(client.userId, client.id);

      if (
        !this.userSockets.has(client.userId) ||
        this.userSockets.get(client.userId)?.size === 0
      ) {
        this.server.emit('user:offline', { userId: client.userId });
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SOCKET TRACKING
  // ─────────────────────────────────────────────────────────────────────────────

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    this.userSockets.get(userId)?.delete(socketId);

    if (this.userSockets.get(userId)?.size === 0) {
      this.userSockets.delete(userId);
    }

    this.socketUsers.delete(socketId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSATION EVENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.debug(
      `User ${client.userId} joined conversation:${data.conversationId}`,
    );
    return { success: true };
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.debug(
      `User ${client.userId} left conversation:${data.conversationId}`,
    );
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGE EVENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const message = await this.messagesService.sendMessage(client.userId, data);
      const plainMessage = this.toPlain(message);

      this.server.to(`conversation:${data.conversationId}`).emit('message:new', {
        conversationId: data.conversationId,
        message: plainMessage,
      });

      this.emitToConversationParticipants(
        data.conversationId,
        client.userId,
        'message:notification',
        {
          conversationId: data.conversationId,
          message: {
            id: plainMessage?._id || plainMessage?.id,
            content: (plainMessage?.content || '').substring(0, 100),
            senderId: plainMessage?.senderId || client.userId,
            energy: plainMessage?.energy,
          },
        },
      );

      return { success: true, message: plainMessage };
    } catch (error: any) {
      this.logger.error(`Error sending message: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @MessageBody() data: { messageId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const message = await this.messagesService.editMessage(
        data.messageId,
        client.userId,
        { content: data.content },
      );

      const conversationId = this.normalizeId((message as any)?.conversationId);

      this.server.to(`conversation:${conversationId}`).emit('message:edited', {
        messageId: data.messageId,
        conversationId,
        content: data.content,
        editedAt: (message as any)?.editedAt,
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error editing message: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to edit message' };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      await this.messagesService.deleteMessage(data.messageId, client.userId);

      this.server.to(`conversation:${data.conversationId}`).emit('message:deleted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error deleting message: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to delete message' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TYPING INDICATOR
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = {
      userId: client.userId,
      username: this.getClientDisplayName(client),
      conversationId: data.conversationId,
      isTyping: true,
    };

    client.to(`conversation:${data.conversationId}`).emit('typing:user', payload);
    client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
    return { success: true };
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = {
      userId: client.userId,
      username: this.getClientDisplayName(client),
      conversationId: data.conversationId,
      isTyping: false,
    };

    client.to(`conversation:${data.conversationId}`).emit('typing:user', payload);
    client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('reaction:add')
  async handleAddReaction(
    @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      await this.messagesService.addReaction(
        data.messageId,
        client.userId,
        data.emoji,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('reaction:added', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: client.userId,
        conversationId: data.conversationId,
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error adding reaction: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to add reaction' };
    }
  }

  @SubscribeMessage('reaction:remove')
  async handleRemoveReaction(
    @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      await this.messagesService.removeReaction(
        data.messageId,
        client.userId,
        data.emoji,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('reaction:removed', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: client.userId,
        conversationId: data.conversationId,
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error removing reaction: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to remove reaction' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ RECEIPTS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('message:read')
  async handleMarkRead(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const message = await this.messagesService.markAsRead(
        data.messageId,
        client.userId,
      );

      const senderId = this.normalizeId((message as any)?.senderId);

      if (senderId) {
        this.emitToUser(senderId, 'message:read:receipt', {
          messageId: data.messageId,
          conversationId: data.conversationId,
          readBy: client.userId,
          readAt: new Date(),
        });
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error marking message read: ${error?.message || error}`);
      return { success: false, error: error?.message || 'Failed to mark message read' };
    }
  }

  @SubscribeMessage('conversation:read')
  async handleMarkConversationRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Not authenticated' };
      }

      await this.messagesService.markConversationAsRead(
        data.conversationId,
        client.userId,
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error marking conversation read: ${error?.message || error}`);
      return {
        success: false,
        error: error?.message || 'Failed to mark conversation read',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  private async emitToConversationParticipants(
    conversationId: string,
    excludeUserId: string,
    event: string,
    data: any,
  ) {
    try {
      const conversation = await this.messagesService.getConversationById(
        conversationId,
        excludeUserId,
      );

      for (const participant of conversation.participants || []) {
        const participantUserId = this.normalizeId((participant as any)?.userId);
        if (participantUserId && participantUserId !== excludeUserId) {
          this.emitToUser(participantUserId, event, data);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error emitting to participants: ${error?.message || error}`);
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

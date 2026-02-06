// src/messages/messages.gateway.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES GATEWAY: Real-time WebSocket communication
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
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import {
  SendMessageDto,
  TypingIndicatorDto,
  AddReactionDto,
} from './dto/message.dto';

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
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  afterInit(server: Server) {
    this.logger.log('Messages WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;
      client.user = payload;

      // Track socket
      this.addUserSocket(client.userId, client.id);

      // Join user's personal room
      client.join(`user:${client.userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      // Notify user is online
      this.server.emit('user:online', { userId: client.userId });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeUserSocket(client.userId, client.id);

      // Check if user has no more connections
      if (!this.userSockets.has(client.userId) || 
          this.userSockets.get(client.userId)?.size === 0) {
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

      // Emit to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:new', message);

      // Emit notification to conversation participants (except sender)
      this.emitToConversationParticipants(
        data.conversationId,
        client.userId,
        'message:notification',
        {
          conversationId: data.conversationId,
          message: {
            id: message._id,
            content: message.content.substring(0, 100),
            senderId: client.userId,
            energy: message.energy,
          },
        },
      );

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
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

      // Emit to conversation room
      this.server
        .to(`conversation:${message.conversationId}`)
        .emit('message:edited', {
          messageId: data.messageId,
          content: data.content,
          editedAt: message.editedAt,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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

      // Emit to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:deleted', { messageId: data.messageId });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:update', {
        userId: client.userId,
        conversationId: data.conversationId,
        isTyping: true,
      });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:update', {
        userId: client.userId,
        conversationId: data.conversationId,
        isTyping: false,
      });
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

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('reaction:added', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: client.userId,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('reaction:removed', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: client.userId,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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

      // Notify sender
      this.emitToUser(message.senderId.toString(), 'message:read:receipt', {
        messageId: data.messageId,
        readBy: client.userId,
        readAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
    } catch (error) {
      return { success: false, error: error.message };
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
        excludeUserId, // Just for access check
      );

      for (const participant of conversation.participants) {
        if (participant.userId.toString() !== excludeUserId) {
          this.emitToUser(participant.userId.toString(), event, data);
        }
      }
    } catch (error) {
      this.logger.error(`Error emitting to participants: ${error.message}`);
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

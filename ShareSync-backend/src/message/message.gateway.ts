import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com']
      : true,
    credentials: true,
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessageGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from user socket map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Client identifies themselves with userId
  @SubscribeMessage('identify')
  handleIdentify(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.userSockets.set(data.userId, client.id);
    client.join(`user:${data.userId}`);
    this.logger.debug(`User ${data.userId} identified with socket ${client.id}`);
  }

  // Join a conversation room
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.debug(`Socket ${client.id} joined conversation:${data.conversationId}`);
  }

  // Leave a conversation room
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.debug(`Socket ${client.id} left conversation:${data.conversationId}`);
  }

  // Send message via WebSocket (real-time)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      recipientId?: string;
      content: string;
      context?: any;
      energy?: any;
      threadParentId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Save to database
      const message = await this.messageService.sendMessage(data);

      // Emit to conversation room (both sender and recipient will receive)
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      // Also emit directly to recipient's user room (for notifications)
      if (data.recipientId) {
        this.server
          .to(`user:${data.recipientId}`)
          .emit('message_notification', {
            conversationId: data.conversationId,
            senderId: data.senderId,
            preview: data.content.substring(0, 50),
          });
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Typing indicator
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to everyone in conversation except sender
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }

  // Mark as read via WebSocket
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { messageId: string; userId: string },
  ) {
    try {
      const message = await this.messageService.markAsRead(data.messageId, data.userId);
      
      // Notify sender that their message was read
      this.server
        .to(`user:${message.senderId.toString()}`)
        .emit('message_read', {
          messageId: data.messageId,
          readAt: message.readAt,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper: Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: Emit to conversation
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}

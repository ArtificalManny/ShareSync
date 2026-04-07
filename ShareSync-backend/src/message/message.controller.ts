import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageContext, MessageEnergy } from './message.schema';

// TODO: Import your actual auth guard
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
// @UseGuards(JwtAuthGuard)  // Uncomment when ready
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // GET /messages/conversations - Get all conversations for current user
  @Get('conversations')
  async getConversations(@Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.messageService.getConversations(userId);
  }

  // GET /messages/conversation/:conversationId - Get messages in a conversation
  @Get('conversation/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
  ) {
    return this.messageService.getMessages(conversationId, limit);
  }

  // GET /messages/thread/:threadParentId - Get thread messages
  @Get('thread/:threadParentId')
  async getThread(@Param('threadParentId') threadParentId: string) {
    return this.messageService.getThread(threadParentId);
  }

  // POST /messages/send - Send a new message
  @Post('send')
  async sendMessage(
    @Request() req,
    @Body()
    body: {
      conversationId: string;
      recipientId?: string;
      content: string;
      context?: MessageContext;
      energy?: MessageEnergy;
      threadParentId?: string;
    },
  ) {
    const senderId = req.user?.id || req.user?._id;
    
    // 1. Save the message to the database via the service
    const savedMessage = await this.messageService.sendMessage({
      ...body,
      senderId,
    });

    // ⭐ THE FIX: Safely inject Real-time Sockets & Notifications
    // Wrapped in a try/catch so if this fails, the message still successfully sends!
    try {
      const recipientId = body.recipientId;

      if (recipientId) {
        let notification = null;
        const mongoose = require('mongoose');
        
        // A. BULLETPROOF DB INSERTION
        // First try to use the registered Mongoose Model
        const NotificationModel = mongoose.models.Notification || mongoose.models.Notifications;
        
        if (NotificationModel) {
          notification = await NotificationModel.create({
            recipient: recipientId,
            sender: senderId,
            type: 'message',
            title: 'New Message',
            message: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : ''),
            relatedItemId: savedMessage._id || savedMessage.id,
            onModel: 'Message',
            isRead: false
          });
          console.log(`✅ [MessageController] DB Notification saved via Model for ${recipientId}`);
        } 
        // Fallback: If NestJS hid the model registry, use the raw MongoDB connection
        else if (mongoose.connection && mongoose.connection.db) {
          const result = await mongoose.connection.db.collection('notifications').insertOne({
            recipient: new mongoose.Types.ObjectId(recipientId),
            sender: new mongoose.Types.ObjectId(senderId),
            type: 'message',
            title: 'New Message',
            message: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : ''),
            relatedItemId: new mongoose.Types.ObjectId(savedMessage._id || savedMessage.id),
            onModel: 'Message',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          notification = await mongoose.connection.db.collection('notifications').findOne({ _id: result.insertedId });
          console.log(`✅ [MessageController] DB Notification saved via Raw Driver for ${recipientId}`);
        } else {
          console.warn('⚠️ [MessageController] Could not save Notification. Model & DB connection missing.');
        }

        // B. ATTEMPT SOCKET EMISSION
        // NestJS wraps Express. We try multiple paths to find the 'io' instance.
        const app = req.app || req.res?.app;
        const io = app?.get ? app.get('io') : null;

        if (io) {
          const rawRoom = recipientId.toString();
          const prefixedRoom = `user:${rawRoom}`;

          // ⭐ THE FIX: Blast to BOTH room formats to guarantee Window B hears it
          io.to(rawRoom).to(prefixedRoom).emit('new_message', savedMessage);
          if (notification) {
            io.to(rawRoom).to(prefixedRoom).emit('new_notification', notification);
          }
          console.log(`✅ [MessageController] Real-time sockets fired for rooms: [${rawRoom}] and [${prefixedRoom}]`);
        } else {
          console.warn('⚠️ [MessageController] Socket.io instance not found. DB notification was saved, but real-time push skipped.');
        }
      }
    } catch (realtimeErr) {
      console.error('⚠️ [MessageController] Failed to execute real-time events:', realtimeErr);
    }

    return savedMessage;
  }

  // PATCH /messages/:messageId/read - Mark message as read
  @Patch(':messageId/read')
  async markAsRead(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.messageService.markAsRead(messageId, userId);
  }

  // PATCH /messages/conversation/:conversationId/read - Mark all messages in conversation as read
  @Patch('conversation/:conversationId/read')
  async markConversationAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.messageService.markConversationAsRead(conversationId, userId);
  }

  // GET /messages/unread-count - Get unread message count
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.messageService.getUnreadCount(userId);
  }

  // DELETE /messages/:messageId - Delete a message
  @Delete(':messageId')
  async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.messageService.deleteMessage(messageId, userId);
  }
}

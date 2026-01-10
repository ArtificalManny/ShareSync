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
    return this.messageService.sendMessage({
      ...body,
      senderId,
    });
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

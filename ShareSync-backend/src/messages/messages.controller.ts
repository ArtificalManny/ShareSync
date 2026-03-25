// src/messages/messages.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES CONTROLLER: REST API for messaging
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor'; // <-- IMPORT SHIELD
import {
  CreateConversationDto,
  CreateDirectConversationDto,
  SendMessageDto,
  EditMessageDto,
  AddReactionDto,
  ConversationSettingsDto,
} from './dto/message.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  /** Safe userId extraction — matches every other controller */
  private getUserId(req: any): string {
    return String(req?.user?.sub || req?.user?.userId || req?.user?.id || req?.user?._id || '');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Conversation created' })
  async createConversation(
    @Req() req: any,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.messagesService.createConversation(
      this.getUserId(req),
      dto,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Get or create a direct conversation with a user' })
  async getOrCreateDirectConversation(
    @Req() req: any,
    @Body() dto: CreateDirectConversationDto,
  ) {
    const conversation = await this.messagesService.getOrCreateDirectConversation(
      this.getUserId(req),
      dto.recipientId,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  async getConversations(
    @Req() req: any,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const conversations = await this.messagesService.getUserConversations(
      this.getUserId(req),
      includeArchived === 'true',
    );
    return {
      success: true,
      data: conversations,
    };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getConversation(@Req() req: any, @Param('id') id: string) {
    const conversation = await this.messagesService.getConversationById(
      id,
      this.getUserId(req),
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Patch('conversations/:id/settings')
  @ApiOperation({ summary: 'Update conversation settings (mute, pin, archive)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async updateConversationSettings(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ConversationSettingsDto,
  ) {
    const conversation = await this.messagesService.updateConversationSettings(
      id,
      this.getUserId(req),
      dto,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Post('conversations/:id/participants')
  @ApiOperation({ summary: 'Add a participant to a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async addParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    const conversation = await this.messagesService.addParticipant(
      id,
      this.getUserId(req),
      body.userId,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Delete('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a participant from a conversation' })
  async removeParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') participantId: string,
  ) {
    const conversation = await this.messagesService.removeParticipant(
      id,
      this.getUserId(req),
      participantId,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Post('conversations/:id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a conversation' })
  async leaveConversation(@Req() req: any, @Param('id') id: string) {
    await this.messagesService.leaveConversation(id, this.getUserId(req));
    return {
      success: true,
      message: 'Left conversation',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @UseInterceptors(TextModerationInterceptor) // <-- SHIELD ACTIVATED
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message sent' })
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    const message = await this.messagesService.sendMessage(
      this.getUserId(req),
      dto,
    );
    return {
      success: true,
      data: message,
    };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  @ApiQuery({ name: 'after', required: false, type: String })
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    const result = await this.messagesService.getMessages(id, this.getUserId(req), {
      limit: limit ? parseInt(limit, 10) : 50,
      before,
      after,
    });
    return {
      success: true,
      data: result.messages,
      meta: {
        hasMore: result.hasMore,
      },
    };
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get thread messages' })
  @ApiParam({ name: 'id', description: 'Thread parent message ID' })
  async getThread(@Req() req: any, @Param('id') id: string) {
    const thread = await this.messagesService.getThreadMessages(
      id,
      this.getUserId(req),
    );
    return {
      success: true,
      data: thread,
    };
  }

  @Put(':id')
  @UseInterceptors(TextModerationInterceptor) // <-- SHIELD ACTIVATED
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async editMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: EditMessageDto,
  ) {
    const message = await this.messagesService.editMessage(
      id,
      this.getUserId(req),
      dto,
    );
    return {
      success: true,
      data: message,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async deleteMessage(@Req() req: any, @Param('id') id: string) {
    await this.messagesService.deleteMessage(id, this.getUserId(req));
    return {
      success: true,
      message: 'Message deleted',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async addReaction(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
  ) {
    const message = await this.messagesService.addReaction(
      id,
      this.getUserId(req),
      dto.emoji,
    );
    return {
      success: true,
      data: message,
    };
  }

  @Delete(':id/reactions/:emoji')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji to remove' })
  async removeReaction(
    @Req() req: any,
    @Param('id') id: string,
    @Param('emoji') emoji: string,
  ) {
    const message = await this.messagesService.removeReaction(
      id,
      this.getUserId(req),
      emoji,
    );
    return {
      success: true,
      data: message,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.messagesService.markAsRead(id, this.getUserId(req));
    return {
      success: true,
    };
  }

  @Patch('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async markConversationAsRead(@Req() req: any, @Param('id') id: string) {
    await this.messagesService.markConversationAsRead(id, this.getUserId(req));
    return {
      success: true,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.messagesService.getUnreadCount(this.getUserId(req));
    return {
      success: true,
      data: count,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Search messages' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'conversationId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchMessages(
    @Req() req: any,
    @Query('q') query: string,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limit?: string,
  ) {
    const messages = await this.messagesService.searchMessages(
      this.getUserId(req),
      query,
      conversationId,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      data: messages,
    };
  }
}

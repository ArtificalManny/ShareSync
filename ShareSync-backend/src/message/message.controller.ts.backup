import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessageService } from './message.service';

@Controller('api/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async getConversations(@Request() req) {
    return this.messageService.getConversations(req.user.sub);
  }

  @Get(':conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.messageService.getMessages(conversationId);
  }

  @Post()
  async sendMessage(@Request() req, @Body() body: { conversationId: string; content: string }) {
    return this.messageService.sendMessage(body.conversationId, req.user.sub, body.content);
  }
}
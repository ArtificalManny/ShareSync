// src/threads/threads.controller.ts
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
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThreadsService, CreateThreadDto, CreateMessageDto } from './threads.service';

@ApiTags('Threads')
@ApiBearerAuth()
@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // THREAD CRUD
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @ApiOperation({ summary: 'Create a new thread' })
  async create(@Req() req: any, @Body() dto: CreateThreadDto) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all threads for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @Query('projectId') projectId: string,
    @Query('category') category?: string,
  ) {
    return this.threadsService.findByProject(projectId, { category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a thread by ID' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async findOne(@Param('id') id: string) {
    return this.threadsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.threadsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async addMessage(
    @Req() req: any,
    @Param('id') threadId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.addMessage(threadId, userId, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false })
  async getMessages(
    @Param('id') threadId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.threadsService.getMessages(threadId, { limit, before });
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async updateMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.updateMessage(messageId, userId, content);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async deleteMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    await this.threadsService.deleteMessage(messageId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async addReaction(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.addReaction(messageId, userId, emoji);
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji to remove' })
  async removeReaction(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.removeReaction(messageId, userId, emoji);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // THREAD MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin status of a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async togglePin(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.togglePin(id, userId);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Toggle lock status of a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async toggleLock(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadsService.toggleLock(id, userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a thread as read' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.threadsService.markAsRead(id, userId);
    return { success: true };
  }

  @Get('project/:projectId/unread-count')
  @ApiOperation({ summary: 'Get unread message count for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getUnreadCount(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const count = await this.threadsService.getUnreadCount(projectId, userId);
    return { unreadCount: count };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TASK LINKING
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Link a task to a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async linkTask(
    @Param('id') threadId: string,
    @Body('taskId') taskId: string,
  ) {
    return this.threadsService.linkTask(threadId, taskId);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Unlink a task from a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  async unlinkTask(
    @Param('id') threadId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.threadsService.unlinkTask(threadId, taskId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('project/:projectId/search')
  @ApiOperation({ summary: 'Search messages in project threads' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async search(
    @Param('projectId') projectId: string,
    @Query('q') query: string,
  ) {
    return this.threadsService.search(projectId, query);
  }
}

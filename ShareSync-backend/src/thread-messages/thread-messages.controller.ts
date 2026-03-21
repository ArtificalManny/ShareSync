import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { ThreadMessagesService } from './thread-messages.service';
import { CreateThreadMessageDto } from './dto/create-thread-message.dto';
import { EditThreadMessageDto } from './dto/edit-thread-message.dto';

@ApiTags('ThreadMessages')
@ApiBearerAuth()
@Controller('thread-messages')
@UseGuards(JwtAuthGuard)
export class ThreadMessagesController {
  constructor(private readonly threadMessagesService: ThreadMessagesService) {}

  @Post(':threadId')
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Create a message in a thread' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async create(
    @Req() req: any,
    @Param('threadId') threadId: string,
    @Body() dto: CreateThreadMessageDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadMessagesService.create(threadId, userId, dto);
  }

  @Get(':threadId')
  @ApiOperation({ summary: 'Get messages for a thread (paginated)' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false })
  async findByThread(
    @Param('threadId') threadId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.threadMessagesService.findByThread(threadId, { limit, before });
  }

  @Put(':messageId')
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Edit a message (owner only)' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async edit(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body() dto: EditThreadMessageDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadMessagesService.edit(messageId, userId, dto.content);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message (owner only)' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async remove(
    @Req() req: any,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    await this.threadMessagesService.delete(messageId, userId);
  }

  @Post(':messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async addReaction(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadMessagesService.addReaction(messageId, userId, emoji);
  }

  @Delete(':messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji' })
  async removeReaction(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.threadMessagesService.removeReaction(messageId, userId, emoji);
  }
}

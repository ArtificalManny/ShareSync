// src/threads/threads.controller.ts
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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';

@ApiTags('Threads')
@ApiBearerAuth()
@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Create a new thread' })
  async create(@Req() req: any, @Body() dto: CreateThreadDto) {
    const userId = req.user?.sub || req.user?.userId;
    const thread = await this.threadsService.create(userId, dto);
    return { success: true, data: thread };
  }

  // ✅ NEW: The endpoint the frontend will hit to get (or auto-create) the project threads
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all threads for a project' })
  @ApiParam({ name: 'projectId' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isPinned', required: false, type: Boolean })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  async findByProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('category') category?: string,
    @Query('isPinned') isPinned?: boolean,
    @Query('archived') archived?: boolean,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const isPinnedBool =
      isPinned !== undefined
        ? String(isPinned) === 'true'
        : undefined;

    const archivedBool =
      archived !== undefined
        ? String(archived) === 'true'
        : false;

    const threads =
      await this.threadsService
        .findByProject(
          projectId,
          {
            category,
            isPinned:
              isPinnedBool,
            archived:
              archivedBool,
          },
          userId,
        );
    
    return { success: true, data: threads };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get thread by ID' })
  async findById(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const thread =
      await this.threadsService
        .findByIdWithAccess(
          id,
          userId,
        );

    return {
      success: true,
      data: thread,
    };
  }

  @Put(':id')
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Update a thread' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateThreadDto) {
    const userId = req.user?.sub || req.user?.userId;
    const thread = await this.threadsService.update(id, userId, dto);
    return { success: true, data: thread };
  }

  // team-room-thread-controls-v2
  @Post(':id/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mute a thread for the current user',
  })
  async mute(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const thread =
      await this.threadsService
        .setMuted(
          id,
          userId,
          true,
        );

    return {
      success: true,
      data: thread,
    };
  }

  @Delete(':id/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unmute a thread for the current user',
  })
  async unmute(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const thread =
      await this.threadsService
        .setMuted(
          id,
          userId,
          false,
        );

    return {
      success: true,
      data: thread,
    };
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a thread for the current user',
  })
  async archive(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const thread =
      await this.threadsService
        .setArchived(
          id,
          userId,
          true,
        );

    return {
      success: true,
      data: thread,
    };
  }

  @Delete(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore an archived thread for the current user',
  })
  async restore(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const thread =
      await this.threadsService
        .setArchived(
          id,
          userId,
          false,
        );

    return {
      success: true,
      data: thread,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a thread' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.threadsService.delete(id, userId);
    return { success: true, message: 'Thread deleted' };
  }
}

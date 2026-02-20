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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  async findByProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('category') category?: string,
    @Query('isPinned') isPinned?: boolean,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const isPinnedBool = isPinned !== undefined ? String(isPinned) === 'true' : undefined;
    
    // Pass the userId down so the service can auto-create "General" if empty
    const threads = await this.threadsService.findByProject(
      projectId, 
      { category, isPinned: isPinnedBool }, 
      userId
    );
    
    return { success: true, data: threads };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get thread by ID' })
  async findById(@Param('id') id: string) {
    const thread = await this.threadsService.findById(id);
    return { success: true, data: thread };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a thread' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateThreadDto) {
    const userId = req.user?.sub || req.user?.userId;
    const thread = await this.threadsService.update(id, userId, dto);
    return { success: true, data: thread };
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

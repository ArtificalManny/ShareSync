// /backend/src/projects/project.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';

@UseGuards(JwtAuthGuard)
@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // ✅ List projects for the current user (fixes /projects page)
  @Get()
  async list(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.projectService.listForUser(userId);
  }

  // ✅ Quick rail API
  @Get('quick')
  async quick(@Req() req: any) {
    const userId = req.user?.sub || 'defaultUserId';
    return this.projectService.listQuick(userId);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const ownerId = req.user?.sub || 'defaultUserId';
    return this.projectService.create(body, ownerId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Get(':id/kpis')
  async getKpis(@Param('id') id: string) {
    return this.projectService.getKpis(id);
  }

  @Get(':id/feed')
  async getFeed(
    @Param('id') id: string,
    @Query('limit') limit = '20',
    @Query('cursor') cursor?: string,
  ) {
    const n = Math.max(1, Math.min(parseInt(String(limit), 10) || 20, 50));
    return this.projectService.getFeed(id, n, cursor);
  }

  @Post(':id/updates')
  async addUpdate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.sub || 'defaultUserId';
    return this.projectService.addUpdate(id, body, userId);
  }

  @Post(':id/tasks')
  async addTask(@Param('id') id: string, @Body() body: any) {
    return this.projectService.addTask(id, body);
  }

  // ✅ align with FE (PATCH)
  @Patch(':id/tasks/:taskId')
  async patchTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: any,
  ) {
    return this.projectService.patchTask(id, taskId, body);
  }
}
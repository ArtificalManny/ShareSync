// src/milestones/milestones.controller.ts
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  private now() {
    return new Date().toISOString();
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateMilestoneDto) {
    const userId = req.user?.sub || req.user?.userId;
    const milestone = await this.milestonesService.create(userId, dto);
    return { success: true, data: milestone, timestamp: this.now() };
  }

  // keep your current GET signature (query param projectId) to avoid breaking any frontend
  @Get()
  async findAll(@Query('projectId') projectId: string) {
    const milestones = await this.milestonesService.findByProject(projectId);
    return { success: true, data: milestones, timestamp: this.now() };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const milestone = await this.milestonesService.findById(id);
    return { success: true, data: milestone, timestamp: this.now() };
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    const userId = req.user?.sub || req.user?.userId;
    const milestone = await this.milestonesService.update(id, userId, dto);
    return { success: true, data: milestone, timestamp: this.now() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.milestonesService.delete(id, userId);
    return;
  }

  @Post(':id/tasks')
  async linkTask(@Param('id') id: string, @Body('taskId') taskId: string) {
    const milestone = await this.milestonesService.linkTask(id, taskId);
    return { success: true, data: milestone, timestamp: this.now() };
  }

  @Delete(':id/tasks/:taskId')
  async unlinkTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    const milestone = await this.milestonesService.unlinkTask(id, taskId);
    return { success: true, data: milestone, timestamp: this.now() };
  }
}

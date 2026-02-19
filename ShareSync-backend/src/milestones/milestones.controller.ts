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
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  private readonly logger = new Logger(MilestonesController.name);

  constructor(private readonly milestonesService: MilestonesService) {}

  private now() {
    return new Date().toISOString();
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateMilestoneDto) {
    try {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;

      this.logger.log(`[CREATE] req.user keys: ${Object.keys(req.user || {}).join(', ')}`);
      this.logger.log(`[CREATE] userId resolved: ${userId}`);
      this.logger.log(`[CREATE] dto: ${JSON.stringify(dto)}`);

      const milestone = await this.milestonesService.create(userId, dto);
      return { success: true, data: milestone, timestamp: this.now() };
    } catch (err: any) {
      this.logger.error(`[CREATE] FAILED: ${err?.message || err}`);
      if (err?.stack) this.logger.error(err.stack);
      throw err;
    }
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
    const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
    const milestone = await this.milestonesService.update(id, userId, dto);
    return { success: true, data: milestone, timestamp: this.now() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
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

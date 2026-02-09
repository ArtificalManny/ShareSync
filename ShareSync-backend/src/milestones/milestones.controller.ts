import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateMilestoneDto) {
    const userId = req.user?.sub || req.user?.userId;
    return this.milestonesService.create(userId, dto);
  }

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.milestonesService.findById(id);
  }

  @Put(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.milestonesService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.milestonesService.delete(id, userId);
  }

  @Post(':id/tasks')
  async linkTask(
    @Param('id') id: string,
    @Body('taskId') taskId: string
  ) {
    return this.milestonesService.linkTask(id, taskId);
  }

  @Delete(':id/tasks/:taskId')
  async unlinkTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string
  ) {
    return this.milestonesService.unlinkTask(id, taskId);
  }
}

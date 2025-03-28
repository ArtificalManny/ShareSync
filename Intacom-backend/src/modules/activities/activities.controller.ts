import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { Activity } from './schemas/activity.schema';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() createActivityDto: Partial<Activity>): Promise<Activity> {
    return this.activitiesService.create(createActivityDto);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<Activity[]> {
    return this.activitiesService.findByUserId(userId);
  }

  @Get('project/:projectId')
  async findByProjectId(@Param('projectId') projectId: string): Promise<Activity[]> {
    return this.activitiesService.findByProjectId(projectId);
  }
}
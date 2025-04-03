import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(
    @Body('userId') userId: string,
    @Body('projectId') projectId: string,
    @Body('action') action: string,
  ) {
    try {
      return await this.activitiesService.create(userId, projectId, action);
    } catch (error) {
      console.error('Error in create activity:', error);
      throw error;
    }
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    try {
      return await this.activitiesService.findByUser(userId);
    } catch (error) {
      console.error('Error in findByUser:', error);
      throw error;
    }
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    try {
      return await this.activitiesService.findByProject(projectId);
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }
}
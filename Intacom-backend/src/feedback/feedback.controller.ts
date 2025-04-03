import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body('userId') userId: string,
    @Body('projectId') projectId: string,
    @Body('message') message: string,
    @Body('rating') rating: number,
  ) {
    try {
      return await this.feedbackService.create(userId, projectId, message, rating);
    } catch (error) {
      console.error('Error in create feedback:', error);
      throw error;
    }
  }

  @Get(':projectId')
  async findByProject(@Param('projectId') projectId: string) {
    try {
      return await this.feedbackService.findByProject(projectId);
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }
}
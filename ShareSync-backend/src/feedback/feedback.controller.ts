import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback } from './schemas/feedback.schema';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body('projectId') projectId: string,
    @Body('userId') userId: string,
    @Body('rating') rating: number,
    @Body('message') message: string,
  ) {
    try {
      const feedback = await this.feedbackService.create(projectId, userId, rating, message);
      return { message: 'Feedback submitted successfully', data: feedback };
    } catch (error) {
      console.error('Error in create feedback:', error);
      throw error;
    }
  }

  @Get('project/:projectId')
  async findByProjectId(@Param('projectId') projectId: string) {
    try {
      const feedback = await this.feedbackService.findByProjectId(projectId);
      return { data: feedback };
    } catch (error) {
      console.error('Error in findByProjectId:', error);
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.feedbackService.delete(id);
    } catch (error) {
      console.error('Error in delete feedback:', error);
      throw error;
    }
  }
}
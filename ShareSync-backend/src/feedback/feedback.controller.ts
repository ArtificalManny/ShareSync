import { Controller, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() createFeedbackDto: { feedback: string; featureRequest?: string; category: string }) {
    return this.feedbackService.create(createFeedbackDto);
  }
}
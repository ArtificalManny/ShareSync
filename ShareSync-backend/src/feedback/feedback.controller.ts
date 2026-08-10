import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  CreateFeedbackInput,
  FeedbackService,
} from './feedback.service';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(
    private readonly feedbackService:
      FeedbackService,
  ) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() input: CreateFeedbackInput,
  ) {
    const userId =
      req?.user?.sub ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?._id;

    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const feedback =
      await this.feedbackService.create(
        String(userId),
        input || {},
      );

    return {
      success: true,
      data: feedback,
    };
  }
}

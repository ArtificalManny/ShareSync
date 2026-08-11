// activation-funnel-controller-v1
import {
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  AnalyticsService,
} from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics/activation')
export class ActivationController {
  constructor(
    private readonly analytics:
      AnalyticsService,
  ) {}

  @Post('touch')
  async touch(
    @Req() req: any,
  ) {
    const userId =
      req?.user?.sub ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?._id;

    const result =
      await this.analytics
        .touchActivation(
          String(userId || ''),
        );

    return {
      success: true,
      ...result,
    };
  }
}

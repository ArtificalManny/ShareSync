import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InsightsService } from './insights.service';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  /**
   * GET /api/insights/weekly-narrative
   * Get natural language summary of user's week
   */
  @Get('weekly-narrative')
  async getWeeklyNarrative(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.insights.generateWeeklyNarrative(userId);
  }

  /**
   * GET /api/insights/predictions
   * Get predictive insights ("If you ship 2 more...")
   */
  @Get('predictions')
  async getPredictions(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.insights.generatePredictions(userId);
  }

  /**
   * GET /api/insights/nudge-timing
   * Get smart nudge timing based on user patterns
   */
  @Get('nudge-timing')
  async getNudgeTiming(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.insights.getSmartNudgeTiming(userId);
  }
}

// src/insights/insights.controller.ts
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Insights')
@Controller('projects/:projectId/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get project analytics and insights' })
  @ApiQuery({ name: 'range', required: false, example: '7d', description: 'Time range (e.g., 7d, 30d)' })
  async getProjectInsights(
    @Param('projectId') projectId: string,
    @Query('range') range: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id || req.user?.sub;
    const timeRange = range || '7d';
    return this.insightsService.calculateProjectInsights(projectId, userId, timeRange);
  }
}

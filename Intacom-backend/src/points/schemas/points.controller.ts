import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    try {
      return await this.pointsService.getLeaderboard();
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      throw error;
    }
  }
}
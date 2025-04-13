import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    const leaderboard = await this.pointsService.getLeaderboard();
    return {
      status: 'success',
      data: leaderboard,
    };
  }
}
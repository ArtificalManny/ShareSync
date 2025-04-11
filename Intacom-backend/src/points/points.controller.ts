import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';
import { User } from '../users/schemas/user.schema';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('leaderboard')
  async getLeaderboard(): Promise<User[]> {
    return await this.pointsService.getLeaderboard();
  }
}
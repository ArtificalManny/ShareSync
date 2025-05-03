import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';
import { UserService } from '../user/user.service';

@Controller('points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getPoints() {
    return this.pointsService.getPoints();
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.userService.getLeaderboard();
  }
}
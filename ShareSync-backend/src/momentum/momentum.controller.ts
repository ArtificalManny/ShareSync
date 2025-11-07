// backend/src/momentum/momentum.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { MomentumService } from './momentum.service';

@Controller('momentum')
export class MomentumController {
  constructor(private readonly momentumService: MomentumService) {}

  @Get('streak/:userId')
  async getStreak(@Param('userId') userId: string) {
    return this.momentumService.getStreak(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.momentumService.getLeaderboard();
  }

  @Get('score/:userId')
  async getMomentumScore(@Param('userId') userId: string) {
    return this.momentumService.getMomentumScore(userId);
  }
}
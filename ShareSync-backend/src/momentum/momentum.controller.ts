// src/momentum/momentum.controller.ts
import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { MomentumService } from './momentum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ShipProjectDto } from './dto/ship.dto';

@Controller('momentum')
@UseGuards(JwtAuthGuard)
export class MomentumController {
  constructor(private momentumService: MomentumService) {}

  @Get()
  async getUserMomentum(@GetUser('id') userId: string) {
    // Return comprehensive momentum card data for the user
    const [streakData, scoreData] = await Promise.all([
      this.momentumService.getStreak(userId),
      this.momentumService.getMomentumScore(userId),
    ]);

    return {
      userId,
      currentStreak: streakData.streak || 0,
      streakResetAt: streakData.resetAt,
      momentumScore: scoreData.score || 0,
      level: this.calculateLevel(scoreData.score || 0),
      nextLevelAt: this.calculateNextLevel(scoreData.score || 0),
    };
  }

  @Get('streak')
  async getStreak(@GetUser('id') userId: string) {
    return this.momentumService.getStreak(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.momentumService.getLeaderboard();
  }

  @Get('score')
  async getScore(@GetUser('id') userId: string) {
    return this.momentumService.getMomentumScore(userId);
  }

  @Post('ship/:projectId')
  async shipProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
    @Body() dto: ShipProjectDto,
  ) {
    return this.momentumService.shipProject(projectId, userId);
  }

  // Helper methods for level calculation
  private calculateLevel(score: number): number {
    // Level up every 1000 points
    return Math.floor(score / 1000) + 1;
  }

  private calculateNextLevel(score: number): number {
    const currentLevel = this.calculateLevel(score);
    return currentLevel * 1000;
  }
}

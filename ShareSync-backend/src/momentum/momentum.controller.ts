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
}
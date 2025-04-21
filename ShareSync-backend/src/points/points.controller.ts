import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PointsService } from './points.service';
import { UsersService } from '../users/users.service'; // Added

@Controller('points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly usersService: UsersService, // Added
  ) {}

  @Post()
  async create(@Body() createPostDto: { title: string; content: string }): Promise<any> {
    return this.pointsService.create(createPostDto);
  }

  @Get('leaderboard')
  async getLeaderboard(): Promise<any[]> {
    return this.usersService.getLeaderboard(); // Fixed
  }
}
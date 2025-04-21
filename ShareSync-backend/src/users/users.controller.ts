import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: { email: string; firstName: string; lastName: string; password: string }): Promise<any> {
    return this.usersService.create(createUserDto);
  }

  @Post('points')
  async addPoints(@Body() body: { userId: string; points: number }): Promise<any> {
    return this.usersService.addPoints(body.userId, body.points);
  }

  @Get('points/:userId')
  async getPoints(@Param('userId') userId: string): Promise<number> {
    return this.usersService.getPoints(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(): Promise<any[]> {
    return this.usersService.getLeaderboard();
  }
}
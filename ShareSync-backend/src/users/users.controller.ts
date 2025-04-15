import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: { username: string; email: string; password: string }) {
    return this.usersService.create(createUserDto);
  }

  @Get(':email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post('points/add')
  addPoints(@Body() body: { userId: string; points: number }) {
    return this.usersService.addPoints(body.userId, body.points);
  }

  @Get('points/:userId')
  getPoints(@Param('userId') userId: string) {
    return this.usersService.getPoints(userId);
  }

  @Get('points/leaderboard')
  getLeaderboard() {
    return this.usersService.getLeaderboard();
  }
}
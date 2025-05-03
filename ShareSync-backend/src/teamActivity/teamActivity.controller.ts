import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { TeamActivityService } from './team-activity.service';

@Controller('team-activity')
export class TeamActivityController {
  constructor(private readonly teamActivityService: TeamActivityService) {}

  @Get()
  async findAll(): Promise<any[]> {
    return this.teamActivityService.findAll();
  }

  @Post(':id/like')
  async like(@Param('id') id: string, @Req() req): Promise<any> {
    return this.teamActivityService.like(id, req.user.sub);
  }
}
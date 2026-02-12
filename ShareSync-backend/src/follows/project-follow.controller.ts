// src/follows/project-follow.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT FOLLOW CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectFollowService } from './project-follow.service';
import { FollowProjectDto } from './dto/follow-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:id')
@UseGuards(JwtAuthGuard)
export class ProjectFollowController {
  constructor(private readonly followService: ProjectFollowService) {}

  @Post('follow')
  async follow(
    @Param('id') projectId: string,
    @Body() dto: FollowProjectDto,
    @Req() req: any,
  ) {
    return this.followService.followProject(projectId, req.user.id, dto);
  }

  @Delete('follow')
  async unfollow(@Param('id') projectId: string, @Req() req: any) {
    return this.followService.unfollowProject(projectId, req.user.id);
  }

  @Get('follow-status')
  async status(@Param('id') projectId: string, @Req() req: any) {
    return this.followService.getFollowStatus(projectId, req.user.id);
  }
}

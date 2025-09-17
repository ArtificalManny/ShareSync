import {
    Controller,
    Post,
    Get,
    Param,
    Req,
    UseGuards,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { ProjectsService } from './project.service';
  
  /**
   * Public/status endpoints (tokenized) + owner-only toggles
   *
   * Routes used by frontend:
   *  - POST /public/projects/:id/enable
   *  - POST /public/projects/:id/disable
   *  - POST /public/projects/:id/regenerate
   *  - GET  /public/projects/:token/status
   */
  @Controller('public/projects')
  export class ProjectShareController {
    constructor(private readonly projects: ProjectsService) {}
  
    /** Owner-only: enable */
    @Post(':id/enable')
    @UseGuards(JwtAuthGuard)
    async enable(@Req() req, @Param('id') id: string) {
      const userId = req?.user?.sub;
      if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      const { publicToken } = await this.projects.enablePublic(id, userId);
      return { token: publicToken };
    }
  
    /** Owner-only: disable */
    @Post(':id/disable')
    @UseGuards(JwtAuthGuard)
    async disable(@Req() req, @Param('id') id: string) {
      const userId = req?.user?.sub;
      if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      await this.projects.disablePublic(id, userId);
      return { ok: true };
    }
  
    /** Owner-only: regenerate token (remains enabled) */
    @Post(':id/regenerate')
    @UseGuards(JwtAuthGuard)
    async regenerate(@Req() req, @Param('id') id: string) {
      const userId = req?.user?.sub;
      if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      const { publicToken } = await this.projects.regeneratePublicToken(id, userId);
      return { token: publicToken };
    }
  
    /** Anonymous: read-only public snapshot by token */
    @Get(':token/status')
    async status(@Param('token') token: string) {
      const snap = await this.projects.getPublicSnapshotByToken(token);
      if (!snap) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }
      return snap;
    }
  }
  
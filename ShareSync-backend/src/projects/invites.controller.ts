// src/projects/invites.controller.ts
import {
    Body,
    Controller,
    Param,
    Post,
    Get,
    Delete,
    Req,
    UseGuards,
  } from '@nestjs/common';
  
  import { InvitesService, CreateInviteDto } from './invites.service';
  
  // If you already have JWT & project guards, import and use them here:
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { ProjectPermissionGuard } from './guards/project-permission.guard';
  // Optional custom decorators if you have them
  // import { CanManageProject } from './decorators/can-manage-project.decorator';
  
  @Controller('projects/:id/invites')
  @UseGuards(JwtAuthGuard, ProjectPermissionGuard /*, CanManageProject */)
  export class InvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    @Post()
    async createInvite(
      @Param('id') projectId: string,
      @Body() dto: CreateInviteDto,
      @Req() req: any,
    ) {
      const actingUserId = req.user?.id || req.user?._id;
      return this.invites.createInvite(projectId, actingUserId, dto);
    }
  
    @Get()
    async listInvites(@Param('id') projectId: string, @Req() req: any) {
      const actingUserId = req.user?.id || req.user?._id;
      return this.invites.listInvites(projectId, actingUserId);
    }
  
    @Delete(':token')
    async revokeInvite(
      @Param('id') projectId: string,
      @Param('token') token: string,
      @Req() req: any,
    ) {
      const actingUserId = req.user?.id || req.user?._id;
      return this.invites.revokeInvite(projectId, token, actingUserId);
    }
  }
  
  @Controller('invites')
  @UseGuards(JwtAuthGuard)
  export class GlobalInvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    @Post('accept')
    async accept(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.acceptInvite(body?.token, userId, email);
    }
  }  
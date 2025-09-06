// src/projects/invites.controller.ts
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Delete,
    UseGuards,
    Req,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { InvitesService } from './invites.service';
  import {
    ProjectPermissionGuard,
    CanManageProject,
  } from './guards/project-permission.guard';
  
  type InviteCreateDto = { email: string; role?: 'member' | 'viewer' };
  type InviteAcceptDto = { token: string };
  
  /**
   * Project-scoped routes (create/list/revoke + accept-with-id)
   */
  @Controller('projects/:id/invites')
  export class InvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    /** Create invite (owner-only / manage) */
    @UseGuards(JwtAuthGuard, ProjectPermissionGuard)
    @CanManageProject()
    @Post()
    async create(@Req() req: any, @Param('id') projectId: string, @Body() dto: InviteCreateDto) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      if (!userId) throw new BadRequestException('Unauthorized');
      const email = String(dto?.email || '').trim().toLowerCase();
      const role = (dto?.role === 'viewer' ? 'viewer' : 'member') as 'viewer' | 'member';
      const { invite } = await this.invites.createInvite(projectId, userId, email, role);
      return { ok: true, invite };
    }
  
    /** Accept invite (auth required; not gated by project guard) */
    @UseGuards(JwtAuthGuard)
    @Post('accept')
    async accept(@Req() req: any, @Param('id') projectId: string, @Body() dto: InviteAcceptDto) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      const email = req?.user?.email || '';
      if (!userId) throw new BadRequestException('Unauthorized');
      const token = String(dto?.token || '').trim();
      if (!token) throw new BadRequestException('Missing invite token');
      const out = await this.invites.acceptInvite(projectId, token, String(userId), email);
      return { ok: true, members: out.members };
    }
  
    /** (Optional) List invites — owner-only/manage */
    @UseGuards(JwtAuthGuard, ProjectPermissionGuard)
    @CanManageProject()
    @Get()
    async list(@Req() req: any, @Param('id') projectId: string) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      return this.invites.listInvites(projectId, String(userId));
    }
  
    /** (Optional) Revoke invite — owner-only/manage */
    @UseGuards(JwtAuthGuard, ProjectPermissionGuard)
    @CanManageProject()
    @Delete(':token')
    async revoke(@Req() req: any, @Param('id') projectId: string, @Param('token') token: string) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      return this.invites.revokeInvite(projectId, String(userId), String(token));
    }
  }
  
  /**
   * Global accept route for magic links: POST /invites/accept
   * (mirrors the project-scoped accept above, but reads projectId from body)
   */
  @Controller('invites')
  export class GlobalInvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('accept')
    async accept(@Req() req: any, @Body() body: { projectId: string; token: string }) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      const email = req?.user?.email || '';
      if (!userId) throw new BadRequestException('Unauthorized');
      const projectId = String(body?.projectId || '').trim();
      const token = String(body?.token || '').trim();
      if (!projectId) throw new BadRequestException('Missing projectId');
      if (!token) throw new BadRequestException('Missing invite token');
      const out = await this.invites.acceptInvite(projectId, token, String(userId), email);
      return { ok: true, members: out.members };
    }
  }  
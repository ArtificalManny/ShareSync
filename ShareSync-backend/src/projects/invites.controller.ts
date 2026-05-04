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
  // Optional custom decorators if you have them
  // import { CanManageProject } from './decorators/can-manage-project.decorator';
  
  @UseGuards(JwtAuthGuard)
  @Controller('projects/:id/invites')
  export class InvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    /** POST /projects/:id/invites */
    @Post()
    async createInvite(
      @Param('id') projectId: string,
      @Body() dto: CreateInviteDto,
      @Req() req: any,
    ) {
      const actingUserId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      return this.invites.createInvite(projectId, actingUserId, dto);
    }
  
    /** GET /projects/:id/invites */
    @Get()
    async listInvites(@Param('id') projectId: string, @Req() req: any) {
      const actingUserId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      return this.invites.listInvites(projectId, actingUserId);
    }
  
    /** DELETE /projects/:id/invites/:token */
    @Delete(':token')
    async revokeInvite(
      @Param('id') projectId: string,
      @Param('token') token: string,
      @Req() req: any,
    ) {
      const actingUserId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      return this.invites.revokeInvite(projectId, token, actingUserId);
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Controller('invites')
  export class GlobalInvitesController {
    constructor(private readonly invites: InvitesService) {}
  
    /** POST /invites/accept  body: { token } */
    @Post('accept')
    async accept(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.acceptInvite(body?.token, userId, email);
    }

    /** POST /invites/decline  body: { token } */
    @Post('decline')
    async decline(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.declineInvite(body?.token, userId, email);
    }
  }

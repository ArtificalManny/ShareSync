import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invites: InvitationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Get('projects/:projectId/invitations')
  async list(@Req() req, @Param('projectId') projectId: string) {
    const userId = req?.user?.sub;
    return this.invites.list(projectId, userId);
  }

  @Post('projects/:projectId/invitations')
  async create(@Req() req, @Param('projectId') projectId: string, @Body() dto: CreateInvitationDto) {
    const userId = req?.user?.sub;
    const invite = await this.invites.create(projectId, userId, dto);

    this.realtime.emitToProject(projectId, 'invite:created', { projectId, invitation: invite });
    return invite;
  }

  @Patch('projects/:projectId/invitations/:invitationId/revoke')
  async revoke(@Req() req, @Param('projectId') projectId: string, @Param('invitationId') invitationId: string) {
    const userId = req?.user?.sub;
    const updated = await this.invites.revoke(projectId, invitationId, userId);

    this.realtime.emitToProject(projectId, 'invite:revoked', { projectId, invitationId });
    return updated;
  }

  @Post('invitations/accept')
  async accept(@Req() req, @Body() dto: AcceptInvitationDto) {
    const userId = req?.user?.sub;
    const userEmail = req?.user?.email; // optional if your JWT includes it
    const result = await this.invites.accept(dto.token, userId, userEmail);

    this.realtime.emitToProject(result.projectId, 'invite:accepted', { projectId: result.projectId, userId });
    return result;
  }
}
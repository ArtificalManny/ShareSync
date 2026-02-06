// src/integrations/integrations.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { IntegrationType } from './schemas/integration.schema';
import {
  CreateIntegrationDto,
  UpdateIntegrationSettingsDto,
  OAuthCallbackDto,
  SlackSendMessageDto,
} from './dto/integration.dto';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('oauth/:type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate OAuth flow' })
  @ApiParam({ name: 'type', enum: IntegrationType })
  @ApiQuery({ name: 'projectId', required: false })
  async initiateOAuth(
    @Req() req: any,
    @Param('type') type: IntegrationType,
    @Query('projectId') projectId?: string,
  ) {
    const result = await this.integrationsService.initiateOAuth(
      req.user.userId,
      type,
      projectId,
    );
    return { success: true, data: result };
  }

  @Get('oauth/:type/callback')
  @ApiOperation({ summary: 'OAuth callback' })
  @ApiParam({ name: 'type', enum: IntegrationType })
  async handleOAuthCallback(
    @Param('type') type: IntegrationType,
    @Query() query: OAuthCallbackDto,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.handleOAuthCallback(
        type,
        query.code,
        query.state || '',
      );
      
      // Redirect to frontend success page
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=true&type=${type}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=${encodeURIComponent(error.message)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a webhook integration' })
  async create(@Req() req: any, @Body() dto: CreateIntegrationDto) {
    const integration = await this.integrationsService.create(req.user.userId, dto);
    return { success: true, data: integration };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user integrations' })
  async findByUser(@Req() req: any) {
    const integrations = await this.integrationsService.findByUser(req.user.userId);
    return { success: true, data: integrations };
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project integrations' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findByProject(@Param('projectId') projectId: string) {
    const integrations = await this.integrationsService.findByProject(projectId);
    return { success: true, data: integrations };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async findById(@Param('id') id: string) {
    const integration = await this.integrationsService.findById(id);
    return { success: true, data: integration };
  }

  @Put(':id/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update integration settings' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationSettingsDto,
  ) {
    const integration = await this.integrationsService.updateSettings(id, dto);
    return { success: true, data: integration };
  }

  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async disconnect(@Param('id') id: string) {
    await this.integrationsService.disconnect(id);
    return { success: true, message: 'Integration disconnected' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async delete(@Param('id') id: string) {
    await this.integrationsService.delete(id);
    return { success: true, message: 'Integration deleted' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROVIDER-SPECIFIC
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/github/repos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get GitHub repositories' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async getGitHubRepos(@Param('id') id: string) {
    const repos = await this.integrationsService.getGitHubRepositories(id);
    return { success: true, data: repos };
  }

  @Get(':id/slack/channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Slack channels' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async getSlackChannels(@Param('id') id: string) {
    const channels = await this.integrationsService.getSlackChannels(id);
    return { success: true, data: channels };
  }

  @Post(':id/slack/message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send Slack message' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  async sendSlackMessage(@Param('id') id: string, @Body() dto: SlackSendMessageDto) {
    const result = await this.integrationsService.sendSlackMessage(
      id,
      dto.channel,
      dto.message,
    );
    return { success: true, data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('webhooks/github/:integrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'GitHub webhook endpoint' })
  @ApiParam({ name: 'integrationId', description: 'Integration ID' })
  async handleGitHubWebhook(
    @Param('integrationId') integrationId: string,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.integrationsService.handleWebhook(
      integrationId,
      event,
      payload,
      req.headers as Record<string, string>,
    );
    return { ok: true };
  }

  @Post('webhooks/slack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Slack webhook/command endpoint' })
  async handleSlackWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    // Handle Slack URL verification challenge
    if (payload.challenge) {
      return { challenge: payload.challenge };
    }

    // TODO: Process Slack events/commands
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK LOGS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getWebhookLogs(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.integrationsService.getWebhookLogs(
      id,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data: logs };
  }
}

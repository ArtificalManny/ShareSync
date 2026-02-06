// src/integrations/integrations.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS SERVICE: External service management
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import {
  Integration,
  IntegrationDocument,
  IntegrationType,
  IntegrationStatus,
} from './schemas/integration.schema';
import { WebhookLog, WebhookLogDocument } from './schemas/webhook-log.schema';
import { GitHubProvider } from './providers/github.provider';
import { SlackProvider } from './providers/slack.provider';
import {
  CreateIntegrationDto,
  UpdateIntegrationSettingsDto,
  CreateWebhookDto,
} from './dto/integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly pendingStates = new Map<string, { userId: string; type: IntegrationType; projectId?: string }>();

  constructor(
    @InjectModel(Integration.name)
    private readonly integrationModel: Model<IntegrationDocument>,
    @InjectModel(WebhookLog.name)
    private readonly webhookLogModel: Model<WebhookLogDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly githubProvider: GitHubProvider,
    private readonly slackProvider: SlackProvider,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  async initiateOAuth(
    userId: string,
    type: IntegrationType,
    projectId?: string,
  ): Promise<{ url: string; state: string }> {
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state for validation
    this.pendingStates.set(state, { userId, type, projectId });
    
    // Clean up after 10 minutes
    setTimeout(() => this.pendingStates.delete(state), 10 * 60 * 1000);

    let url: string;
    switch (type) {
      case IntegrationType.GITHUB:
        url = this.githubProvider.getAuthUrl(state);
        break;
      case IntegrationType.SLACK:
        url = this.slackProvider.getAuthUrl(state);
        break;
      default:
        throw new BadRequestException(`OAuth not supported for ${type}`);
    }

    return { url, state };
  }

  async handleOAuthCallback(
    type: IntegrationType,
    code: string,
    state: string,
  ): Promise<IntegrationDocument> {
    const pendingAuth = this.pendingStates.get(state);
    if (!pendingAuth) {
      throw new BadRequestException('Invalid or expired state');
    }

    this.pendingStates.delete(state);

    let integration: IntegrationDocument;

    switch (type) {
      case IntegrationType.GITHUB: {
        const { accessToken } = await this.githubProvider.exchangeCodeForToken(code);
        const user = await this.githubProvider.getUser(accessToken);
        
        integration = await this.createOrUpdateIntegration({
          userId: pendingAuth.userId,
          type: IntegrationType.GITHUB,
          name: `GitHub - ${user.login}`,
          projectId: pendingAuth.projectId,
          credentials: { accessToken },
          externalUserId: user.id.toString(),
        });
        break;
      }
      case IntegrationType.SLACK: {
        const { accessToken, teamId, teamName, userId: slackUserId, incomingWebhook } = 
          await this.slackProvider.exchangeCodeForToken(code);
        
        integration = await this.createOrUpdateIntegration({
          userId: pendingAuth.userId,
          type: IntegrationType.SLACK,
          name: `Slack - ${teamName}`,
          projectId: pendingAuth.projectId,
          credentials: { 
            accessToken,
            webhookUrl: incomingWebhook?.url,
          },
          externalUserId: slackUserId,
          externalWorkspaceId: teamId,
          settings: {
            defaultChannel: incomingWebhook?.channel,
          },
        });
        break;
      }
      default:
        throw new BadRequestException(`Unknown integration type: ${type}`);
    }

    return integration;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  private async createOrUpdateIntegration(data: {
    userId: string;
    type: IntegrationType;
    name: string;
    projectId?: string;
    credentials: any;
    externalUserId?: string;
    externalWorkspaceId?: string;
    settings?: any;
  }): Promise<IntegrationDocument> {
    const filter: any = {
      userId: new Types.ObjectId(data.userId),
      type: data.type,
    };
    if (data.projectId) {
      filter.projectId = new Types.ObjectId(data.projectId);
    }

    const existing = await this.integrationModel.findOne(filter);

    if (existing) {
      existing.name = data.name;
      existing.credentials = data.credentials;
      existing.status = IntegrationStatus.ACTIVE;
      existing.externalUserId = data.externalUserId;
      existing.externalWorkspaceId = data.externalWorkspaceId;
      if (data.settings) {
        existing.settings = { ...existing.settings, ...data.settings };
      }
      return existing.save();
    }

    const integration = new this.integrationModel({
      ...data,
      userId: new Types.ObjectId(data.userId),
      projectId: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
      status: IntegrationStatus.ACTIVE,
    });

    return integration.save();
  }

  async create(userId: string, dto: CreateIntegrationDto): Promise<IntegrationDocument> {
    // For webhook-based integrations (no OAuth)
    const integration = new this.integrationModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      credentials: {
        accessToken: dto.accessToken,
        apiKey: dto.apiKey,
        webhookUrl: dto.webhookUrl,
        webhookSecret: crypto.randomBytes(32).toString('hex'),
      },
      status: IntegrationStatus.ACTIVE,
    });

    return integration.save();
  }

  async findById(integrationId: string): Promise<IntegrationDocument> {
    const integration = await this.integrationModel.findById(integrationId);
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    return integration;
  }

  async findByUser(userId: string): Promise<IntegrationDocument[]> {
    return this.integrationModel.find({
      userId: new Types.ObjectId(userId),
    });
  }

  async findByProject(projectId: string): Promise<IntegrationDocument[]> {
    return this.integrationModel.find({
      projectId: new Types.ObjectId(projectId),
    });
  }

  async findByType(
    userId: string,
    type: IntegrationType,
    projectId?: string,
  ): Promise<IntegrationDocument | null> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      type,
    };
    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }
    return this.integrationModel.findOne(filter);
  }

  async updateSettings(
    integrationId: string,
    dto: UpdateIntegrationSettingsDto,
  ): Promise<IntegrationDocument> {
    const integration = await this.findById(integrationId);
    integration.settings = { ...integration.settings, ...dto };
    return integration.save();
  }

  async disconnect(integrationId: string): Promise<void> {
    const integration = await this.findById(integrationId);
    integration.status = IntegrationStatus.INACTIVE;
    integration.credentials = {};
    await integration.save();
  }

  async delete(integrationId: string): Promise<void> {
    await this.integrationModel.findByIdAndDelete(integrationId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK HANDLING
  // ─────────────────────────────────────────────────────────────────────────────

  async handleWebhook(
    integrationId: string,
    event: string,
    payload: any,
    headers: Record<string, string>,
  ): Promise<void> {
    const startTime = Date.now();
    const integration = await this.findById(integrationId);

    const log = new this.webhookLogModel({
      integrationId: new Types.ObjectId(integrationId),
      eventType: event,
      direction: 'inbound',
      payload,
      headers,
      status: 'pending',
    });

    try {
      switch (integration.type) {
        case IntegrationType.GITHUB:
          await this.githubProvider.handleWebhook(event, payload, integrationId);
          break;
        default:
          this.logger.warn(`No webhook handler for type: ${integration.type}`);
      }

      log.status = 'success';
      log.statusCode = 200;
      integration.lastSyncAt = new Date();
      integration.syncCount += 1;
      await integration.save();
    } catch (error) {
      log.status = 'failed';
      log.errorMessage = error.message;
      integration.lastError = error.message;
      integration.status = IntegrationStatus.ERROR;
      await integration.save();
    }

    log.processingTimeMs = Date.now() - startTime;
    await log.save();
  }

  async sendOutboundWebhook(
    integrationId: string,
    event: string,
    payload: any,
  ): Promise<void> {
    const integration = await this.findById(integrationId);

    if (!integration.credentials.webhookUrl) {
      this.logger.warn(`No webhook URL for integration ${integrationId}`);
      return;
    }

    const log = new this.webhookLogModel({
      integrationId: new Types.ObjectId(integrationId),
      eventType: event,
      direction: 'outbound',
      payload,
      status: 'pending',
    });

    try {
      const signature = crypto
        .createHmac('sha256', integration.credentials.webhookSecret || '')
        .update(JSON.stringify(payload))
        .digest('hex');

      const response = await fetch(integration.credentials.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ShareSync-Signature': signature,
          'X-ShareSync-Event': event,
        },
        body: JSON.stringify(payload),
      });

      log.statusCode = response.status;
      log.status = response.ok ? 'success' : 'failed';
      
      if (!response.ok) {
        log.errorMessage = await response.text();
      }
    } catch (error) {
      log.status = 'failed';
      log.errorMessage = error.message;
    }

    await log.save();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROVIDER-SPECIFIC METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  async getGitHubRepositories(integrationId: string): Promise<any[]> {
    const integration = await this.findById(integrationId);
    if (integration.type !== IntegrationType.GITHUB) {
      throw new BadRequestException('Not a GitHub integration');
    }
    return this.githubProvider.getRepositories(integration.credentials.accessToken);
  }

  async getSlackChannels(integrationId: string): Promise<any[]> {
    const integration = await this.findById(integrationId);
    if (integration.type !== IntegrationType.SLACK) {
      throw new BadRequestException('Not a Slack integration');
    }
    return this.slackProvider.getChannels(integration.credentials.accessToken);
  }

  async sendSlackMessage(
    integrationId: string,
    channel: string,
    message: string,
    blocks?: any[],
  ): Promise<any> {
    const integration = await this.findById(integrationId);
    if (integration.type !== IntegrationType.SLACK) {
      throw new BadRequestException('Not a Slack integration');
    }
    return this.slackProvider.sendMessage(
      integration.credentials.accessToken,
      channel,
      message,
      blocks,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: any): Promise<void> {
    // Find integrations for the project with notifications enabled
    const integrations = await this.integrationModel.find({
      projectId: new Types.ObjectId(payload.projectId),
      status: IntegrationStatus.ACTIVE,
      'settings.notifyOnTaskComplete': true,
    });

    for (const integration of integrations) {
      if (integration.type === IntegrationType.SLACK) {
        await this.sendSlackMessage(
          integration._id.toString(),
          integration.settings.defaultChannel,
          `✅ Task completed: ${payload.taskTitle}`,
        );
      } else if (integration.type === IntegrationType.WEBHOOK) {
        await this.sendOutboundWebhook(
          integration._id.toString(),
          'task.completed',
          payload,
        );
      }
    }
  }

  @OnEvent('project.completed')
  async handleProjectCompleted(payload: any): Promise<void> {
    const integrations = await this.integrationModel.find({
      projectId: new Types.ObjectId(payload.projectId),
      status: IntegrationStatus.ACTIVE,
    });

    for (const integration of integrations) {
      if (integration.type === IntegrationType.SLACK) {
        await this.sendSlackMessage(
          integration._id.toString(),
          integration.settings.defaultChannel,
          `🎉 Project completed: ${payload.projectName}!`,
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK LOGS
  // ─────────────────────────────────────────────────────────────────────────────

  async getWebhookLogs(
    integrationId: string,
    limit: number = 50,
  ): Promise<WebhookLogDocument[]> {
    return this.webhookLogModel
      .find({ integrationId: new Types.ObjectId(integrationId) })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

// src/integrations/integrations.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Integration, IntegrationSchema } from './schemas/integration.schema';
import { WebhookLog, WebhookLogSchema } from './schemas/webhook-log.schema';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GitHubProvider } from './providers/github.provider';
import { SlackProvider } from './providers/slack.provider';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
      { name: WebhookLog.name, schema: WebhookLogSchema },
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GitHubProvider, SlackProvider],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

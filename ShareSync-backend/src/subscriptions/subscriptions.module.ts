// src/subscriptions/subscriptions.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS MODULE
// Phase 5: Stripe subscription system
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { VaultFile, VaultFileSchema } from '../vault/schemas/vault-file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: VaultFile.name, schema: VaultFileSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

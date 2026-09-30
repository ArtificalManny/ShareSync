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
import { User, UserSchema } from '../user/schemas/user.schema';
import { VaultFile, VaultFileSchema } from '../vault/schemas/vault-file.schema';
import { Thread, ThreadSchema } from '../threads/schemas/thread.schema';
import {
  ThreadMessage,
  ThreadMessageSchema,
} from '../thread-messages/schemas/thread-message.schema';
import {
  TeamRoomPendingUpload,
  TeamRoomPendingUploadSchema,
} from '../uploads/schemas/team-room-pending-upload.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Project.name, schema: ProjectSchema },

      // openshare-downgrade-member-display-v1
      { name: User.name, schema: UserSchema },

      { name: VaultFile.name, schema: VaultFileSchema },

      // openshare-team-room-storage-accounting-v1
      // Thread messages represent accepted Team Room attachment storage.
      // Pending uploads represent already-persisted objects that have not
      // yet been consumed into a message.
      { name: Thread.name, schema: ThreadSchema },
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
      {
        name: TeamRoomPendingUpload.name,
        schema: TeamRoomPendingUploadSchema,
      },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

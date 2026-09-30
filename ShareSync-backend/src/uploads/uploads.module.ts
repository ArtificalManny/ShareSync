import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ModerationModule } from '../moderation/moderation.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import {
  TeamRoomPendingUpload,
  TeamRoomPendingUploadSchema,
} from './schemas/team-room-pending-upload.schema';
import {
  ThreadMessage,
  ThreadMessageSchema,
} from '../thread-messages/schemas/thread-message.schema';
import {
  TeamRoomUploadCleanupService,
} from './team-room-upload-cleanup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TeamRoomPendingUpload.name,
        schema: TeamRoomPendingUploadSchema,
      },
      {
        name: ThreadMessage.name,
        schema: ThreadMessageSchema,
      },
    ]),

    // openshare-team-room-asset-registry-v1
    ModerationModule,
    SubscriptionsModule,
  ],
  controllers: [UploadsController],
  // openshare-team-room-upload-cleanup-v1
  providers: [
    UploadsService,
    TeamRoomUploadCleanupService,
  ],
  // openshare-team-room-explicit-delete-retry-v1
  exports: [
    UploadsService,
    TeamRoomUploadCleanupService,
  ],
})
export class UploadsModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThreadMessage, ThreadMessageSchema } from './schemas/thread-message.schema';
import { ThreadMessagesService } from './thread-messages.service';
import { ThreadMessagesController } from './thread-messages.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { VaultModule } from '../vault/vault.module';
import { ProjectsModule } from '../projects/projects.module';
import { UploadsModule } from '../uploads/uploads.module';
import {
  TeamRoomPendingUpload,
  TeamRoomPendingUploadSchema,
} from '../uploads/schemas/team-room-pending-upload.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
      {
        name: TeamRoomPendingUpload.name,
        schema: TeamRoomPendingUploadSchema,
      },
    ]),
    ModerationModule,
    VaultModule,
    ProjectsModule,

    // openshare-team-room-message-delete-cleanup-v1
    UploadsModule,
  ],
  controllers: [ThreadMessagesController],
  providers: [ThreadMessagesService],
  exports: [ThreadMessagesService],
})
export class ThreadMessagesModule {}

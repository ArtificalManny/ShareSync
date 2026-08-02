import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { MongooseModule } from '@nestjs/mongoose';
import { VaultFolder, VaultFolderSchema } from './schemas/vault-folder.schema';
import { VaultFile, VaultFileSchema } from './schemas/vault-file.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Milestone, MilestoneSchema } from '../milestones/schemas/milestone.schema';
import {
  Announcement,
  AnnouncementSchema,
} from '../announcements/schemas/announcements.schema';
import { Thread, ThreadSchema } from '../threads/schemas/thread.schema';
import {
  ThreadMessage,
  ThreadMessageSchema,
} from '../threads/schemas/thread-message.schema';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VaultFolder.name, schema: VaultFolderSchema },
      { name: VaultFile.name, schema: VaultFileSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Milestone.name, schema: MilestoneSchema },
      {
        name: Announcement.name,
        schema: AnnouncementSchema,
      },
      { name: Thread.name, schema: ThreadSchema },
      {
        name: ThreadMessage.name,
        schema: ThreadMessageSchema,
      },
    ]),
    ModerationModule,
    NotificationsModule,
    UploadsModule,
  ],
  controllers: [VaultController],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import {
  VaultFolder,
  VaultFolderSchema,
} from '../vault/schemas/vault-folder.schema';
import {
  VaultFile,
  VaultFileSchema,
} from '../vault/schemas/vault-file.schema';
import {
  Announcement,
  AnnouncementSchema,
} from '../announcements/schemas/announcements.schema';
import {
  Thread,
  ThreadSchema,
} from '../threads/schemas/thread.schema';
import {
  ThreadMessage,
  ThreadMessageSchema,
} from '../threads/schemas/thread-message.schema';

import { ProjectsController } from './projects.controller';
import { ProjectShareController } from './share.controller';
import { ProjectsService } from './projects.service';

// ⭐ FIXED: Now importing BOTH controllers from the file!
import { InvitesController, GlobalInvitesController } from './invites.controller'; 
import { InvitesService } from './invites.service';

import { ProjectFollowModule } from '../follows/project-follow.module';
import { ModerationModule } from '../moderation/moderation.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      {
        name: VaultFolder.name,
        schema: VaultFolderSchema,
      },
      {
        name: VaultFile.name,
        schema: VaultFileSchema,
      },
      {
        name: Announcement.name,
        schema: AnnouncementSchema,
      },
      {
        name: Thread.name,
        schema: ThreadSchema,
      },
      {
        name: ThreadMessage.name,
        schema: ThreadMessageSchema,
      }
    ]),
    ProjectFollowModule,
    UploadsModule,
    ModerationModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ActivitiesModule)
  ],
  controllers: [
    ProjectsController,
    ProjectShareController,
    InvitesController,
    GlobalInvitesController // ⭐ ACTIVATED: The /invites/accept route is now live!
  ],
  providers: [
    ProjectsService,
    InvitesService
  ],
  exports: [
    ProjectsService,
    InvitesService
  ],
})
export class ProjectsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement, AnnouncementSchema } from './schemas/announcements.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AnnouncementCommentEmailWorker } from './announcement-comment-email.worker';
import { VaultModule } from '../vault/vault.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UploadsModule,
    ModerationModule,
    NotificationsModule,
    VaultModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementCommentEmailWorker],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}

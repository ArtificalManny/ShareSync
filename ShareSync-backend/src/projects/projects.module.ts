import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

import { ProjectsController } from './projects.controller';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema }
    ]),
    ProjectFollowModule,
    ModerationModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ActivitiesModule)
  ],
  controllers: [
    ProjectsController,
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

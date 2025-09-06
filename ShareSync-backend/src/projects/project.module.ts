// src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectController } from './project.controller';
import { ProjectsService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectPermissionGuard } from './guards/project-permission.guard';

// ⬇️ new invites pieces
import { InvitesService } from './invites.service';
import { InvitesController, GlobalInvitesController } from './invites.controller';

// deps used by services/guards
import { UserModule } from '../user/user.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => ActivitiesModule),
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    ProjectController,
    InvitesController,          // ⬅️ project-scoped invites routes
    GlobalInvitesController,    // ⬅️ /invites/accept global endpoint
  ],
  providers: [
    ProjectsService,
    ProjectPermissionGuard,
    InvitesService,             // ⬅️ provide invites service
  ],
  exports: [
    ProjectsService,
    ProjectPermissionGuard,
    InvitesService,             // ⬅️ export if other modules need it
  ],
})
export class ProjectModule {}

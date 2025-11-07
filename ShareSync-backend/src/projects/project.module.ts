// backend/src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectsService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectPermissionGuard } from './guards/project-permission.guard';
import { InvitesService } from './invites.service';
import { InvitesController, GlobalInvitesController } from './invites.controller';
import { UserModule } from '../user/user.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MomentumModule } from '../momentum/momentum.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => ActivitiesModule),
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => MomentumModule),
  ],
  controllers: [ProjectController, InvitesController, GlobalInvitesController],
  providers: [ProjectsService, ProjectPermissionGuard, InvitesService],
  exports: [ProjectsService, ProjectPermissionGuard, InvitesService, MongooseModule],
})
export class ProjectModule {}
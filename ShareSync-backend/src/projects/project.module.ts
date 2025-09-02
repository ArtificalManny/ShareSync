// src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectController } from './project.controller';
import { UpdatesController } from './updates.controller';
import { InvitesController } from './invites.controller';

import { ProjectsService } from './project.service';
import { InvitesService } from './invites.service';

import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectPermissionGuard } from './guards/project-permission.guard';

import { RealtimeModule } from '../realtime/realtime.module';
import { NotifyModule } from '../notifications/notify.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => RealtimeModule),
    NotifyModule,
  ],
  controllers: [ProjectController, UpdatesController, InvitesController],
  providers: [ProjectsService, InvitesService, ProjectPermissionGuard],
  exports: [ProjectsService],
})
export class ProjectModule {}

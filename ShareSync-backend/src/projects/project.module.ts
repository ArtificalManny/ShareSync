// src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsService } from './project.service';

import { UpdatesController } from './updates.controller';
// If you have a ProjectController, import it too:
import { ProjectController } from './project.controller';

import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    // 👇 This registers the ProjectModel for DI
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),

    ModerationModule,
    NotificationsModule,

    // Only needed if ProjectsService injects UserService somewhere (safe to keep)
    forwardRef(() => UserModule),
  ],
  controllers: [
    UpdatesController,
    // Include this only if the file exists in your repo:
    ProjectController,
  ],
  providers: [ProjectsService],
  exports: [ProjectsService], // 👈 allow other modules to inject ProjectsService
})
export class ProjectModule {}
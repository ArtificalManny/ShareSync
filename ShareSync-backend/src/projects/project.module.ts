// src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ProjectsService } from './project.service';
import { UpdatesController } from './updates.controller';
import { ProjectController } from './project.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';
import { ProjectPermissionGuard } from './guards/project-permission.guard';

@Module({
  imports: [
    ModerationModule,
    NotificationsModule,
    forwardRef(() => UserModule),
  ],
  controllers: [UpdatesController, ProjectController],
  providers: [ProjectsService, ProjectPermissionGuard],
  exports: [ProjectsService],
})
export class ProjectModule {}

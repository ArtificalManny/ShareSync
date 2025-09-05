// src/projects/project.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './project.service';
import { ProjectController } from './project.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectPermissionGuard } from './guards/project-permission.guard';

// ⬇️ bring in anything that ProjectsService/guards need (examples)
import { UserModule } from '../user/user.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectsService,
    ProjectPermissionGuard,     // ⬅️ provide the guard here
  ],
  exports: [
    ProjectsService,            // ⬅️ export service
    ProjectPermissionGuard,     // ⬅️ export guard so other modules can use it
  ],
})
export class ProjectModule {}
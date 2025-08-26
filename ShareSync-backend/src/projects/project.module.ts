// src/projects/project.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from './project.controller';
import { ProjectsService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectShareSchema } from './share.schema';
import { ProjectShareService } from './share.service';

@Module({
  imports: [
    // ...existing
    MongooseModule.forFeature([
      { name: 'ProjectShare', schema: ProjectShareSchema },
    ]),
  ],
  // ...
  providers: [
    // ...existing
    ProjectShareService,
  ],
  exports: [
    // ...existing
    ProjectShareService,
  ],
})
export class ProjectModule {}

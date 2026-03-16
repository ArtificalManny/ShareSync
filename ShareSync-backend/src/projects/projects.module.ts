// src/projects/projects.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// ✅ Phase 3: follows (needed because ProjectsController injects ProjectFollowService)
import { ProjectFollowModule } from '../follows/project-follow.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
    ]),

    // ✅ allows DI of ProjectFollowService in ProjectsController
    ProjectFollowModule,

    // ✅ Content moderation for project name/description
    ModerationModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

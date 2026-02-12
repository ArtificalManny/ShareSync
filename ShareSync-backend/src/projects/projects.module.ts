// src/projects/projects.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// ✅ Phase 3: follows (needed because ProjectsController injects ProjectFollowService)
import { ProjectFollowModule } from '../follows/project-follow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),

    // ✅ allows DI of ProjectFollowService in ProjectsController
    ProjectFollowModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

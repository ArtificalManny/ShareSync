// src/sprints/sprints.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS MODULE
// Registers the Sprint model, controller, and service.
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// openshare-sprints-projects-wiring-v1
import { ProjectsModule } from '../projects/projects.module';

import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';

@Module({
  imports: [
    ProjectsModule,
    MongooseModule.forFeature([
      {
        name: Sprint.name,
        schema: SprintSchema,
      },
    ]),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}

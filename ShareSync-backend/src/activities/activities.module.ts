// src/activities/activities.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';

// ✅ Needed for ProjectAccessGuard DI
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },

      // ✅ Provide Project model in this module context (for ProjectAccessGuard)
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ProjectAccessGuard],

  // ✅ THIS is what fixes UserService DI
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

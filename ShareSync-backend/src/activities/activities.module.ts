// src/activities/activities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController, ActivityFeedController } from './activities.controller';
import { TaskMutationActivityListener } from './listeners/task-mutation-activity.listener';
import { ProjectMembershipActivityListener } from './listeners/project-membership-activity.listener';
import { ActivitiesService } from './activities.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';

// ✅ Needed for ProjectAccessGuard DI
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },

      // ✅ Provide Project model in this module context (for ProjectAccessGuard)
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ActivitiesController, ActivityFeedController],
  providers: [
    ActivitiesService,
    ProjectAccessGuard,
    TaskMutationActivityListener,
    ProjectMembershipActivityListener,
  ],

  // ✅ THIS is what fixes UserService DI
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

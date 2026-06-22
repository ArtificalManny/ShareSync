// src/milestones/milestones.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Milestone, MilestoneSchema } from './schemas/milestone.schema';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';

// ✅ NEW: task model access for progress calculation
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

// ✅ NEW: endpoint GET /api/projects/:projectId/milestones
import { ProjectMilestonesController } from './project-milestones.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Milestone.name, schema: MilestoneSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    forwardRef(() => ProjectsModule),
    NotificationsModule,
  ],
  controllers: [MilestonesController, ProjectMilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}

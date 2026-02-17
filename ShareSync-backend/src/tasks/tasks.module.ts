// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TasksService } from './tasks.service';
import { Task, TaskSchema } from './schemas/task.schema';

// Controllers (adjust if yours differs)
import { ProjectTasksController } from './project-tasks.controller';

// Existing deps
import { ProjectsModule } from '../projects/projects.module';

// ✅ Needed for ProjectAccessGuard DI (even if ProjectsModule exists)
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },

      // ✅ Provide Project model for guard DI
      { name: Project.name, schema: ProjectSchema },
    ]),
    ProjectsModule,
  ],
  controllers: [ProjectTasksController],
  providers: [TasksService, ProjectAccessGuard],
  exports: [TasksService],
})
export class TasksModule {}

// src/tasks/tasks.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TasksService } from './tasks.service';
import { Task, TaskSchema } from './schemas/task.schema';

// ✅ Controllers
import { ProjectTasksController } from './project-tasks.controller';
import { TasksController } from './tasks.controller';

// Existing deps
import { ProjectsModule } from '../projects/projects.module';

// ✅ Needed for ProjectAccessGuard DI (even if ProjectsModule exists)
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

// ✅ Realtime (Socket emit layer)
import { RealtimeModule } from '../realtime/realtime.module';

// ✅ Priority 1: UserService needed for first-task/first-ship XP bonus tracking
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },

      // ✅ Provide Project model for guard DI
      { name: Project.name, schema: ProjectSchema },
    ]),
    ProjectsModule,

    // ✅ Allows TasksService to inject RealtimeService safely
    RealtimeModule,

    // ✅ Priority 1: forwardRef avoids circular dependency (UserModule ↔ TasksModule)
    forwardRef(() => UserModule),
  ],
  controllers: [
    ProjectTasksController,
    TasksController, // ✅ THIS is what enables /api/tasks/*
  ],
  providers: [TasksService, ProjectAccessGuard],
  exports: [TasksService],
})
export class TasksModule {}

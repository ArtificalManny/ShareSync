// src/tasks/tasks.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
    ]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

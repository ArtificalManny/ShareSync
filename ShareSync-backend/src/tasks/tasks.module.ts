// src/tasks/tasks.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, TaskSchema } from './schemas/task.schema';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    forwardRef(() => RealtimeModule),
    forwardRef(() => ProjectModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
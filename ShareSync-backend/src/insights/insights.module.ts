// src/insights/insights.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    // We inject the Task model directly to run aggregations without bloating TasksService
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    ProjectsModule, // Required to check project access permissions
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}

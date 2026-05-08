import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  DailyFocusPlan,
  DailyFocusPlanSchema,
} from './schemas/daily-focus-plan.schema';
import { DailyFocusController } from './daily-focus.controller';
import { DailyFocusService } from './daily-focus.service';

import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyFocusPlan.name, schema: DailyFocusPlanSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [DailyFocusController],
  providers: [DailyFocusService],
  exports: [DailyFocusService],
})
export class DailyFocusModule {}

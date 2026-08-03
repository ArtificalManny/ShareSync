import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MyWorkController } from './my-work.controller';
import { MyWorkService } from './my-work.service';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import {
  Milestone,
  MilestoneSchema,
} from '../milestones/schemas/milestone.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Milestone.name, schema: MilestoneSchema },
    ]),
  ],
  controllers: [MyWorkController],
  providers: [MyWorkService],
  exports: [MyWorkService],
})
export class MyWorkModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AIController } from './ai.controller';
import { AIService } from './ai.service';

import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { UserStats, UserStatsSchema } from '../gamification/schemas/user-stats.schema';

import { UserModule } from '../user/user.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: UserStats.name, schema: UserStatsSchema },
    ]),
    UserModule,
    GamificationModule,
    ProjectsModule,
    TasksModule,
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}

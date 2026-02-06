import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AIController } from './ai.controller';
import { AIService } from './ai.service';

// ✅ Import the schemas AIService needs (at least Task)
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

// If AIService injects these models too, keep them here as well.
// If it doesn't, it's still safe (just extra providers).
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { UserStats, UserStatsSchema } from '../gamification/schemas/user-stats.schema';

// Keep your feature modules if you want their services/controllers available
import { UserModule } from '../user/user.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    // ✅ This is what actually registers TaskModel (and friends) for DI in this module
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: UserStats.name, schema: UserStatsSchema },
    ]),

    // Optional: keep these if AIService calls other services
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

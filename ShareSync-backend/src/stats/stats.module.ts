// src/stats/stats.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { StatsService } from './stats.service';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectStatsController } from '../analytics/project-stats.controller';
import { UserStatsController } from '../analytics/user-stats.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    forwardRef(() => ProjectsModule),  // ⬅️ so the guard/service are visible here
  ],
  controllers: [ProjectStatsController, UserStatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

// src/stats/stats.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ProjectModule } from '../projects/project.module';
import { ProjectStatsController } from '../analytics/project-stats.controller';
import { UserStatsController } from '../analytics/user-stats.controller';

@Module({
  imports: [
    forwardRef(() => ProjectModule),  // ⬅️ so the guard/service are visible here
  ],
  controllers: [ProjectStatsController, UserStatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

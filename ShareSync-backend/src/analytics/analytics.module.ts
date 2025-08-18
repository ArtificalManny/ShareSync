// src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StatsService } from './stats.service';
import { UserStatsController } from './user-stats.controller';
import { ProjectStatsController } from './project-stats.controller';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [UserStatsController, ProjectStatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class AnalyticsModule {}

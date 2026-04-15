// src/analytics/analytics.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { DailySnapshot, DailySnapshotSchema } from './schemas/daily-snapshot.schema';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailySnapshot.name, schema: DailySnapshotSchema },
      { name: EventLog.name, schema: EventLogSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailySnapshot.name, schema: DailySnapshotSchema },
      { name: EventLog.name, schema: EventLogSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

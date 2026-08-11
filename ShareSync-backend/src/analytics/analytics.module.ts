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
import { GrowthController } from './growth.controller';
import { GrowthService } from './growth.service';
import { AnalyticsService } from './analytics.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
// activation-funnel-module-v1
import { ActivationController } from './activation.controller';
import { ActivationListener } from './activation.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailySnapshot.name, schema: DailySnapshotSchema },
      { name: EventLog.name, schema: EventLogSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController, GrowthController,
    ActivationController,],
  providers: [AnalyticsService, GrowthService,
    ActivationListener,],
  exports: [AnalyticsService, GrowthService],
})
export class AnalyticsModule {}

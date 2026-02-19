// src/calendar/calendar.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarEvent, CalendarEventSchema } from './schemas/event.schema';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

// ✅ NEW: Import schemas needed for the Rhythm aggregator
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Sprint, SprintSchema } from '../sprints/schemas/sprint.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEvent.name, schema: CalendarEventSchema },
      // ✅ NEW: Injecting the required models
      { name: Task.name, schema: TaskSchema },
      { name: Sprint.name, schema: SprintSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

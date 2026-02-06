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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

/**
 * analytics.module.ts
 * Analytics module for cursor metrics and insights
 * 
 * Location: src/analytics/analytics.module.ts
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cursor, CursorSchema } from '../realtime/schemas/cursor.schema';
import { Presence, PresenceSchema } from '../realtime/schemas/presence.schema';
import { CursorMetricsService } from './cursor-metrics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cursor.name, schema: CursorSchema },
      { name: Presence.name, schema: PresenceSchema },
    ]),
  ],
  providers: [CursorMetricsService],
  exports: [CursorMetricsService],
})
export class AnalyticsModule {}
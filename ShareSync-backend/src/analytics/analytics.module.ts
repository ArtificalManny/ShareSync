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
import { User, UserSchema } from '../user/schemas/user.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { CursorMetricsService } from './cursor-metrics.service';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cursor.name, schema: CursorSchema },
      { name: Presence.name, schema: PresenceSchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [InsightsController],
  providers: [CursorMetricsService, InsightsService],
  exports: [CursorMetricsService, InsightsService],
})
export class AnalyticsModule {}

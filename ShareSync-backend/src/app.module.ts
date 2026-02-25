// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { CacheModule } from './cache/cache.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { UserContextModule } from './user-context/user-context.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ActivitiesModule } from './activities/activities.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PresenceModule } from './presence/presence.module';
import { GamificationModule } from './gamification/gamification.module';
import { ProjectFollowModule } from './follows/project-follow.module';
import { SprintsModule } from './sprints/sprints.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FilesModule } from './files/files.module';
import { MilestonesModule } from './milestones/milestones.module';
import { ThreadsModule } from './threads/threads.module';
import { InsightsModule } from './insights/insights.module';
import { VaultModule } from './vault/vault.module';
import { CalendarModule } from './calendar/calendar.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ReportsModule } from './reports/reports.module';
import { AIModule } from './ai/ai.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { ModerationModule } from './moderation/moderation.module';
import { ContentReportsModule } from './content-reports/content-reports.module';

// ✅ NEW: Imported the SettingsModule
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'], cache: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/sharesync'),
        retryWrites: true, w: 'majority', maxPoolSize: 10, minPoolSize: 5, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000,
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    CacheModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        { name: 'short', ttl: 1000, limit: configService.get<number>('THROTTLE_SHORT_LIMIT', 3) },
        { name: 'medium', ttl: 10000, limit: configService.get<number>('THROTTLE_MEDIUM_LIMIT', 20) },
        { name: 'long', ttl: 60000, limit: configService.get<number>('THROTTLE_LONG_LIMIT', 100) },
      ],
    }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', newListener: false, removeListener: false, maxListeners: 20, verboseMemoryLeak: false, ignoreErrors: false }),
    ScheduleModule.forRoot(),
    MonitoringModule, HealthModule, AuthModule, UserModule, ProjectsModule, TasksModule, UserContextModule, RealtimeModule,
    ActivitiesModule, MessagesModule, NotificationsModule, PresenceModule, ProjectFollowModule, GamificationModule,
    SprintsModule, AnalyticsModule, FilesModule, MilestonesModule, ThreadsModule, InsightsModule, VaultModule, DiscoveryModule,
    CalendarModule, IntegrationsModule, ReportsModule, AIModule, ModerationModule, ContentReportsModule,
    
    // ✅ PHASE 6: Added SettingsModule to the imports array
    SettingsModule,
  ],
  providers: [ { provide: APP_GUARD, useClass: ThrottlerGuard } ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}

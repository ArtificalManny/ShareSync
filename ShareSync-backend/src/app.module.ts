// src/app.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC MAIN APPLICATION MODULE - ALL PHASES COMPLETE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// ═══════════════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE MODULES
// ═══════════════════════════════════════════════════════════════════════════════

import { CacheModule } from './cache/cache.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH & USERS - Note: folder is "user" not "users"
// ═══════════════════════════════════════════════════════════════════════════════

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: CORE MODULES
// ═══════════════════════════════════════════════════════════════════════════════

import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DailyFocusModule } from './daily-focus/daily-focus.module';
import { MyWorkModule } from './my-work/my-work.module';
import { UserContextModule } from './user-context/user-context.module';
import { RealtimeModule } from './realtime/realtime.module';

// ✅ Activity persistence layer (3.4)
import { ActivitiesModule } from './activities/activities.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: COLLABORATION MODULES
// ═══════════════════════════════════════════════════════════════════════════════
import { AnnouncementsModule } from './announcements/announcements.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PresenceModule } from './presence/presence.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: GAMIFICATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { GamificationModule } from './gamification/gamification.module';

// ✅ Phase 3: spectator follows
import { ProjectFollowModule } from './follows/project-follow.module';

import { FollowsModule } from './follows/follows.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: ADVANCED MODULES
// ═══════════════════════════════════════════════════════════════════════════════

import { SprintsModule } from './sprints/sprints.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StatsModule } from './stats/stats.module';
import { FilesModule } from './files/files.module';

// ✅ PHASE 6: NEW MODULES
import { MilestonesModule } from './milestones/milestones.module';
import { ThreadsModule } from './threads/threads.module';
import { ThreadMessagesModule } from './thread-messages/thread-messages.module'; // ⭐ ADDED THIS LINE
import { InsightsModule } from './insights/insights.module';
import { VaultModule } from './vault/vault.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: POLISH & SCALE MODULES
// ═══════════════════════════════════════════════════════════════════════════════

import { CalendarModule } from './calendar/calendar.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ReportsModule } from './reports/reports.module';
import { AIModule } from './ai/ai.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
// enterprise-sales-inquiry-backend-v1
import { SalesModule } from './sales/sales.module';

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST & SAFETY MODULES
// ═══════════════════════════════════════════════════════════════════════════════

import { ModerationModule } from './moderation/moderation.module';
import { ContentReportsModule } from './content-reports/content-reports.module';
import { AccountEnforcementModule } from './account-enforcement/account-enforcement.module';
import { SettingsModule } from './settings/settings.module';

import { FlowRulesModule } from './flow-rules/flow-rules.module';
import { IntakeFormsModule } from './intake-forms/intake-forms.module';

@Module({
  imports: [
    FlowRulesModule,
    IntakeFormsModule,
    SettingsModule,
    AccountEnforcementModule,
    // ─────────────────────────────────────────────────────────────────────────
    // GLOBAL CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // DATABASE
    // ─────────────────────────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/sharesync',
        ),
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // CACHING
    // ─────────────────────────────────────────────────────────────────────────
    CacheModule,

    // ─────────────────────────────────────────────────────────────────────────
    // RATE LIMITING
    // ─────────────────────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: configService.get<number>('THROTTLE_SHORT_LIMIT', 3),
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: configService.get<number>('THROTTLE_MEDIUM_LIMIT', 20),
        },
        {
          name: 'long',
          ttl: 60000,
          limit: configService.get<number>('THROTTLE_LONG_LIMIT', 100),
        },
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT EMITTER
    // ─────────────────────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULED TASKS
    // ─────────────────────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─────────────────────────────────────────────────────────────────────────
    // INFRASTRUCTURE
    // ─────────────────────────────────────────────────────────────────────────
    MonitoringModule,
    HealthModule,

    // ─────────────────────────────────────────────────────────────────────────
    // CORE MODULES
    // ─────────────────────────────────────────────────────────────────────────
    AuthModule,
    UserModule,
    ProjectsModule,
    TasksModule,
    DailyFocusModule,
    MyWorkModule,
    UserContextModule,
    RealtimeModule,

    // ✅ 3.4 Activity persistence
    ActivitiesModule,

    // ─────────────────────────────────────────────────────────────────────────
    // COLLABORATION
    // ─────────────────────────────────────────────────────────────────────────
    AnnouncementsModule,
    SuggestionsModule,
    MessagesModule,
    NotificationsModule,

    // ✅ Phase 3: spectator follows
    ProjectFollowModule,

    FollowsModule,

    // ─────────────────────────────────────────────────────────────────────────
    // GAMIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    GamificationModule,

    // ─────────────────────────────────────────────────────────────────────────
    // ADVANCED
    // ─────────────────────────────────────────────────────────────────────────
    SprintsModule,
    AnalyticsModule,
    StatsModule,
    FilesModule,

    // ✅ PHASE 6: ADD THESE
    MilestonesModule,
    ThreadsModule,
    ThreadMessagesModule, // ⭐ ADDED THIS LINE
    InsightsModule,
    VaultModule,

    // ✅ DISCOVERY (Public project feed)
    DiscoveryModule,
    SubscriptionsModule,
    SalesModule,

    // ─────────────────────────────────────────────────────────────────────────
    // POLISH & SCALE
    // ─────────────────────────────────────────────────────────────────────────
    CalendarModule,
    IntegrationsModule,
    ReportsModule,
    AIModule,

    // ─────────────────────────────────────────────────────────────────────────
    // TRUST & SAFETY
    // ─────────────────────────────────────────────────────────────────────────
    ModerationModule,
    ContentReportsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Add any middleware here
  }
}

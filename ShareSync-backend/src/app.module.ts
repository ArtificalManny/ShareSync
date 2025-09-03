// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module';
import { FeedModule } from './feed/feed.module';
import { ProfileModule } from './profile/profile.module';
import { ActivitiesModule } from './activities/activities.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AnalyticsModule } from './analytics/analytics.module';

// ✅ new modules we added
import { ModerationModule } from './moderation/moderation.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';

// ✅ stats (new)
import { StatsModule } from './stats/stats.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),

    // ✅ global rate limiting: 20 requests per 60s per client by default
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),

    // Feature modules
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
    RealtimeModule,
    AnalyticsModule,

    // ✅ server-side safety + uploads + notifications
    ModerationModule,
    UploadsModule,
    NotificationsModule,

    // ✅ stats/insights
    StatsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
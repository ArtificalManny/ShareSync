// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

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

import { AppController } from './app.controller';
import { APP_GUARD } from '@nestjs/core';

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

    // ✅ new: server-side safety + uploads + sockets
    ModerationModule,
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard}
  ],
})
export class AppModule {}
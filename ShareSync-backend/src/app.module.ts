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
// REMOVED: AnalyticsModule
import { ModerationModule } from './moderation/moderation.module';
import { UploadsModule } from './uploads/uploads.module';
import { StatsModule } from './stats/stats.module';
import { TasksModule } from './tasks/tasks.module';

// keep only the new notify module
import { NotifyModule } from './notifications/notify.module';
// files module
import { FilesModule } from './files/files.module';
// habits module
import { HabitsModule } from './habits/habits.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Use env or sensible local default
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/sharesync'),

    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),

    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
    RealtimeModule,
    // AnalyticsModule,  // REMOVED
    ModerationModule,
    UploadsModule,
    StatsModule,
    TasksModule,

    NotifyModule,
    FilesModule,
    HabitsModule, // now wired
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
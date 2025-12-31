// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { FeedModule } from './feed/feed.module';
import { ProfileModule } from './profile/profile.module';
import { ActivitiesModule } from './activities/activities.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MomentumModule } from './momentum/momentum.module';
import { ModerationModule } from './moderation/moderation.module';
import { UploadsModule } from './uploads/uploads.module';
import { StatsModule } from './stats/stats.module';
import { TasksModule } from './tasks/tasks.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { NotifyModule } from './notifications/notify.module';
import { FilesModule } from './files/files.module';
import { HabitsModule } from './habits/habits.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/sharesync',
    ),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),

    // Feature modules
    AuthModule,
    UserModule,
    ProjectModule,
    ExperimentsModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
    RealtimeModule,
    MomentumModule,
    ModerationModule,
    UploadsModule,
    StatsModule,
    TasksModule,
    AnalyticsModule,
    NotifyModule,
    FilesModule,
    HabitsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

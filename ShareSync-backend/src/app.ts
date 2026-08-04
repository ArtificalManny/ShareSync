// src/app.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC MAIN APPLICATION MODULE - PHASE 3 UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { ScheduleModule } from '@nestjs/schedule';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { UserContextModule } from './user-context/user-context.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GamificationModule } from './gamification/gamification.module';

// Middleware
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/sharesync'),
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),

    ScheduleModule.forRoot(),

    // Feature Modules
    HealthModule,
    AuthModule,
    UserModule, // ✅ fixed (was UsersModule)
    ProjectsModule,
    TasksModule,
    UserContextModule,
    RealtimeModule,
    MessagesModule,
    NotificationsModule,
    GamificationModule,
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
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

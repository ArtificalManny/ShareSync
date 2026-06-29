// src/notifications/notifications.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS MODULE: Complete wiring for REST + Gateway + Channels
// Phase 9: Full notification system with email/SMS verification
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { NotificationsController } from './notifications.controller';
import { NotificationChannelsController } from './notification-channels.controller';

// Services
import { NotificationsService } from './notifications.service';
import { NotificationChannelsService } from './notification-channels.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationPolicy } from './notification-policy';

// Gateway
import { NotificationsGateway } from './notifications.gateway';

// Schemas
import { Notification, NotificationSchema } from './schemas/notification.schema';
import {
  NotificationVerification,
  NotificationVerificationSchema,
} from './schemas/notification-verification.schema';

// User schema (for channel verification)
import { User, UserSchema } from '../user/schemas/user.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { DigestScheduler } from './digest.scheduler';

// Optional: Project Follow schema (for follower notifications)
// Import conditionally to avoid circular dependency issues
let ProjectFollowImport: any = null;
try {
  const followModule = require('../follows/schemas/project-follow.schema');
  ProjectFollowImport = {
    name: followModule.ProjectFollow?.name || 'ProjectFollow',
    schema: followModule.ProjectFollowSchema,
  };
} catch (e) {
  // ProjectFollow not available, follower notifications will be disabled
}

@Module({
  imports: [
    // Core schemas
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationVerification.name, schema: NotificationVerificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      // Conditionally include ProjectFollow if available
      ...(ProjectFollowImport ? [ProjectFollowImport] : []),
    ]),

    // JWT for WebSocket authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_SECRET') ||
          config.get<string>('JWT_ACCESS_SECRET') ||
          config.get<string>('JWT_ACCESS_TOKEN_SECRET') ||
          process.env.JWT_SECRET ||
          process.env.JWT_ACCESS_SECRET ||
          'dev_jwt_secret_change_me';

        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),

    // Event emitter for internal events
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    NotificationsController,
    NotificationChannelsController,
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationChannelsService,
    EmailService,
    SmsService,
    NotificationPolicy,
    DigestScheduler,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    EmailService,
    NotificationPolicy,
  ],
})
export class NotificationsModule {}

// src/notifications/notifications.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS MODULE: wiring for REST + Gateway
// Fixes boot crash: provides JwtService to NotificationsGateway via JwtModule.
// Also registers mongoose schema + exports NotificationsService.
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),

    // Provide JwtService in this module context for NotificationsGateway
    // IMPORTANT: Secret must match whatever your auth tokens are signed with.
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
          // verify() does not require signOptions, but harmless to include
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}

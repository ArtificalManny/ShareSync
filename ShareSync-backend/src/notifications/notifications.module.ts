// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsGateway } from './gateway';

@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway], // 👈 good
})
export class NotificationsModule {}

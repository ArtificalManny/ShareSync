// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotifyService } from './notify.service';
import { NotifyCron } from './notify.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [NotifyService, NotifyCron],
  exports: [NotifyService],
})
export class NotificationsModule {}
// src/notifications/sms.module.ts
import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';

@Module({
  providers: [SmsService],
  exports: [SmsService], // Exported so UserModule and AuthModule can use it
})
export class SmsModule {}

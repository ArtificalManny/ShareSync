import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotifyService } from './notify.service';

@Module({
  imports: [RealtimeModule],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}

// backend/src/realtime/realtime.module.ts
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  providers: [
    {
      provide: 'REALTIME_GATEWAY',
      useClass: RealtimeGateway,
    },
  ],
  exports: ['REALTIME_GATEWAY'],
})
export class RealtimeModule {}
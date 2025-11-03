// src/realtime/realtime.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { ProjectModule } from '../projects/project.module';
import { MomentumModule } from '../momentum/momentum.module';

@Module({
  imports: [
    forwardRef(() => ProjectModule),
    forwardRef(() => MomentumModule), // NEW
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}